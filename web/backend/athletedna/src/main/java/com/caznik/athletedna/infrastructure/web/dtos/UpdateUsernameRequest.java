package com.caznik.athletedna.infrastructure.web.dtos;

// Body of PATCH /api/auth/me — the new display handle for the current user.
public record UpdateUsernameRequest(String username) {}
