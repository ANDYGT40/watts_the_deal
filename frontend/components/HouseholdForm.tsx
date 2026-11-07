import React, { useMemo } from 'react';
import { HouseholdProfile, DistributorInfo } from '../types';
import { DISTRIBUTORS } from '../constants';
import { MapPin, Users, Sun, Gauge, DollarSign, Car, BatteryCharging, Zap, ShieldCheck, Clock, Network, AlertCircle } from 'lucide-react';

interface HouseholdFormProps {
  profile: HouseholdProfile;
  onChangeProfile: (profile: HouseholdProfile) => void;
  distributor: DistributorInfo;
  onSelectDistributor: (distributorCode: string) => void;
}

export const HouseholdForm: React.FC<HouseholdFormProps> = ({ 
  profile, 
  onChangeProfile, 
  distributor,
  onSelectDistributor 
}) => {
  const handleOccupantsChange = (count: number) => {
    let suggestedUsage = 14;
    if (count === 1) suggestedUsage = 9;
    if (count === 2) suggestedUsage = 13;
    if (count === 3) suggestedUsage = 16;
    if (count >= 4) suggestedUsage = 21;

    onChangeProfile({
      ...profile,
      occupants: count,
      averageDailyUsageKWh: suggestedUsage,
    });
  };

  const batteryPresets = [10, 13.5, 20, 30, 40, 50];
  const inverterPresets = [5, 7, 10, 15, 20];

  const possibleDistributors = useMemo(() => {
    const p = parseInt(profile.postcode, 10);
    if (isNaN(p)) return DISTRIBUTORS.filter(d => d.state === profile.state);

    const matches = DISTRIBUTORS.filter(d => {
      return d.postcodeRanges.some(([start, end]) => p >= start && p <= end);
    });

    if (matches.length > 0) return matches;
    return DISTRIBUTORS.filter(d => d.state === profile.state);
  }, [profile.postcode, profile.state]);

  const hasMultipleDistributors = possibleDistributors.length > 1;

  // Maximum energy that can be drawn from grid in a 3-hour window
  const currentInverterKw = profile.batteryInverterKw || (profile.batteryCapacityKWh >= 30 ? 10 : 5);
  const maxThreeHourSoakKWh = currentInverterKw * 3;
  const isBatteryRestrictedByInverter = profile.hasBattery && (profile.batteryCapacityKWh * 0.90) > maxThreeHourSoakKWh;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-emerald-600" />
            Your Household Energy & Network Profile
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Compare plans from GloBird, OVO, AGL, Origin, and more. Customize power network, solar, EV, and battery storage up to 50kWh.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-900">
            <Network className="w-3.5 h-3.5 text-emerald-600" />
            <span>Active Network: <strong>{distributor.code}</strong> (${distributor.defaultMarketOfferAnnual}/yr DMO)</span>
          </div>
        </div>
      </div>

      {/* Network Provider Selector */}
      <div className={`p-3.5 rounded-xl border transition-all ${hasMultipleDistributors ? 'bg-amber-50/70 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${hasMultipleDistributors ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'}`}>
              <Network className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-extrabold text-slate-900">Electricity Network / Distributor</h4>
                {hasMultipleDistributors && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-950 uppercase tracking-wide">
                    2 Networks in Postcode {profile.postcode}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600">
                {hasMultipleDistributors 
                  ? 'Your postcode is on a network boundary! Select the poles & wires distributor for your street address:'
                  : 'Distributor operates your local power poles and wires. Select to change if your property borders another network:'}
              </p>
            </div>
          </div>

          <div className="sm:w-72">
            <select
              value={distributor.code}
              onChange={(e) => onSelectDistributor(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <optgroup label="Networks in your postcode/state">
                {possibleDistributors.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name.split('(')[0]} ({d.code}) - DMO ${d.defaultMarketOfferAnnual}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Other Australian Networks">
                {DISTRIBUTORS.filter(d => !possibleDistributors.some(p => p.code === d.code)).map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.state}: {d.name.split('(')[0]} ({d.code})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Basic Profile Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Postcode
          </label>
          <div className="relative">
            <input
              type="text"
              value={profile.postcode}
              maxLength={4}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                onChangeProfile({ ...profile, postcode: val });
              }}
              placeholder="e.g. 3756 or 2145"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            State: <strong className="text-slate-800">{profile.state}</strong> • Network: <strong className="text-emerald-800">{distributor.code}</strong>
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Household Occupants
          </label>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleOccupantsChange(num)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  profile.occupants === num
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                {num === 4 ? '4+' : num}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {profile.occupants === 1 && 'Single (~9 kWh/day)'}
            {profile.occupants === 2 && 'Couple (~13 kWh/day)'}
            {profile.occupants === 3 && '3 people (~16 kWh/day)'}
            {profile.occupants >= 4 && 'Family (~21 kWh/day)'}
          </span>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Base Daily Usage (kWh)
            </label>
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              {profile.averageDailyUsageKWh} kWh/day
            </span>
          </div>
          <input
            type="range"
            min="3"
            max="60"
            step="0.5"
            value={profile.averageDailyUsageKWh}
            onChange={(e) =>
              onChangeProfile({ ...profile, averageDailyUsageKWh: parseFloat(e.target.value) })
            }
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
            <span>3 kWh (Low)</span>
            <span>~14 (Avg)</span>
            <span>60 kWh (High)</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Current Bill (Optional)
          </label>
          <div className="relative">
            <input
              type="number"
              placeholder="e.g. 540"
              value={profile.currentQuarterlyBillCost || ''}
              onChange={(e) =>
                onChangeProfile({
                  ...profile,
                  currentQuarterlyBillCost: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              className="w-full pl-8 pr-16 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
            <DollarSign className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <span className="text-xs text-slate-400 absolute right-3 top-2.5">/ quarter</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Used to calculate exact annual savings.
          </span>
        </div>
      </div>

      {/* Electrification Suite */}
      <div className="pt-2 border-t border-slate-100">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-500" />
          Solar, Home Battery & EV Charging Strategy
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Rooftop Solar */}
          <div className={`p-4 rounded-2xl border transition-all ${profile.hasSolar ? 'border-amber-300 bg-amber-50/50 shadow-sm' : 'border-slate-200 bg-slate-50/60'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Rooftop Solar</h4>
                  <p className="text-[10px] text-slate-500">Capped daily FiT tiers</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={profile.hasSolar}
                onChange={(e) =>
                  onChangeProfile({
                    ...profile,
                    hasSolar: e.target.checked,
                    solarDailyExportKWh: e.target.checked ? (profile.solarDailyExportKWh || 8) : 0,
                  })
                }
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
              />
            </div>

            {profile.hasSolar && (
              <div className="mt-3 pt-2.5 border-t border-amber-200/80 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-[11px]">Daily export:</span>
                  <div className="flex items-center gap-1 font-mono">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="80"
                      value={profile.solarDailyExportKWh}
                      onChange={(e) =>
                        onChangeProfile({ ...profile, solarDailyExportKWh: parseFloat(e.target.value) || 0 })
                      }
                      className="w-16 px-1.5 py-0.5 text-center bg-white border border-slate-300 rounded text-xs font-bold text-amber-900"
                    />
                    <span className="text-[10px] text-slate-500 font-sans">kWh</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Home Battery Storage (With Inverter Speed Limitation) */}
          <div className={`p-4 rounded-2xl border transition-all ${profile.hasBattery ? 'border-emerald-300 bg-emerald-50/50 shadow-sm' : 'border-slate-200 bg-slate-50/60'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <BatteryCharging className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Home Battery</h4>
                  <p className="text-[10px] text-slate-500">Up to 40kWh - 50kWh+</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={profile.hasBattery}
                onChange={(e) =>
                  onChangeProfile({
                    ...profile,
                    hasBattery: e.target.checked,
                    batteryCapacityKWh: e.target.checked ? (profile.batteryCapacityKWh || 40) : 0,
                    batteryInverterKw: e.target.checked ? (profile.batteryInverterKw || 10) : 5,
                    batteryChargingSource: 'FREE_POWER_HOURS_SOAK',
                    joinVpp: e.target.checked ? true : false,
                  })
                }
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
              />
            </div>

            {profile.hasBattery && (
              <div className="mt-3 pt-2.5 border-t border-emerald-200/80 space-y-2.5 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-600 text-[11px] font-semibold">Battery Capacity:</span>
                    <div className="flex items-center gap-1 font-mono">
                      <input
                        type="number"
                        min="2"
                        max="100"
                        step="1"
                        value={profile.batteryCapacityKWh}
                        onChange={(e) =>
                          onChangeProfile({ ...profile, batteryCapacityKWh: Math.max(1, parseFloat(e.target.value) || 0) })
                        }
                        className="w-16 px-1.5 py-0.5 text-center bg-white border border-slate-300 rounded text-xs font-bold text-emerald-900"
                      />
                      <span className="text-[11px] text-slate-600 font-sans">kWh</span>
                    </div>
                  </div>

                  {/* Preset Pills */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {batteryPresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => onChangeProfile({ ...profile, batteryCapacityKWh: preset })}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                          profile.batteryCapacityKWh === preset
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {preset}kWh
                      </button>
                    ))}
                  </div>
                </div>

                {/* Battery Inverter Power Limit (Crucial for 3-hour zero cost intake) */}
                <div className="p-2 bg-white rounded-xl border border-emerald-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Inverter Continuous Rate:</span>
                    <span className="font-mono font-black text-emerald-800 text-xs">
                      {currentInverterKw} kW
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {inverterPresets.map((kw) => (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => onChangeProfile({ ...profile, batteryInverterKw: kw })}
                        className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                          currentInverterKw === kw
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {kw}kW
                      </button>
                    ))}
                  </div>
                  {isBatteryRestrictedByInverter && (
                    <p className="text-[10px] text-amber-800 leading-tight pt-1 flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>
                        In a 3-hour free window, a <strong>{currentInverterKw}kW inverter</strong> can draw at most <strong>{maxThreeHourSoakKWh}kWh</strong>. Your {profile.batteryCapacityKWh}kWh battery cannot fully charge from 0 to 100% in 3 hours alone.
                      </span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Battery Charge Source:</label>
                  <select
                    value={profile.batteryChargingSource}
                    onChange={(e) =>
                      onChangeProfile({ ...profile, batteryChargingSource: e.target.value as any })
                    }
                    className="w-full text-[11px] font-bold bg-white border border-emerald-300 rounded-lg px-2 py-1 text-emerald-950"
                  >
                    <option value="FREE_POWER_HOURS_SOAK">⚡ Free Power Hours (Max {maxThreeHourSoakKWh}kWh in 3h)</option>
                    <option value="SOLAR_AND_GRID">Solar + Off-Peak Grid</option>
                    <option value="SOLAR_ONLY">Rooftop Solar Only</option>
                  </select>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={profile.joinVpp}
                    onChange={(e) => onChangeProfile({ ...profile, joinVpp: e.target.checked })}
                    className="w-3.5 h-3.5 text-emerald-600 rounded"
                  />
                  <span className="text-[10px] font-semibold text-emerald-950 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Enroll in VPP credits (~$250-$340/yr)
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* 3. Electric Vehicle (EV) */}
          <div className={`p-4 rounded-2xl border transition-all ${profile.hasEV ? 'border-sky-300 bg-sky-50/60 shadow-sm' : 'border-slate-200 bg-slate-50/60'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Electric Vehicle</h4>
                  <p className="text-[10px] text-slate-500">Overnight or Free Hours</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={profile.hasEV}
                onChange={(e) =>
                  onChangeProfile({
                    ...profile,
                    hasEV: e.target.checked,
                    evDailyKWh: e.target.checked ? (profile.evDailyKWh || 10) : 0,
                    evChargingTime: 'OVERNIGHT',
                  })
                }
                className="w-4 h-4 text-sky-600 rounded cursor-pointer"
              />
            </div>

            {profile.hasEV && (
              <div className="mt-3 pt-2.5 border-t border-sky-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-[11px]">Daily charge:</span>
                  <div className="flex items-center gap-1 font-mono">
                    <input
                      type="number"
                      step="1"
                      min="2"
                      max="80"
                      value={profile.evDailyKWh}
                      onChange={(e) =>
                        onChangeProfile({ ...profile, evDailyKWh: parseFloat(e.target.value) || 0 })
                      }
                      className="w-14 px-1.5 py-0.5 text-center bg-white border border-slate-300 rounded text-xs font-bold text-sky-900"
                    />
                    <span className="text-[10px] text-slate-500 font-sans">kWh</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-medium mb-1">Charging Window:</label>
                  <select
                    value={profile.evChargingTime}
                    onChange={(e) =>
                      onChangeProfile({ ...profile, evChargingTime: e.target.value as any })
                    }
                    className="w-full text-[11px] font-semibold bg-white border border-sky-200 rounded-lg px-2 py-1 text-slate-800"
                  >
                    <option value="OVERNIGHT">Overnight (Super Off-Peak 12am-6am)</option>
                    <option value="FREE_POWER_HOURS">Free Power Hours Window (0c/kWh)</option>
                    <option value="DAYTIME_SOLAR">Daytime Solar Sponge (10am-3pm)</option>
                    <option value="FLEXIBLE">Anytime / Plug & Go</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 4. Controlled Load */}
          <div className={`p-4 rounded-2xl border transition-all ${profile.hasControlledLoad ? 'border-blue-300 bg-blue-50/50 shadow-sm' : 'border-slate-200 bg-slate-50/60'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Controlled Load</h4>
                  <p className="text-[10px] text-slate-500">Dedicated hot water meter</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={profile.hasControlledLoad}
                onChange={(e) =>
                  onChangeProfile({
                    ...profile,
                    hasControlledLoad: e.target.checked,
                    controlledLoadDailyKWh: e.target.checked ? (profile.controlledLoadDailyKWh || 4) : 0,
                  })
                }
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>

            {profile.hasControlledLoad && (
              <div className="mt-3 pt-2.5 border-t border-blue-200/80 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-[11px]">Usage:</span>
                  <div className="flex items-center gap-1 font-mono">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="20"
                      value={profile.controlledLoadDailyKWh}
                      onChange={(e) =>
                        onChangeProfile({ ...profile, controlledLoadDailyKWh: parseFloat(e.target.value) || 0 })
                      }
                      className="w-14 px-1.5 py-0.5 text-center bg-white border border-slate-300 rounded text-xs font-bold text-blue-900"
                    />
                    <span className="text-[10px] text-slate-500 font-sans">kWh/day</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
