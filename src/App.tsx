/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Scaling, 
  ScrollText, 
  BrainCircuit, 
  ArrowRight, 
  History, 
  Dna,
  Calculator,
  MessageSquareQuote,
  Sparkles,
  RefreshCcw,
  BookOpen,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  TrendingDown,
  Info
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceArea
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { DecisionState, AttachmentStyle, MonteCarloResult, SensitivityResult, DomainScore } from './types.ts';
import { INITIAL_WHETHER_FACTORS, DARWIN_QUOTES, DOMAINS, ATTACH_MATRIX, RISK_FACTORS } from './constants.ts';
import { computeDomainScores, computeWeightedCompatibility, runMonteCarlo, runSensitivity } from './engine.ts';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const INITIAL_STATE: DecisionState = {
  whetherFactors: INITIAL_WHETHER_FACTORS,
  readinessFactors: [
    { id: 'remotional', label: 'Emotional Readiness', weight: 8, score: 5 },
    { id: 'rfinancial', label: 'Financial Independence', weight: 6, score: 5 },
    { id: 'rsocial', label: 'Social Support Network', weight: 5, score: 5 },
  ],
  selfRatings: DOMAINS.reduce((acc, d) => ({ ...acc, [d.id]: 7 }), {}),
  partnerRatings: DOMAINS.reduce((acc, d) => ({ ...acc, [d.id]: 7 }), {}),
  interactionRatio: 5, // Gottman baseline
  myAttachment: 'secure',
  partnerAttachment: 'secure',
  horsemen: {
    criticism: 2,
    contempt: 0,
    defensiveness: 1,
    stonewalling: 1,
  },
  activeRisks: []
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'intro' | 'whether' | 'whom' | 'results'>('intro');
  const [state, setState] = useState<DecisionState>(INITIAL_STATE);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('scientific-marriage-engine');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setState(prev => ({ ...prev, ...data }));
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('scientific-marriage-engine', JSON.stringify(state));
  }, [state]);

  const domainScores = useMemo(() => computeDomainScores(state), [state]);
  const compatibility = useMemo(() => computeWeightedCompatibility(domainScores, state), [domainScores, state]);
  const monteCarlo = useMemo(() => runMonteCarlo(state), [state]);
  const sensitivity = useMemo(() => runSensitivity(state), [state]);

  const darwinUtility = useMemo(() => {
    const totalW = state.whetherFactors.reduce((acc, f) => acc + f.weight, 0);
    const sum = state.whetherFactors.reduce((acc, f) => acc + (f.score * f.weight), 0);
    return totalW === 0 ? 0 : sum / totalW;
  }, [state.whetherFactors]);

  const decisionVerdict = useMemo(() => {
    const adjustedThreshold = 75 + (darwinUtility * 0.5);
    if (compatibility >= adjustedThreshold && monteCarlo.width < 15) {
      return { status: "PROCEED", detail: "High compatibility with narrow uncertainty.", color: "text-emerald-700" };
    } else if (compatibility >= 60) {
      return { status: "CAUTION", detail: "Moderate compatibility or higher uncertainty.", color: "text-amber-700" };
    } else {
      return { status: "RECONSIDER", detail: "Below evidence-based stability threshold.", color: "text-red-700" };
    }
  }, [compatibility, monteCarlo.width, darwinUtility]);

  const consultDarwin = async () => {
    setLoadingAi(true);
    setAiInsight('');
    try {
      const prompt = `
        You are Charles Darwin, FRS. You have received a psychological report from the HMS Beagle Marriage Division.
        Data Summary:
        - Commitment Calculus (Darwinian Utility): ${darwinUtility.toFixed(1)} (-10 to 10)
        - Compatibility Index: ${compatibility.toFixed(1)}%
        - Uncertainty Interval: ${monteCarlo.ciLower.toFixed(0)}% to ${monteCarlo.ciUpper.toFixed(0)}%
        - Attachment Dynamics: ${state.myAttachment} - ${state.partnerAttachment}
        - Gottman Risk Patterns: Contempt level ${state.horsemen.contempt}/10.
        - Strategic Decision: ${decisionVerdict.status}
        
        Provide a "Scientific Naturalist" verdict with evolutionary perspective. 
        Refer to the "Eight Pillars of Marital Stability" (Weights: Emotional Communication 25%, etc).
        Be rigorous, slightly eccentric, but analytically sharp. 
        Limit to 250 words.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setAiInsight(response.text || "Nature's secrets are often elusive. Try again later.");
    } catch (err) {
      console.error(err);
      setAiInsight("Alas, the telegram wires are down.");
    } finally {
      setLoadingAi(false);
    }
  };

  const updateNestedState = (path: string, val: any) => {
    const parts = path.split('.');
    setState(prev => {
      const next = { ...prev };
      let current: any = next;
      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = { ...current[parts[i]] };
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = val;
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-parchment text-ink font-serif selection:bg-sepia/20">
      <div className="max-w-6xl mx-auto py-12 px-6">
        <header className="mb-16 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 mb-4">
                <Dna className="text-sepia size-5 animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.4em] font-mono text-sepia/50 italic">HMS Beagle Decision Engine v2.5</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tighter text-center">
                Scientific <span className="italic font-light serif text-sepia/90">Union</span>
            </h1>
            <p className="text-xl text-sepia/70 max-w-2xl text-center leading-relaxed">
                An evidence-based Multi-Criteria Decision Analysis implementation combining Darwinian utility, Gottman's communication research, and attachment theory.
            </p>
        </header>

        <nav className="flex gap-2 mb-12 overflow-x-auto pb-4 justify-center">
          {[
            { id: 'intro', label: 'Framework', icon: BookOpen },
            { id: 'whether', label: 'Stage I: Darwinian Utility', icon: Scaling },
            { id: 'whom', label: 'Stage II: Compatibility', icon: Heart },
            { id: 'results', label: 'Stage III: Analytics', icon: BrainCircuit },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-3 rounded-sm flex items-center gap-3 transition-all font-bold uppercase tracking-widest text-xs whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-sepia text-parchment shadow-xl shadow-sepia/20' 
                  : 'text-sepia/40 hover:text-sepia hover:bg-sepia/5'
              }`}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        <main className="min-h-[700px]">
          <AnimatePresence mode="wait">
            {activeTab === 'intro' && (
                <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="scientific-card max-w-4xl mx-auto p-12">
                    <h2 className="text-4xl mb-8 flex items-center gap-4">
                        <ScrollText className="size-10 text-sepia" /> 
                        Statistical Marriage Framework
                    </h2>
                    <div className="prose prose-sepia max-w-none text-lg">
                        <p>This engine quantifies marital fitness using a <strong>Multi-Criteria Decision Analysis (MCDA)</strong> model. It bridges historical heuristics with modern predictive psychology.</p>
                        
                        <div className="grid md:grid-cols-2 gap-12 my-12">
                            <ul className="space-y-4 not-prose">
                                <li className="flex gap-4">
                                    <ShieldCheck className="text-emerald-700 shrink-0" />
                                    <div>
                                        <h4 className="font-bold underline">Gottman Institute (Communication)</h4>
                                        <p className="text-sm opacity-70">Predicts stability with 94% accuracy based on the "Four Horsemen" and 5:1 interaction ratio.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <BrainCircuit className="text-blue-700 shrink-0" />
                                    <div>
                                        <h4 className="font-bold underline">Big Five Personality</h4>
                                        <p className="text-sm opacity-70">Empirically identifies Conscientiousness and Emotional Stability as the robust predictors.</p>
                                    </div>
                                </li>
                            </ul>
                            <ul className="space-y-4 not-prose">
                                <li className="flex gap-4">
                                    <History className="text-sepia shrink-0" />
                                    <div>
                                        <h4 className="font-bold underline">Darwin's Journal (1838)</h4>
                                        <p className="text-sm opacity-70">Weighting the utility of the institution itself (freedom vs companionship).</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <TrendingDown className="text-orange-700 shrink-0" />
                                    <div>
                                        <h4 className="font-bold underline">Monte Carlo Logic</h4>
                                        <p className="text-sm opacity-70">Corrects for subjective observer bias using 2,000 iterations to produce 95% Confidence Intervals.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex justify-center mt-12">
                        <button onClick={() => setActiveTab('whether')} className="bg-sepia text-parchment px-12 py-5 font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-ink transition-all flex items-center gap-4 group">
                            Initialization Sequence <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                        </button>
                    </div>
                </motion.div>
            )}

            {activeTab === 'whether' && (
                <motion.div key="whether" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-12">
                    <div className="text-center">
                        <h2 className="text-5xl font-black mb-2">Stage I: Darwinian Utility</h2>
                        <p className="font-mono text-xs uppercase tracking-[0.5em] opacity-40 italic">Historical Net Happiness Calculus</p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <h3 className="font-mono text-[10px] uppercase tracking-widest opacity-30 mb-6">Original Journal Entry Weights</h3>
                            {state.whetherFactors.map(f => (
                                <div key={f.id} className="scientific-card bg-white/40">
                                    <div className="flex justify-between items-center mb-6">
                                        <label className="text-xl font-bold">{f.label}</label>
                                        <span className={`font-mono text-xs px-2 py-1 border ${f.score > 0 ? 'border-emerald-600/30 text-emerald-700' : 'border-red-600/30 text-red-700'}`}>
                                            Net Impact: {f.score > 0 ? '+' : ''}{f.score}
                                        </span>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] uppercase font-mono opacity-40 w-16">Disutility</span>
                                            <input type="range" min="-10" max="10" value={f.score} onChange={e => {
                                                const newF = state.whetherFactors.map(x => x.id === f.id ? { ...x, score: parseInt(e.target.value) } : x);
                                                updateNestedState('whetherFactors', newF);
                                            }} className="grow cursor-pointer" />
                                            <span className="text-[10px] uppercase font-mono opacity-40 w-16 text-right">Utility</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-8 h-fit lg:sticky lg:top-24">
                            <div className="scientific-card border-none bg-sepia text-parchment p-12 text-center">
                                <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] mb-4 opacity-70">Calculated Propensity</h3>
                                <div className="text-8xl font-black mb-4">{(darwinUtility * 10).toFixed(0)}%</div>
                                <p className="italic opacity-80 text-lg">"{darwinUtility > 2 ? 'Darwin noted: Marry—Marry—Marry Q.E.D.' : darwinUtility < -2 ? 'Better to be a solitary philosopher than a weary parent.' : 'The natural scales of desire are in equilibrium.'}"</p>
                            </div>
                            <div className="scientific-card bg-white/60 p-8">
                                <h3 className="font-mono text-[10px] uppercase tracking-widest mb-6 opacity-40">System Readiness Sliders</h3>
                                <div className="space-y-6">
                                    {state.readinessFactors.map(r => (
                                        <div key={r.id} className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold font-mono">
                                                <span>{r.label}</span>
                                                <span>{r.score}/10</span>
                                            </div>
                                            <input type="range" min="0" max="10" value={r.score} onChange={e => {
                                                const newR = state.readinessFactors.map(x => x.id === r.id ? { ...x, score: parseInt(e.target.value) } : x);
                                                updateNestedState('readinessFactors', newR);
                                            }} className="w-full opacity-60 hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'whom' && (
                <motion.div key="whom" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-12">
                    <div className="text-center">
                        <h2 className="text-5xl font-black mb-2">Stage II: The Selection Engine</h2>
                        <p className="font-mono text-xs uppercase tracking-[0.5em] opacity-40 italic">Psychometric Domain & Attachment Matrix</p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div className="scientific-card bg-white/50">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <Dna className="size-5 text-sepia" /> Domain Assessments (Self vs Partner)
                                </h3>
                                <div className="space-y-8">
                                    {DOMAINS.map(d => (
                                        <div key={d.id} className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-sm font-bold uppercase tracking-tight">{d.label}</h4>
                                                <span className="text-[10px] font-mono p-1 bg-sepia/5">{Math.round(d.weight * 100)}% Weight</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] uppercase font-mono opacity-40">Self Rating</label>
                                                    <input type="range" min="0" max="10" value={state.selfRatings[d.id]} onChange={e => updateNestedState(`selfRatings.${d.id}`, parseInt(e.target.value))} className="w-full" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] uppercase font-mono opacity-40">Partner Rating</label>
                                                    <input type="range" min="0" max="10" value={state.partnerRatings[d.id]} onChange={e => updateNestedState(`partnerRatings.${d.id}`, parseInt(e.target.value))} className="w-full" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="scientific-card bg-emerald-700/5 border-emerald-700/20">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <ShieldCheck className="size-5 text-emerald-800" /> Gottman Risk Mitigation
                                </h3>
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-mono">
                                            <span>Pos:Neg interaction Ratio</span>
                                            <span className="font-bold">{state.interactionRatio}:1</span>
                                        </div>
                                        <input type="range" min="0" max="20" step="0.5" value={state.interactionRatio} onChange={e => updateNestedState('interactionRatio', parseFloat(e.target.value))} className="w-full" />
                                        <p className="text-[10px] italic opacity-50">Gottman Baseline: 5:1 for stability, 1:1 for dissolution.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                        {Object.entries(state.horsemen).map(([key, val]) => (
                                            <div key={key} className="space-y-1">
                                                <label className="text-[10px] uppercase font-mono opacity-60 flex justify-between">
                                                    {key} <span>{key === 'contempt' ? '2.5x weight' : ''}</span>
                                                </label>
                                                <input type="range" min="0" max="10" value={val} onChange={e => updateNestedState(`horsemen.${key}`, parseInt(e.target.value))} className="w-full accent-sepia" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 h-fit lg:sticky lg:top-24">
                            <div className="scientific-card flex flex-col items-center">
                                <h3 className="font-mono text-[10px] uppercase tracking-widest mb-8 opacity-40">Dynamic Compatibility Map</h3>
                                <div className="w-full aspect-square max-w-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={domainScores}>
                                            <PolarGrid stroke="#704214" strokeOpacity={0.15} />
                                            <PolarAngleAxis dataKey="domain" tick={{ fill: '#704214', fontSize: 9, fontWeight: 700 }} />
                                            <Radar name="Compatibility" dataKey="score" stroke="#704214" fill="#704214" fillOpacity={0.4} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="scientific-card bg-white/80">
                                <h3 className="font-mono text-[10px] uppercase tracking-widest mb-6 opacity-40">Attachment Compatibility Matrix</h3>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-mono opacity-50 block text-center">Your Style</label>
                                        <select value={state.myAttachment} onChange={e => updateNestedState('myAttachment', e.target.value as any)} className="w-full bg-parchment border-none p-3 font-mono text-xs uppercase tracking-widest font-bold">
                                            <option value="secure">Secure</option>
                                            <option value="anxious">Anxious</option>
                                            <option value="avoidant">Avoidant</option>
                                            <option value="disorganized">Disorganized</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-mono opacity-50 block text-center">Their Style</label>
                                        <select value={state.partnerAttachment} onChange={e => updateNestedState('partnerAttachment', e.target.value as any)} className="w-full bg-parchment border-none p-3 font-mono text-xs uppercase tracking-widest font-bold">
                                            <option value="secure">Secure</option>
                                            <option value="anxious">Anxious</option>
                                            <option value="avoidant">Avoidant</option>
                                            <option value="disorganized">Disorganized</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-sepia/5 text-center">
                                    <p className="text-xs italic opacity-60">"Pairing Score: {ATTACH_MATRIX[state.myAttachment][state.partnerAttachment]}/10 Factors into base compatibility."</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'results' && (
                <motion.div key="results" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-12 pb-32">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="scientific-card border-none bg-sepia text-parchment p-12 flex flex-col items-center justify-center text-center col-span-2">
                            <h3 className="font-mono text-[10px] uppercase tracking-[0.4em] mb-6 opacity-60">Final Stability Index</h3>
                            <div className="text-9xl font-black mb-4 tracking-tighter">{compatibility.toFixed(0)}</div>
                            <div className={`text-2xl font-black uppercase tracking-widest py-2 px-6 border-2 mb-6 ${decisionVerdict.status === 'PROCEED' ? 'border-emerald-400 bg-emerald-400/10' : decisionVerdict.status === 'CAUTION' ? 'border-amber-400 bg-amber-400/10' : 'border-red-400 bg-red-400/10'}`}>
                                {decisionVerdict.status}
                            </div>
                            <p className="text-lg opacity-80 max-w-sm italic">"{decisionVerdict.detail}"</p>
                        </div>
                        <div className="scientific-card bg-white/80 p-12 flex flex-col items-center justify-center text-center">
                            <h3 className="font-mono text-[10px] uppercase tracking-widest mb-6 opacity-40">Confidence Interval (95%)</h3>
                            <div className="w-full h-24 relative flex items-center justify-center">
                                <div className="w-full h-0.5 bg-sepia/20 absolute"></div>
                                <div className="h-full w-0.5 bg-sepia/20 absolute left-0"></div>
                                <div className="h-full w-0.5 bg-sepia/20 absolute right-0"></div>
                                <div className="h-4 bg-sepia absolute flex items-center justify-center text-[10px] font-mono p-2 text-parchment" style={{ 
                                    left: `${monteCarlo.ciLower}%`, 
                                    right: `${100 - monteCarlo.ciUpper}%` 
                                }}>
                                    {monteCarlo.ciLower.toFixed(0)}-{monteCarlo.ciUpper.toFixed(0)}%
                                </div>
                            </div>
                            <p className="text-[10px] uppercase font-mono tracking-widest mt-8 opacity-40">Uncertainty Metric: {monteCarlo.width.toFixed(1)} Pts</p>
                            <p className="text-xs italic mt-4 px-4">{monteCarlo.width < 15 ? 'Narrow width indicates high observational reliability.' : 'Wide interval suggesting high subjective uncertainty.'}</p>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12">
                        <div className="scientific-card">
                            <h3 className="text-lg font-bold mb-8 flex items-center gap-3"><TrendingDown className="size-5 text-sepia" /> Sensitivity Analysis (Weight Perturbation)</h3>
                            <div className="space-y-6">
                                {sensitivity.map(s => (
                                    <div key={s.domain} className="space-y-1">
                                        <div className="flex justify-between text-[10px] uppercase font-mono opacity-60">
                                            <span>{s.domain}</span>
                                            <span className={s.impact > 0 ? 'text-emerald-700' : 'text-red-700'}>{s.impact > 0 ? '+' : ''}{s.impact.toFixed(1)} Impact</span>
                                        </div>
                                        <div className="h-1 bg-sepia/10 overflow-hidden">
                                          <motion.div className={`h-full ${s.impact > 0 ? 'bg-emerald-600' : 'bg-red-600'}`} initial={{ width: 0 }} animate={{ width: `${Math.abs(s.impact) * 20}%` }} style={{ marginLeft: s.impact < 0 ? '50%' : '50%', transform: `translateX(${s.impact < 0 ? '-100%' : '0'})` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] italic opacity-40 mt-8">Impact of increasing domain weight by 20% on final compatibility score.</p>
                        </div>

                        <div className="scientific-card">
                            <h3 className="text-lg font-bold mb-8 flex items-center gap-3 uppercase tracking-tighter"><AlertTriangle className="size-5 text-red-700" /> Longitudinal Risk Flags</h3>
                            {RISK_FACTORS.map(r => (
                                <button key={r.id} onClick={() => {
                                    const next = state.activeRisks.includes(r.id) ? state.activeRisks.filter(id => id !== r.id) : [...state.activeRisks, r.id];
                                    updateNestedState('activeRisks', next);
                                }} className={`w-full text-left p-4 rounded-sm border mb-3 transition-all flex items-center gap-4 ${state.activeRisks.includes(r.id) ? (r.level === 'red' ? 'bg-red-100 border-red-300' : 'bg-amber-100 border-amber-300') : 'bg-white/40 border-sepia/10 opacity-60'}`}>
                                    <div className={`size-3 rounded-full ${r.level === 'red' ? 'bg-red-600' : 'bg-amber-600'}`}></div>
                                    <span className="grow font-bold text-sm tracking-tight">{r.text}</span>
                                    <span className="text-[10px] font-mono opacity-50">{r.weight} Pts</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="scientific-card relative overflow-hidden bg-white/40">
                      <div className="absolute top-0 right-0 p-4 opacity-5"><MessageSquareQuote className="size-24" /></div>
                      <h3 className="text-3xl mb-8 flex items-center gap-4">
                        <Sparkles className="size-8 text-sepia" /> 
                        The Naturalist's Verdict
                      </h3>
                      {aiInsight ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-sepia max-w-none italic text-xl leading-relaxed first-letter:text-7xl first-letter:font-black first-letter:mr-4 first-letter:float-left first-letter:text-sepia">
                          {aiInsight.split('\n').map((p, i) => <p key={i} className="mb-6">{p}</p>)}
                          <div className="mt-12 pt-8 border-t border-sepia/10 flex justify-between items-center text-[10px] font-mono tracking-[0.3em] uppercase opacity-40">
                             <span>Final Decryption</span>
                             <span>— C. Robert Darwin, Royal Society</span>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="py-24 text-center">
                          {loadingAi ? (
                             <div className="flex flex-col items-center gap-6">
                                <RefreshCcw className="size-10 animate-spin text-sepia/40" />
                                <p className="font-mono text-xs uppercase tracking-widest animate-pulse">Sifting biological data via telegraph...</p>
                             </div>
                          ) : (
                            <button onClick={consultDarwin} className="bg-sepia text-parchment px-16 py-6 font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition-all text-sm flex items-center gap-4 mx-auto">
                               <MessageSquareQuote className="size-5" /> Execute AI Analysis
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="mt-32 pt-16 border-t border-sepia/10">
            <div className="grid md:grid-cols-3 gap-12 text-[10px] font-mono uppercase tracking-[0.2em] opacity-40 italic">
                <div className="space-y-2">
                    <p>Method: MCDA Engine v2.5</p>
                    <p>Precision: Monte Carlo (2k Iter)</p>
                </div>
                <div className="text-center space-y-2">
                    <p>Reference: Gottman & Levenson (1992)</p>
                    <p>Reference: Dyrenforth et al. (2010)</p>
                </div>
                <div className="text-right space-y-2">
                    <p>© 1838-2024 HMS Beagle Labs</p>
                    <p>Verified: Darwin Marriage Notebooks</p>
                </div>
            </div>
        </footer>
      </div>
    </div>
  );
}
