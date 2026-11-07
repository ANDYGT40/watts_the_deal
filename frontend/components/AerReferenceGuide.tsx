import React from 'react';
import { DISTRIBUTORS } from '../constants';
import { ShieldCheck, BookOpen, ExternalLink, Award, CheckCircle } from 'lucide-react';

export const AerReferenceGuide: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          AER Energy Product Reference Data Standard
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          How Australian Energy Pricing Works
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
          The Australian Energy Regulator (AER) publishes the <strong>Default Market Offer (DMO)</strong> every year on July 1st.
          Under Australian Consumer Law, all electricity retailers in NSW, South East Queensland, and South Australia must compare their market offer prices directly against the AER Reference Price benchmark.
        </p>
      </div>

      {/* DMO Reference Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Current Default Market Offer (DMO / VDO) Reference Benchmarks
            </h3>
            <p className="text-xs text-slate-500">
              Based on the average Australian household benchmark consumption (~4,000 to 4,600 kWh/year)
            </p>
          </div>
          <a
            href="https://www.aer.gov.au/energy-product-reference-data"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>Official AER Reference Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3">Distributor Network</th>
                <th className="py-2.5 px-3">Primary Coverage</th>
                <th className="py-2.5 px-3 text-right">AER Reference Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {DISTRIBUTORS.map((d) => (
                <tr key={d.code} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-bold text-emerald-800">{d.state}</td>
                  <td className="py-2.5 px-3">{d.name}</td>
                  <td className="py-2.5 px-3 text-slate-500">Postcodes {d.postcodeRanges[0][0]}-{d.postcodeRanges[0][1]}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    ${d.defaultMarketOfferAnnual} / yr
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rights & Protections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <CheckCircle className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">No Disruption When Switching</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your physical poles and wires do not change. Electricity keeps flowing uninterrupted. The switch happens seamlessly in the billing database.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">10-Day Cooling-off Period</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every household has a legal 10-business-day cooling-off window. If you change your mind, cancel with zero penalty or exit fees.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Consumer Data Right (CDR)</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            CDR Energy standards mandate that all retail contracts and rates be openly accessible via public machine-readable APIs to empower comparison.
          </p>
        </div>
      </div>
    </div>
  );
};
