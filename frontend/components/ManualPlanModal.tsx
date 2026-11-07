import React, { useState } from 'react';
import { EnergyPlan, DistributorInfo, TariffType } from '../types';
import { X, Plus, DollarSign, Clock, Zap, CheckCircle } from 'lucide-react';

interface ManualPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  distributor: DistributorInfo;
  onAddCustomPlan: (plan: EnergyPlan) => void;
}

export const ManualPlanModal: React.FC<ManualPlanModalProps> = ({
  isOpen,
  onClose,
  distributor,
  onAddCustomPlan,
}) => {
  if (!isOpen) return null;

  const [retailerName, setRetailerName] = useState('GloBird Energy');
  const [planName, setPlanName] = useState('My Custom Tariff Offer');
  const [tariffType, setTariffType] = useState<TariffType>('TOU');
  const [dailySupply, setDailySupply] = useState('92.0');
  const [flatRate, setFlatRate] = useState('26.0');
  const [peakRate, setPeakRate] = useState('32.0');
  const [shoulderRate, setShoulderRate] = useState('22.0');
  const [offPeakRate, setOffPeakRate] = useState('14.0');
  const [solarFiT, setSolarFiT] = useState('8.0');
  const [solarFiTCap, setSolarFiTCap] = useState('14.0');
  const [hasFreeHours, setHasFreeHours] = useState(true);
  const [freeWindowDesc, setFreeWindowDesc] = useState('Free 11am-2pm Daily (0c/kWh)');
  const [hasZeroHero, setHasZeroHero] = useState(false);
  const [zeroHeroDailyReward, setZeroHeroDailyReward] = useState('1.00');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const newPlan: EnergyPlan = {
      id: `custom-${Date.now()}`,
      retailerName: retailerName.trim() || 'Custom Retailer',
      retailerCode: retailerName.toUpperCase().slice(0, 8),
      planName: planName.trim() || 'Custom Energy Offer',
      state: distributor.state,
      distributorCode: distributor.code,
      tariffType,
      rates: {
        dailySupplyChargeCents: parseFloat(dailySupply) || 95.0,
        flatRateCentsPerKWh: tariffType === 'FLAT' ? parseFloat(flatRate) : undefined,
        peakRateCentsPerKWh: tariffType === 'TOU' ? parseFloat(peakRate) : undefined,
        shoulderRateCentsPerKWh: tariffType === 'TOU' ? parseFloat(shoulderRate) : undefined,
        offPeakRateCentsPerKWh: tariffType === 'TOU' ? parseFloat(offPeakRate) : undefined,
        solarFeedInTariffCents: parseFloat(solarFiT) || 0,
        solarFeedInCapKWhPerDay: parseFloat(solarFiTCap) || 14.0,
      },
      contractType: 'NO_LOCK_IN',
      pricingType: 'VARIABLE',
      isStandingOffer: false,
      greenPowerAvailable: false,
      greenPowerPercent: 0,
      dmoComparisonPercent: -25,
      features: [
        'User-created custom plan',
        hasFreeHours ? freeWindowDesc : 'No free power window',
        hasZeroHero ? `$${zeroHeroDailyReward}/day peak incentive` : 'Standard peak rates'
      ],
      billFrequency: 'MONTHLY',
      coolingOffDays: 10,
      websiteUrl: 'https://www.globirdenergy.com.au',
      phone: '13 34 56',
      customerRating: 4.8,
      isCustomPlan: true,
      hasFreePowerHours: hasFreeHours,
      freePowerWindowDescription: hasFreeHours ? freeWindowDesc : undefined,
      freePowerHoursDaily: hasFreeHours ? 3 : 0,
      hasZeroHeroIncentive: hasZeroHero,
      zeroHeroDailyRewardDollars: hasZeroHero ? parseFloat(zeroHeroDailyReward) || 1.0 : undefined,
      zeroHeroDescription: hasZeroHero ? `$${zeroHeroDailyReward}/day reward for zero peak grid consumption` : undefined,
    };

    onAddCustomPlan(newPlan);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold">Add Custom Plan for Comparison</h3>
              <p className="text-[11px] text-slate-400">Network: {distributor.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Retailer Name</label>
              <input
                type="text"
                value={retailerName}
                onChange={(e) => setRetailerName(e.target.value)}
                placeholder="e.g. GloBird Energy"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Plan Name</label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="e.g. WholeSave / Super Special"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tariff Type</label>
              <select
                value={tariffType}
                onChange={(e) => setTariffType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              >
                <option value="TOU">Time of Use (Peak / Off-Peak)</option>
                <option value="FLAT">Single Flat Rate</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Daily Supply Charge (c/day)</label>
              <input
                type="number"
                step="0.1"
                value={dailySupply}
                onChange={(e) => setDailySupply(e.target.value)}
                placeholder="e.g. 92.5"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                required
              />
            </div>
          </div>

          {tariffType === 'TOU' ? (
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Peak (c/kWh)</label>
                <input
                  type="number"
                  step="0.1"
                  value={peakRate}
                  onChange={(e) => setPeakRate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Shoulder (c/kWh)</label>
                <input
                  type="number"
                  step="0.1"
                  value={shoulderRate}
                  onChange={(e) => setShoulderRate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Off-Peak (c/kWh)</label>
                <input
                  type="number"
                  step="0.1"
                  value={offPeakRate}
                  onChange={(e) => setOffPeakRate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  required
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Flat Usage Rate (c/kWh)</label>
              <input
                type="number"
                step="0.1"
                value={flatRate}
                onChange={(e) => setFlatRate(e.target.value)}
                placeholder="e.g. 26.5"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Solar Feed-in Tariff (c/kWh)</label>
              <input
                type="number"
                step="0.1"
                value={solarFiT}
                onChange={(e) => setSolarFiT(e.target.value)}
                placeholder="e.g. 8.0"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Daily Solar FiT Cap (kWh/day)</label>
              <input
                type="number"
                step="1"
                value={solarFiTCap}
                onChange={(e) => setSolarFiTCap(e.target.value)}
                placeholder="e.g. 14.0"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
              <input
                type="checkbox"
                checked={hasFreeHours}
                onChange={(e) => setHasFreeHours(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span>Includes Free Power Window (0c/kWh)?</span>
            </label>
            {hasFreeHours && (
              <input
                type="text"
                value={freeWindowDesc}
                onChange={(e) => setFreeWindowDesc(e.target.value)}
                placeholder="e.g. Free 11:00am - 2:00pm Daily"
                className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
              />
            )}
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
              <input
                type="checkbox"
                checked={hasZeroHero}
                onChange={(e) => setHasZeroHero(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span>Includes ZEROHERO Zero-Peak Demand Reward ($1.00/day)?</span>
            </label>
            {hasZeroHero && (
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium">Reward ($/day with zero peak import):</span>
                <input
                  type="number"
                  step="0.1"
                  value={zeroHeroDailyReward}
                  onChange={(e) => setZeroHeroDailyReward(e.target.value)}
                  className="w-20 px-2 py-1 bg-white border border-emerald-300 rounded-lg font-mono font-bold"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl shadow-md transition-colors"
            >
              Add to Comparison Table
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
