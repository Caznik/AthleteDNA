package com.caznik.athletedna.infrastructure.web.dtos;

// Body of PUT /api/auth/me/theme — the new theme for the current user
// ("light" | "dark" | "system"). Validated server-side in UpdateThemeService.
public record UpdateThemeRequest(String theme) {}
