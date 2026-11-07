import React from 'react';
import { JARGON_GLOSSARY } from '../constants';
import { X, HelpCircle, Lightbulb, ShieldCheck } from 'lucide-react';

interface JargonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JargonModal: React.FC<JargonModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Australian Electricity Bill Jargon Buster</h3>
              <p className="text-xs text-emerald-200">
                Understand what you are paying for in plain Australian English
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-700 hover:bg-emerald-600 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Quick Explainer Graphic Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              The 2 Main Parts of Every Power Bill:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">1. Daily Supply Charge (c/day)</span>
                <p className="text-slate-600">
                  Like a line rental fee. You pay this simply for your meter connection, usually between $0.90 to $1.40 every day.
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">2. Usage Rates (c/kWh)</span>
                <p className="text-slate-600">
                  The actual power you consume. 1 kWh is typically 22c to 38c. Air conditioning and heaters consume the most kWh.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {JARGON_GLOSSARY.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900">{item.term}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    AER Standard
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {item.meaning}
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-amber-900 bg-amber-50/70 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <span className="font-bold">Pro Tip:</span>
                  <span>{item.tip}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Got It, Back to Comparing
          </button>
        </div>
      </div>
    </div>
  );
};
