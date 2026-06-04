package com.caznik.athletedna.infrastructure.web.dtos;

// Body of PUT /api/auth/me/password — verify currentPassword, then set newPassword.
public record ChangePasswordRequest(String currentPassword, String newPassword) {}
