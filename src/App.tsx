import React, { useState, useEffect } from 'react';
import { SidebarNav } from './components/SidebarNav';
import { HomeDashboard } from './components/HomeDashboard';
import { PlannerView } from './components/PlannerView';
import { FocusTimerView } from './components/FocusTimerView';
import { LibraryView } from './components/LibraryView';
import { AICoachView } from './components/AICoachView';
import { ProgressView } from './components/ProgressView';
import { RevisionView } from './components/RevisionView';
import { OnboardingModal } from './components/OnboardingModal';
import { ProfileModal } from './components/ProfileModal';
import { SoundscapeMixer } from './components/SoundscapeMixer';
import { RightAIChatbotWidget } from './components/RightAIChatbotWidget';
import {
  Flashcard,
  Resource,
  StudySession,
  Subject,
  Task,
  ThemePreference,
  Topic,
  UserProfile,
} from './types/studyos';
import { storage } from './db/storage';
import { SoundTrackState } from './types';

const INITIAL_SOUND_TRACKS: SoundTrackState[] = [
  {
    id: 'binaural',
    name: '40Hz Gamma Focus',
    description: 'Binaural frequency difference calibrated for deep cognition',
    category: 'neuro',
    volume: 0.6,
    isPlaying: false,
  },
  {
    id: 'rain',
    name: 'Rain & Storm Swell',
    description: 'Filtered rain synthesis with slow rhythmic atmospheric swells',
    category: 'nature',
    volume: 0.5,
    isPlaying: false,
  },
  {
    id: 'brownnoise',
    name: 'Deep Brown Noise',
    description: '1/f² power-curve noise that masks outside conversational distractions',
    category: 'noise',
    volume: 0.45,
    isPlaying: false,
  },
  {
    id: 'forest',
    name: 'Forest Breeze & Birds',
    description: 'Gentle wind through pines with procedural bird calls',
    category: 'nature',
    volume: 0.5,
    isPlaying: false,
  },
  {
    id: 'lofi',
    name: 'Lo-Fi Vinyl Warmth',
    description: 'Analog record crackle with soft harmonic vinyl pops',
    category: 'ambient',
    volume: 0.4,
    isPlaying: false,
  },
  {
    id: 'pinknoise',
    name: 'Gentle Pink Noise',
    description: 'Balanced acoustic masking for libraries and dorms',
    category: 'noise',
    volume: 0.35,
    isPlaying: false,
  },
];

