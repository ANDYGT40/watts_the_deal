import React, { useState, useMemo } from 'react';
import { HouseholdProfile, EnergyPlan, TariffType, DistributorInfo } from './types';
import { SAMPLE_AER_PLANS, DISTRIBUTORS } from './constants';
import { detectDistributorFromPostcode, calculatePlanCost } from './utils/calculationUtils';
import { Navbar } from './components/Navbar';
import { HouseholdForm } from './components/HouseholdForm';
import { PlanCard } from './components/PlanCard';
import { ComparisonModal } from './components/ComparisonModal';
import { BillScanner } from './components/BillScanner';
import { JargonModal } from './components/JargonModal';
import { AiAdvisorChat } from './components/AiAdvisorChat';
import { AerReferenceGuide } from './components/AerReferenceGuide';
import { 
  Filter, 
  ArrowUpDown, 
  HelpCircle, 
  Sun, 
  Leaf, 
  Sparkles, 
  CheckCircle2, 
  Layers,
  X,
  ExternalLink,
  Car,
  BatteryCharging,
  Zap,
  Clock,
  Building2,
  RefreshCw,
  Check
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'compare' | 'scanner' | 'glossary' | 'aerData'>('compare');
  const [isJargonModalOpen, setIsJargonModalOpen] = useState(false);

  // Household Profile State with default 40kWh Battery & Postcode 3756
  const [profile, setProfile] = useState<HouseholdProfile>({
    postcode: '3756', // Mitchell Shire (Wallan / Beveridge) - AusNet Services
    state: 'VIC',
    distributorCode: 'AUSNET',
    occupants: 3,
    averageDailyUsageKWh: 16.0,
    hasSolar: true,
    solarDailyExportKWh: 14.0,
    hasControlledLoad: false,
    controlledLoadDailyKWh: 0,
    tariffTypePreference: 'ANY',
    currentQuarterlyBillCost: 540,

    // EV Provisions
    hasEV: false,
    evDailyKWh: 10,
    evChargingTime: 'OVERNIGHT',

    // 40kWh Battery default for high energy independence
    hasBattery: true,
    batteryCapacityKWh: 40,
    batteryChargingSource: 'FREE_POWER_HOURS_SOAK',
    joinVpp: true,
  });

  // Selected distributor override (allows picking between 2 possible networks)
  const [selectedDistributorCode, setSelectedDistributorCode] = useState<string>('AUSNET');

  // Filters & Sorting
  const [retailerFilter, setRetailerFilter] = useState<string>('ALL'); // 'ALL' | 'GloBird Energy' | etc.
  const [tariffFilter, setTariffFilter] = useState<'ALL' | 'FLAT' | 'TOU'>('ALL');
  const [pricingFilter, setPricingFilter] = useState<'ALL' | 'VARIABLE' | 'FIXED'>('ALL');
  const [greenOnly, setGreenOnly] = useState(false);
  const [solarPriority, setSolarPriority] = useState(false);
  const [evOnly, setEvOnly] = useState(false);
  const [batteryOnly, setBatteryOnly] = useState(false);
  const [freePowerOnly, setFreePowerOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'LOWEST_COST' | 'MAX_SAVINGS' | 'SOLAR_FIT' | 'RATING'>('LOWEST_COST');

  // Multi-plan compare selection
  const [comparedPlanIds, setComparedPlanIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Quick AI Advice Trigger
  const [aiFocusPlan, setAiFocusPlan] = useState<EnergyPlan | null>(null);

  // Sync distributor from code or postcode
  const currentDistributor: DistributorInfo = useMemo(() => {
    const found = DISTRIBUTORS.find(d => d.code === selectedDistributorCode);
    if (found) return found;
    return detectDistributorFromPostcode(profile.postcode);
  }, [selectedDistributorCode, profile.postcode]);

  // Handle changes from form
  const handleProfileChange = (updated: HouseholdProfile) => {
    const autoDist = detectDistributorFromPostcode(updated.postcode);
    if (autoDist.code !== selectedDistributorCode) {
      setSelectedDistributorCode(autoDist.code);
    }
    setProfile({
      ...updated,
      state: autoDist.state,
      distributorCode: autoDist.code,
    });
  };

  const handleSelectDistributor = (code: string) => {
    setSelectedDistributorCode(code);
    const dist = DISTRIBUTORS.find(d => d.code === code);
    if (dist) {
      setProfile(prev => ({
        ...prev,
        distributorCode: dist.code,
        state: dist.state
      }));
    }
  };

  // Distinct list of retailers available in plans for the current distributor
  const availableRetailers = useMemo(() => {
    const set = new Set<string>();
    SAMPLE_AER_PLANS.forEach(p => {
      if (p.distributorCode === currentDistributor.code) {
        set.add(p.retailerName);
      }
    });
    return Array.from(set);
  }, [currentDistributor]);

  // Filter plans based on selected network distributor
  const filteredPlans = useMemo(() => {
    return SAMPLE_AER_PLANS.filter((plan) => {
      // Distributor match
      const distributorMatch = plan.distributorCode === currentDistributor.code;
      if (!distributorMatch) return false;

      // Retailer Filter (e.g. GloBird Energy specifically)
      if (retailerFilter !== 'ALL' && plan.retailerName !== retailerFilter) {
        return false;
      }

      if (tariffFilter !== 'ALL' && plan.tariffType !== tariffFilter) {
        return false;
      }

      if (pricingFilter !== 'ALL' && plan.pricingType !== pricingFilter) {
        return false;
      }

      if (greenOnly && (!plan.greenPowerAvailable || plan.greenPowerPercent < 20)) {
        return false;
      }

      if (solarPriority && (!plan.rates.solarFeedInTariffCents || plan.rates.solarFeedInTariffCents < 7.0)) {
        return false;
      }

      if (evOnly && !plan.isEvPlan) {
        return false;
      }

      if (batteryOnly && !plan.isBatteryVppEligible) {
        return false;
      }

      if (freePowerOnly && !plan.hasFreePowerHours) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const costA = calculatePlanCost(a, profile, currentDistributor);
      const costB = calculatePlanCost(b, profile, currentDistributor);

      if (sortBy === 'LOWEST_COST') {
        return costA.quarterlyTotal - costB.quarterlyTotal;
      }
      if (sortBy === 'MAX_SAVINGS') {
        return costB.annualSavingsVsDMO - costA.annualSavingsVsDMO;
      }
      if (sortBy === 'SOLAR_FIT') {
        return (b.rates.solarFeedInTariffCents || 0) - (a.rates.solarFeedInTariffCents || 0);
      }
      if (sortBy === 'RATING') {
        return b.customerRating - a.customerRating;
      }
      return 0;
    });
  }, [currentDistributor, retailerFilter, tariffFilter, pricingFilter, greenOnly, solarPriority, evOnly, batteryOnly, freePowerOnly, sortBy, profile]);

  const toggleCompare = (planId: string) => {
    if (comparedPlanIds.includes(planId)) {
      setComparedPlanIds(comparedPlanIds.filter((id) => id !== planId));
    } else {
      if (comparedPlanIds.length >= 3) {
        alert('You can compare up to 3 plans side-by-side.');
        return;
      }
      setComparedPlanIds([...comparedPlanIds, planId]);
    }
  };

  const comparedPlans = useMemo(() => {
    return SAMPLE_AER_PLANS.filter((p) => comparedPlanIds.includes(p.id));
  }, [comparedPlanIds]);

  const resetFilters = () => {
    setRetailerFilter('ALL');
    setTariffFilter('ALL');
    setPricingFilter('ALL');
    setGreenOnly(false);
    setSolarPriority(false);
    setEvOnly(false);
    setBatteryOnly(false);
    setFreePowerOnly(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenJargonModal={() => setIsJargonModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* Top Announcement */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0 font-bold">
              !
            </span>
            <div>
              <p className="font-bold text-amber-950">
                Network: {currentDistributor.name} (Postcode {profile.postcode}) • Benchmark: ${currentDistributor.defaultMarketOfferAnnual}/yr
              </p>
              <p className="text-amber-800 text-[11px]">
                {profile.batteryCapacityKWh >= 30 
                  ? `With your ${profile.batteryCapacityKWh}kWh battery, GloBird Energy's FreeLunch (11am-2pm 0c/kWh), OVO Energy, or Amber allows you to soak free power every midday.`
                  : 'Check your electricity bill to confirm your exact network distributor if you live near network boundaries.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsJargonModalOpen(true)}
            className="self-start sm:self-auto px-3 py-1.5 bg-amber-200/70 hover:bg-amber-300 font-bold text-amber-900 rounded-lg text-xs transition-colors flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Learn What DMO/VDO Means
          </button>
        </div>

        {/* Tab 1: Compare View */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            {/* Household & Network Configurator */}
            <HouseholdForm
              profile={profile}
              onChangeProfile={handleProfileChange}
              distributor={currentDistributor}
              onSelectDistributor={handleSelectDistributor}
            />

            {/* Filter & Sort Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" /> Filter:
                </span>

                {/* Retailer Selector Dropdown */}
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={retailerFilter}
                    onChange={(e) => setRetailerFilter(e.target.value)}
                    className="text-xs font-bold bg-transparent text-slate-900 focus:outline-none"
                  >
                    <option value="ALL">All Retailers ({availableRetailers.length})</option>
                    {availableRetailers.map((ret) => (
                      <option key={ret} value={ret}>
                        {ret} {ret === 'GloBird Energy' ? '⭐ (FreeLunch)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Free Power Hours Button */}
                <button
                  type="button"
                  onClick={() => setFreePowerOnly(!freePowerOnly)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors ${
                    freePowerOnly
                      ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                      : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  Free Power Hours (0c)
                </button>

                {/* EV Friendly button */}
                <button
                  type="button"
                  onClick={() => setEvOnly(!evOnly)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors ${
                    evOnly
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  EV Night Rate (7c-8c)
                </button>

                {/* Battery / VPP button */}
                <button
                  type="button"
                  onClick={() => setBatteryOnly(!batteryOnly)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors ${
                    batteryOnly
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <BatteryCharging className="w-3.5 h-3.5" />
                  Battery / VPP Ready
                </button>

                {/* Tariff Type */}
                <select
                  value={tariffFilter}
                  onChange={(e) => setTariffFilter(e.target.value as any)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">All Tariffs</option>
                  <option value="FLAT">Single Flat Rate</option>
                  <option value="TOU">Time of Use</option>
                </select>

                {/* Green power filter */}
                <button
                  type="button"
                  onClick={() => setGreenOnly(!greenOnly)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors ${
                    greenOnly
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Leaf className="w-3.5 h-3.5" />
                  GreenPower
                </button>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-2 self-end lg:self-auto">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="LOWEST_COST">Lowest Estimated Cost</option>
                  <option value="MAX_SAVINGS">Highest Savings vs VDO/DMO</option>
                  <option value="SOLAR_FIT">Highest Solar Feed-in</option>
                  <option value="RATING">Highest Customer Rating</option>
                </select>
              </div>
            </div>

            {/* Main Plan Results Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Showing <strong>{filteredPlans.length} plans</strong> available for <strong>{currentDistributor.name}</strong>
                    {retailerFilter !== 'ALL' ? ` (${retailerFilter})` : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    {retailerFilter !== 'ALL' && (
                      <button
                        onClick={() => setRetailerFilter('ALL')}
                        className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md"
                      >
                        Show All Retailers
                      </button>
                    )}
                    {comparedPlanIds.length > 0 && (
                      <button
                        onClick={() => setShowCompareModal(true)}
                        className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Compare {comparedPlanIds.length} Selected
                      </button>
                    )}
                  </div>
                </div>

                {filteredPlans.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center space-y-3 border border-slate-200">
                    <p className="text-sm font-bold text-slate-700">No matching plans found for this filter combination in {currentDistributor.code}.</p>
                    <p className="text-xs text-slate-500">
                      You may have active filters applied (like "EV Night Rate" or "Free Power Hours"). Click below to view all offers.
                    </p>
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold"
                    >
                      Reset All Filters (Show All {availableRetailers.length} Retailers)
                    </button>
                  </div>
                ) : (
                  filteredPlans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      profile={profile}
                      distributor={currentDistributor}
                      isCompared={comparedPlanIds.includes(plan.id)}
                      onToggleCompare={toggleCompare}
                      onAskAiAboutPlan={(p) => setAiFocusPlan(p)}
                    />
                  ))
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <AiAdvisorChat
                  profile={profile}
                  distributor={currentDistributor}
                  planCount={filteredPlans.length}
                />

                <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3 shadow-md">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Sparkles className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      {profile.batteryCapacityKWh >= 30 ? `${profile.batteryCapacityKWh}kWh Mega Battery Optimization` : 'Battery + Free Power Soaking'}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    In <strong>{currentDistributor.name}</strong>, plans like <strong>GloBird Energy</strong> ("FreeLunch 11am-2pm"), <strong>OVO Energy</strong>, and <strong>Amber Electric</strong> allow you to soak 100% free electricity.
                    With your <strong>{profile.batteryCapacityKWh}kWh battery</strong>, filling for $0 at midday runs your evening peak at zero cost.
                  </p>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>GloBird FreeLunch</span>
                    <span>•</span>
                    <span>$0.00 Grid Soak</span>
                    <span>•</span>
                    <span>{profile.batteryCapacityKWh}kWh Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Bill Scanner */}
        {activeTab === 'scanner' && (
          <BillScanner
            onApplyBillDataToProfile={(data) => {
              setProfile((prev) => ({
                ...prev,
                ...data,
              }));
              setActiveTab('compare');
            }}
            onNavigateToCompare={() => setActiveTab('compare')}
          />
        )}

        {/* Tab 3: Jargon Glossary View */}
        {activeTab === 'glossary' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2">
              <h2 className="text-xl font-extrabold text-slate-900">Australian Electricity Jargon Explained</h2>
              <p className="text-xs text-slate-500">
                A simple glossary of every term including AusNet Services (Mitchell Shire 3756), Free Power Hours, GloBird FreeLunch, and 40kWh-50kWh battery banks.
              </p>
            </div>
            <AerReferenceGuide />
          </div>
        )}

        {/* Tab 4: AER Data Standards */}
        {activeTab === 'aerData' && <AerReferenceGuide />}
      </main>

      {/* Floating Compare Bar */}
      {comparedPlanIds.length > 0 && (
        <aside 
          aria-label="Plan comparison drawer"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700 animate-bounce-short"
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-900 font-extrabold flex items-center justify-center text-[10px]">
              {comparedPlanIds.length}
            </span>
            <span>{comparedPlanIds.length} plan{comparedPlanIds.length > 1 ? 's' : ''} ready to compare</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCompareModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-extrabold text-xs transition-colors"
            >
              Compare Side-by-Side
            </button>
            <button
              onClick={() => setComparedPlanIds([])}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              Clear
            </button>
          </div>
        </aside>
      )}

      {/* Comparison Modal */}
      {showCompareModal && (
        <ComparisonModal
          plans={comparedPlans}
          profile={profile}
          distributor={currentDistributor}
          onClose={() => setShowCompareModal(false)}
          onRemovePlan={(id) => setComparedPlanIds(comparedPlanIds.filter((p) => p !== id))}
        />
      )}

      {/* Jargon explainer modal */}
      <JargonModal
        isOpen={isJargonModalOpen}
        onClose={() => setIsJargonModalOpen(false)}
      />

      {/* AI Plan Focus Modal */}
      {aiFocusPlan && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">WattWise Plan Breakdown</span>
                <h3 className="text-lg font-extrabold text-slate-900">{aiFocusPlan.retailerName} - {aiFocusPlan.planName}</h3>
              </div>
              <button
                onClick={() => setAiFocusPlan(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-slate-700 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>Plan Assessment Highlights:</span>
              </div>
              <p>
                This plan is <strong>{Math.abs(aiFocusPlan.dmoComparisonPercent)}% {aiFocusPlan.dmoComparisonPercent <= 0 ? 'less than' : 'above'} the Victorian Default Offer (VDO)</strong> in the {currentDistributor.name} network.
              </p>
              {aiFocusPlan.hasFreePowerHours && (
                <p className="text-amber-900 font-bold bg-amber-100/80 p-2 rounded-lg">
                  ⚡ Free Power Window: {aiFocusPlan.freePowerWindowDescription} — Perfect for soaking into a {profile.batteryCapacityKWh}kWh home battery for $0.00!
                </p>
              )}
              <p>
                <strong>Daily Supply:</strong> {aiFocusPlan.rates.dailySupplyChargeCents}c/day • 
                <strong> Usage:</strong> {aiFocusPlan.rates.flatRateCentsPerKWh ? `${aiFocusPlan.rates.flatRateCentsPerKWh}c/kWh flat` : `${aiFocusPlan.rates.peakRateCentsPerKWh}c peak`}.
              </p>
              {aiFocusPlan.rates.evNightRateCentsPerKWh && (
                <p className="text-sky-800 font-bold flex items-center gap-1">
                  <Car className="w-3.5 h-3.5" />
                  EV Super Off-Peak: {aiFocusPlan.rates.evNightRateCentsPerKWh}c/kWh ({aiFocusPlan.evRateDescription || 'Overnight'})
                </p>
              )}
              {aiFocusPlan.isBatteryVppEligible && aiFocusPlan.vppAnnualCredit && (
                <p className="text-emerald-800 font-bold flex items-center gap-1">
                  <BatteryCharging className="w-3.5 h-3.5" />
                  Battery VPP Bonus: ${aiFocusPlan.vppAnnualCredit}/yr ({aiFocusPlan.vppProviderName})
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setAiFocusPlan(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
              <a
                href={aiFocusPlan.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <span>Check on Retailer Site</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-800">WattWise Australia</span>
              <span>•</span>
              <span>Independent Energy, Solar, Battery & EV Comparison Tool</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <a href="https://www.aer.gov.au/energy-product-reference-data" target="_blank" rel="noreferrer" className="hover:text-emerald-700">
                AER Product Data
              </a>
              <a href="https://www.energymadeeasy.gov.au" target="_blank" rel="noreferrer" className="hover:text-emerald-700">
                Energy Made Easy
              </a>
              <button onClick={() => setIsJargonModalOpen(true)} className="hover:text-emerald-700">
                Bill Anatomy Guide
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            WattWise is an independent consumer resource aligned with the Australian Energy Regulator (AER) Reference Price benchmarks and Victorian Default Offer (VDO) specifications. Calculations are estimates calibrated using household profiles, AusNet / Jemena / Powercor / CitiPower network distributors, rooftop solar, EV charging timing, and Free Power Hours battery soaking (including 40-50kWh arrays). Rates include GST. Always check the retailer's Basic Plan Information Document (BPID) before signing.
          </p>
        </div>
      </footer>
    </div>
  );
}
