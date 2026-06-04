package com.caznik.athletedna.application;

// Driven port for password hashing. Keeps the application layer free of any
// concrete crypto dependency; the infrastructure layer supplies a BCrypt adapter.
public interface PasswordHasher {
	String hash(String rawPassword);
	boolean matches(String rawPassword, String passwordHash);
}