export default function App() {
  // Navigation State: 'home' | 'planner' | 'focus' | 'library' | 'coach' | 'revision' | 'progress'
  const [activeNav, setActiveNav] = useState<string>('home');

  // Core Persistent State
  const [profile, setProfile] = useState<UserProfile>(() => storage.getProfile());
  const [subjects, setSubjects] = useState<Subject[]>(() => storage.getSubjects());
  const [topics, setTopics] = useState<Topic[]>(() => storage.getTopics());
  const [tasks, setTasks] = useState<Task[]>(() => storage.getTasks());
  const [sessions, setSessions] = useState<StudySession[]>(() => storage.getSessions());
  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => storage.getFlashcards());
  const [resources, setResources] = useState<Resource[]>(() => storage.getResources());

  // Focus Timer active task
  const [activeTaskId, setActiveTaskId] = useState<string | null>(tasks[0]?.id || null);

  // Modals & Panels
  const [showOnboarding, setShowOnboarding] = useState<boolean>(!profile.onboarding_completed);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [isSoundMixerOpen, setIsSoundMixerOpen] = useState<boolean>(false);
  const [isAIChatWidgetOpen, setIsAIChatWidgetOpen] = useState<boolean>(false);

  // Soundscape Audio Engine state
  const [soundTracks, setSoundTracks] = useState<SoundTrackState[]>(INITIAL_SOUND_TRACKS);
  const [masterVolume, setMasterVolume] = useState<number>(0.8);

  // Theme state: light | dark | system
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    profile.theme_preference || 'system'
  );
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  // Handle system vs explicit theme detection
  useEffect(() => {
    const updateResolvedTheme = () => {
      if (themePreference === 'system') {
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(isDark ? 'dark' : 'light');
      } else {
        setResolvedTheme(themePreference);
      }
    };

    updateResolvedTheme();

    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => {
        if (themePreference === 'system') {
          updateResolvedTheme();
        }
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [themePreference]);

  // Persist data on mutations
  useEffect(() => {
    storage.saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    storage.saveSubjects(subjects);
  }, [subjects]);

  useEffect(() => {
    storage.saveTopics(topics);
  }, [topics]);

  useEffect(() => {
    storage.saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    storage.saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    storage.saveFlashcards(flashcards);
  }, [flashcards]);

  useEffect(() => {
    storage.saveResources(resources);
  }, [resources]);

  // Handle Focus session logging
  const handleSaveSession = (newSession: StudySession) => {
    setSessions((prev) => [newSession, ...prev]);

    // If session was linked to a task, update task status or subtasks
    if (newSession.task_id) {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === newSession.task_id) {
            return {
              ...t,
              status: t.status === 'pending' ? 'in_progress' : t.status,
            };
          }
          return t;
        })
      );
    }
  };

  const handleStartFocus = (taskId?: string) => {
    if (taskId) {
      setActiveTaskId(taskId);
    }
    setActiveNav('focus');
  };

  const handleDataReset = () => {
    storage.resetToDefaults();
    setProfile(storage.getProfile());
    setSubjects(storage.getSubjects());
    setTopics(storage.getTopics());
    setTasks(storage.getTasks());
    setSessions(storage.getSessions());
    setFlashcards(storage.getFlashcards());
    setResources(storage.getResources());
  };

  const handleOnboardingComplete = (updated: UserProfile) => {
    setProfile(updated);
    setThemePreference(updated.theme_preference);
    setShowOnboarding(false);
  };

  const activeSoundsCount = soundTracks.filter((t) => t.isPlaying).length;

  return (
    <div className={`theme-${resolvedTheme} min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row font-sans transition-colors duration-200 antialiased selection:bg-indigo-500/20 selection:text-indigo-200`}>
      {/* Responsive Navigation Sidebar & Bottom Bar */}
      <SidebarNav
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        profile={profile}
        themePreference={themePreference}
        setThemePreference={(pref) => {
          setThemePreference(pref);
          setProfile((p) => ({ ...p, theme_preference: pref }));
        }}
        onOpenSoundMixer={() => setIsSoundMixerOpen(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        activeSoundsCount={activeSoundsCount}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pb-20 md:pb-8 overflow-x-hidden">
        {activeNav === 'home' && (
          <HomeDashboard
            profile={profile}
            tasks={tasks}
            setTasks={setTasks}
            subjects={subjects}
            sessions={sessions}
            onNavigate={setActiveNav}
            onStartFocus={handleStartFocus}
          />
        )}

        {activeNav === 'planner' && (
          <PlannerView
            tasks={tasks}
            setTasks={setTasks}
            subjects={subjects}
            onStartFocus={handleStartFocus}
          />
        )}

        {activeNav === 'focus' && (
          <FocusTimerView
            tasks={tasks}
            subjects={subjects}
            activeTaskId={activeTaskId}
            setActiveTaskId={setActiveTaskId}
            onSaveSession={handleSaveSession}
            onOpenSoundMixer={() => setIsSoundMixerOpen(true)}
            activeSoundsCount={activeSoundsCount}
          />
        )}

        {activeNav === 'library' && (
          <LibraryView
            subjects={subjects}
            setSubjects={setSubjects}
            topics={topics}
            setTopics={setTopics}
            resources={resources}
            flashcards={flashcards}
            onNavigate={setActiveNav}
          />
        )}

        {activeNav === 'coach' && (
          <AICoachView
            profile={profile}
            tasks={tasks}
            setTasks={setTasks}
            subjects={subjects}
            onNavigate={setActiveNav}
          />
        )}

        {activeNav === 'revision' && (
          <RevisionView
            flashcards={flashcards}
            setFlashcards={setFlashcards}
            subjects={subjects}
            topics={topics}
          />
        )}

        {activeNav === 'progress' && (
          <ProgressView
            profile={profile}
            sessions={sessions}
            tasks={tasks}
            subjects={subjects}
            topics={topics}
          />
        )}
      </main>

      {/* Onboarding Wizard Modal */}
      {showOnboarding && (
        <OnboardingModal
          profile={profile}
          onComplete={handleOnboardingComplete}
          onClose={() => setShowOnboarding(false)}
        />
      )}

      {/* Profile & Settings Modal */}
      <ProfileModal
        profile={profile}
        setProfile={setProfile}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onDataReset={handleDataReset}
      />

      {/* Ambient Soundscapes Mixer Drawer/Modal */}
      <SoundscapeMixer
        tracks={soundTracks}
        setTracks={setSoundTracks}
        masterVolume={masterVolume}
        setMasterVolume={setMasterVolume}
        isOpen={isSoundMixerOpen}
        onClose={() => setIsSoundMixerOpen(false)}
      />

      {/* Right-Side AI Chatbot Shortcut & Flyout Panel */}
      <RightAIChatbotWidget
        profile={profile}
        subjects={subjects}
        tasks={tasks}
        activeTaskId={activeTaskId}
        onNavigateToFullAI={() => setActiveNav('coach')}
        isOpen={isAIChatWidgetOpen}
        setIsOpen={setIsAIChatWidgetOpen}
      />
    </div>
  );
}
