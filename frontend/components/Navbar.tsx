import React from 'react';
import { Zap, ShieldCheck, HelpCircle, FileText, ArrowRightLeft, TrendingUp } from 'lucide-react';

interface NavbarProps {
  activeTab: 'compare' | 'wholesale' | 'scanner' | 'glossary' | 'aerData';
  setActiveTab: (tab: 'compare' | 'wholesale' | 'scanner' | 'glossary' | 'aerData') => void;
  onOpenJargonModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenJargonModal }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
              <Zap className="w-6 h-6 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">Watt's the Deal</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold tracking-wide uppercase">
                  AER Reference
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Australian Electricity Compare & Insights</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('compare')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'compare'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              Compare Plans
            </button>
            <button
              onClick={() => setActiveTab('wholesale')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'wholesale'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-amber-600" />
              Wholesale vs FreeLunch Simulator
            </button>
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'scanner'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              AI Bill Scanner
            </button>
            <button
              onClick={() => setActiveTab('glossary')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'glossary'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              Jargon Buster
            </button>
            <button
              onClick={() => setActiveTab('aerData')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'aerData'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              AER DMO Standards
            </button>
          </nav>

          {/* Quick Explainer CTA */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenJargonModal}
              className="text-xs sm:text-sm flex items-center gap-1.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-emerald-700" />
              <span>Bill Help</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Tabs */}
        <div className="flex md:hidden border-t border-slate-100 py-2 gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap ${
              activeTab === 'compare' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Compare Plans
          </button>
          <button
            onClick={() => setActiveTab('wholesale')}
            className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap ${
              activeTab === 'wholesale' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Wholesale Simulator
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap ${
              activeTab === 'scanner' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Bill Scanner
          </button>
          <button
            onClick={() => setActiveTab('glossary')}
            className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap ${
              activeTab === 'glossary' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Jargon Buster
          </button>
          <button
            onClick={() => setActiveTab('aerData')}
            className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap ${
              activeTab === 'aerData' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            AER Reference
          </button>
        </div>
      </div>
    </header>
  );
};
