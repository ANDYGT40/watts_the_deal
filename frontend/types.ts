export type AusState = 'NSW' | 'VIC' | 'QLD' | 'SA' | 'ACT' | 'TAS';

export interface DistributorInfo {
  code: string;
  name: string;
  state: AusState;
  postcodeRanges: [number, number][];
  defaultMarketOfferAnnual: number; // In AUD ($) for average 4,000 - 4,600 kWh/yr benchmark
}

export type TariffType = 'FLAT' | 'TOU' | 'DEMAND';

export interface TariffRate {
  dailySupplyChargeCents: number; // e.g. 115.5 c/day
  flatRateCentsPerKWh?: number; // e.g. 31.2 c/kWh
  peakRateCentsPerKWh?: number; // e.g. 42.5 c/kWh
  shoulderRateCentsPerKWh?: number; // e.g. 27.8 c/kWh
  offPeakRateCentsPerKWh?: number; // e.g. 21.0 c/kWh
  evNightRateCentsPerKWh?: number; // e.g. 8.0 c/kWh super off-peak midnight-6am
  controlledLoadCentsPerKWh?: number; // e.g. 19.5 c/kWh
  solarFeedInTariffCents?: number; // e.g. 7.0 c/kWh
  peakSolarFeedInTariffCents?: number; // Special peak export FiT if offered
  solarFeedInCapKWhPerDay?: number; // e.g. max 10 or 14 kWh/day eligible for high FiT rate before dropping to lower tier
}

export interface EnergyPlan {
  id: string;
  retailerName: string;
  retailerCode: string;
  planName: string;
  state: AusState;
  distributorCode: string;
  tariffType: TariffType;
  rates: TariffRate;
  contractType: 'NO_LOCK_IN' | '12_MONTHS' | '24_MONTHS';
  pricingType: 'VARIABLE' | 'FIXED';
  isStandingOffer: boolean; // Standing vs Market offer
  greenPowerAvailable: boolean;
  greenPowerPercent: number;
  dmoComparisonPercent: number; // e.g. -14 means 14% LESS than the reference price / DMO
  conditionalDiscountsNotes?: string;
  features: string[];
  billFrequency: 'MONTHLY' | 'QUARTERLY';
  coolingOffDays: number;
  websiteUrl: string;
  phone: string;
  customerRating: number; // e.g. 4.3 out of 5
  isCustomPlan?: boolean; // User created / custom imported plan
  
  // EV & Battery Provisions
  isEvPlan?: boolean;
  evRateDescription?: string;
  isBatteryVppEligible?: boolean;
  vppAnnualCredit?: number;
  vppProviderName?: string;

  // Free Power Hours Provision
  hasFreePowerHours?: boolean;
  freePowerWindowDescription?: string;
  freePowerHoursDaily?: number; // Duration (e.g. 3 hours)

  // GloBird ZeroHero: $1.00 per DAY incentive for zero grid draw in peak periods
  hasZeroHeroIncentive?: boolean;
  zeroHeroDailyRewardDollars?: number; // Exactly $1.00 per peak day with 0 grid import
  zeroHeroDescription?: string;
}

export interface HouseholdProfile {
  postcode: string;
  state: AusState;
  distributorCode: string;
  occupants: number; // 1, 2, 3, 4, 5+
  averageDailyUsageKWh: number; // default ~12 to 18 kWh/day
  hasSolar: boolean;
  solarDailyExportKWh: number;
  hasControlledLoad: boolean; // electric hot water or slab heating
  controlledLoadDailyKWh: number;
  tariffTypePreference: 'ANY' | 'FLAT' | 'TOU';
  currentQuarterlyBillCost?: number;

  // EV Charging Provisions
  hasEV: boolean;
  evDailyKWh: number;
  evChargingTime: 'OVERNIGHT' | 'DAYTIME_SOLAR' | 'FREE_POWER_HOURS' | 'FLEXIBLE';

  // Home Battery Storage Provisions
  hasBattery: boolean;
  batteryCapacityKWh: number; // e.g. 5, 10, 13.5, 40, 50 kWh
  batteryInverterKw: number; // Continuous charge/discharge power limit (e.g. 5kW, 7kW, 10kW)
  batteryChargingSource: 'SOLAR_AND_GRID' | 'FREE_POWER_HOURS_SOAK' | 'SOLAR_ONLY';
  joinVpp: boolean;

  // ZeroHero / Peak Curtailment opt-in
  participateInZeroHero?: boolean;
}

export interface WholesaleHalfHourInterval {
  time: string; // e.g. "17:30"
  wholesalePriceCentsPerKWh: number; // e.g. -5c/kWh up to $15.00/kWh (1500c/kWh)
  isPeakPeriod: boolean;
  isSolarSpongePeriod: boolean;
  isSpike: boolean;
  gridStatus: 'NORMAL' | 'SOLAR_FLOOD' | 'EVENING_PEAK' | 'EXTREME_PRICE_SPIKE';
}

export interface BatteryStrategyComparison {
  scenarioName: string;
  description: string;
  amberWholesaleAnnualNetProfit: number;
  gloBirdFreeLunchAnnualTotal: number;
  zeroHeroEarningsAnnual: number;
  recommendedWinner: 'AMBER_WHOLESALE' | 'GLOBIRD_FREELUNCH' | 'GLOBIRD_ZEROHERO';
  pros: string[];
  cons: string[];
}

export interface BillAnalysisResult {
  nmi?: string;
  retailer?: string;
  state?: string;
  periodDays?: number;
  totalKWh?: number;
  dailyAverageKWh?: number;
  totalCostIncGst?: number;
  currentSupplyChargeCents?: number;
  currentUsageRateCents?: number;
  solarExportKWh?: number;
  evDetected?: boolean;
  batteryDetected?: boolean;
  insights: string[];
  recommendationSummary: string;
}
