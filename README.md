# AthleteDNA 🧬🏃

**Understand your training. Train smarter.**

AthleteDNA is a personal training companion for runners, cyclists, and endurance
athletes. Connect your Strava account or upload files straight from your watch, and
AthleteDNA turns all those workouts into a clear picture of your fitness — so you can
see whether you're building form, carrying too much fatigue, or peaking at just the
right time.

No spreadsheets. No guesswork. Just your training, explained.

---

## What it does

### 📊 A dashboard of your training at a glance
See your recent activity summarized in one place — how much you've done, what kind of
workouts (runs, rides, swims), and how it all adds up.

### 📈 Know your fitness, fatigue, and form
The **Insights** page shows the same kind of chart the pros use: how fit you are, how
tired you are, and whether you're fresh enough to perform. Spot when you're overdoing
it — or when you're ready for a big effort.

### 🏆 Track your progress and personal records
Watch your weekly training load and trends over time, and keep your personal bests for
each sport in one place.

### ⌚ Bring your data in, your way
- **Connect Strava** — link your account and pull in your activities with one click.
- **Upload from your watch** — drop in `.fit` files straight from your device. These
  add richer detail (laps, extra metrics) and even fill in the gaps on activities you
  already imported from Strava.

### 🌍 Made comfortable for you
- Light, dark, or automatic theme.
- Available in **English** and **Spanish**.
- Your own profile with a photo, and your data kept private to your account.

---

## Who it's for

Anyone who trains and wants to understand the *why* behind how they feel — without
needing a coach or a degree in sports science. If you run, ride, or swim and track it,
AthleteDNA helps you make sense of it.

---

## Getting started

AthleteDNA is currently a self-hosted app you run on your own computer. The full setup
(database, services, and connecting your Strava account) is documented for developers
in [`web/README.md`](web/README.md), with step-by-step instructions in
[`web/frontend/README.md`](web/frontend/README.md).

Once it's running, open it in your browser, create an account, connect Strava (or
upload a `.fit` file), and your insights appear automatically.

---

## Under the hood

For the curious, AthleteDNA is built from three parts working together:

- a **web app** you use in the browser,
- a **backend** that securely stores your activities and talks to Strava, and
- a small **analytics engine** that crunches the fitness/fatigue/form numbers.

Full technical details — architecture, API, setup, and configuration — live in
[`web/README.md`](web/README.md).
