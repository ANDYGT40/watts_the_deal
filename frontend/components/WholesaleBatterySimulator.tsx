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
  AlertCircle
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
  const [spikeIntensity, setSpikeIntensity] = useState<number>(850);
  const [spikeEventsPerYear, setSpikeEventsPerYear] = useState<number>(35);
  const [batteryDischargeKw, setBatteryDischargeKw] = useState<number>(profile.batteryInverterKw || (profile.batteryCapacityKWh >= 30 ? 10 : 5));

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

  const calculations = useMemo(() => {
    const batteryCapacity = profile.batteryCapacityKWh || 40;
    const usableCapacity = batteryCapacity * 0.90;
    const inverterKw = batteryDischargeKw;

    // --- Scenario A: Amber Smartshift Wholesale Trading ---
    const exportableKWhPerEvent = Math.min(usableCapacity * 0.75, inverterKw * 2.5);
    const avgSpikePriceDollars = spikeIntensity / 100;
    const revenuePerSpikeEvent = exportableKWhPerEvent * avgSpikePriceDollars;
    const annualSpikeTradingEarnings = revenuePerSpikeEvent * spikeEventsPerYear;

    const normalDays = 365 - spikeEventsPerYear;
    const dailyNormalArbitrageProfit = Math.min(usableCapacity, inverterKw * 4) * 0.22;
    const annualNormalArbitrage = normalDays * dailyNormalArbitrageProfit;

    const amberAnnualSupply = (122 * 365) / 100;
    const amberAnnualMembership = 264;
    const amberGrossProfit = annualSpikeTradingEarnings + annualNormalArbitrage;
    const amberNetBenefit = Math.round(amberGrossProfit - amberAnnualMembership - amberAnnualSupply);

    // --- Scenario B: GloBird FreeLunch (3h window constrained by inverter kW) ---
    // A 40kWh or 50kWh battery CANNOT charge fully in 3 hours unless inverter kW allows it!
    const maxThreeHourChargeKWh = inverterKw * 3;
    const actualDailySoakKWh = Math.min(usableCapacity, maxThreeHourChargeKWh);
    const dailyAvoidedPeakKWh = Math.min(actualDailySoakKWh, profile.averageDailyUsageKWh * 0.85);
    const regularPeakRateDollars = 0.339;
    const annualFreeLunchSavings = dailyAvoidedPeakKWh * regularPeakRateDollars * 365;
    const gloBirdSupplyAnnual = (96.5 * 365) / 100;
    const freeLunchNetBenefit = Math.round(annualFreeLunchSavings - gloBirdSupplyAnnual);

    // --- Scenario C: GloBird ZEROHERO (Free 11am-2pm soak + $1.00/DAY for 0 peak grid draw) ---
    // Daily Peak Demand Reward: $1.00 per day if battery covers home's peak hours (4pm-9pm)
    const householdPeakKWh = profile.averageDailyUsageKWh * 0.40;
    const coversFullPeak = actualDailySoakKWh >= householdPeakKWh;
    const zeroHeroAnnualDaysReward = coversFullPeak ? 365 : Math.round(365 * (actualDailySoakKWh / householdPeakKWh));
    const zeroHeroAnnualReward = zeroHeroAnnualDaysReward * 1.00; // $1.00 per day
    const zeroHeroNetBenefit = Math.round(annualFreeLunchSavings + zeroHeroAnnualReward - gloBirdSupplyAnnual);

    return {
      actualDailySoakKWh,
      maxThreeHourChargeKWh,
      amber: {
        annualNetBenefit: amberNetBenefit,
        spikeEarnings: Math.round(annualSpikeTradingEarnings),
        normalEarnings: Math.round(annualNormalArbitrage),
      },
      freeLunch: {
        annualNetBenefit: freeLunchNetBenefit,
        annualSavings: Math.round(annualFreeLunchSavings),
      },
      zeroHero: {
        annualNetBenefit: zeroHeroNetBenefit,
        annualDaysReward: zeroHeroAnnualDaysReward,
        annualReward: zeroHeroAnnualReward,
        freeSoakSavings: Math.round(annualFreeLunchSavings),
      }
    };
  }, [profile, spikeIntensity, spikeEventsPerYear, batteryDischargeKw]);

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
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Wholesale Price Tracker & Battery Strategy Simulator
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                  Amber vs GloBird FreeLunch vs ZEROHERO
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Model real NEM wholesale spikes against GloBird's 11am-2pm Free Power and <strong>$1.00/day ZEROHERO zero-peak reward</strong>, factoring in your <strong>{batteryDischargeKw}kW inverter charging limit</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-sm self-start lg:self-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>NEM Grid: <strong>{distributor.state} Region Active</strong></span>
        </div>
      </div>

      {/* Simulator Interactive Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200/80">
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

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
              Battery Inverter Rating
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
            <span>10 kW (Standard 3P)</span>
            <span>20 kW (Mega array)</span>
          </div>
        </div>
      </div>

      {/* Inverter Charging Reality Check Callout */}
      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
        <div>
          <strong className="block">Inverter Charging Bottleneck Reality:</strong>
          <span>
            During the 3-hour free power window (11am - 2pm), your <strong>{batteryDischargeKw}kW inverter</strong> can physically absorb at most <strong>{calculations.maxThreeHourChargeKWh}kWh</strong> ({batteryDischargeKw}kW x 3h). 
            {profile.batteryCapacityKWh > calculations.maxThreeHourChargeKWh && (
              <> A {profile.batteryCapacityKWh}kWh battery cannot fully charge inside the 3-hour window alone; you soak {calculations.actualDailySoakKWh}kWh for free and fill the rest via rooftop solar.</>
            )}
          </span>
        </div>
      </div>

      {/* Dynamic 24-Hour Wholesale Price Chart */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              24-Hour Spot Price Curve ($/kWh) & Solar Sponge Window
            </h4>
            <p className="text-[11px] text-slate-500">
              Notice the <strong>negative/zero-cent dip (11am - 2pm)</strong> where GloBird FreeLunch and ZEROHERO provide free power, versus the <strong>evening peak price surge (5pm - 9pm)</strong>.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <span className="w-3 h-3 rounded bg-emerald-400 inline-block"></span> 11am-2pm Free Window (0c)
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

      {/* Head-to-Head Strategy Cards */}
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
              <span className="text-xs font-mono font-bold text-slate-500">Spot Pass-Through</span>
            </div>

            <p className="text-xs text-slate-600 mt-2">
              Discharges your battery into the grid when spot prices surge to ${(spikeIntensity/100).toFixed(2)}/kWh (limited by your {batteryDischargeKw}kW inverter rate).
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
              Tech-savvy battery owners wanting high reward from automated spot trading surges.
            </p>
          </div>
        </div>

        {/* Strategy 2: GloBird FreeLunch */}
        <div className="bg-white rounded-2xl p-5 border-2 border-amber-300 bg-amber-50/20 transition-all flex flex-col justify-between shadow-sm space-y-4">
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
              Draw 100% free power (0c/kWh) between 11am and 2pm daily. With a {batteryDischargeKw}kW inverter, you absorb <strong>{calculations.actualDailySoakKWh}kWh for $0</strong> daily to eliminate evening peak grid bills.
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
              Households wanting guaranteed free power without managing spot price exposure.
            </p>
          </div>
        </div>

        {/* Strategy 3: GloBird ZEROHERO (DUAL: FreeLunch 11am-2pm + $1/Day Zero Peak Reward) */}
        <div className="bg-white rounded-2xl p-5 border-2 border-emerald-500 bg-emerald-50/30 transition-all flex flex-col justify-between shadow-xl space-y-4 relative ring-2 ring-emerald-400/40">
          <div className="absolute -top-3.5 right-4 bg-gradient-to-r from-emerald-600 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md flex items-center gap-1">
            <Zap className="w-3 h-3 fill-white" /> DUAL ADVANTAGE CHAMPION
          </div>

          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Free 11am-2pm + $1/Day Reward
                </span>
                <h4 className="text-lg font-black text-slate-900 mt-1">GloBird ZEROHERO</h4>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-900">$1.00 / Day Peak Reward</span>
            </div>

            <p className="text-xs text-slate-600 mt-2">
              <strong>Both in one plan:</strong> Soak ~{calculations.actualDailySoakKWh}kWh for <strong>$0 from the grid</strong> during 11am-2pm, then power your home in peak (4pm-9pm) with battery to draw zero grid power and collect <strong>$1.00 every single day ($365/yr cash)</strong>!
            </p>

            <div className="mt-4 p-3.5 bg-gradient-to-r from-emerald-100 to-amber-100 rounded-xl border border-emerald-300 text-center shadow-inner">
              <span className="text-[11px] text-emerald-950 uppercase tracking-wider font-extrabold block">
                Total Combined Annual Benefit
              </span>
              <span className="text-3xl font-black text-emerald-950 font-mono">
                +${calculations.zeroHero.annualNetBenefit}
              </span>
              <div className="text-[10px] text-emerald-900 font-semibold flex items-center justify-center gap-2 mt-1">
                <span>Free Soak: ~${calculations.zeroHero.freeSoakSavings}/yr</span>
                <span>•</span>
                <span>$1/Day Reward: +${calculations.zeroHero.annualReward}/yr</span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-start gap-1.5 text-emerald-900 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 flex-shrink-0" />
                <span><strong>11am - 2pm Free Power:</strong> Battery fuel cost is $0.00!</span>
              </div>
              <div className="flex items-start gap-1.5 text-emerald-900 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 flex-shrink-0" />
                <span><strong>$1.00/Day Zero Peak Reward:</strong> Earn ${calculations.zeroHero.annualReward}/yr cash</span>
              </div>
              <div className="flex items-start gap-1.5 text-emerald-900">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 flex-shrink-0" />
                <span><strong>Zero Market Risk:</strong> Capped retail price protects against spikes</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-300">
            <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-wider block">Why this wins:</span>
            <p className="text-xs font-semibold text-slate-800">
              Stacking 11am-2pm free power with $1/day zero-peak payouts delivers predictable savings without wholesale market risk.
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
                ? `GloBird ZEROHERO provides the best risk-adjusted return (~$${calculations.zeroHero.annualNetBenefit}/yr) because it combines midday free charging (up to ${calculations.actualDailySoakKWh}kWh/day with your ${batteryDischargeKw}kW inverter) with a guaranteed $1.00/day zero-peak reward.`
                : `Amber Smartshift delivers higher peak upside (~$${calculations.amber.annualNetBenefit}/yr) only if wholesale spikes stay above $8.50/kWh for ${spikeEventsPerYear}+ days per year.`}
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
