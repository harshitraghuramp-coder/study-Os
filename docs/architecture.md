# StudyOS Architecture & System Design Document

## 1. System Overview

**StudyOS** is an AI-powered personal study companion designed to solve the cognitive friction between planning, focusing, understanding, and revising.

**Core Philosophy:**
> "Know what to study. Start focusing. Learn effectively. Stay consistent."

## 2. Layered Architecture

```
┌────────────────────────────────────────────────────────┐
│               PRESENTATION LAYER                       │
│  - React 19 + TypeScript (Web SPA / Mobile Responsive) │
│  - Tailwind CSS v4 Adaptive Design Tokens (Dark/Light) │
│  - Web Audio API Procedural Soundscapes Engine         │
└─────────────────────────┬──────────────────────────────┘
                          │ (REST API & Local Persistence)
┌─────────────────────────▼──────────────────────────────┐
│                 APPLICATION / API TIER                 │
│  - Express.js Backend Server                           │
│  - Gemini 3.8 Flash SDK Integration (@google/genai)    │
│  - RFC 5545 iCalendar (.ics) Generator                 │
│  - SuperMemo SM-2 Spaced Repetition Engine             │
└─────────────────────────┬──────────────────────────────┘
                          │ (SQL Migrations & RLS Policies)
┌─────────────────────────▼──────────────────────────────┐
│                    DATA STORAGE TIER                   │
│  - PostgreSQL / Supabase Schema                        │
│  - Enforced Row-Level Security (RLS) on all tables     │
│  - In-Browser Offline Recovery Engine (IndexedDB/Local)│
└────────────────────────────────────────────────────────┘
```

## 3. Core Modules

1. **Focus Engine**:
   - Timestamp-based timer: stores start, paused, and active intervals to recover state across browser refreshes and tab backgrounding without drifting.
   - Procedural Web Audio API soundscape synthesis (40Hz Gamma binaural beats, storm rain, brown noise, forest wind, vinyl warmth).
   - Distraction scratchpad for capturing intrusive thoughts without breaking flow.

2. **Smart Planner & Calendar**:
   - Constraint-based scheduling respecting daily study capacity.
   - RFC 5545 universal `.ics` download for Google Calendar, Apple Calendar, and Outlook.
   - Non-judgmental missed task recovery.

3. **AI Coach & Intelligence Suite**:
   - Socratic Inquiry and Feynman Explainer adapted to learning levels (School, College, Competitive Exams, Self-Learning).
   - Structured study plan draft generator with explicit user confirmation before applying.
   - Diagnostic active recall quiz generator.

4. **Spaced Repetition & Library**:
   - SuperMemo SM-2 memory retention algorithm for flashcards.
   - Multi-tier organization: Courses -> Subjects -> Topics -> Notes.
