---
wi: WI-strava-oauth/20260601-strava-oauth-integration
phase: propose
status: confirmed
date: 2026-06-01
triggered: yes
---

## Approach A — Custom OAuth with `RestClient` + JPA adapter
**Summary:** Build the OAuth 2.0 authorization-code flow ourselves: a controller generates the auth URL, a callback controller exchanges the code for tokens via `RestClient`, and a `StravaClient` outbound port whose adapter handles token refresh on expiry. Tokens are persisted directly in a `StravaAccount` JPA entity.

**Pros:**
- Clean fit with the existing hexagonal architecture (port + adapter)
- No new framework dependencies — just `RestClient` (already in Spring Boot 4)
- Full control over token lifecycle, refresh policy, retry behaviour
- No Spring Security to configure or fight with
- Simple to test — mock the `RestClient` or the `StravaClient` port

**Cons:**
- More code to write (auth URL builder, state validation, token-exchange logic)
- We own the CSRF `state` validation logic
- Eventually duplicates concerns Spring Security would otherwise handle for free

**Effort:** medium

## Approach B — Spring Security OAuth2 Client
**Summary:** Add `spring-boot-starter-oauth2-client`, register Strava as a custom OAuth2 provider in `application.properties`, and let Spring Security handle the auth URL, callback, state, and token refresh via `OAuth2AuthorizedClientManager`. Tokens persisted via a custom `OAuth2AuthorizedClientService` backed by JPA.

**Pros:**
- Battle-tested OAuth flow — CSRF, state, token refresh handled out of the box
- Less hand-written security-sensitive code
- Standard pattern that future SSO work (Google) can reuse
- Automatic token refresh integrated with each outbound call

**Cons:**
- Introduces Spring Security into a codebase that currently has none
- The "link external account to a stub user" pattern is awkward — Spring Security OAuth2 Client is built for login flows
- More opaque magic — harder to introspect when things go wrong
- Pulls infrastructure concerns into application config, blurring the hexagonal boundary

**Effort:** medium-high

## Selected Approach
**Choice:** Approach A
**Rationale:** The codebase has no Spring Security yet, and the "stub user simulating login" pattern is much simpler when we own the flow. Approach A keeps the hexagonal boundary clean (port + adapter), avoids dragging in a filter chain just to do one OAuth dance, and is straightforward to unit-test. Spring Security becomes more attractive *after* real user auth + Google SSO land, when the framework is already in play.

## Confirmation
**Confirmed by user:** yes
**Notes:** User selected Approach A explicitly.

## Cancellation
_n/a_
