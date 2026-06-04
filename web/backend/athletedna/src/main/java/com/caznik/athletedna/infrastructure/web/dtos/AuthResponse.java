package com.caznik.athletedna.infrastructure.web.dtos;

import java.util.UUID;

// Returned by register and login. The token is the JWT the client presents as a
// Bearer credential; expiresInSeconds lets the BFF size its session cookie.
public record AuthResponse(
	String token,
	long expiresInSeconds,
	UUID id,
	String email,
	String username,
	// Epoch millis of the last photo upload, or null when the user has no photo.
	// Carried on login/register so the avatar shows immediately without a separate
	// /me refetch. Mirrors UserResponse.photoUpdatedAt.
	Long photoUpdatedAt
) {}
