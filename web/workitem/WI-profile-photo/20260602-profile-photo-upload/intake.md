---
wi: WI-profile-photo
sub_feature: 20260602-profile-photo-upload
phase: intake
status: confirmed
date: 2026-06-02
---

# Intake — Profile Photo Upload

## Request
Allow user to upload a photo to their profile. Use the uploaded photo instead of the
avatar if provided; if not provided, fall back to the avatar.

## Classification
- Type: new feature
- Scope: user-facing — profile photo upload + display precedence (uploaded photo over avatar, avatar as fallback)

## Routing Decision
- Flow: full workflow
- Rationale: New user-facing feature affecting behavior. Open questions around storage,
  formats, size limits, and display locations warrant the analyze phase before coding.
- Phases: analyze → propose → plan → implement → review → document

## Confirmation
- Confirmed by user: yes
