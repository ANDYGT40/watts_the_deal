import { DistributorInfo, EnergyPlan, WholesaleHalfHourInterval } from './types';

export const DISTRIBUTORS: DistributorInfo[] = [
  // VIC (5 Networks)
  {
    code: 'AUSNET',
    name: 'AusNet Services (Mitchell Shire e.g. 3756 Wallan, Outer North/East, Yarra Ranges, Gippsland)',
    state: 'VIC',
    postcodeRanges: [[3138, 3156], [3750, 3810], [3820, 3996], [3756, 3756]],
    defaultMarketOfferAnnual: 1840,
  },
  {
    code: 'CITIPOWER',
    name: 'CitiPower (Melbourne CBD & Inner Suburbs)',
    state: 'VIC',
    postcodeRanges: [[3000, 3010], [3121, 3144], [3181, 3207]],
    defaultMarketOfferAnnual: 1570,
  },
  {
    code: 'POWERCOR',
    name: 'Powercor (Western Suburbs & Regional Western VIC)',
    state: 'VIC',
    postcodeRanges: [[3020, 3040], [3211, 3550], [3028, 3030]],
    defaultMarketOfferAnnual: 1720,
  },
  {
    code: 'JEMENA',
    name: 'Jemena (North-West Melbourne)',
    state: 'VIC',
    postcodeRanges: [[3041, 3089], [3040, 3046]],
    defaultMarketOfferAnnual: 1690,
  },
  {
    code: 'UNITED',
    name: 'United Energy (South East Melbourne & Mornington Peninsula)',
    state: 'VIC',
    postcodeRanges: [[3145, 3175], [3192, 3200], [3910, 3944]],
    defaultMarketOfferAnnual: 1640,
  },

  // NSW
  {
    code: 'AUSGRID',
    name: 'Ausgrid (Sydney East, North, Central Coast, Hunter)',
    state: 'NSW',
    postcodeRanges: [[2000, 2249], [2250, 2338], [2760, 2770]],
    defaultMarketOfferAnnual: 1827,
  },
  {
    code: 'ENDEAVOUR',
    name: 'Endeavour Energy (Western Sydney, Blue Mtns, Illawarra, South Coast)',
    state: 'NSW',
    postcodeRanges: [[2140, 2179], [2500, 2574], [2745, 2786], [2145, 2160]],
    defaultMarketOfferAnnual: 1980,
  },
  {
    code: 'ESSENTIAL',
    name: 'Essential Energy (Regional & Country NSW)',
    state: 'NSW',
    postcodeRanges: [[2340, 2489], [2580, 2640], [2800, 2880]],
    defaultMarketOfferAnnual: 2250,
  },

  // QLD
  {
    code: 'ENERGEX',
    name: 'Energex (South East Queensland - Brisbane, Gold Coast, Sunshine Coast)',
    state: 'QLD',
    postcodeRanges: [[4000, 4350], [4500, 4575]],
    defaultMarketOfferAnnual: 1890,
  },

  // SA
  {
    code: 'SAPN',
    name: 'SA Power Networks (South Australia State-wide)',
    state: 'SA',
    postcodeRanges: [[5000, 5734]],
    defaultMarketOfferAnnual: 2270,
  },

  // ACT
  {
    code: 'EVOENERGY',
    name: 'Evoenergy (ACT / Canberra)',
    state: 'ACT',
    postcodeRanges: [[2600, 2620], [2900, 2920]],
    defaultMarketOfferAnnual: 1780,
  },

  // TAS
  {
    code: 'TASNETWORKS',
    name: 'TasNetworks (Tasmania State-wide)',
    state: 'TAS',
    postcodeRanges: [[7000, 7470]],
    defaultMarketOfferAnnual: 1950,
  }
];

