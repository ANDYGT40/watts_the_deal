import React, { useState } from 'react';
import { askEnergyAdvisor } from '../services/billScannerService';
import { HouseholdProfile, DistributorInfo } from '../types';
import { Sparkles, Send, Bot, User, Loader2 } from 'lucide-react';

interface AiAdvisorChatProps {
  profile: HouseholdProfile;
  distributor: DistributorInfo;
  planCount: number;
}

export const AiAdvisorChat: React.FC<AiAdvisorChatProps> = ({ profile, distributor, planCount }) => {
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: `G'day! I'm WattWise, your independent energy guide. You're currently exploring ${planCount} plans in the ${distributor.name} network with ${profile.averageDailyUsageKWh} kWh/day usage. Ask me anything about DMO rates, solar FiT, or how to switch!`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (questionText?: string) => {
    const q = questionText || input.trim();
    if (!q || loading) return;

    const newMsgs = [...messages, { sender: 'user' as const, text: q }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const context = `State: ${profile.state}, Postcode: ${profile.postcode}, Distributor: ${distributor.name}, DMO Benchmark: $${distributor.defaultMarketOfferAnnual}/yr, Daily Usage: ${profile.averageDailyUsageKWh} kWh/day, Solar: ${profile.hasSolar ? 'Yes' : 'No'}, Controlled load: ${profile.hasControlledLoad ? 'Yes' : 'No'}.`;
      const reply = await askEnergyAdvisor(q, context);
      setMessages([...newMsgs, { sender: 'ai', text: reply }]);
    } catch (e: any) {
      setMessages([...newMsgs, { sender: 'ai', text: 'Sorry, I had a momentary connection hiccup. Please ask again!' }]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    'Is Time-of-Use better than Flat Rate for me?',
    'What happens to my power when I switch retailers?',
    'Why is the Reference Price important?',
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-amber-500 text-white flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">WattWise Energy Assistant</h4>
            <p className="text-[11px] text-slate-500">Instant answers powered by Gemini 2.5</p>
          </div>
        </div>
      </div>

      {/* Message history */}
      <div className="space-y-3 max-h-56 overflow-y-auto text-xs pr-1">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2 ${
              m.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.sender === 'ai' && (
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-emerald-700" />
              </div>
            )}
            <div
              className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-slate-900 text-white font-medium rounded-br-xs'
                  : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-xs'
              }`}
            >
              {m.text}
            </div>
            {m.sender === 'user' && (
              <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3 h-3" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            <span>WattWise is writing advice...</span>
          </div>
        )}
      </div>

      {/* Suggested quick chips */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {sampleQuestions.map((sq, i) => (
          <button
            key={i}
            onClick={() => handleSend(sq)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Input box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 pt-1"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your energy bill..."
          className="flex-1 text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 text-white transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
