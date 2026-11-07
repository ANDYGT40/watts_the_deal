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
  
  // EV & Battery Provisions
  isEvPlan?: boolean;
  evRateDescription?: string; // e.g. "8.0c/kWh between 12am - 6am every night"
  isBatteryVppEligible?: boolean;
  vppAnnualCredit?: number; // e.g. $240/yr VPP grid participation credit
  vppProviderName?: string; // e.g. "Tesla Energy Plan / Amber SmartShift / AGL VPP"

  // Free Power Hours Provision
  hasFreePowerHours?: boolean;
  freePowerWindowDescription?: string; // e.g. "Free 3 hours daily (11:00am - 2:00pm)"
  freePowerHoursDaily?: number; // Duration in hours per day (e.g. 3 hours)
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
  evDailyKWh: number; // Typical daily top-up: ~8 - 14 kWh/day (~40-70km)
  evChargingTime: 'OVERNIGHT' | 'DAYTIME_SOLAR' | 'FREE_POWER_HOURS' | 'FLEXIBLE';

  // Home Battery Storage Provisions
  hasBattery: boolean;
  batteryCapacityKWh: number; // e.g. 5, 10, 13.5 kWh
  batteryChargingSource: 'SOLAR_AND_GRID' | 'FREE_POWER_HOURS_SOAK' | 'SOLAR_ONLY'; // Charge battery for $0 during free power hours
  joinVpp: boolean; // Virtual Power Plant enrollment for grid discharge credits
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
