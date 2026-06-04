package com.caznik.athletedna.infrastructure.web.dtos;

import java.util.UUID;

// Returned by GET /api/auth/me — the identity behind a valid token.
// photoUpdatedAt is epoch millis of the last photo upload, or null when the user
// has no photo. The client uses it both to decide whether to render an avatar
// image and as a ?v= cache-buster on the photo URL.
public record UserResponse(UUID id, String email, String username, Long photoUpdatedAt) {}