function createNetworkPlans(dist: DistributorInfo): EnergyPlan[] {
  const isVic = dist.state === 'VIC';
  const vdoMultiplier = dist.defaultMarketOfferAnnual / 1700;

  const baseSupply = Number((96 * vdoMultiplier).toFixed(1));
  const basePeak = Number((31 * vdoMultiplier).toFixed(1));
  const baseShoulder = Number((22 * vdoMultiplier).toFixed(1));
  const baseOffPeak = Number((14.5 * vdoMultiplier).toFixed(1));
  const baseFlat = Number((26.5 * vdoMultiplier).toFixed(1));

  return [
    // 1. GloBird Energy - FreeLunch (0c 11am-2pm)
    {
      id: `${dist.code.toLowerCase()}-globird-freelunch`,
      retailerName: 'GloBird Energy',
      retailerCode: 'GLOBIRD',
      planName: `FreeLunch Solar & Battery Saver (${dist.code})`,
      state: dist.state,
      distributorCode: dist.code,
      tariffType: 'TOU',
      rates: {
        dailySupplyChargeCents: Math.round(baseSupply * 0.98 * 10) / 10,
        peakRateCentsPerKWh: Math.round(basePeak * 0.96 * 10) / 10,
        shoulderRateCentsPerKWh: Math.round(baseShoulder * 0.95 * 10) / 10,
        offPeakRateCentsPerKWh: Math.round(baseOffPeak * 0.95 * 10) / 10,
        evNightRateCentsPerKWh: 7.5,
        solarFeedInTariffCents: 8.0,
        controlledLoadCentsPerKWh: 16.0,
      },
      contractType: 'NO_LOCK_IN',
      pricingType: 'VARIABLE',
      isStandingOffer: false,
      greenPowerAvailable: true,
      greenPowerPercent: 20,
      dmoComparisonPercent: -26,
      features: [
        'FREE power 11:00am - 2:00pm daily ("FreeLunch" 0c/kWh)',
        'Fill your 40kWh - 50kWh battery for $0 from the grid during FreeLunch',
        `Ultra-competitive supply charge in ${dist.code} network`,
        '100% Australian customer service'
      ],
      billFrequency: 'MONTHLY',
      coolingOffDays: 10,
      websiteUrl: 'https://www.globirdenergy.com.au',
      phone: '13 34 56',
      customerRating: 4.7,
      isEvPlan: true,
      evRateDescription: 'FreeLunch 11am-2pm (0c/kWh) + 7.5c overnight EV rate',
      isBatteryVppEligible: true,
      vppAnnualCredit: 260,
      vppProviderName: 'GloBird Smart Battery Program',
      hasFreePowerHours: true,
      freePowerWindowDescription: 'Free power daily 11:00am - 2:00pm (FreeLunch)',
      freePowerHoursDaily: 3,
    },

    // 2. GloBird Energy - ZEROHERO ($1/kWh peak reward for zero grid draw or battery export)
    {
      id: `${dist.code.toLowerCase()}-globird-zerohero`,
      retailerName: 'GloBird Energy',
      retailerCode: 'GLOBIRD',
      planName: `ZEROHERO Peak Reward Tariff (${dist.code})`,
      state: dist.state,
      distributorCode: dist.code,
      tariffType: 'TOU',
      rates: {
        dailySupplyChargeCents: Math.round(baseSupply * 0.95 * 10) / 10,
        peakRateCentsPerKWh: Math.round(basePeak * 0.98 * 10) / 10,
        shoulderRateCentsPerKWh: Math.round(baseShoulder * 0.94 * 10) / 10,
        offPeakRateCentsPerKWh: Math.round(baseOffPeak * 0.92 * 10) / 10,
        evNightRateCentsPerKWh: 7.2,
        solarFeedInTariffCents: 9.0,
      },
      contractType: 'NO_LOCK_IN',
      pricingType: 'VARIABLE',
      isStandingOffer: false,
      greenPowerAvailable: true,
      greenPowerPercent: 20,
      dmoComparisonPercent: -27,
      features: [
        '$1.00 / kWh cash reward for zero net grid use during peak periods',
        'Discharge your 40-50kWh battery to earn guaranteed $1/kWh demand credits',
        'No wholesale spot price risk — 100% predictable rate cap',
        'Sub-95c/day daily supply charge'
      ],
      billFrequency: 'MONTHLY',
      coolingOffDays: 10,
      websiteUrl: 'https://www.globirdenergy.com.au',
      phone: '13 34 56',
      customerRating: 4.8,
      hasZeroHeroIncentive: true,
      zeroHeroPeakRewardPerKWhSaved: 1.00,
      zeroHeroDescription: '$1.00/kWh incentive paid for zero peak power consumption or battery export (4:00pm - 9:00pm)',
      isBatteryVppEligible: true,
      vppAnnualCredit: 380,
      vppProviderName: 'GloBird ZeroHero Grid Resilience',
      hasFreePowerHours: false,
    },

    // 3. GloBird Energy - GloSave Flat Rate
    {
      id: `${dist.code.toLowerCase()}-globird-glosave`,
      retailerName: 'GloBird Energy',
      retailerCode: 'GLOBIRD',
      planName: `GloSave Flat Rate Special (${dist.code})`,
      state: dist.state,
      distributorCode: dist.code,
      tariffType: 'FLAT',
      rates: {
        dailySupplyChargeCents: Math.round(baseSupply * 0.94 * 10) / 10,
        flatRateCentsPerKWh: Math.round(baseFlat * 0.96 * 10) / 10,
        solarFeedInTariffCents: 7.5,
        controlledLoadCentsPerKWh: 16.2,
      },
      contractType: 'NO_LOCK_IN',
      pricingType: 'VARIABLE',
      isStandingOffer: false,
      greenPowerAvailable: false,
      greenPowerPercent: 0,
      dmoComparisonPercent: -24,
      features: [
        `Discount single flat rate in ${dist.code} network`,
        'Sub-$1 daily supply charge',
        'Direct debit discount included'
      ],
      billFrequency: 'MONTHLY',
      coolingOffDays: 10,
      websiteUrl: 'https://www.globirdenergy.com.au',
      phone: '13 34 56',
      customerRating: 4.6,
      hasFreePowerHours: false,
    },

    // 4. Amber Electric - Smartshift Wholesale Pass-Through
    {
      id: `${dist.code.toLowerCase()}-amber-smart`,
      retailerName: 'Amber Electric',
      retailerCode: 'AMBER',
      planName: `Amber Smartshift Wholesale (${dist.code})`,
      state: dist.state,
      distributorCode: dist.code,
      tariffType: 'TOU',
      rates: {
        dailySupplyChargeCents: Math.round(baseSupply * 1.25 * 10) / 10,
        peakRateCentsPerKWh: Math.round(basePeak * 1.02 * 10) / 10,
        shoulderRateCentsPerKWh: Math.round(baseShoulder * 0.92 * 10) / 10,
        offPeakRateCentsPerKWh: Math.round(baseOffPeak * 0.85 * 10) / 10,
        evNightRateCentsPerKWh: 5.0,
        solarFeedInTariffCents: 10.5,
      },
      contractType: 'NO_LOCK_IN',
      pricingType: 'VARIABLE',
      isStandingOffer: false,
      greenPowerAvailable: true,
      greenPowerPercent: 100,
      dmoComparisonPercent: -25,
      features: [
        'Automated 40kWh - 50kWh battery soaking when wholesale rates hit 0c or negative',
        'Export battery to grid at up to $15/kWh (1500c/kWh) during evening price spikes',
        'Direct pass-through of NEM wholesale electricity spot prices'
      ],
      billFrequency: 'MONTHLY',
      coolingOffDays: 10,
      websiteUrl: 'https://www.amber.com.au',
      phone: '1800 262 370',
      customerRating: 4.8,
      isEvPlan: true,
      evRateDescription: 'Wholesale dips (often 0c to 5c/kWh overnight & midday)',
      isBatteryVppEligible: true,
      vppAnnualCredit: 440,
      vppProviderName: 'Amber Smartshift Automated 50kWh Dispatch',
      hasFreePowerHours: true,
      freePowerWindowDescription: 'Automated 0c/kWh Solar Sponge & Negative Price Intervals',
      freePowerHoursDaily: 3,
    },

    // 5. OVO Energy - The One Plan (Free 3-Hour Power 11am-2pm)
    {
      id: `${dist.code.toLowerCase()}-ovo-theone`,
      retailerName: 'OVO Energy',
      retailerCode: 'OVO',
      planName: `The One Plan (Free 3-Hour Power ${dist.code})`,
      state: dist.state,
      distributorCode: dist.code,
      tariffType: 'TOU',
      rates: {
        dailySupplyChargeCents: Math.round(baseSupply * 1.02 * 10) / 10,
        peakRateCentsPerKWh: Math.round(basePeak * 0.98 * 10) / 10,
        shoulderRateCentsPerKWh: Math.round(baseShoulder * 0.98 * 10) / 10,
        offPeakRateCentsPerKWh: Math.round(baseOffPeak * 1.02 * 10) / 10,
        evNightRateCentsPerKWh: 8.0,
        solarFeedInTariffCents: 8.5,
      },
      contractType: 'NO_LOCK_IN',
      pricingType: 'VARIABLE',
      isStandingOffer: false,
      greenPowerAvailable: true,
      greenPowerPercent: 100,
      dmoComparisonPercent: -23,
      features: [
        'FREE 3 hours of electricity daily (11:00am - 2:00pm)',
        'Soak grid power into 40kWh - 50kWh battery banks for $0',
        'EV Add-on: 8.0c/kWh overnight charging'
      ],
      billFrequency: 'MONTHLY',
      coolingOffDays: 10,
      websiteUrl: 'https://www.ovoenergy.com.au',
      phone: '1300 937 686',
      customerRating: 4.7,
      isEvPlan: true,
      evRateDescription: '8.0c/kWh overnight + FREE 11am-2pm solar sponge window',
      isBatteryVppEligible: true,
      vppAnnualCredit: 240,
      vppProviderName: 'OVO Smart Grid',
      hasFreePowerHours: true,
      freePowerWindowDescription: 'Free 3 hours daily (11:00am - 2:00pm)',
      freePowerHoursDaily: 3,
    },

    // 6. AGL Energy - EV Night Saver
    {
      id: `${dist.code.toLowerCase()}-agl-ev-night`,
      retailerName: 'AGL Energy',
      retailerCode: 'AGL',
      planName: `AGL EV Night Saver + Battery (${dist.code})`,
      state: dist.state,
      distributorCode: dist.code,
      tariffType: 'TOU',
      rates: {
        dailySupplyChargeCents: Math.round(baseSupply * 1.15 * 10) / 10,
        peakRateCentsPerKWh: Math.round(basePeak * 1.10 * 10) / 10,
        shoulderRateCentsPerKWh: Math.round(baseShoulder * 1.05 * 10) / 10,
        offPeakRateCentsPerKWh: Math.round(baseOffPeak * 1.10 * 10) / 10,
        evNightRateCentsPerKWh: 8.0,
        solarFeedInTariffCents: 6.5,
      },
      contractType: 'NO_LOCK_IN',
      pricingType: 'VARIABLE',
      isStandingOffer: false,
      greenPowerAvailable: true,
      greenPowerPercent: 20,
      dmoComparisonPercent: -21,
      features: [
        '8.0c/kWh EV overnight rate (12am - 6am)',
        '$150 sign-up bonus credit',
        'AGL Virtual Power Plant battery ready ($280/yr)'
      ],
      billFrequency: 'MONTHLY',
      coolingOffDays: 10,
      websiteUrl: 'https://www.agl.com.au',
      phone: '131 245',
      customerRating: 4.5,
      isEvPlan: true,
      isBatteryVppEligible: true,
      vppAnnualCredit: 280,
      hasFreePowerHours: false,
    },

    // 7. Origin Energy - EV Power Up
    {
      id: `${dist.code.toLowerCase()}-origin-ev`,
      retailerName: 'Origin Energy',
      retailerCode: 'ORIGIN',
      planName: `Origin EV Power Up + Loop VPP (${dist.code})`,
      state: dist.state,
      distributorCode: dist.code,
      tariffType: 'TOU',
      rates: {
        dailySupplyChargeCents: Math.round(baseSupply * 1.10 * 10) / 10,
        peakRateCentsPerKWh: Math.round(basePeak * 1.05 * 10) / 10,
        shoulderRateCentsPerKWh: Math.round(baseShoulder * 1.02 * 10) / 10,
        offPeakRateCentsPerKWh: Math.round(baseOffPeak * 1.05 * 10) / 10,
        evNightRateCentsPerKWh: 7.8,
        solarFeedInTariffCents: 7.0,
      },
      contractType: 'NO_LOCK_IN',
      pricingType: 'VARIABLE',
      isStandingOffer: false,
      greenPowerAvailable: true,
      greenPowerPercent: 25,
      dmoComparisonPercent: -20,
      features: [
        'Origin 360 EV Smart Charging discount',
        '$250/yr Loop Battery VPP support bonus',
        'Everyday Rewards points on every bill'
      ],
      billFrequency: 'MONTHLY',
      coolingOffDays: 10,
      websiteUrl: 'https://www.originenergy.com.au',
      phone: '13 24 61',
      customerRating: 4.4,
      isEvPlan: true,
      isBatteryVppEligible: true,
      vppAnnualCredit: 250,
      hasFreePowerHours: false,
    },

    // 8. EnergyAustralia - Total Plan Home
    {
      id: `${dist.code.toLowerCase()}-ea-total`,
      retailerName: 'EnergyAustralia',
      retailerCode: 'EA',
      planName: `Total Plan Home + PowerResponse (${dist.code})`,
      state: dist.state,
      distributorCode: dist.code,
      tariffType: 'FLAT',
      rates: {
        dailySupplyChargeCents: Math.round(baseSupply * 1.18 * 10) / 10,
        flatRateCentsPerKWh: Math.round(baseFlat * 1.05 * 10) / 10,
        solarFeedInTariffCents: 7.0,
        controlledLoadCentsPerKWh: 17.0,
      },
      contractType: 'NO_LOCK_IN',
      pricingType: 'FIXED',
      isStandingOffer: false,
      greenPowerAvailable: true,
      greenPowerPercent: 100,
      dmoComparisonPercent: -15,
      features: [
        '12-month fixed rate guarantee',
        'PowerResponse Battery VPP enrolled ($300/yr)'
      ],
      billFrequency: 'QUARTERLY',
      coolingOffDays: 10,
      websiteUrl: 'https://www.energyaustralia.com.au',
      phone: '133 466',
      customerRating: 4.1,
      isBatteryVppEligible: true,
      vppAnnualCredit: 300,
      hasFreePowerHours: false,
    },

    // 9. Powershop - Free Power Sponge
    {
      id: `${dist.code.toLowerCase()}-powershop-sponge`,
      retailerName: 'Powershop',
      retailerCode: 'POWERSHOP',
      planName: `Powershop Solar Sponge & Battery (${dist.code})`,
      state: dist.state,
      distributorCode: dist.code,
      tariffType: 'TOU',
      rates: {
        dailySupplyChargeCents: Math.round(baseSupply * 1.16 * 10) / 10,
        peakRateCentsPerKWh: Math.round(basePeak * 1.08 * 10) / 10,
        shoulderRateCentsPerKWh: Math.round(baseShoulder * 0.98 * 10) / 10,
        offPeakRateCentsPerKWh: Math.round(baseOffPeak * 1.05 * 10) / 10,
        evNightRateCentsPerKWh: 8.5,
        solarFeedInTariffCents: 8.5,
      },
      contractType: 'NO_LOCK_IN',
      pricingType: 'VARIABLE',
      isStandingOffer: false,
      greenPowerAvailable: true,
      greenPowerPercent: 100,
      dmoComparisonPercent: -23,
      features: [
        'FREE Solar Sponge midday power window (10:00am - 1:00pm)',
        'Fill battery for $0 from grid during solar sponge window'
      ],
      billFrequency: 'MONTHLY',
      coolingOffDays: 10,
      websiteUrl: 'https://www.powershop.com.au',
      phone: '1800 462 668',
      customerRating: 4.7,
      isEvPlan: true,
      isBatteryVppEligible: true,
      vppAnnualCredit: 300,
      hasFreePowerHours: true,
      freePowerWindowDescription: 'Free Solar Sponge power window (10am - 1pm)',
      freePowerHoursDaily: 3,
    },

    // 10. Regulated Standing Offer (DMO or VDO Reference Price)
    {
      id: `${dist.code.toLowerCase()}-standing-dmo`,
      retailerName: 'Standard Retailer Standing Offer',
      retailerCode: 'STANDING',
      planName: isVic
        ? `Victorian Default Offer (VDO Reference - ${dist.code})`
        : `Default Market Offer (DMO Reference - ${dist.code})`,
      state: dist.state,
      distributorCode: dist.code,
      tariffType: 'FLAT',
      rates: {
        dailySupplyChargeCents: Math.round(baseSupply * 1.35 * 10) / 10,
        flatRateCentsPerKWh: Math.round(baseFlat * 1.30 * 10) / 10,
        solarFeedInTariffCents: 4.9,
      },
      contractType: 'NO_LOCK_IN',
      pricingType: 'VARIABLE',
      isStandingOffer: true,
      greenPowerAvailable: false,
      greenPowerPercent: 0,
      dmoComparisonPercent: 0,
      features: [
        'Regulated baseline safety net set by AER / ESC',
        'No discounts applied'
      ],
      billFrequency: 'QUARTERLY',
      coolingOffDays: 10,
      websiteUrl: 'https://www.aer.gov.au',
      phone: '1300 585 165',
      customerRating: 3.5,
      hasFreePowerHours: false,
    }
  ];
}

