# COROS Metrics — Feasibility Against AthleteDNA Data

_Analysis date: 2026-06-12_

This document records which metrics from the COROS Training Center / EvoLab
dashboards (reference screenshots in `imagenes/`) we can reproduce in AthleteDNA,
given the data we actually ingest from Strava.

## What we store per activity (today)

From the Strava activity summary we persist only **5 fields**:

| Field | Source |
|---|---|
| `startDate` | activity start timestamp |
| `type` | Run / Ride / … |
| `distance` | meters |
| `durationSeconds` | moving time |
| `avgHeartRate` | average HR (nullable) |

The insight engine already derives from these: **PMC** (CTL/ATL/TSB), **weekly
load**, **trends** (CTL ramp, TSB direction), and **personal records**.

We do **not** ingest: max HR, elevation gain, cadence, power, per-second GPS/HR
**streams**, resting HR, or HRV. Those gaps are what gate most of the richer COROS
tiles. Note that some of these (max HR, elevation gain, cadence, suffer score) are
already present in the Strava summary payload we fetch — we simply don't persist
them — while streams, resting HR, and HRV require additional data sources.

## Legend

- 🟢 **showable now** from the 5 fields
- 🟡 **showable but approximate** — needs a modeling assumption, not new data
- 🔴 **needs data we don't ingest**

## Feasibility table

| COROS metric | Verdict | Notes |
|---|---|---|
| Training Status (Mantenimiento + Impact / Base / Trend) | 🟢 | Already have it — CTL = base, ATL = impact, TSB → trend. Needs a label band + relabel. |
| Recent activities (date / volume / intensity / load) | 🟢 | Have date, distance, avgHR, load. |
| Weekly activity (distance per day / week) | 🟢 | Already computed. |
| Training summary 4-wk (total dist, time, avg HR, load, # sessions) | 🟢 | Trivial aggregation. |
| Weekly training load (bar / range) | 🟢 | Already on the page. |
| Activity data 12-wk (load over time) | 🟢 | Already have (PMC). |
| Personal records — distance / duration / pace | 🟢 | Already computed. |
| Distance-zone distribution (0–5, 5–10, 10–15 km…) | 🟢 | Needs only `distance`. Cheap, representative. |
| Intensity distribution (Easy / Med / Hard) | 🟡 | Bucket each session by `avgHR` band (no streams → per-session, not time-in-zone). |
| Race predictor (5k / 10k / HM / Marathon) | 🟡 | Riegel / VDOT extrapolation from best efforts. Honest as an estimate. |
| VO₂max estimate | 🟡 | VDOT from best pace + HR. Single number, clearly "estimated". |
| HR-zone distribution | 🟡 | Only by average HR per session; needs an estimated max / threshold HR. Not true time-in-zone. |
| Pace-zone distribution | 🟡 | By average pace per session + estimated threshold pace. |
| Running fitness score (80.9 gauge) / sub-levels | 🟡 | Derivable as a VDOT-style score, but COROS's exact model is proprietary — our own approximation. |
| 7-day efficiency (pace ÷ HR) | 🟡 | Feasible as avg-pace-per-avg-HR trend. |
| Most Elevation Gain PR | 🔴 → easy | Strava summary has `total_elevation_gain`; we just don't store it. One field to add. |
| Recovery % | 🔴 | Needs HRV / resting HR. |
| Nocturnal HRV | 🔴 | Needs HRV. |
| Resting HR trend | 🔴 | Strava doesn't expose it. |
| True time-in-zone HR / pace distributions | 🔴 | Needs per-second streams (separate, heavier Strava API). |

## Count

Of ~20 distinct COROS tiles:

- **8 showable now (🟢)**
- **~6 showable as honest estimates (🟡)**
- **~6 need data we don't have (🔴)** — though *Elevation-Gain PR* is a one-field
  ingest away.

## Current scope decision

We are implementing **green-only (🟢)** tiles — no new data sources, fully
truthful from the 5 fields we already store. The 🟡 / 🔴 rows are recorded here as
a backlog for when we add estimate-modeling or new ingest fields.
