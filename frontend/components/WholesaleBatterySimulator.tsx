import React, { useState, useMemo } from 'react';
import { HouseholdProfile, DistributorInfo, WholesaleHalfHourInterval } from '../types';
import { SAMPLE_WHOLESALE_INTERVALS } from '../constants';
import { 
  Zap, 
  TrendingUp, 
  BatteryCharging, 
  DollarSign, 
  AlertTriangle, 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Flame,
  Sun,
  Layers,
  HelpCircle
} from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell } from 'recharts';

interface WholesaleBatterySimulatorProps {
  profile: HouseholdProfile;
  distributor: DistributorInfo;
}

export const WholesaleBatterySimulator: React.FC<WholesaleBatterySimulatorProps> = ({
  profile,
  distributor,
}) => {
  // Simulator Controls
  const [spikeIntensity, setSpikeIntensity] = useState<number>(850); // cents/kWh (e.g. $8.50/kWh peak spike)
  const [spikeEventsPerYear, setSpikeEventsPerYear] = useState<number>(35); // typical 30-45 NEM spike days
  const [batteryDischargeKw, setBatteryDischargeKw] = useState<number>(profile.batteryCapacityKWh >= 30 ? 10 : 5); // kW inverter discharge rate
  const [selectedScenario, setSelectedScenario] = useState<'ALL' | 'AMBER' | 'FREELUNCH' | 'ZEROHERO'>('ALL');

  // Dynamic 24-hr wholesale profile adjusting based on spikeIntensity slider
  const dynamicWholesaleCurve = useMemo(() => {
    return SAMPLE_WHOLESALE_INTERVALS.map((item) => {
      let price = item.wholesalePriceCentsPerKWh;
      if (item.isSpike) {
        if (item.time === '19:30') price = spikeIntensity * 1.5;
        else if (item.time === '18:30') price = spikeIntensity;
        else price = spikeIntensity * 0.45;
      }
      return {
        ...item,
        wholesalePriceCentsPerKWh: Math.round(price),
        wholesaleDollars: Number((price / 100).toFixed(2)),
      };
    });
  }, [spikeIntensity]);

  // Mathematical comparisons between the 3 main strategies:
  // 1. Amber Smartshift: Soaks solar/negative price & discharges during extreme spikes ($X/kWh)
  // 2. GloBird FreeLunch: Soaks 100% free power (0c) every single day (11am-2pm) and avoids all peak costs with 0 risk
  // 3. GloBird ZEROHERO: Capped retail rate + $1.00/kWh cash reward for zero peak draw or peak export (4pm-9pm)
  const calculations = useMemo(() => {
    const batteryCapacity = profile.batteryCapacityKWh || 40;
    const usableCapacity = batteryCapacity * 0.90; // 90% usable depth of discharge

    // --- Scenario A: Amber Smartshift Wholesale Trading ---
    // Inverter discharge: e.g. 10kW for 2.5 hours of high spike = 25kWh exported
    const exportableKWhPerEvent = Math.min(usableCapacity * 0.75, batteryDischargeKw * 2.5);
    const avgSpikePriceDollars = spikeIntensity / 100; // e.g. $8.50 / kWh
    const revenuePerSpikeEvent = exportableKWhPerEvent * avgSpikePriceDollars;
    const annualSpikeTradingEarnings = revenuePerSpikeEvent * spikeEventsPerYear;

    // Daily cycling profit during normal non-spike days (buy at ~0c midday, discharge during 30c evening)
    const normalDays = 365 - spikeEventsPerYear;
    const dailyNormalArbitrageProfit = usableCapacity * 0.22; // ~22c/kWh spread
    const annualNormalArbitrage = normalDays * dailyNormalArbitrageProfit;

    // Amber subscription ($22/mo = $264/yr) + daily supply
    const amberAnnualSupply = (122 * 365) / 100;
    const amberAnnualMembership = 264;
    const amberGrossProfit = annualSpikeTradingEarnings + annualNormalArbitrage;
    const amberNetBenefit = Math.round(amberGrossProfit - amberAnnualMembership - amberAnnualSupply);

    // --- Scenario B: GloBird FreeLunch (Fixed 0c/kWh Midday Grid Soak) ---
    // Soaks 100% free power every single day from the grid (365 days)
    // Runs entire home peak and night for $0.00
    const dailyAvoidedPeakKWh = Math.min(usableCapacity, profile.averageDailyUsageKWh * 0.85);
    const regularPeakRateDollars = 0.339; // GloBird AusNet/Ausgrid peak rate ~34c/kWh
    const dailyAvoidedPeakCost = dailyAvoidedPeakKWh * regularPeakRateDollars;
    const annualFreeLunchSavings = dailyAvoidedPeakCost * 365;

    // Low GloBird daily supply (~96c/day = $350/yr)
    const gloBirdSupplyAnnual = (96.5 * 365) / 100;
    const freeLunchNetBenefit = Math.round(annualFreeLunchSavings - gloBirdSupplyAnnual);

    // --- Scenario C: GloBird ZEROHERO ($1/kWh Peak Curtailment Reward) ---
    // Guaranteed $1.00 / kWh rewarded for zero net peak draw or battery export during 4pm-9pm
    // 5 days per week x 52 weeks = ~260 peak days/year
    const zeroHeroEligibleDays = 260;
    const zeroHeroDischargeKWh = Math.min(usableCapacity * 0.65, batteryDischargeKw * 3); // ~20kWh
    const zeroHeroAnnualReward = zeroHeroDischargeKWh * 1.00 * zeroHeroEligibleDays; // $1.00/kWh incentive!
    const zeroHeroOffPeakUsageCost = (profile.averageDailyUsageKWh * 0.40 * 0.16 * 365); // 16c off-peak fill
    const zeroHeroNetBenefit = Math.round(zeroHeroAnnualReward - zeroHeroSupplyAnnual(baseSupplyFromDist(distributor)) - zeroHeroOffPeakUsageCost);

    return {
      amber: {
        annualNetBenefit: amberNetBenefit,
        spikeEarnings: Math.round(annualSpikeTradingEarnings),
        normalEarnings: Math.round(annualNormalArbitrage),
        riskLevel: 'HIGH (Wholesale Market Spot Exposure)',
      },
      freeLunch: {
        annualNetBenefit: freeLunchNetBenefit,
        annualSavings: Math.round(annualFreeLunchSavings),
        riskLevel: 'ZERO (100% Guaranteed 0c/kWh midday window)',
      },
      zeroHero: {
        annualNetBenefit: zeroHeroNetBenefit,
        annualReward: Math.round(zeroHeroAnnualReward),
        riskLevel: 'LOW (Capped retail rate + guaranteed $1/kWh incentive)',
      }
    };
  }, [profile, distributor, spikeIntensity, spikeEventsPerYear, batteryDischargeKw]);

  function zeroHeroSupplyAnnual(dailySupply: number) {
    return (dailySupply * 365) / 100;
  }

  function baseSupplyFromDist(d: DistributorInfo) {
    return (d.defaultMarketOfferAnnual / 1700) * 94;
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black">
              <Zap className="w-5 h-5 fill-slate-950" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Wholesale Price Tracker & Battery Strategy Simulator
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                  Amber vs GloBird vs ZEROHERO
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Model real NEM wholesale price spikes ($0 to $15/kWh) against guaranteed Free Power Windows and $1/kWh peak incentives for your <strong>{profile.batteryCapacityKWh}kWh home battery</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Status Chip */}
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-sm self-start lg:self-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>NEM Grid: <strong>{distributor.state} Region Active</strong></span>
        </div>
      </div>

      {/* Simulator Interactive Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200/80">
        {/* Slider 1: Evening Spike Peak Price */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              Peak Wholesale Spike
            </label>
            <span className="text-xs font-mono font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
              ${(spikeIntensity / 100).toFixed(2)} / kWh
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="1500"
            step="50"
            value={spikeIntensity}
            onChange={(e) => setSpikeIntensity(parseInt(e.target.value, 10))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
            <span>$1.00/kWh (Mild)</span>
            <span>$8.50 (Summer Heatwave)</span>
            <span>$15.00/kWh (NEM Cap)</span>
          </div>
        </div>

        {/* Slider 2: Annual Spike Events Count */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
              Spike Days Per Year
            </label>
            <span className="text-xs font-mono font-extrabold bg-sky-100 text-sky-900 px-2 py-0.5 rounded">
              {spikeEventsPerYear} days / yr
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            step="1"
            value={spikeEventsPerYear}
            onChange={(e) => setSpikeEventsPerYear(parseInt(e.target.value, 10))}
            className="w-full accent-sky-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
            <span>10 days (Quiet year)</span>
            <span>35 days (Typical)</span>
            <span>90 days (Extreme)</span>
          </div>
        </div>

        {/* Slider 3: Inverter Continuous Discharge Kw */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
              Inverter Discharge Rate
            </label>
            <span className="text-xs font-mono font-extrabold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
              {batteryDischargeKw} kW Inverter
            </span>
          </div>
          <input
            type="range"
            min="3"
            max="20"
            step="1"
            value={batteryDischargeKw}
            onChange={(e) => setBatteryDischargeKw(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
            <span>3 kW (Single phase)</span>
            <span>10 kW (Standard)</span>
            <span>20 kW (3-Phase Mega)</span>
          </div>
        </div>
      </div>

      {/* Dynamic 24-Hour Wholesale Price vs Free Window Chart */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              24-Hour Spot Price Curve ($/kWh) & Solar Sponge Window
            </h4>
            <p className="text-[11px] text-slate-500">
              Notice the <strong>negative/zero-cent dip (10am - 2pm)</strong> where batteries soak, and the <strong>evening peak price surge (5pm - 9pm)</strong>.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <span className="w-3 h-3 rounded bg-emerald-400 inline-block"></span> Solar Sponge (0c / Negative)
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700">
              <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span> Evening Price Spike
            </span>
          </div>
        </div>

        <div className="h-64 w-full bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dynamicWholesaleCurve} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis 
                tick={{ fontSize: 11 }} 
                tickFormatter={(val) => `$${val}`}
                domain={[-0.10, 'auto']}
              />
              <Tooltip 
                formatter={(val: number) => [`$${val}/kWh`, 'Wholesale Spot Price']}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
              <Bar dataKey="wholesaleDollars" radius={[4, 4, 0, 0]}>
                {dynamicWholesaleCurve.map((entry, index) => (
                  <Cell 
                    key={`bar-${index}`} 
                    fill={entry.wholesaleDollars < 0 ? '#10b981' : entry.isSpike ? '#f59e0b' : '#38bdf8'} 
                  />
                ))}
              </Bar>
              <Line type="monotone" dataKey="wholesaleDollars" stroke="#0f172a" strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Head-to-Head Strategy Cards: Amber vs FreeLunch vs ZEROHERO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Strategy 1: Amber Smartshift */}
        <div className="bg-white rounded-2xl p-5 border-2 border-slate-200 hover:border-sky-400 transition-all flex flex-col justify-between shadow-sm space-y-4">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                  Wholesale Spot Trading
                </span>
                <h4 className="text-lg font-black text-slate-900 mt-1">Amber Smartshift</h4>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">Wholesale Pass-Through</span>
            </div>

            <p className="text-xs text-slate-600 mt-2">
              Automatically soaks during negative midday prices and dumps power from your {profile.batteryCapacityKWh}kWh battery into the grid when prices surge to ${(spikeIntensity/100).toFixed(2)}/kWh.
            </p>

            <div className="mt-4 p-3 bg-sky-50/70 rounded-xl border border-sky-100 text-center">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold block">
                Estimated Annual Net Value
              </span>
              <span className="text-3xl font-black text-sky-900 font-mono">
                +${calculations.amber.annualNetBenefit}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                (Includes ~${calculations.amber.spikeEarnings} from {spikeEventsPerYear} spike events)
              </span>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-start gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 flex-shrink-0" />
                <span>Massive windfalls when NEM spikes reach $15/kWh</span>
              </div>
              <div className="flex items-start gap-1.5 text-amber-900">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-amber-600 flex-shrink-0" />
                <span>Volatile risk: High prices if battery empties during peak</span>
              </div>
              <div className="flex items-start gap-1.5 text-slate-600">
                <DollarSign className="w-3.5 h-3.5 mt-0.5 text-slate-500 flex-shrink-0" />
                <span>$22/month Amber subscription fee applies</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Best for:</span>
            <p className="text-xs font-semibold text-slate-800">
              Tech-savvy battery owners who want to actively trade price surges with Smartshift automation.
            </p>
          </div>
        </div>

        {/* Strategy 2: GloBird FreeLunch */}
        <div className="bg-white rounded-2xl p-5 border-2 border-amber-400 bg-amber-50/30 transition-all flex flex-col justify-between shadow-md space-y-4 relative">
          <div className="absolute -top-3 right-4 bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
            Zero Market Risk
          </div>

          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  Fixed 0c Midday Soak
                </span>
                <h4 className="text-lg font-black text-slate-900 mt-1">GloBird FreeLunch</h4>
              </div>
              <span className="text-xs font-mono font-bold text-amber-900">11am - 2pm Daily</span>
            </div>

            <p className="text-xs text-slate-600 mt-2">
              Draw 100% free power (0c/kWh) between 11am and 2pm every single day. Soak 30kWh - 40kWh into your battery and run your home with zero grid expense all night.
            </p>

            <div className="mt-4 p-3 bg-amber-100/70 rounded-xl border border-amber-200 text-center">
              <span className="text-[11px] text-slate-600 uppercase tracking-wider font-bold block">
                Estimated Annual Net Savings
              </span>
              <span className="text-3xl font-black text-amber-950 font-mono">
                +${calculations.freeLunch.annualNetBenefit}
              </span>
              <span className="text-[10px] text-amber-800 block mt-0.5">
                (Saves ~${calculations.freeLunch.annualSavings}/yr with $0 spot risk)
              </span>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-start gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 flex-shrink-0" />
                <span>100% Predictable: Free 3 hours every day of the year</span>
              </div>
              <div className="flex items-start gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 flex-shrink-0" />
                <span>Zero bill shock: Protected by capped retail rates</span>
              </div>
              <div className="flex items-start gap-1.5 text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 mt-0.5 text-slate-500 flex-shrink-0" />
                <span>Sub-96c/day daily supply rate in {distributor.code}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-amber-200">
            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">Best for:</span>
            <p className="text-xs font-semibold text-slate-800">
              Households with 40-50kWh batteries who want guaranteed free power without managing spot price exposure.
            </p>
          </div>
        </div>

        {/* Strategy 3: GloBird ZEROHERO ($1/kWh Peak Incentive) */}
        <div className="bg-white rounded-2xl p-5 border-2 border-emerald-500 bg-emerald-50/20 transition-all flex flex-col justify-between shadow-md space-y-4 relative">
          <div className="absolute -top-3 right-4 bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
            $1/kWh Incentive
          </div>

          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Demand Response Cash
                </span>
                <h4 className="text-lg font-black text-slate-900 mt-1">GloBird ZEROHERO</h4>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-900">$1.00 / kWh Reward</span>
            </div>

            <p className="text-xs text-slate-600 mt-2">
              Receive a guaranteed <strong>$1.00 per kWh credit</strong> for keeping grid usage at zero during peak hours (4pm - 9pm). Your 40-50kWh battery provides the full home load, generating cash credits every single peak.
            </p>

            <div className="mt-4 p-3 bg-emerald-100/70 rounded-xl border border-emerald-200 text-center">
              <span className="text-[11px] text-emerald-900 uppercase tracking-wider font-bold block">
                Estimated Annual Net Earnings
              </span>
              <span className="text-3xl font-black text-emerald-950 font-mono">
                +${calculations.zeroHero.annualNetBenefit}
              </span>
              <span className="text-[10px] text-emerald-800 block mt-0.5">
                (Up to ${calculations.zeroHero.annualReward}/yr from $1.00/kWh demand credits)
              </span>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-start gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 flex-shrink-0" />
                <span>Guaranteed $1.00/kWh payout without waiting for NEM spikes</span>
              </div>
              <div className="flex items-start gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 flex-shrink-0" />
                <span>Zero spot price downside: Retail rate is capped and locked</span>
              </div>
              <div className="flex items-start gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 flex-shrink-0" />
                <span>High 40kWh - 50kWh battery capacity maximizes payouts</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">Best for:</span>
            <p className="text-xs font-semibold text-slate-800">
              Battery owners wanting high dollar returns ($1/kWh) with complete protection from wholesale electricity volatility.
            </p>
          </div>
        </div>
      </div>

      {/* Simulator Conclusion Summary */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h5 className="text-sm font-bold">Simulator Recommendation for Your {profile.batteryCapacityKWh}kWh Battery:</h5>
            <p className="text-xs text-slate-300">
              {calculations.zeroHero.annualNetBenefit >= calculations.amber.annualNetBenefit
                ? `GloBird ZEROHERO generates the highest risk-adjusted profit (~$${calculations.zeroHero.annualNetBenefit}/yr) thanks to guaranteed $1.00/kWh peak demand credits with zero market volatility.`
                : `Amber Smartshift delivers higher peak upside (~$${calculations.amber.annualNetBenefit}/yr) if wholesale spikes stay above $8.50/kWh for ${spikeEventsPerYear}+ days per year.`}
            </p>
          </div>
        </div>

        <button 
          onClick={() => {
            const elm = document.getElementById('compare-table-top');
            if (elm) elm.scrollIntoView({ behavior: 'smooth' });
          }}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5"
        >
          <span>View Verified Retail Plans</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
