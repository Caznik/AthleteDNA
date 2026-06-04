package com.caznik.athletedna.infrastructure.auth;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.caznik.athletedna.config.JwtProperties;
import com.caznik.athletedna.domain.model.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

// Issues and verifies the stateless HS256 session token.
@Service
@Profile("jpa")
public class JwtTokenService {

	private final SecretKey key;
	private final Duration expiration;

	public JwtTokenService(JwtProperties properties) {
		this.key = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
		this.expiration = Duration.ofMinutes(properties.expirationMinutes());
	}

	public String issue(User user) {
		Instant now = Instant.now();
		return Jwts.builder()
			.subject(user.getId().toString())
			.claim("email", user.getEmail())
			.issuedAt(Date.from(now))
			.expiration(Date.from(now.plus(expiration)))
			.signWith(key)
			.compact();
	}

	// Verifies the signature and expiry, returning the user id. Throws
	// io.jsonwebtoken.JwtException for any invalid or expired token.
	public UUID parseUserId(String token) {
		Jws<Claims> jws = Jwts.parser()
			.verifyWith(key)
			.build()
			.parseSignedClaims(token);
		return UUID.fromString(jws.getPayload().getSubject());
	}

	public long expirationSeconds() {
		return expiration.toSeconds();
	}
}
