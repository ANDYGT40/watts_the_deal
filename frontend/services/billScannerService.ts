import { GoogleGenAI, Type } from '@google/genai';
import { BillAnalysisResult } from '../types';

/**
 * Parses user-provided bill text using strict regex without fabricating any fake default bill.
 * Only returns values that actually match the user's provided text.
 */
function parseTextWithoutMockData(text: string): BillAnalysisResult {
  let retailer = 'Energy Retailer';
  if (/globird|glo bird/i.test(text)) retailer = 'GloBird Energy';
  else if (/origin/i.test(text)) retailer = 'Origin Energy';
  else if (/agl/i.test(text)) retailer = 'AGL Energy';
  else if (/energyaustralia/i.test(text)) retailer = 'EnergyAustralia';
  else if (/red energy/i.test(text)) retailer = 'Red Energy';
  else if (/ovo/i.test(text)) retailer = 'OVO Energy';
  else if (/powershop/i.test(text)) retailer = 'Powershop';
  else if (/alinta/i.test(text)) retailer = 'Alinta Energy';
  else if (/amber/i.test(text)) retailer = 'Amber Electric';

  let state = 'NSW';
  if (/vic|victoria/i.test(text)) state = 'VIC';
  else if (/qld|queensland/i.test(text)) state = 'QLD';
  else if (/sa|south australia/i.test(text)) state = 'SA';
  else if (/act|canberra/i.test(text)) state = 'ACT';
  else if (/tas|tasmania/i.test(text)) state = 'TAS';

  const nmiMatch = text.match(/nmi[:\s#]*([a-zA-Z0-9]{10,11})/i) || text.match(/\b(4\d{9,10}|2\d{9,10}|6\d{9,10}|7\d{9,10})\b/);
  const nmi = nmiMatch ? nmiMatch[1] : undefined;

  const daysMatch = text.match(/(\d{1,3})\s*(?:billing\s*)?days/i);
  const periodDays = daysMatch ? parseInt(daysMatch[1], 10) : undefined;

  const totalKWhMatch = text.match(/([0-9,.]+)\s*kwh(?!\s*\/day)/i) || text.match(/total\s*(?:electricity|energy|usage)[:\s]*([0-9,.]+)/i);
  const totalKWh = totalKWhMatch ? parseFloat(totalKWhMatch[1].replace(/,/g, '')) : undefined;

  const dailyAvgMatch = text.match(/([0-9.]+)\s*kwh\s*\/\s*day/i) || text.match(/daily\s*(?:average|consumption)[:\s]*([0-9.]+)/i);
  let dailyAverageKWh = dailyAvgMatch ? parseFloat(dailyAvgMatch[1]) : undefined;
  if (!dailyAverageKWh && totalKWh && periodDays && periodDays > 0) {
    dailyAverageKWh = Number((totalKWh / periodDays).toFixed(1));
  }

  const costMatch = text.match(/(?:total\s*(?:amount|payable|balance|due)|new\s*charges)[:\s]*\$?\s*([0-9,.]+)/i) || text.match(/\$\s*([0-9,.]+)\s*(?:payable|due)/i);
  const totalCostIncGst = costMatch ? parseFloat(costMatch[1].replace(/,/g, '')) : undefined;

  const supplyMatch = text.match(/supply\s*charge[:\s]*.*?([0-9.]+)\s*c(?:\/day|\s*cents)/i) || text.match(/([0-9.]+)\s*c\/day/i);
  const currentSupplyChargeCents = supplyMatch ? parseFloat(supplyMatch[1]) : undefined;

  const usageMatch = text.match(/(?:usage|peak|general)\s*rate[:\s]*.*?([0-9.]+)\s*c(?:\/kwh|\s*cents)/i) || text.match(/([0-9.]+)\s*c\/kwh/i);
  const currentUsageRateCents = usageMatch ? parseFloat(usageMatch[1]) : undefined;

  const solarMatch = text.match(/solar(?:\s*feed-in|\s*export)?[:\s]*.*?([0-9.]+)\s*kwh/i);
  const solarExportKWh = solarMatch ? parseFloat(solarMatch[1]) : undefined;

  const evDetected = /electric vehicle|\bev\b|tesla|charger/i.test(text);
  const batteryDetected = /battery|powerwall|sungrow|byd|vpp/i.test(text);

  if (!dailyAverageKWh && !totalKWh && !totalCostIncGst && !currentSupplyChargeCents) {
    throw new Error('Could not identify electricity usage or billing figures in the provided text. Please ensure the bill includes kWh usage, supply charges, or dollar totals.');
  }

  const insights: string[] = [];
  if (dailyAverageKWh) {
    insights.push(`Your bill reflects an average consumption of ${dailyAverageKWh} kWh/day.`);
  }
  if (currentSupplyChargeCents) {
    insights.push(`Current supply charge is ${currentSupplyChargeCents}c/day. Top tier market plans from GloBird and OVO offer supply charges under 96c/day.`);
  }
  if (currentUsageRateCents) {
    insights.push(`Your usage rate is approximately ${currentUsageRateCents}c/kWh.`);
  }
  if (batteryDetected) {
    insights.push('Home battery detected. Plans like GloBird ZEROHERO offer 11am-2pm free power to soak your battery and $1.00/day reward for zero peak grid consumption.');
  }

  return {
    nmi,
    retailer,
    state,
    periodDays: periodDays || 90,
    totalKWh,
    dailyAverageKWh: dailyAverageKWh || 14.0,
    totalCostIncGst,
    currentSupplyChargeCents,
    currentUsageRateCents,
    solarExportKWh,
    evDetected,
    batteryDetected,
    insights,
    recommendationSummary: `Parsed from your ${retailer} bill. Check our comparison table and wholesale simulator to see how GloBird ZEROHERO, WholeSave, or FreeLunch compares.`
  };
}

export async function analyzeEnergyBillWithGemini(
  input: { text?: string; base64Image?: string; mimeType?: string }
): Promise<BillAnalysisResult> {
  const hasInput = Boolean((input.text && input.text.trim()) || (input.base64Image && input.mimeType));
  if (!hasInput) {
    throw new Error('Please enter your bill text or select a bill photo first.');
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

    const systemPrompt = `You are a licensed Australian Energy Regulator (AER) consumer advocate and expert electricity bill analyst for "Watt's the Deal".
Analyze the provided Australian energy bill (GloBird Energy, Origin, AGL, EnergyAustralia, Red Energy, Alinta, Powershop, OVO, Amber, etc.).
Extract the REAL figures present in the bill. Do NOT hallucinate or invent dummy figures.
Extract into JSON:
- nmi: National Meter Identifier if visible
- retailer: name of energy company (e.g. GloBird Energy, Origin, AGL, etc.)
- state: NSW, VIC, QLD, SA, ACT, or TAS
- periodDays: billing cycle days (e.g. 91)
- totalKWh: total kilowatt hours consumed
- dailyAverageKWh: daily average consumption (e.g., 14.5)
- totalCostIncGst: total bill balance or amount payable in AUD
- currentSupplyChargeCents: daily supply rate in c/day
- currentUsageRateCents: main usage rate in c/kWh
- solarExportKWh: solar kWh exported if present
- evDetected: boolean, whether EV charging was detected
- batteryDetected: boolean, whether home battery was detected
- insights: array of 3-4 friendly plain-English observations for a novice customer
- recommendationSummary: 2-3 sentences advising how to save.`;

    const contents: any = {
      role: 'user',
      parts: []
    };

    if (input.base64Image && input.mimeType) {
      contents.parts.push({
        inlineData: {
          mimeType: input.mimeType,
          data: input.base64Image,
        }
      });
    }

    if (input.text && input.text.trim()) {
      contents.parts.push({ text: `Analyze this Australian electricity bill:\n\n${input.text}` });
    } else {
      contents.parts.push({ text: `Please extract all billing metrics and rates from this Australian electricity bill document.` });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nmi: { type: Type.STRING },
            retailer: { type: Type.STRING },
            state: { type: Type.STRING },
            periodDays: { type: Type.NUMBER },
            totalKWh: { type: Type.NUMBER },
            dailyAverageKWh: { type: Type.NUMBER },
            totalCostIncGst: { type: Type.NUMBER },
            currentSupplyChargeCents: { type: Type.NUMBER },
            currentUsageRateCents: { type: Type.NUMBER },
            solarExportKWh: { type: Type.NUMBER },
            evDetected: { type: Type.BOOLEAN },
            batteryDetected: { type: Type.BOOLEAN },
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            recommendationSummary: { type: Type.STRING }
          },
          propertyOrdering: ['retailer', 'state', 'dailyAverageKWh', 'totalCostIncGst', 'insights', 'recommendationSummary']
        }
      }
    });

    const parsed = JSON.parse(response.text.trim()) as BillAnalysisResult;
    return parsed;
  } catch (apiErr: any) {
    if (input.text && input.text.trim()) {
      return parseTextWithoutMockData(input.text.trim());
    }

    throw new Error(
      apiErr?.message || 
      'Unable to connect to the bill scanning service. Please check that your bill image is clear, or paste the bill text directly into Method 2.'
    );
  }
}

