# StudyOS Setup & Deployment Guide

## 1. Prerequisites

- **Node.js**: v20+ recommended
- **NPM** or **PNPM**
- **Supabase / PostgreSQL**: Optional for remote database hosting (in-app persistence is built-in).
- **Gemini API Key**: Set in environment variable `GEMINI_API_KEY`.

## 2. Environment Variables

Create `.env` based on `.env.example`:

```bash
# Gemini AI API Key (Injected automatically in AI Studio)
GEMINI_API_KEY="your-gemini-api-key"

# App URL
APP_URL="http://localhost:3000"

# Optional Supabase Configuration (for remote sync)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
```

## 3. Development Workflow

```bash
# Install dependencies
npm install

# Start full-stack development server (Express API + Vite SPA)
npm run dev
```

Server will run at `http://localhost:3000`.

## 4. Production Deployment

```bash
# Build client bundle
npm run build

# Start production server
npm run start
```
