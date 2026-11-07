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
  vppCreditAnnual: number;
  annualSavingsVsDMO: number;
  annualSavingsVsCurrent?: number;
  percentCheaperThanDMO: number;
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

  // 2. Battery Capacity & Discharge Modeling
  // For standard batteries (10-13.5 kWh) it covers peak (40% of use).
  // For massive battery banks (40kWh - 50kWh), it can displace 100% of peak AND shoulder hours!
  let usableDailyBatteryKWh = 0;
  if (profile.hasBattery && profile.batteryCapacityKWh > 0) {
    // 90% depth of discharge
    usableDailyBatteryKWh = profile.batteryCapacityKWh * 0.90;
  }

  // 3. Free Power Hours Battery Soaking
  const isFreePowerBatteryCharge = Boolean(
    profile.hasBattery && 
    plan.hasFreePowerHours && 
    (profile.batteryChargingSource === 'FREE_POWER_HOURS_SOAK' || profile.batteryChargingSource === 'SOLAR_AND_GRID')
  );

  // 4. Usage Charge
  let usageCostAnnual = 0;
  let batteryPeakSavingsAnnual = 0;
  let freePowerBatterySavingsAnnual = 0;

  if (plan.tariffType === 'TOU' && plan.rates.peakRateCentsPerKWh) {
    let peakKWh = baseAnnualUsageKWh * 0.40;
    let shoulderKWh = baseAnnualUsageKWh * 0.30;
    let offPeakKWh = baseAnnualUsageKWh * 0.30;

    const peakRate = plan.rates.peakRateCentsPerKWh / 100;
    const shoulderRate = (plan.rates.shoulderRateCentsPerKWh || plan.rates.peakRateCentsPerKWh * 0.75) / 100;
    const offPeakRate = (plan.rates.offPeakRateCentsPerKWh || plan.rates.peakRateCentsPerKWh * 0.55) / 100;

    if (usableDailyBatteryKWh > 0) {
      const annualBatteryStorage = usableDailyBatteryKWh * daysInYear;

      // First displace peak
      const shavedPeak = Math.min(peakKWh, annualBatteryStorage);
      peakKWh -= shavedPeak;
      const remainingBatteryStorage = Math.max(0, annualBatteryStorage - shavedPeak);

      // With a large 40kWh - 50kWh battery, remaining capacity can also displace shoulder!
      const shavedShoulder = Math.min(shoulderKWh, remainingBatteryStorage);
      shoulderKWh -= shavedShoulder;

      if (isFreePowerBatteryCharge) {
        // Battery was charged at 0c/kWh from the grid during Free Power Hours!
        // Full displaced power saves 100% of the peak & shoulder tariffs
        freePowerBatterySavingsAnnual = (shavedPeak * peakRate) + (shavedShoulder * shoulderRate);
        batteryPeakSavingsAnnual = freePowerBatterySavingsAnnual;
      } else {
        // Stored power came from rooftop solar or off-peak grid
        const replacementCostRate = profile.hasSolar ? (plan.rates.solarFeedInTariffCents || 6.0) / 100 : offPeakRate;
        const netPeakBenefit = shavedPeak * (peakRate - replacementCostRate);
        const netShoulderBenefit = shavedShoulder * Math.max(0, shoulderRate - replacementCostRate);
        batteryPeakSavingsAnnual = netPeakBenefit + netShoulderBenefit;
      }
    }

    usageCostAnnual = (peakKWh * peakRate) + (shoulderKWh * shoulderRate) + (offPeakKWh * offPeakRate);
  } else {
    // Flat rate
    const flatRate = (plan.rates.flatRateCentsPerKWh || 30.0) / 100;
    let netUsage = baseAnnualUsageKWh;

    if (usableDailyBatteryKWh > 0) {
      const annualBatterySupply = usableDailyBatteryKWh * daysInYear;
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

  // 5. EV Charging Annual Cost
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

  // 6. Controlled Load
  let controlledLoadAnnual = 0;
  if (profile.hasControlledLoad && profile.controlledLoadDailyKWh > 0) {
    const controlledRate = (plan.rates.controlledLoadCentsPerKWh || plan.rates.flatRateCentsPerKWh || 20.0) / 100;
    controlledLoadAnnual = profile.controlledLoadDailyKWh * daysInYear * controlledRate;
  }

  // 7. Solar Feed-in Credit
  let solarCreditAnnual = 0;
  if (profile.hasSolar && profile.solarDailyExportKWh > 0 && plan.rates.solarFeedInTariffCents) {
    let netExportKWh = profile.solarDailyExportKWh;
    if (profile.hasBattery && profile.batteryCapacityKWh > 0 && !isFreePowerBatteryCharge) {
      const storedForBattery = Math.min(profile.batteryCapacityKWh * 0.8, netExportKWh * 0.7);
      netExportKWh = Math.max(0, netExportKWh - storedForBattery);
    }
    const fitRate = plan.rates.solarFeedInTariffCents / 100;
    solarCreditAnnual = netExportKWh * daysInYear * fitRate;
  }

  // 8. Virtual Power Plant (VPP) Credit
  let vppCreditAnnual = 0;
  if (profile.hasBattery && profile.joinVpp && plan.isBatteryVppEligible && plan.vppAnnualCredit) {
    const scaleFactor = profile.batteryCapacityKWh >= 30 ? 1.3 : 1.0;
    vppCreditAnnual = plan.vppAnnualCredit * scaleFactor;
  }

  // Combined Annual Total
  const totalRaw = supplyCostAnnual + usageCostAnnual + evChargingAnnual + controlledLoadAnnual - solarCreditAnnual - vppCreditAnnual;
  const annualTotal = Math.max(0, totalRaw);
  const quarterlyTotal = annualTotal / 4;

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
    annualTotal: Math.round(annualTotal),
    quarterlyTotal: Math.round(quarterlyTotal),
    supplyCostAnnual: Math.round(supplyCostAnnual),
    usageCostAnnual: Math.round(usageCostAnnual),
    solarCreditAnnual: Math.round(solarCreditAnnual),
    controlledLoadAnnual: Math.round(controlledLoadAnnual),
    evChargingAnnual: Math.round(evChargingAnnual),
    batteryPeakSavingsAnnual: Math.round(batteryPeakSavingsAnnual),
    freePowerBatterySavingsAnnual: Math.round(freePowerBatterySavingsAnnual),
    vppCreditAnnual: Math.round(vppCreditAnnual),
    annualSavingsVsDMO: Math.round(annualSavingsVsDMO),
    annualSavingsVsCurrent: annualSavingsVsCurrent !== undefined ? Math.round(annualSavingsVsCurrent) : undefined,
    percentCheaperThanDMO: percentCheaperThanDMO,
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

  // Specific check for 3756 (Wallan, Mitchell Shire, AusNet boundary)
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
