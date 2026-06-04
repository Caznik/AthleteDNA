package com.caznik.athletedna.infrastructure.auth;

import java.io.IOException;
import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.caznik.athletedna.endpoints.Endpoints;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

// Resolves the caller from a "Authorization: Bearer <jwt>" header and stashes the
// user id as a request attribute for JwtCurrentUserProvider to read.
//
// The filter is deliberately lenient: a missing or invalid token is not rejected
// here, so public endpoints (register, login, the OAuth callback, swagger) keep
// working. Endpoints that require a user obtain it via CurrentUserProvider, which
// throws UnauthenticatedException when no valid id was resolved.
@Component
@Profile("jpa")
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	public static final String USER_ID_ATTRIBUTE = "athletedna.authenticatedUserId";

	private static final String BEARER_PREFIX = "Bearer ";

	private final JwtTokenService jwtTokenService;

	public JwtAuthenticationFilter(JwtTokenService jwtTokenService) {
		this.jwtTokenService = jwtTokenService;
	}

	// The OAuth callback is reached via Strava's browser redirect (no JWT). It
	// identifies the user from the signed OAuth state instead, so skip it.
	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		return request.getServletPath().startsWith("/" + Endpoints.STRAVA_ENDPOINT + "/callback");
	}

	@Override
	protected void doFilterInternal(
		HttpServletRequest request,
		HttpServletResponse response,
		FilterChain filterChain
	) throws ServletException, IOException {
		String header = request.getHeader("Authorization");
		if (header != null && header.startsWith(BEARER_PREFIX)) {
			try {
				UUID userId = jwtTokenService.parseUserId(header.substring(BEARER_PREFIX.length()));
				request.setAttribute(USER_ID_ATTRIBUTE, userId);
			} catch (JwtException | IllegalArgumentException ignored) {
				// Invalid/expired token → leave the request unauthenticated.
			}
		}
		filterChain.doFilter(request, response);
	}
}
