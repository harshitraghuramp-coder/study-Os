import React, { useState } from 'react';
import { FileText, Compass, GitFork, Layers, CheckSquare, Download, Sparkles, Calendar, Flame, Headphones, Cpu, Check, Copy } from 'lucide-react';

export const SpecBlueprintView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'spec' | 'nav' | 'flows' | 'stack' | 'plan'>('spec');
  const [copied, setCopied] = useState<boolean>(false);

  const fullMarkdownSpec = [
    '# AuraFocus: Study Management & Deep-Focus Operating System',
    '## Product Feature Specification & Architectural Blueprint',
    '',
    '**Parameters:**',
    '- **Platform:** Both (Cross-platform Web / Desktop / Mobile PWA)',
    '- **Audience:** Everyone (Students, Researchers, Knowledge Workers, Lifelong Learners)',
    '- **AI Capability:** Full (Adaptive Gemini 3.8 Intelligence: Socratic Tutor, Cognitive Breakdown, Active Recall, Flow Coaching)',
    '- **Visual Style:** Adaptive (Focus Dark, Clean Paper Light, Forest Zen, Midnight OLED, Sunset Warmth)',
    '- **Main Goal:** Focus (Minimizing cognitive switching, eliminating friction, inducing sustained flow states)',
    '',
    '---',
    '',
    '### 1. Practical Feature Specification',
    '',
    '#### A. Deep-Focus Pomodoro & Flow Engine',
    '- **Interval Flexibility:** Standard 25/5 Classic, 50/10 Ultradian Rhythm, and unbounded Flow Stopwatch.',
    '- **Cognitive Task Binding:** Direct association of running intervals with specific syllabus objectives.',
    '- **Zen Fullscreen Mode:** Distraction-free minimalist interface with zero-clutter typography and Spacebar hotkeys.',
    '- **Zen Bell Completion Synthesis:** Harmonic 528Hz Solfeggio procedural chime via HTML5 Web Audio.',
    '',
    '#### B. Synthesized Ambient Soundscape Mixer',
    '- **Zero-Bandwidth Procedural Audio:** Generated directly in the browser via Web Audio API oscillators and filtered noise (zero external MP3 buffering or network lag).',
    '- **Channels:**',
    '  1. 40Hz Gamma Binaural Beats (216Hz/256Hz stereo phase separation for cognitive synchronization)',
    '  2. Synthesized Rain & Gentle Storm Swells (Bandpass pink noise + dynamic LFO)',
    '  3. Forest Breeze & Procedural Bird Chirps (Exponential sine sweep synthesis)',
    '  4. Lo-Fi Vinyl Crackle (Filtered warm rumble + stochastic pop impulse bursts)',
    '  5. Deep Brown Noise & Pink Noise (1/f² speech masking)',
    '- **Master & Per-Track Faders:** Precision gain adjustments with one-click presets.',
    '',
    '#### C. Smart Study Tasks & AI Cognitive Decomposition',
    '- **Task Hierarchy:** Objective -> Estimated Pomodoros -> Subject Tag -> Actionable Micro-Steps.',
    '- **AI Breakdown via Gemini:** Transforms vague objectives into 3-5 structured 25-minute Pomodoro steps with cognitive focus tips.',
    '- **Inline Checklists:** Subtask progress tracking that rewards incremental dopamine (+15 XP).',
    '',
    '#### D. Live AI Study Helper & Active Recall Arena',
    '- **Four Cognitive Modes:**',
    '  1. Feynman Explainer: Analogies and first-principles mental models for difficult concepts.',
    '  2. Socratic Guide: Interactive inquiry-based dialogue that probes understanding.',
    '  3. Active Recall Quiz: Generates 3-question diagnostic quizzes with instant grading and explanations.',
    '  4. Focus Coach: Strategies for cognitive fatigue, spaced repetition, and attention stamina.',
    '',
    '#### E. Gamified Study Streaks & Progression System',
    '- **Daily Streak Flame:** Multiplier increments on consecutive daily study sessions.',
    '- **Streak Freeze Power-Ups:** Purchasable via earned XP (200 XP each) to protect streaks against unexpected breaks.',
    '- **Scholar Leveling System:** 10 Ranks (Apprentice Scholar -> Deep Thinker -> Grand Archon).',
    '- **Badge Showcase:** Milestones for focus milestones, sound immersion, and task completion.',
    '',
    '#### F. Study Calendar & Time-Blocking Sync',
    '- **Interactive Schedule Grid:** Daily 07:00-22:00 timeline with drag/click time blocking.',
    '- **Standard .ics Export:** Full RFC 5545 compliance; imports cleanly into Google Calendar, Apple Calendar, and Outlook.',
    '- **1-Click Google Calendar Intent:** Direct URL generator to sync blocks without OAuth friction.',
    '',
    '---',
    '',
    '### 2. Information Architecture & App Navigation',
    '',
    'Root Layout (1440px Desktop / Mobile Adaptive)',
    '├── Top Bar (Wordmark: AuraFocus | 5 Nav Links | Sound & Theme Controls)',
    '├── Focus Timer View: Circular SVG ring, Zen mode, task linkage, spacebar hotkey',
    '├── Task Manager View: Priority filtering, AI decomposition modal, subtask verification',
    '├── Live AI Tutor: Feynman explainer, Socratic inquiry, Active Recall generator',
    '├── Calendar & Time-Blocking: Hourly slots, .ics export, Google Calendar sync',
    '└── Analytics & Gamification: Streak metrics, XP progress bar, Freeze store, Badges',
    '',
    '---',
    '',
    '### 3. Core User Flows',
    '',
    '#### Flow 1: Morning Planning & AI Decomposition',
    '1. User opens Tasks & AI and types new objective.',
    '2. Clicks AI Break Down. Gemini decomposes into 3 subtasks with time estimates and focus tips.',
    '3. User clicks Apply Subtasks (+20 XP). Objective is ready.',
    '',
    '#### Flow 2: Time-Blocking to Calendar & Sync',
    '1. User navigates to Calendar view.',
    '2. Selects 14:00 time slot, clicks Block Time, and links task.',
    '3. Clicks Export .ICS or Add to Google Calendar.',
    '',
    '#### Flow 3: Deep Focus Session with Ambient Soundscapes',
    '1. User navigates to Focus Timer and clicks Start Focus.',
    '2. Opens Soundscape Mixer and activates 40Hz Deep Gamma.',
    '3. Spacebar pauses/resumes as needed.',
    '4. Timer completes -> 528Hz Solfeggio Zen bell plays -> Session logged (+50 XP).',
    '',
    '---',
    '',
    '### 4. Recommended Production Tech Stack',
    '- Frontend: React 19 + TypeScript + Vite',
    '- Styling: Tailwind CSS v4 with adaptive CSS variables',
    '- Audio Engine: Native Web Audio API procedural synthesis',
    '- AI Intelligence: Gemini 3.8 Flash via @google/genai server endpoints',
    '- Calendar Sync: RFC 5545 iCalendar + Web Intents',
    '- Gamification: State Engine + Streak Freeze math',
    '',
    '---',
    '',
    '### 5. Implementation Plan & Milestones',
    '- Phase 1: Focus Engine & Procedural Audio (Completed)',
    '- Phase 2: Task Management & Gemini AI Decomposition (Completed)',
    '- Phase 3: Calendar Sync & Time-Blocking (Completed)',
    '- Phase 4: Gamification & Progression (Completed)',
    '- Phase 5: Adaptive Multi-Theme Engine & Responsive Layout (Completed)',
  ].join('\n');

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(fullMarkdownSpec);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([fullMarkdownSpec], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AuraFocus-Product-Specification.md';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold tracking-tight text-neutral-100">
              Feature Specification & Implementation Blueprint
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
            <span>Adaptive Focus OS Design</span>
            <span aria-hidden="true">·</span>
            <span>Platform: Both (Desktop & Mobile)</span>
            <span aria-hidden="true">·</span>
            <span>Production Blueprint</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Spec' : 'Copy Markdown'}</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .MD</span>
          </button>
        </div>
      </div>

      {/* Blueprint Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl text-xs overflow-x-auto no-scrollbar">
        {[
          { id: 'spec', label: 'Feature Specification', icon: <FileText className="w-3.5 h-3.5" /> },
          { id: 'nav', label: 'App Navigation & IA', icon: <Compass className="w-3.5 h-3.5" /> },
          { id: 'flows', label: 'Core User Flows', icon: <GitFork className="w-3.5 h-3.5" /> },
          { id: 'stack', label: 'Tech Stack & Architecture', icon: <Cpu className="w-3.5 h-3.5" /> },
          { id: 'plan', label: 'Implementation Plan', icon: <CheckSquare className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`px-3.5 py-1.5 font-medium rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeSection === tab.id
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Blueprint Content Sections */}
      {activeSection === 'spec' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Feature 1 */}
            <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                <Flame className="w-4 h-4" />
                <span>1. Deep-Focus Pomodoro & Flow Engine</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Circular SVG timer calibrated for 25/5 Pomodoros, 50/10 Ultradian blocks, and open Flow stopwatch. Includes keyboard hotkeys (Spacebar), Zen fullscreen focus, active task binding, and 528Hz Solfeggio chime completion synthesis.
              </p>
              <div className="text-[11px] text-neutral-400 pt-1">
                Mechanism: Single-state interval clock with audio synthesizer callback and +50 XP reward.
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
                <Headphones className="w-4 h-4" />
                <span>2. Procedural Ambient Soundscape Mixer</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Zero-bandwidth Web Audio synthesis generating 40Hz Gamma binaural beats, filtered storm rain, deep brown noise for speech masking, forest wind with chirps, and vintage lo-fi vinyl warmth.
              </p>
              <div className="text-[11px] text-neutral-400 pt-1">
                Mechanism: Multi-channel gain node graph with separate LFO modulators and stereo panning.
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>3. Tasks & AI Cognitive Decomposition</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                To-do list with priorities, estimated Pomodoro counts, and subject tagging. Includes Gemini-powered "AI Break Down" button that translates bulky topics into 3-5 bite-sized 25m steps with focus tips.
              </p>
              <div className="text-[11px] text-neutral-400 pt-1">
                Mechanism: Structured JSON schema querying Gemini 3.8 Flash via server-side endpoint.
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <Calendar className="w-4 h-4" />
                <span>4. Calendar Time-Blocking & Sync</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Interactive schedule grid with hourly slots, task-to-calendar linking, direct RFC 5545 \`.ics\` download file generation, and 1-click Google Calendar web intent synchronization.
              </p>
              <div className="text-[11px] text-neutral-400 pt-1">
                Mechanism: Real .ics calendar file generator + template URL encoding for Google Calendar.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'nav' && (
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-100">Information Architecture & Navigation Hierarchy</h2>
          <p className="text-xs text-neutral-400">
            Engineered strictly under the Universal Frontend Design Constitution with clean single-line controls and zero clutter.
          </p>

          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 font-mono text-xs text-neutral-300 space-y-2 leading-relaxed">
            <div>Root Layout (Viewport 1440px Desktop / Mobile Adaptive)</div>
            <div className="pl-4">├── Top Bar (Wordmark: AuraFocus | 5 Nav Links | Sound & Theme Controls)</div>
            <div className="pl-8">├── View 1: Focus Timer (Circular Ring, Mode Tabs, Task Binder, Zen Mode)</div>
            <div className="pl-8">├── View 2: Tasks & AI (Task Matrix, Priority Filters, AI Decomposition)</div>
            <div className="pl-8">├── View 3: Live AI Helper (Feynman Explainer, Socratic Tutor, Active Recall)</div>
            <div className="pl-8">├── View 4: Calendar (Day Schedule Grid, .ics Export, Google Cal Sync)</div>
            <div className="pl-8">└── View 5: Analytics (Streak Flame, Level XP, Freeze Store, Badges)</div>
            <div className="pl-4">└── Global Overlays: Soundscape Mixer Modal · AI Task Breakdown Modal</div>
          </div>
        </div>
      )}

      {activeSection === 'flows' && (
        <div className="space-y-4">
          {[
            {
              title: 'Flow 1: Morning Planning & AI Task Decomposition',
              steps: [
                'User opens Tasks & AI view, enters study topic "Organic Chem Reaction Mechanisms".',
                'User clicks "AI Break Down". System calls /api/ai/breakdown with target subject.',
                'Gemini generates a 1-sentence strategy + 3 Pomodoro-sized subtasks with focus tips.',
                'User reviews and clicks "Apply Subtasks to Task" (+20 XP).',
              ],
            },
            {
              title: 'Flow 2: Calendar Time Blocking & External Calendar Sync',
              steps: [
                'User navigates to Calendar view to organize afternoon study blocks.',
                'Clicks 14:00 time slot and selects the Organic Chem task from the dropdown.',
                'Clicks "Export .ICS File" to download universal iCalendar format.',
                'Or clicks 1-click Google Calendar button to launch prefilled Google Calendar event.',
              ],
            },
            {
              title: 'Flow 3: Deep Focus Immersion & Ambient Soundscape',
              steps: [
                'User launches Focus Timer and hits Spacebar or "Start Focus".',
                'Opens Ambient Soundscape Mixer and enables "40Hz Deep Gamma" + "Rain".',
                'Activates Fullscreen Zen Mode for uninterrupted visual focus.',
                'On timer completion, 528Hz Solfeggio bell rings, +50 XP is awarded, streak increments.',
              ],
            },
            {
              title: 'Flow 4: Active Recall Diagnostic Quiz',
              steps: [
                'User opens Live AI Tutor and selects "Active Recall Quiz" mode.',
                'Enters concept topic (e.g. "Stereochemistry").',
                'Gemini generates 3 diagnostic multiple choice questions with feedback.',
                'User selects answers, views conceptual explanations, and earns XP.',
              ],
            },
          ].map((flow, i) => (
            <div key={i} className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-2.5">
              <h3 className="text-xs font-bold text-neutral-100">{flow.title}</h3>
              <ol className="space-y-1.5 pl-4 list-decimal text-xs text-neutral-300">
                {flow.steps.map((st, j) => (
                  <li key={j}>{st}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      {activeSection === 'stack' && (
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-100">Recommended Production Tech Stack</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-neutral-800 rounded-xl overflow-hidden">
              <thead className="bg-neutral-950 text-neutral-400 font-mono">
                <tr>
                  <th className="p-3 border-b border-neutral-800">Domain / Tier</th>
                  <th className="p-3 border-b border-neutral-800">Technology Choice</th>
                  <th className="p-3 border-b border-neutral-800">Architectural Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80 text-neutral-200">
                <tr>
                  <td className="p-3 font-semibold text-amber-400">Frontend Core</td>
                  <td className="p-3">React 19 + TypeScript + Vite</td>
                  <td className="p-3 text-neutral-400">Strict type safety, reactive state hooks, lightning bundle size.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-amber-400">Styling & Visuals</td>
                  <td className="p-3">Tailwind CSS v4</td>
                  <td className="p-3 text-neutral-400">Adaptive CSS variables for instantaneous 5-theme switching without layout shift.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-amber-400">Audio Engine</td>
                  <td className="p-3">Native Web Audio API</td>
                  <td className="p-3 text-neutral-400">Procedural synthesis of binaural beats, noise, and rain. Zero network bandwidth.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-amber-400">AI Intelligence</td>
                  <td className="p-3">Gemini 3.8 Flash via @google/genai</td>
                  <td className="p-3 text-neutral-400">Server-side proxy routes, structured JSON schema response mode, low latency.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-amber-400">Calendar Sync</td>
                  <td className="p-3">RFC 5545 iCalendar + Web Intents</td>
                  <td className="p-3 text-neutral-400">Standard .ics generation supported by Google Calendar, Outlook, and Apple Calendar.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-amber-400">Gamification</td>
                  <td className="p-3">State Engine + Streak Freeze Math</td>
                  <td className="p-3 text-neutral-400">Dopamine reward feedback loops, streak freeze protection, XP leveling tiers.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'plan' && (
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-100">Implementation Plan & Roadmap</h2>
          <div className="space-y-3">
            {[
              { phase: 'Phase 1: Focus Engine & Procedural Audio Synthesis', status: 'Completed', details: 'Full Pomodoro circular ring timer, Zen fullscreen, and Web Audio API 40Hz binaural/rain/noise generators.' },
              { phase: 'Phase 2: Task Management & Gemini AI Cognitive Breakdown', status: 'Completed', details: 'Objective tracker with priority indicators, subtasks checklist, and automated Gemini task breakdown.' },
              { phase: 'Phase 3: Calendar Syncing & Time-Blocking Schedule', status: 'Completed', details: 'Daily timeline blocking, standard RFC 5545 .ics calendar export, and 1-click Google Calendar intent generator.' },
              { phase: 'Phase 4: Gamified Study Streaks & XP Leveling Store', status: 'Completed', details: 'Streak counter, streak freeze protection inventory, 10 scholar levels, and milestone badge achievements.' },
              { phase: 'Phase 5: Adaptive Multi-Theme Engine & Responsive Layout', status: 'Completed', details: 'Focus Dark, Clean Paper, Forest Zen, Midnight OLED, and Sunset Warmth visual styles.' },
            ].map((p, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-neutral-200">{p.phase}</div>
                  <div className="text-[11px] text-neutral-400 mt-1">{p.details}</div>
                </div>
                <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
