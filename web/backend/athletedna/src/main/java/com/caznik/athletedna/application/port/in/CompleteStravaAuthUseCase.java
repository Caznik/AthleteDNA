package com.caznik.athletedna.application.port.in;

public interface CompleteStravaAuthUseCase {
	void complete(String code, String state);
}
