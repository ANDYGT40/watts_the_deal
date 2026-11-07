import React from 'react';
import { EnergyPlan, HouseholdProfile, DistributorInfo } from '../types';
import { calculatePlanCost } from '../utils/calculationUtils';
import { X, CheckCircle2, ExternalLink, Car, BatteryCharging } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ComparisonModalProps {
  plans: EnergyPlan[];
  profile: HouseholdProfile;
  distributor: DistributorInfo;
  onClose: () => void;
  onRemovePlan: (planId: string) => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  plans,
  profile,
  distributor,
  onClose,
  onRemovePlan,
}) => {
  if (plans.length === 0) return null;

  const chartData = plans.map((p) => {
    const cost = calculatePlanCost(p, profile, distributor);
    return {
      name: `${p.retailerName} (${p.planName.split(' ')[0]})`,
      quarterly: cost.quarterlyTotal,
      annual: cost.annualTotal,
      evCost: cost.evChargingAnnual,
      savings: cost.annualSavingsVsDMO,
    };
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Side-by-Side Electricity Comparison
            </h3>
            <p className="text-xs text-slate-500">
              Modeled for <strong>{profile.averageDailyUsageKWh} kWh/day</strong>
              {profile.hasEV ? ` + ${profile.evDailyKWh} kWh/day EV` : ''}
              {profile.hasBattery ? ` + ${profile.batteryCapacityKWh} kWh Battery` : ''} in {distributor.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Chart */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Estimated Total Annual Cost ($ AUD)
            </h4>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    formatter={(val: number) => [`$${val}`, 'Annual Cost']}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar dataKey="annual" radius={[6, 6, 0, 0]} fill="#008459">
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? '#008459' : '#0284C7'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grid Columns for Each Plan */}
          <div className={`grid grid-cols-1 md:grid-cols-${plans.length} gap-4`}>
            {plans.map((p) => {
              const cost = calculatePlanCost(p, profile, distributor);
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                          {p.retailerName}
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                          {p.planName}
                        </h4>
                      </div>
                      <button
                        onClick={() => onRemovePlan(p.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Cost Hero */}
                    <div className="mt-4 p-3 bg-emerald-50 rounded-xl text-center">
                      <span className="text-xs text-slate-500 block">Quarterly Total</span>
                      <span className="text-2xl font-black text-slate-900 font-mono">
                        ${cost.quarterlyTotal}
                      </span>
                      <span className="text-xs text-slate-600 block mt-0.5">
                        ~${cost.annualTotal} / year
                      </span>
                      <span className="inline-block mt-1 text-[11px] font-bold text-emerald-700">
                        {cost.percentCheaperThanDMO > 0
                          ? `${cost.percentCheaperThanDMO}% less than DMO benchmark`
                          : 'Standard DMO baseline'}
                      </span>
                    </div>

                    {/* Metrics Table */}
                    <div className="mt-4 space-y-2 text-xs border-t border-slate-100 pt-3">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Daily Supply:</span>
                        <span className="font-mono font-bold">{p.rates.dailySupplyChargeCents} c/day</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Usage Rate:</span>
                        <span className="font-mono font-bold">
                          {p.rates.flatRateCentsPerKWh ? `${p.rates.flatRateCentsPerKWh} c/kWh` : `${p.rates.peakRateCentsPerKWh} c Peak`}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Car className="w-3.5 h-3.5 text-sky-600" /> EV Night Rate:
                        </span>
                        <span className="font-mono font-bold text-sky-700">
                          {p.rates.evNightRateCentsPerKWh ? `${p.rates.evNightRateCentsPerKWh} c/kWh` : 'Standard Off-Peak'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1">
                          <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" /> Battery VPP:
                        </span>
                        <span className="font-semibold text-emerald-800">
                          {p.isBatteryVppEligible ? `$${p.vppAnnualCredit}/yr` : 'Not Enrolled'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Solar Feed-in:</span>
                        <span className="font-mono font-bold text-amber-700">
                          {p.rates.solarFeedInTariffCents || 0} c/kWh
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">GreenPower:</span>
                        <span className="font-semibold">{p.greenPowerPercent}%</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={p.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <span>Switch to {p.retailerName}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Australian Energy Regulator guidelines guarantee a 10-business-day cooling-off period on all new retail energy contracts.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
