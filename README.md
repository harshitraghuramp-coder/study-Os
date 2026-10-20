# StudyOS — AI-Powered Personal Study Management Platform

> *"Know what to study. Start focusing. Learn effectively. Stay consistent."*

StudyOS is a production-grade personal study companion engineered for school students, college students, competitive-exam aspirants, and independent learners.

---

## Features

### 1. Home Dashboard
- Personalized greeting and current date
- Today's planned study time and completion ratio
- Weekly goal progress bar
- Upcoming deadlines countdown
- Schedule timeline
- Continue-last-session quick resume banner
- Contextual AI study coach observations

### 2. Smart Study Planner
- Day, Week, Month, and Task list views
- Hourly time-blocking grid (07:00 to 22:00)
- Search and multi-criteria filters (subject, priority, deadline)
- Missed Task Recovery flow (reschedule without guilt)
- Universal RFC 5545 iCalendar (`.ics`) export
- 1-Click Google Calendar web intent synchronization

### 3. Recoverable Focus Timer
- Timestamp-based timer: recovers elapsed time after browser refresh or tab backgrounding
- Active focused intervals tracked separately from paused time
- Target task and session objective association
- 25/5 Pomodoro, 50/10 Ultradian, and custom duration settings
- Distraction Scratchpad notes
- Procedural Web Audio API ambient soundscape mixer
- Session completion summary and reflection logging

### 4. Library & Syllabus Organization
- Courses, Subjects, Chapters/Units, and Topics
- Topic status management (Not started, In progress, Needs revision, Completed)
- Notes & cheatsheet viewer

### 5. AI Coach Suite (Gemini 3.8 Flash)
- **Tutor & Q&A**: Feynman Explainer, Socratic inquiry, and weak-topic analysis adapted to learning category
- **Study Plan Generator**: Generates realistic balanced draft schedules based on task deadlines and capacity; review before applying to the planner
- **Summarizer**: Transforms raw notes into key concepts, revision checklists, and flashcards
- **Active Recall Quiz**: Generates diagnostic 3-question quizzes with instant scoring and explanations
- **Document Q&A**: Answers questions grounded strictly in supplied study notes

### 6. Spaced Repetition (SuperMemo SM-2)
- Due-today revision queue
- Interactive flashcard flip review
- Ratings: Again, Hard, Good, Easy
- Algorithmic calculation of ease factors and next review dates

### 7. Real Analytics & Progress
- All metrics calculated from actual stored sessions (never fabricated)
- 7-day study cadence bar chart
- Subject-level time allocation percentage
- Syllabus completion rate

### 8. Adaptive Design & Themes
- Light mode, Dark mode, and System default preference
- Mobile bottom navigation and full-screen Zen focus mode

---

## Database & Migrations
The PostgreSQL schema with Row-Level Security (RLS) is located at `supabase/migrations/20261020000000_studyos_core_schema.sql`.
