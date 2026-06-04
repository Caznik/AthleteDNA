---
wi: WI-frontend-mvp / 20260601-frontend-mvp-dashboard
phase: propose
status: confirmed
date: 2026-06-01
triggered: yes
---

## Approach A — RSC-first (Server Components + revalidate)
**Summary:** Server Components read data via a server-side `fetch` wrapper to Spring; mutations (connect/sync) go through Route Handlers / Server Actions; `revalidatePath`/`router.refresh()` refreshes after sync. Table sorting/filtering client-side on loaded data; weekly load aggregation computed on the frontend.
**Pros:**
- Most idiomatic App Router; minimal client JS
- Data fetching stays server-side (backend URL never exposed to browser)
- Fewest dependencies
**Cons:**
- Less "live" feel; interactive refresh is more manual
- Optimistic updates awkward
**Effort:** low

## Approach B — Client SPA with TanStack Query
**Summary:** Route Handlers (BFF) expose JSON endpoints proxying Spring; client components use TanStack (React) Query for fetching, caching, and refetch-after-sync. Dashboard and activities table are client-rendered. Weekly load aggregation computed on the frontend from the activities query data.
**Pros:**
- Familiar SPA patterns; straightforward refetch / cache invalidation after sync
- Clean loading/error/empty states via query status
- Easy to extend interactivity (filters, optimistic updates) later
**Cons:**
- More client JS; does not leverage RSC for data
- Extra dependency (TanStack Query)
- Initial render needs an explicit loading state
**Effort:** medium

## Approach C — Hybrid (RSC initial render + Query for interactions)
**Summary:** Server Components render first paint; TanStack Query hydrates and owns interactive refresh and filters.
**Pros:**
- Fast first paint + rich interactivity
**Cons:**
- Two data-flow mental models; most moving parts; overkill for MVP
**Effort:** medium-high

## Selected Approach
**Choice:** Approach B — Client SPA with TanStack Query
**Rationale:** User prefers familiar SPA patterns and the cleaner refetch/cache-invalidation story for the sync→refresh flow, and wants room to grow interactivity (filters, optimistic updates) without restructuring. BFF Route Handlers still keep the backend URL server-side; the browser only talks to Next.js JSON routes.

## Confirmation
**Confirmed by user:** yes
**Notes:** Chosen over the agent's lean toward Approach A (RSC-first). Trade-off accepted: more client JS in exchange for SPA ergonomics.

## Cancellation
_n/a_
