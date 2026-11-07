import React, { useState } from 'react';
import { EnergyPlan, HouseholdProfile, DistributorInfo } from '../types';
import { calculatePlanCost } from '../utils/calculationUtils';
import { 
  CheckCircle2, 
  Leaf, 
  Sun, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Car,
  BatteryCharging,
  Zap,
  Clock,
  DollarSign,
  Tag
} from 'lucide-react';

interface PlanCardProps {
  plan: EnergyPlan;
  profile: HouseholdProfile;
  distributor: DistributorInfo;
  isCompared: boolean;
  onToggleCompare: (planId: string) => void;
  onAskAiAboutPlan: (plan: EnergyPlan) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  profile,
  distributor,
  isCompared,
  onToggleCompare,
  onAskAiAboutPlan
}) => {
  const [expanded, setExpanded] = useState(false);
  const cost = calculatePlanCost(plan, profile, distributor);

  const isDmoStanding = plan.isStandingOffer;
  const isZeroHeroWithFreePower = Boolean(plan.hasZeroHeroIncentive && plan.hasFreePowerHours);

  return (
    <div className={`relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
      isCompared 
        ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg' 
        : isDmoStanding
          ? 'border-slate-300/80 bg-slate-50/50'
          : plan.hasZeroHeroIncentive
            ? 'border-emerald-500 hover:border-emerald-600 hover:shadow-lg'
            : plan.hasFreePowerHours
              ? 'border-amber-300/80 hover:border-amber-400 hover:shadow-md'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
    }`}>
      {/* Top Banner */}
      <div className={`px-5 py-2.5 text-xs font-bold flex flex-wrap items-center justify-between gap-2 ${
        isDmoStanding 
          ? 'bg-slate-200 text-slate-700' 
          : plan.hasZeroHeroIncentive
            ? 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-amber-700 text-white'
            : plan.hasFreePowerHours
              ? 'bg-gradient-to-r from-amber-600 via-emerald-700 to-slate-900 text-white'
              : plan.isEvPlan
                ? 'bg-gradient-to-r from-sky-800 to-emerald-700 text-white'
                : plan.dmoComparisonPercent <= -18
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-900 border-b border-emerald-100'
      }`}>
        <div className="flex items-center gap-2 flex-wrap">
          {plan.isCustomPlan && (
            <span className="inline-flex items-center gap-1 bg-purple-200 text-purple-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <Tag className="w-3 h-3" /> CUSTOM ADDED PLAN
            </span>
          )}
          {isZeroHeroWithFreePower && (
            <span className="inline-flex items-center gap-1 bg-amber-300 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              <Zap className="w-3 h-3 fill-slate-950" /> FREE 11AM-2PM + $1.00/DAY PEAK REWARD
            </span>
          )}
          {plan.hasZeroHeroIncentive && !isZeroHeroWithFreePower && (
            <span className="inline-flex items-center gap-1 bg-emerald-400 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <DollarSign className="w-3 h-3" /> $1.00/DAY ZERO PEAK DRAW REWARD
            </span>
          )}
          {plan.hasFreePowerHours && !plan.hasZeroHeroIncentive && (
            <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <Zap className="w-3 h-3" /> FREE POWER HOURS (0c)
            </span>
          )}
          {plan.isEvPlan && (
            <span className="inline-flex items-center gap-1 bg-sky-300 text-slate-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <Car className="w-3 h-3" /> EV 8c Night
            </span>
          )}
          {plan.dmoComparisonPercent < 0 ? (
            <span className="flex items-center gap-1 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              {Math.abs(plan.dmoComparisonPercent)}% LESS than Reference Price (DMO/VDO)
            </span>
          ) : (
            <span className="font-semibold text-slate-700">
              Standing Offer Reference Price baseline
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span>{plan.tariffType === 'TOU' ? 'Time of Use' : 'Single Flat Rate'}</span>
          <span>•</span>
          <span>{plan.pricingType === 'FIXED' ? 'Fixed Rate' : 'Variable Rate'}</span>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-4">
        {/* Retailer & Plan Title + Cost summary */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-extrabold text-slate-900">{plan.retailerName}</h3>
              {plan.greenPowerAvailable && plan.greenPowerPercent > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                  <Leaf className="w-3 h-3 text-green-600" />
                  {plan.greenPowerPercent}% Green
                </span>
              )}
              {plan.isBatteryVppEligible && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">
                  <BatteryCharging className="w-3 h-3 text-emerald-600" />
                  VPP Ready
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-emerald-800 mt-0.5">{plan.planName}</p>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
              <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                {plan.contractType === 'NO_LOCK_IN' ? 'No lock-in contract' : plan.contractType}
              </span>
              <span>•</span>
              <span>Cooling-off: {plan.coolingOffDays} business days</span>
            </div>
          </div>

          {/* Price Highlight (Handles Negative Totals as Credit) */}
          <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6 min-w-[180px]">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
              {cost.isCredit ? 'Estimated Net Credit' : 'Estimated Total Cost'}
            </span>
            <div className="flex items-baseline justify-end gap-1">
              {cost.isCredit ? (
                <>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
                    +${Math.abs(cost.quarterlyTotal)}
                  </span>
                  <span className="text-xs text-emerald-800 font-bold">/ qtr credit</span>
                </>
              ) : (
                <>
                  <span className="text-3xl font-extrabold text-slate-900 font-mono">
                    ${cost.quarterlyTotal}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ qtr</span>
                </>
              )}
            </div>
            <p className="text-xs font-mono font-semibold text-slate-600 mt-0.5">
              {cost.isCredit ? `(Earn ~+$${Math.abs(cost.annualTotal)} / year in credit)` : `~$${cost.annualTotal} / year`}
            </p>
            {cost.annualSavingsVsDMO > 0 && (
              <span className="inline-block mt-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Save ~${cost.annualSavingsVsDMO}/yr vs VDO/DMO
              </span>
            )}
            {cost.annualSavingsVsCurrent !== undefined && cost.annualSavingsVsCurrent > 0 && (
              <span className="block mt-0.5 text-[11px] font-bold text-amber-700">
                Save ~${cost.annualSavingsVsCurrent}/yr vs current bill
              </span>
            )}
          </div>
        </div>

        {/* GloBird ZEROHERO Combined Banner */}
        {plan.hasZeroHeroIncentive && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 via-amber-50 to-emerald-50 border-2 border-emerald-400 text-emerald-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-black mt-0.5 shadow-sm">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-xs">GloBird ZEROHERO Plan</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-950 font-black text-[10px]">
                    $1.00 / DAY REWARD
                  </span>
                </div>
                <p className="text-[11px] text-emerald-900 mt-1 leading-snug">
                  • <strong>11am - 2pm Free Power:</strong> Draw up to ~{cost.dailyFreeSoakKWhCapped}kWh for <strong>$0.00</strong> (governed by your {profile.batteryInverterKw || (profile.batteryCapacityKWh >= 30 ? 10 : 5)}kW inverter limit).<br/>
                  • <strong>4pm - 9pm Peak Window:</strong> Power home with battery to achieve <strong>zero grid import</strong> and earn $1.00/day ($365/year cash reward)!
                </p>
              </div>
            </div>
            <div className="text-right sm:border-l sm:border-emerald-200 sm:pl-3 whitespace-nowrap">
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Zero Peak Draw Reward</span>
              <span className="font-mono font-black text-sm text-emerald-950 bg-emerald-200/90 px-2 py-0.5 rounded block mt-0.5">
                +${cost.zeroHeroRewardAnnual || 365}/yr ($1/day)
              </span>
            </div>
          </div>
        )}

        {/* Free Power Hours Alert */}
        {plan.hasFreePowerHours && !plan.hasZeroHeroIncentive && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0 font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold block">Free Power Window: {plan.freePowerWindowDescription}</span>
                <span className="text-[11px] text-amber-800">
                  {profile.hasBattery 
                    ? `Soak up to ~${cost.dailyFreeSoakKWhCapped}kWh daily for $0/kWh during the 3h window (${profile.batteryInverterKw || (profile.batteryCapacityKWh >= 30 ? 10 : 5)}kW inverter limit).`
                    : 'Schedule washing machines, dishwasher, and EV charging during this window for $0.00!'}
                </span>
              </div>
            </div>
            {profile.hasBattery && cost.freePowerBatterySavingsAnnual > 0 && (
              <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded text-right whitespace-nowrap">
                +${cost.freePowerBatterySavingsAnnual}/yr Battery Soak Savings
              </span>
            )}
          </div>
        )}

        {/* Rate Quick Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Daily Supply
            </span>
            <span className="text-sm font-mono font-bold text-slate-900">
              {plan.rates.dailySupplyChargeCents} c
            </span>
            <span className="text-[10px] text-slate-500 block">/ day</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Usage Rate
            </span>
            {plan.tariffType === 'FLAT' ? (
              <>
                <span className="text-sm font-mono font-bold text-slate-900">
                  {plan.rates.flatRateCentsPerKWh} c
                </span>
                <span className="text-[10px] text-slate-500 block">per kWh (Flat)</span>
              </>
            ) : (
              <>
                <span className="text-sm font-mono font-bold text-slate-900">
                  {plan.rates.peakRateCentsPerKWh} c
                </span>
                <span className="text-[10px] text-slate-500 block">Peak / {plan.rates.offPeakRateCentsPerKWh}c Off-peak</span>
              </>
            )}
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70">
            <span className="text-[10px] text-amber-900 font-bold uppercase tracking-wider block flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-600" />
              Solar Feed-in
            </span>
            <span className="text-sm font-mono font-bold text-amber-900">
              {plan.rates.solarFeedInTariffCents ? `${plan.rates.solarFeedInTariffCents} c` : '0 c'}
            </span>
            <span className="text-[10px] text-amber-700 block">
              {plan.rates.solarFeedInCapKWhPerDay ? `Capped at ${plan.rates.solarFeedInCapKWhPerDay}kWh/d` : 'Standard export'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Customer Rating
            </span>
            <span className="text-sm font-mono font-bold text-emerald-800">
              ★ {plan.customerRating} / 5
            </span>
            <span className="text-[10px] text-slate-500 block">ProductReview</span>
          </div>
        </div>

        {/* Plan Key Features */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          {plan.features.map((feat, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {feat}
            </span>
          ))}
        </div>

        {/* Detailed Breakdown Toggle */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 bg-slate-50/80 -mx-5 -mb-5 p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Detailed Cost Composition (Annual Estimates with Battery & Inverter Speed)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 font-sans block">Supply Charge</span>
                <span className="font-bold text-slate-800">${cost.supplyCostAnnual} / yr</span>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 font-sans block">Base Usage</span>
                <span className="font-bold text-slate-800">${cost.usageCostAnnual} / yr</span>
              </div>
              {profile.hasBattery && cost.batteryPeakSavingsAnnual > 0 && (
                <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 font-sans block">
                    {plan.hasFreePowerHours ? `Battery 0c Soak Offset (~${cost.dailyFreeSoakKWhCapped}kWh/d)` : 'Battery Peak Offset'}
                  </span>
                  <span className="font-bold text-emerald-700">-${cost.batteryPeakSavingsAnnual} / yr</span>
                </div>
              )}
              {plan.hasZeroHeroIncentive && cost.zeroHeroRewardAnnual > 0 && (
                <div className="p-2 bg-emerald-100/80 rounded border border-emerald-300">
                  <span className="text-[10px] text-emerald-900 font-sans block font-bold">ZEROHERO $1/Day Reward</span>
                  <span className="font-bold text-emerald-900">-${cost.zeroHeroRewardAnnual} / yr</span>
                </div>
              )}
              {profile.hasEV && (
                <div className="p-2 bg-sky-50 rounded border border-sky-200">
                  <span className="text-[10px] text-sky-800 font-sans block">EV Charging ({profile.evDailyKWh} kWh/d)</span>
                  <span className="font-bold text-sky-900">+${cost.evChargingAnnual} / yr</span>
                </div>
              )}
              {profile.hasBattery && profile.joinVpp && cost.vppCreditAnnual > 0 && (
                <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 font-sans block">VPP Grid Credit</span>
                  <span className="font-bold text-emerald-700">-${cost.vppCreditAnnual} / yr</span>
                </div>
              )}
              {profile.hasSolar && (
                <div className="p-2 bg-amber-50/60 rounded border border-amber-200">
                  <span className="text-[10px] text-amber-800 font-sans block">Solar Export Credit</span>
                  <span className="font-bold text-emerald-700">-${cost.solarCreditAnnual} / yr</span>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-600 space-y-1 pt-1 font-sans">
              <p>
                <strong>Retailer Contact:</strong> {plan.phone} •{' '}
                <a
                  href={plan.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 font-semibold underline hover:text-emerald-800 inline-flex items-center gap-1"
                >
                  Visit Retailer Website <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <p className="text-[11px] text-slate-500">
                * Rates inclusive of GST. Inverter rating ({profile.batteryInverterKw || (profile.batteryCapacityKWh >= 30 ? 10 : 5)}kW) limits 3-hour grid intake to {cost.dailyFreeSoakKWhCapped}kWh per day. ZEROHERO credits $1.00/day for zero grid draw in peak periods.
              </p>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleCompare(plan.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                isCompared
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isCompared ? 'Added to Compare' : 'Compare Plan'}
            </button>

            <button
              onClick={() => onAskAiAboutPlan(plan)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              AI Plan Summary
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2 py-1"
            >
              <span>{expanded ? 'Hide Details' : 'Show Tariff Details'}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <a
              href={plan.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-1.5 rounded-xl text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span>Sign Up with Retailer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
