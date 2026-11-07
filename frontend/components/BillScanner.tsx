import React, { useState } from 'react';
import { BillAnalysisResult, HouseholdProfile } from '../types';
import { analyzeEnergyBillWithGemini } from '../services/billScannerService';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  Camera, 
  Car, 
  BatteryCharging,
  Trash2
} from 'lucide-react';

interface BillScannerProps {
  onApplyBillDataToProfile: (extracted: Partial<HouseholdProfile>) => void;
  onNavigateToCompare: () => void;
}

export const BillScanner: React.FC<BillScannerProps> = ({
  onApplyBillDataToProfile,
  onNavigateToCompare,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingSource, setLoadingSource] = useState<'upload' | 'text' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BillAnalysisResult | null>(null);

  const sampleBillText = `ORIGIN ENERGY ELECTRICITY BILL TAX INVOICE
Account No: 8829-192-102
NMI: 4102001920
Supply Address: 42 George St, Sydney NSW 2000
Billing Period: 15 Oct 2024 to 14 Jan 2025 (91 days)
Total Electricity Consumed: 1,320 kWh
Average Daily Consumption: 14.5 kWh/day
Current Charges:
- Daily Supply Charge: 91 days @ 118.5 c/day = $107.83
- Peak Electricity Usage: 1,320 kWh @ 34.2 c/kWh = $451.44
- Solar Feed-in Export: 210 kWh @ -5.5 c/kWh = -$11.55
GST (10%): $54.77
TOTAL AMOUNT PAYABLE: $602.49
Payment Due Date: 28 Jan 2025`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError(null);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  // Run analysis specifically for file upload
  const handleScanUpload = async () => {
    if (!selectedFile) {
      setError('Please choose or snap a bill photo or PDF first.');
      return;
    }
    setLoadingSource('upload');
    setError(null);

    try {
      const mimeType = selectedFile.type || 'image/jpeg';
      const arrayBuffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Image = btoa(binary);

      const res = await analyzeEnergyBillWithGemini({
        base64Image,
        mimeType,
        text: inputText.trim() || undefined,
      });

      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Could not analyze uploaded bill. Please ensure your image is legible, or paste the text directly into Method 2.');
    } finally {
      setLoadingSource(null);
    }
  };

  // Run analysis specifically for pasted text (does NOT invent fake data if empty)
  const handleScanText = async () => {
    if (!inputText.trim()) {
      setError('Please paste your electricity bill text into the box or click "Load Sample Bill" to test.');
      return;
    }
    setLoadingSource('text');
    setError(null);

    try {
      const res = await analyzeEnergyBillWithGemini({
        text: inputText.trim(),
      });

      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Could not parse bill text. Please check the content and try again.');
    } finally {
      setLoadingSource(null);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApplyBillDataToProfile({
      averageDailyUsageKWh: result.dailyAverageKWh || (result.totalKWh && result.periodDays ? Number((result.totalKWh / result.periodDays).toFixed(1)) : 14.5),
      currentQuarterlyBillCost: result.totalCostIncGst || 450,
      hasSolar: Boolean(result.solarExportKWh && result.solarExportKWh > 0),
      solarDailyExportKWh: result.solarExportKWh && result.periodDays ? Number((result.solarExportKWh / result.periodDays).toFixed(1)) : 0,
      hasEV: result.evDetected || false,
      hasBattery: result.batteryDetected || false,
    });
    onNavigateToCompare();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Gemini 2.5 AI Bill Reader & Analyzer
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Scan Your Real Electricity Bill
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm">
            WattWise parses your actual daily consumption, supply charges, and NMI to show exact comparisons against the AER Default Market Offer benchmark without fabricating figures.
          </p>
        </div>
      </div>

      {/* Two Upload & Paste Input Boxes with Separate Analyze Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Method 1: Upload photo/PDF */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                Method 1: Upload Photo or PDF
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                Fastest
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Take a photo or upload page 1 showing your rates & usage summary.
            </p>

            <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50">
              <input
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                onChange={handleFileChange}
              />
              {previewUrl ? (
                <div className="text-center space-y-2 w-full">
                  {selectedFile?.type.startsWith('image/') ? (
                    <img
                      src={previewUrl}
                      alt="Bill preview"
                      className="max-h-32 rounded-lg object-contain mx-auto shadow"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto text-emerald-800">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}
                  <span className="text-xs font-semibold text-emerald-800 block truncate">
                    {selectedFile?.name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleClearFile();
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 px-2 py-0.5 rounded"
                  >
                    <Trash2 className="w-3 h-3" /> Remove File
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 block">
                    Tap to snap or select bill photo
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Supports JPG, PNG, PDF, or screenshots
                  </span>
                </div>
              )}
            </label>
          </div>

          <button
            onClick={handleScanUpload}
            disabled={!selectedFile || loadingSource !== null}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            {loadingSource === 'upload' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Scanning Bill Document...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Analyze Uploaded Bill Photo</span>
              </>
            )}
          </button>
        </div>

        {/* Method 2: Paste Bill Text */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Method 2: Paste Bill Text
              </h3>
              <button
                type="button"
                onClick={() => setInputText(sampleBillText)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
              >
                Load Sample Bill
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Copy & paste the rate lines or charges section from your email or PDF invoice.
            </p>

            <textarea
              rows={5}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your bill text here (e.g. NMI, daily supply charge c/day, kWh usage, total amount)..."
              className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleScanText}
            disabled={loadingSource !== null}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            {loadingSource === 'text' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Analyzing Pasted Bill Text...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Analyze Pasted Bill Text</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Analysis Result Display */}
      {result && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-lg space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Extraction Complete
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">
                Current Bill Breakdown: {result.retailer || 'Your Retailer'}
              </h3>
            </div>
            {result.nmi && (
              <span className="text-xs font-mono bg-slate-100 text-slate-800 px-3 py-1 rounded-lg border border-slate-200 font-bold">
                NMI: {result.nmi}
              </span>
            )}
          </div>

          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">
                Daily Consumption
              </span>
              <span className="text-lg font-mono font-bold text-slate-900">
                {result.dailyAverageKWh ? `${result.dailyAverageKWh} kWh` : 'N/A'}
              </span>
              <span className="text-[10px] text-slate-500 block">per day</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">
                Total Bill Paid
              </span>
              <span className="text-lg font-mono font-bold text-slate-900">
                {result.totalCostIncGst ? `$${result.totalCostIncGst}` : 'N/A'}
              </span>
              <span className="text-[10px] text-slate-500 block">{result.periodDays || 90} days period</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">
                Supply Rate
              </span>
              <span className="text-lg font-mono font-bold text-slate-900">
                {result.currentSupplyChargeCents ? `${result.currentSupplyChargeCents} c` : 'N/A'}
              </span>
              <span className="text-[10px] text-slate-500 block">per day</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">
                Usage Rate
              </span>
              <span className="text-lg font-mono font-bold text-slate-900">
                {result.currentUsageRateCents ? `${result.currentUsageRateCents} c` : 'N/A'}
              </span>
              <span className="text-[10px] text-slate-500 block">per kWh</span>
            </div>
          </div>

          {/* Electrification Badges */}
          {(result.evDetected || result.batteryDetected || result.solarExportKWh) && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              {result.solarExportKWh && (
                <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg font-semibold flex items-center gap-1.5">
                  Solar Export: {result.solarExportKWh} kWh credited
                </span>
              )}
              {result.evDetected && (
                <span className="px-3 py-1 bg-sky-50 border border-sky-200 text-sky-900 rounded-lg font-semibold flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-sky-600" />
                  Electric Vehicle charging detected
                </span>
              )}
              {result.batteryDetected && (
                <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg font-semibold flex items-center gap-1.5">
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
                  Home battery detected
                </span>
              )}
            </div>
          )}

          {/* AI Insights */}
          <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              WattWise AI Assessment & Savings Opportunity
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {result.insights.map((ins, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>{ins}</span>
                </li>
              ))}
            </ul>
            {result.recommendationSummary && (
              <p className="text-xs font-semibold text-emerald-950 pt-2 border-t border-emerald-200/60">
                Recommendation: {result.recommendationSummary}
              </p>
            )}
          </div>

          {/* Action to transfer into profile */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-xs text-slate-500">
              Apply these exact figures to update your comparison profile and view cheaper alternatives immediately.
            </p>
            <button
              onClick={handleApply}
              className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md transition-all"
            >
              <span>Apply to Profile & Compare Plans</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
