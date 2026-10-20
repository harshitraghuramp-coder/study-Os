import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  ArrowRight,
  BookOpen,
  Target,
  Clock,
  Timer,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { LearningCategory, UserProfile } from '../types/studyos';

interface OnboardingModalProps {
  profile: UserProfile;
  onComplete: (updated: UserProfile) => void;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  profile,
  onComplete,
  onClose,
}) => {
  const [step, setStep] = useState<number>(1);
  const [category, setCategory] = useState<LearningCategory>(profile.learning_category || 'college');
  const [selectedGoals, setSelectedGoals] = useState<string[]>(profile.goals || []);
  const [weeklyHours, setWeeklyHours] = useState<number>(Math.round(profile.weekly_goal_minutes / 60) || 10);
  const [prefTime, setPrefTime] = useState<'morning' | 'afternoon' | 'evening' | 'night'>(
    profile.preferred_study_time || 'morning'
  );
  const [focusMins, setFocusMins] = useState<number>(profile.default_focus_minutes || 25);
  const [breakMins, setBreakMins] = useState<number>(profile.default_break_minutes || 5);

  const goalOptions = [
    'Improve focus & minimize distractions',
    'Prepare for upcoming exams',
    'Learn new technical skills',
    'Complete assignments on time',
    'Build a consistent daily routine',
  ];

  const toggleGoal = (g: string) => {
    setSelectedGoals((prev) =>
      prev.includes(g) ? prev.filter((item) => item !== g) : [...prev, g]
    );
  };

  const handleFinish = (generatePlan: boolean = false) => {
    const updated: UserProfile = {
      ...profile,
      learning_category: category,
      goals: selectedGoals,
      weekly_goal_minutes: weeklyHours * 60,
      preferred_study_time: prefTime,
      default_focus_minutes: focusMins,
      default_break_minutes: breakMins,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };
    onComplete(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
          <span>Step {step} of 7</span>
          <button
            onClick={() => handleFinish(false)}
            className="text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Skip for now
          </button>
        </div>

        {/* Step 1: Welcome to StudyOS */}
        {step === 1 && (
          <div className="space-y-4 text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100">
              Welcome to StudyOS
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
              Your AI-powered personal study companion designed around a single philosophy:
              <br />
              <span className="font-semibold text-neutral-100 italic mt-2 block">
                "Know what to study. Start focusing. Learn effectively. Stay consistent."
              </span>
            </p>
          </div>
        )}

        {/* Step 2: Learning Category */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-neutral-100">Select Your Learning Context</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                StudyOS adapts its AI explanations, task scheduling, and recommendations to your level.
              </p>
            </div>

            <div className="space-y-2">
              {[
                { id: 'school', title: 'School Student', desc: 'Middle or High School curriculum and exams' },
                { id: 'college', title: 'College & University', desc: 'Undergraduate, graduate degree, or university coursework' },
                { id: 'competitive_exams', title: 'Competitive Exam Aspirant', desc: 'Civil services, medical/engineering entrance, bar exam, or licensure' },
                { id: 'self_learning', title: 'Self-Directed Learner', desc: 'Software engineering, languages, professional certifications, or research' },
                { id: 'other', title: 'Other / Lifelong Scholar', desc: 'Independent study and reading habits' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setCategory(opt.id as LearningCategory)}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    category === opt.id
                      ? 'border-indigo-500 bg-indigo-500/10 text-neutral-100'
                      : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold">{opt.title}</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">{opt.desc}</div>
                  </div>
                  {category === opt.id && <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Goals */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-neutral-100">What are your primary study goals?</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Select all that apply to help calibrate your dashboard and AI coaching priorities.
              </p>
            </div>

            <div className="space-y-2">
              {goalOptions.map((g) => {
                const isChecked = selectedGoals.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => toggleGoal(g)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isChecked
                        ? 'border-indigo-500 bg-indigo-500/10 text-neutral-100'
                        : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <span className="text-xs font-semibold">{g}</span>
                    <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${isChecked ? 'bg-indigo-600 text-white' : 'border border-neutral-700'}`}>
                      {isChecked ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Subjects overview */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-neutral-100">Your Initial Subjects</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                We've pre-configured your library workspace. You can edit, rename, or add more courses in the Library tab anytime.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-950/60 space-y-2">
              <div className="flex items-center gap-2 text-xs text-neutral-200">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span>Organic Chemistry II</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-200">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>Linear Algebra & Calculus</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-200">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span>Data Structures & Algorithms</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Realistic Weekly Target & Preferred Times */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-neutral-100">Weekly Target & Peak Focus Window</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Consistency beats intensity. Set a realistic target you can reliably sustain.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-neutral-300 font-medium block mb-1">
                  Weekly Study Target (Hours)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="4"
                    max="40"
                    step="1"
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(Number(e.target.value))}
                    className="flex-1 accent-indigo-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-sm font-mono font-bold text-indigo-400 tabular-nums w-12 text-right">
                    {weeklyHours}h
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-300 font-medium block mb-1.5">
                  When is your peak mental acuity?
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'morning', label: 'Morning (07:00 - 12:00)' },
                    { id: 'afternoon', label: 'Afternoon (12:00 - 17:00)' },
                    { id: 'evening', label: 'Evening (17:00 - 21:00)' },
                    { id: 'night', label: 'Night (21:00 - 01:00)' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setPrefTime(t.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-colors ${
                        prefTime === t.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-neutral-100 font-semibold'
                          : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Focus & Break Durations */}
        {step === 6 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-neutral-100">Preferred Focus Duration</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Choose your default Pomodoro interval. You can adjust this on the fly during any session.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              {[
                { focus: 25, brk: 5, label: 'Classic 25/5' },
                { focus: 45, brk: 10, label: 'Standard 45/10' },
                { focus: 50, brk: 10, label: 'Deep 50/10' },
              ].map((p) => {
                const isSelected = focusMins === p.focus;
                return (
                  <button
                    key={p.focus}
                    onClick={() => {
                      setFocusMins(p.focus);
                      setBreakMins(p.brk);
                    }}
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10 text-neutral-100 font-bold'
                        : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-mono text-sm">{p.focus}m</div>
                    <div className="text-[10px] text-neutral-400 mt-1 font-normal">{p.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 7: Ready */}
        {step === 7 && (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-neutral-100">Setup Complete</h2>
            <p className="text-xs text-neutral-300 max-w-sm mx-auto leading-relaxed">
              Your personal study workspace is calibrated and ready. Know what to study, start focusing, and build a lasting habit.
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 7 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => handleFinish(false)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all"
            >
              Enter StudyOS
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
