import { EnergyPlan, HouseholdProfile, DistributorInfo } from '../types';
import { DISTRIBUTORS } from '../constants';

export interface PlanCostBreakdown {
  annualTotal: number;
  quarterlyTotal: number;
  supplyCostAnnual: number;
  usageCostAnnual: number;
  solarCreditAnnual: number;
  controlledLoadAnnual: number;
  evChargingAnnual: number;
  batteryPeakSavingsAnnual: number;
  freePowerBatterySavingsAnnual: number;
  zeroHeroRewardAnnual: number;
  vppCreditAnnual: number;
  annualSavingsVsDMO: number;
  annualSavingsVsCurrent?: number;
  percentCheaperThanDMO: number;
  isCredit: boolean; // Indicates household earns money / bill in net credit
  dailyFreeSoakKWhCapped: number; // Actual kWh soaked during 3h window after inverter kW bottleneck
}

export function calculatePlanCost(
  plan: EnergyPlan,
  profile: HouseholdProfile,
  distributor: DistributorInfo
): PlanCostBreakdown {
  const daysInYear = 365;
  const baseAnnualUsageKWh = profile.averageDailyUsageKWh * daysInYear;

  // 1. Supply Charge: c/day * 365 / 100 => $
  const supplyCostAnnual = (plan.rates.dailySupplyChargeCents * daysInYear) / 100;

  // 2. Battery Capacity & Inverter Speed Constraints
  let usableDailyBatteryKWh = 0;
  // Default inverter kW to 10kW for large 30-50kWh batteries, 5kW for smaller systems if not specified
  const inverterKw = profile.batteryInverterKw || (profile.batteryCapacityKWh >= 30 ? 10 : 5);

  if (profile.hasBattery && profile.batteryCapacityKWh > 0) {
    usableDailyBatteryKWh = profile.batteryCapacityKWh * 0.90; // 90% DoD
  }

  // 3. Free Power Hours Battery Soaking (11am-2pm = 3-hour window)
  // Bottleneck: A 40kWh or 50kWh battery CANNOT charge more than (inverterKw * hours) in that window!
  // e.g. 5kW inverter in 3 hours can only soak 15kWh max! A 10kW inverter can soak 30kWh.
  let dailyFreeSoakKWhCapped = 0;
  const isFreePowerBatteryCharge = Boolean(
    profile.hasBattery && 
    plan.hasFreePowerHours && 
    (profile.batteryChargingSource === 'FREE_POWER_HOURS_SOAK' || profile.batteryChargingSource === 'SOLAR_AND_GRID')
  );

  if (isFreePowerBatteryCharge) {
    const windowHours = plan.freePowerHoursDaily || 3;
    const maxInverterIntakeKWh = inverterKw * windowHours;
    // Capped by whichever is smaller: battery capacity or inverter intake limit
    dailyFreeSoakKWhCapped = Math.min(usableDailyBatteryKWh, maxInverterIntakeKWh);
  }

  // 4. Usage Charge & Peak Offset
  let usageCostAnnual = 0;
  let batteryPeakSavingsAnnual = 0;
  let freePowerBatterySavingsAnnual = 0;
  let zeroHeroRewardAnnual = 0;

  if (plan.tariffType === 'TOU' && plan.rates.peakRateCentsPerKWh) {
    let peakKWh = baseAnnualUsageKWh * 0.40;
    let shoulderKWh = baseAnnualUsageKWh * 0.30;
    let offPeakKWh = baseAnnualUsageKWh * 0.30;

    const peakRate = plan.rates.peakRateCentsPerKWh / 100;
    const shoulderRate = (plan.rates.shoulderRateCentsPerKWh || plan.rates.peakRateCentsPerKWh * 0.75) / 100;
    const offPeakRate = (plan.rates.offPeakRateCentsPerKWh || plan.rates.peakRateCentsPerKWh * 0.55) / 100;

    if (usableDailyBatteryKWh > 0) {
      // If charging from Free Power Hours, the battery only has the inverter-capped intake from that window
      // plus any surplus rooftop solar
      let effectiveDailyDischarge = usableDailyBatteryKWh;
      if (isFreePowerBatteryCharge) {
        effectiveDailyDischarge = Math.min(usableDailyBatteryKWh, dailyFreeSoakKWhCapped + (profile.hasSolar ? profile.solarDailyExportKWh * 0.5 : 0));
      }

      const annualBatteryStorage = effectiveDailyDischarge * daysInYear;

      // Displace peak consumption first
      const shavedPeak = Math.min(peakKWh, annualBatteryStorage);
      peakKWh -= shavedPeak;
      const remainingBatteryStorage = Math.max(0, annualBatteryStorage - shavedPeak);

      // Remaining battery storage displaces shoulder
      const shavedShoulder = Math.min(shoulderKWh, remainingBatteryStorage);
      shoulderKWh -= shavedShoulder;

      if (isFreePowerBatteryCharge) {
        // Power soaked at 0c/kWh from the grid during Free Power Hours saves the full displaced rates!
        freePowerBatterySavingsAnnual = (shavedPeak * peakRate) + (shavedShoulder * shoulderRate);
        batteryPeakSavingsAnnual = freePowerBatterySavingsAnnual;
      } else {
        const replacementCostRate = profile.hasSolar ? (plan.rates.solarFeedInTariffCents || 6.0) / 100 : offPeakRate;
        const netPeakBenefit = shavedPeak * (peakRate - replacementCostRate);
        const netShoulderBenefit = shavedShoulder * Math.max(0, shoulderRate - replacementCostRate);
        batteryPeakSavingsAnnual = netPeakBenefit + netShoulderBenefit;
      }

      // 5. ZEROHERO Model: EXACTLY $1.00 PER DAY if grid draw during peak is zero!
      // If battery capacity displaces 100% of the household's peak draw on that day, user earns $1.00 for the day.
      if (plan.hasZeroHeroIncentive) {
        const dailyPeakNeedKWh = profile.averageDailyUsageKWh * 0.40;
        // User achieves 0 grid draw if battery storage >= household peak demand
        if (effectiveDailyDischarge >= dailyPeakNeedKWh) {
          // Earns $1.00 per day for all 365 days of zero peak grid draw
          const rewardPerDay = plan.zeroHeroDailyRewardDollars || 1.00;
          zeroHeroRewardAnnual = rewardPerDay * daysInYear; // e.g. $365/year
        } else {
          // If inverter or battery is too small to cover the entire peak, prorate by coverage percentage
          const coverageRatio = Math.min(1.0, effectiveDailyDischarge / dailyPeakNeedKWh);
          zeroHeroRewardAnnual = Math.round(coverageRatio * (plan.zeroHeroDailyRewardDollars || 1.00) * daysInYear);
        }
      }
    }

    usageCostAnnual = (peakKWh * peakRate) + (shoulderKWh * shoulderRate) + (offPeakKWh * offPeakRate);
  } else {
    // Flat rate
    const flatRate = (plan.rates.flatRateCentsPerKWh || 30.0) / 100;
    let netUsage = baseAnnualUsageKWh;

    if (usableDailyBatteryKWh > 0) {
      let effectiveDailyDischarge = usableDailyBatteryKWh;
      if (isFreePowerBatteryCharge) {
        effectiveDailyDischarge = Math.min(usableDailyBatteryKWh, dailyFreeSoakKWhCapped + (profile.hasSolar ? profile.solarDailyExportKWh * 0.5 : 0));
      }

      const annualBatterySupply = effectiveDailyDischarge * daysInYear;
      const displacedUsage = Math.min(baseAnnualUsageKWh * 0.85, annualBatterySupply);
      netUsage = Math.max(0, baseAnnualUsageKWh - displacedUsage);

      if (isFreePowerBatteryCharge) {
        freePowerBatterySavingsAnnual = displacedUsage * flatRate;
        batteryPeakSavingsAnnual = freePowerBatterySavingsAnnual;
      } else {
        const replacementCostRate = profile.hasSolar ? (plan.rates.solarFeedInTariffCents || 6.0) / 100 : flatRate * 0.45;
        batteryPeakSavingsAnnual = displacedUsage * (flatRate - replacementCostRate);
      }
    }
    usageCostAnnual = netUsage * flatRate;
  }

  // 6. EV Charging Annual Cost
  let evChargingAnnual = 0;
  if (profile.hasEV && profile.evDailyKWh > 0) {
    const annualEvKWh = profile.evDailyKWh * daysInYear;

    if (plan.hasFreePowerHours && profile.evChargingTime === 'FREE_POWER_HOURS') {
      const freeShare = 0.75;
      const remainderRate = (plan.rates.offPeakRateCentsPerKWh || plan.rates.flatRateCentsPerKWh || 20.0) / 100;
      evChargingAnnual = (annualEvKWh * (1 - freeShare)) * remainderRate;
    } else if (plan.isEvPlan && plan.rates.evNightRateCentsPerKWh && profile.evChargingTime === 'OVERNIGHT') {
      evChargingAnnual = (annualEvKWh * plan.rates.evNightRateCentsPerKWh) / 100;
    } else if (plan.tariffType === 'TOU' && plan.rates.offPeakRateCentsPerKWh && profile.evChargingTime === 'OVERNIGHT') {
      evChargingAnnual = (annualEvKWh * plan.rates.offPeakRateCentsPerKWh) / 100;
    } else if (profile.evChargingTime === 'DAYTIME_SOLAR' && profile.hasSolar) {
      evChargingAnnual = (annualEvKWh * (plan.rates.solarFeedInTariffCents || 6.0)) / 100;
    } else {
      const rate = plan.rates.flatRateCentsPerKWh || plan.rates.shoulderRateCentsPerKWh || 28.0;
      evChargingAnnual = (annualEvKWh * rate) / 100;
    }
  }

  // 7. Controlled Load
  let controlledLoadAnnual = 0;
  if (profile.hasControlledLoad && profile.controlledLoadDailyKWh > 0) {
    const controlledRate = (plan.rates.controlledLoadCentsPerKWh || plan.rates.flatRateCentsPerKWh || 20.0) / 100;
    controlledLoadAnnual = profile.controlledLoadDailyKWh * daysInYear * controlledRate;
  }

  // 8. Solar Feed-in Credit WITH CAPPED DAILY TIER LOGIC
  let solarCreditAnnual = 0;
  if (profile.hasSolar && profile.solarDailyExportKWh > 0 && plan.rates.solarFeedInTariffCents) {
    let netDailyExportKWh = profile.solarDailyExportKWh;

    // If battery is present and not soaking from grid, store solar first up to inverter limit
    if (profile.hasBattery && profile.batteryCapacityKWh > 0 && !isFreePowerBatteryCharge) {
      const maxDailySolarStorage = Math.min(usableDailyBatteryKWh * 0.8, inverterKw * 4);
      const storedForBattery = Math.min(maxDailySolarStorage, netDailyExportKWh * 0.7);
      netDailyExportKWh = Math.max(0, netDailyExportKWh - storedForBattery);
    }

    // Apply Tier 1 and Tier 2 Feed-in Tariff (FiT Cap)
    const fitCapKWh = plan.rates.solarFeedInCapKWhPerDay || 14.0;
    const primaryFitRate = plan.rates.solarFeedInTariffCents / 100;
    const secondaryFitRate = (plan.rates.solarFeedInTariffCents * 0.55) / 100; // Base export rate above cap (~4.9c)

    const tier1ExportKWh = Math.min(netDailyExportKWh, fitCapKWh);
    const tier2ExportKWh = Math.max(0, netDailyExportKWh - fitCapKWh);

    const dailySolarCredit = (tier1ExportKWh * primaryFitRate) + (tier2ExportKWh * secondaryFitRate);
    solarCreditAnnual = dailySolarCredit * daysInYear;
  }

  // 9. Virtual Power Plant (VPP) Credit
  let vppCreditAnnual = 0;
  if (profile.hasBattery && profile.joinVpp && plan.isBatteryVppEligible && plan.vppAnnualCredit) {
    const scaleFactor = profile.batteryCapacityKWh >= 30 ? 1.3 : 1.0;
    vppCreditAnnual = plan.vppAnnualCredit * scaleFactor;
  }

  // Combined Annual Total (Net cost after credits and ZEROHERO rewards)
  const totalRaw = supplyCostAnnual + usageCostAnnual + evChargingAnnual + controlledLoadAnnual - solarCreditAnnual - vppCreditAnnual - zeroHeroRewardAnnual;
  const annualTotal = Math.round(totalRaw);
  const quarterlyTotal = Math.round(totalRaw / 4);
  const isCredit = annualTotal < 0;

  // DMO Reference benchmark
  const totalHouseholdKWh = baseAnnualUsageKWh + (profile.hasEV ? profile.evDailyKWh * daysInYear : 0);
  const baselineKWh = 4200;
  const distBenchmark = distributor?.defaultMarketOfferAnnual || 1827;
  const scaledDMOCost = (distBenchmark * (totalHouseholdKWh / baselineKWh));

  const annualSavingsVsDMO = scaledDMOCost - annualTotal;
  const percentCheaperThanDMO = scaledDMOCost > 0 ? Math.round((annualSavingsVsDMO / scaledDMOCost) * 100) : 0;

  let annualSavingsVsCurrent: number | undefined;
  if (profile.currentQuarterlyBillCost && profile.currentQuarterlyBillCost > 0) {
    const currentAnnual = profile.currentQuarterlyBillCost * 4;
    annualSavingsVsCurrent = currentAnnual - annualTotal;
  }

  return {
    annualTotal,
    quarterlyTotal,
    supplyCostAnnual: Math.round(supplyCostAnnual),
    usageCostAnnual: Math.round(usageCostAnnual),
    solarCreditAnnual: Math.round(solarCreditAnnual),
    controlledLoadAnnual: Math.round(controlledLoadAnnual),
    evChargingAnnual: Math.round(evChargingAnnual),
    batteryPeakSavingsAnnual: Math.round(batteryPeakSavingsAnnual),
    freePowerBatterySavingsAnnual: Math.round(freePowerBatterySavingsAnnual),
    zeroHeroRewardAnnual: Math.round(zeroHeroRewardAnnual),
    vppCreditAnnual: Math.round(vppCreditAnnual),
    annualSavingsVsDMO: Math.round(annualSavingsVsDMO),
    annualSavingsVsCurrent: annualSavingsVsCurrent !== undefined ? Math.round(annualSavingsVsCurrent) : undefined,
    percentCheaperThanDMO,
    isCredit,
    dailyFreeSoakKWhCapped: Math.round(dailyFreeSoakKWhCapped),
  };
}