export const SAMPLE_AER_PLANS: EnergyPlan[] = DISTRIBUTORS.flatMap(createNetworkPlans);

// Realistic 24-Hour National Electricity Market (NEM) wholesale price curve
export const SAMPLE_WHOLESALE_INTERVALS: WholesaleHalfHourInterval[] = [
  { time: '00:00', wholesalePriceCentsPerKWh: 8.2, isPeakPeriod: false, isSolarSpongePeriod: false, isSpike: false, gridStatus: 'NORMAL' },
  { time: '02:00', wholesalePriceCentsPerKWh: 5.4, isPeakPeriod: false, isSolarSpongePeriod: false, isSpike: false, gridStatus: 'NORMAL' },
  { time: '04:00', wholesalePriceCentsPerKWh: 6.8, isPeakPeriod: false, isSolarSpongePeriod: false, isSpike: false, gridStatus: 'NORMAL' },
  { time: '06:00', wholesalePriceCentsPerKWh: 18.5, isPeakPeriod: false, isSolarSpongePeriod: false, isSpike: false, gridStatus: 'NORMAL' },
  { time: '08:00', wholesalePriceCentsPerKWh: 14.2, isPeakPeriod: false, isSolarSpongePeriod: false, isSpike: false, gridStatus: 'NORMAL' },
  { time: '10:00', wholesalePriceCentsPerKWh: 1.5, isPeakPeriod: false, isSolarSpongePeriod: true, isSpike: false, gridStatus: 'SOLAR_FLOOD' },
  { time: '11:00', wholesalePriceCentsPerKWh: -2.8, isPeakPeriod: false, isSolarSpongePeriod: true, isSpike: false, gridStatus: 'SOLAR_FLOOD' },
  { time: '12:00', wholesalePriceCentsPerKWh: -4.5, isPeakPeriod: false, isSolarSpongePeriod: true, isSpike: false, gridStatus: 'SOLAR_FLOOD' },
  { time: '13:00', wholesalePriceCentsPerKWh: -1.2, isPeakPeriod: false, isSolarSpongePeriod: true, isSpike: false, gridStatus: 'SOLAR_FLOOD' },
  { time: '14:00', wholesalePriceCentsPerKWh: 3.8, isPeakPeriod: false, isSolarSpongePeriod: true, isSpike: false, gridStatus: 'SOLAR_FLOOD' },
  { time: '16:00', wholesalePriceCentsPerKWh: 24.5, isPeakPeriod: true, isSolarSpongePeriod: false, isSpike: false, gridStatus: 'EVENING_PEAK' },
  { time: '17:30', wholesalePriceCentsPerKWh: 185.0, isPeakPeriod: true, isSolarSpongePeriod: false, isSpike: true, gridStatus: 'EXTREME_PRICE_SPIKE' },
  { time: '18:30', wholesalePriceCentsPerKWh: 850.0, isPeakPeriod: true, isSolarSpongePeriod: false, isSpike: true, gridStatus: 'EXTREME_PRICE_SPIKE' },
  { time: '19:30', wholesalePriceCentsPerKWh: 1420.0, isPeakPeriod: true, isSolarSpongePeriod: false, isSpike: true, gridStatus: 'EXTREME_PRICE_SPIKE' },
  { time: '20:30', wholesalePriceCentsPerKWh: 340.0, isPeakPeriod: true, isSolarSpongePeriod: false, isSpike: true, gridStatus: 'EXTREME_PRICE_SPIKE' },
  { time: '21:30', wholesalePriceCentsPerKWh: 32.0, isPeakPeriod: false, isSolarSpongePeriod: false, isSpike: false, gridStatus: 'NORMAL' },
  { time: '23:00', wholesalePriceCentsPerKWh: 12.0, isPeakPeriod: false, isSolarSpongePeriod: false, isSpike: false, gridStatus: 'NORMAL' },
];

