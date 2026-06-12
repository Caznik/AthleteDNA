package com.caznik.athletedna.infrastructure.web.dtos;

// Body of PUT /api/auth/me/language — the new language for the current user
// ("en" | "es"). Validated server-side in UpdateLanguageService.
public record UpdateLanguageRequest(String language) {}