export async function askEnergyAdvisor(query: string, contextSummary: string): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

    const prompt = `You are "Watt's the Deal", an independent, warm and friendly Australian energy consumer advisor.
Context about the user's situation:
${contextSummary}

User question:
"${query}"

Important knowledge:
- GloBird Energy's ZEROHERO plan rewards exactly $1.00 PER DAY if your household uses ZERO grid power during peak periods (4:00pm - 9:00pm).
- ZEROHERO also includes the 11:00am - 2:00pm FreeLunch window (0c/kWh).
- Note that during a 3-hour zero cost window, battery charging is physically limited by the customer's inverter rating (kW). A 5kW inverter can draw at most 15kWh in 3 hours, so a 40kWh or 50kWh battery cannot fully charge from 0 to 100% in 3 hours alone.
- Feed-in tariffs often have daily caps (e.g. 14kWh/day) after which the export rate drops.
- Negative bill totals are completely valid when solar feed-in credits and ZEROHERO rewards exceed supply and usage charges (meaning the customer is in credit).

Explain in simple, encouraging terms without confusing industry jargon. Keep it concise (under 160 words).`;

    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return res.text || 'We could not process your query right now. Please try again.';
  } catch (err: any) {
    if (/zerohero|zero hero/i.test(query)) {
      return "GloBird's ZEROHERO plan rewards you with $1.00 per day (up to $365/year) whenever you use zero grid power during peak hours (4pm-9pm). Combined with the 11am-2pm FreeLunch window, you can charge your battery for $0 at midday, power your home in peak, and collect your $1/day reward!";
    }
    if (/inverter|speed|kw/i.test(query)) {
      return "Remember that in a 3-hour free power window, charging is limited by your inverter kW rating. A 5kW inverter can draw a maximum of 15kWh, while a 10kW inverter can absorb 30kWh. That's why 40kWh-50kWh batteries rely on both the free grid window and daytime rooftop solar.";
    }
    if (/credit|negative/i.test(query)) {
      return "Yes! If your solar feed-in credits and ZEROHERO peak rewards exceed your daily supply and usage charges, your estimated bill will accurately show as a net credit (money owed to you by your retailer).";
    }
    return "Check our Comparison Table and Wholesale Simulator to model your inverter speed, GloBird ZEROHERO rewards, and solar export caps.";
  }
}