export const JARGON_GLOSSARY = [
  {
    term: 'GloBird ZEROHERO ($1/kWh Incentive)',
    meaning: 'GloBird Energy\'s demand-response incentive program paying you $1.00 for every kilowatt-hour avoided or discharged from a home battery during high-stress peak periods (typically 4:00pm - 9:00pm weekdays). Unlike wholesale plans, your retail electricity rate remains strictly capped so you face zero risk of runaway bills.',
    tip: 'With a 40kWh or 50kWh battery, discharging 20-30kWh across the peak window earns you $20 - $30 in direct bill credits per event (over $800 - $1,400/year) without exposing your home to volatile wholesale price spikes.'
  },
  {
    term: 'Amber Smartshift Wholesale Discharging',
    meaning: 'Amber passes through the real-time National Electricity Market (NEM) wholesale spot price, which normally fluctuates between -5c/kWh (curtailed solar flood) and $15.00/kWh (extreme price cap). When the grid spikes, your battery automatically sells stored energy back into the grid at wholesale spot rates.',
    tip: 'Wholesale plans offer immense reward during extreme summer/winter grid events, but also require careful inverter control to avoid accidentally importing power at $15/kWh if your battery runs dry.'
  },
  {
    term: 'GloBird FreeLunch (11:00am - 2:00pm)',
    meaning: 'GloBird Energy provides 100% free grid power (0c/kWh) between 11:00am and 2:00pm every day of the year. This allows households with large 40kWh or 50kWh batteries to suck power from the grid at $0.00/kWh, regardless of cloud cover, and power the home for free through the night.',
    tip: 'Pairing FreeLunch with a 40kWh-50kWh battery guarantees free electricity with zero market volatility.'
  },
  {
    term: 'Wholesale Price Spikes vs Capped Retail',
    meaning: 'Wholesale prices are set every 5 minutes on the NEM by AEMO. Capped retail plans (like GloBird FreeLunch or OVO) absorb all wholesale volatility for you, whereas pass-through providers (like Amber) pass both the negative price benefits and the risk of price surges directly to you.',
    tip: 'If you want 100% peace of mind, choose GloBird FreeLunch or ZEROHERO. If you love automated energy trading and active grid participation, Amber Smartshift is unmatched.'
  }
];
