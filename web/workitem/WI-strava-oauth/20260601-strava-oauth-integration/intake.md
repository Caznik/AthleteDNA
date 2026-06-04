---
wi: WI-strava-oauth
phase: intake
status: confirmed
date: 2026-06-01
---

## Request
Connect to Strava and obtain user activities via OAuth. This is the first version of the integration — authenticate users through Strava's OAuth 2.0 flow and fetch their activities to feed into the existing activity sync pipeline.

## Classification
- type: new feature
- scope: infrastructure + auth + API layer

## Routing Decision
- flow: full workflow
- rationale: New OAuth 2.0 integration (authorization code flow, token exchange, token refresh), new Strava API client adapter, user token persistence, and wiring into the existing hexagonal architecture.
- phases: analyze → plan → implement → review

## Confirmation
- confirmed by user: yes

## Cancellation
_none_
