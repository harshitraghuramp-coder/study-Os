import React, { useState } from 'react';
import { User, Download, RefreshCw, X, Shield, Check } from 'lucide-react';
import { LearningCategory, UserProfile } from '../types/studyos';
import { storage } from '../db/storage';

interface ProfileModalProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  isOpen: boolean;
  onClose: () => void;
  onDataReset: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  setProfile,
  isOpen,
  onClose,
  onDataReset,
}) => {
  if (!isOpen) return null;

  const [displayName, setDisplayName] = useState(profile.display_name);
  const [learningCat, setLearningCat] = useState<LearningCategory>(profile.learning_category);
  const [weeklyGoalHrs, setWeeklyGoalHrs] = useState(Math.round(profile.weekly_goal_minutes / 60));
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      display_name: displayName.trim() || profile.display_name,
      learning_category: learningCat,
      weekly_goal_minutes: weeklyGoalHrs * 60,
      updated_at: new Date().toISOString(),
    };
    setProfile(updated);
    storage.saveProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleExportData = () => {
    const backup = {
      profile,
      subjects: storage.getSubjects(),
      topics: storage.getTopics(),
      tasks: storage.getTasks(),
      sessions: storage.getSessions(),
      flashcards: storage.getFlashcards(),
      resources: storage.getResources(),
      exportedAt: new Date().toISOString(),
      schemaVersion: '1.0.0',
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyos-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-neutral-100">Profile & Preferences</h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs text-neutral-300 font-medium block mb-1">Display Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-300 font-medium block mb-1">Email</label>
            <input
              type="email"
              disabled
              value={profile.email}
              className="w-full bg-neutral-950/60 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-300 font-medium block mb-1">Learning Category</label>
            <select
              value={learningCat}
              onChange={(e) => setLearningCat(e.target.value as LearningCategory)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="school">School Student</option>
              <option value="college">College & University</option>
              <option value="competitive_exams">Competitive Exams</option>
              <option value="self_learning">Self-Directed Learning</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-neutral-300 font-medium block mb-1">
              Weekly Target (Hours)
            </label>
            <input
              type="number"
              min="2"
              max="60"
              value={weeklyGoalHrs}
              onChange={(e) => setWeeklyGoalHrs(Number(e.target.value))}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-neutral-800">
            <button
              type="button"
              onClick={handleExportData}
              className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-neutral-400" />
              <span>Export JSON</span>
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{savedSuccess ? 'Saved' : 'Save Changes'}</span>
            </button>
          </div>
        </form>

        {/* Danger zone / Reset */}
        <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <span>Reset sample data:</span>
          <button
            onClick={() => {
              if (confirm('Reset to default curriculum and sample state?')) {
                onDataReset();
                onClose();
              }
            }}
            className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Database</span>
          </button>
        </div>
      </div>
    </div>
  );
};