export function detectDistributorFromPostcode(postcodeStr: string): DistributorInfo {
  if (!DISTRIBUTORS || DISTRIBUTORS.length === 0) {
    return {
      code: 'AUSNET',
      name: 'AusNet Services (Eastern & Outer Eastern VIC)',
      state: 'VIC',
      postcodeRanges: [[3750, 3810]],
      defaultMarketOfferAnnual: 1840,
    };
  }

  const p = parseInt(postcodeStr, 10);
  if (isNaN(p)) return DISTRIBUTORS[0];

  if (p === 3756) {
    const ausnet = DISTRIBUTORS.find(d => d.code === 'AUSNET');
    if (ausnet) return ausnet;
  }

  for (const dist of DISTRIBUTORS) {
    if (dist.postcodeRanges) {
      for (const [start, end] of dist.postcodeRanges) {
        if (p >= start && p <= end) {
          return dist;
        }
      }
    }
  }

  if (p >= 2000 && p <= 2999) return DISTRIBUTORS.find(d => d.code === 'AUSGRID') || DISTRIBUTORS[0];
  if (p >= 3000 && p <= 3999) return DISTRIBUTORS.find(d => d.code === 'AUSNET') || DISTRIBUTORS[3];
  if (p >= 4000 && p <= 4999) return DISTRIBUTORS.find(d => d.code === 'ENERGEX') || DISTRIBUTORS[6];
  if (p >= 5000 && p <= 5999) return DISTRIBUTORS.find(d => d.code === 'SAPN') || DISTRIBUTORS[7];
  if (p >= 7000 && p <= 7999) return DISTRIBUTORS.find(d => d.code === 'TASNETWORKS') || DISTRIBUTORS[9];

  return DISTRIBUTORS[0];
}
