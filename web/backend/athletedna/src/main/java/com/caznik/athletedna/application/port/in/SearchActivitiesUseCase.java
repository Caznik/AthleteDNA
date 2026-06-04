package com.caznik.athletedna.application.port.in;

import java.util.List;

import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.ActivityPage;

public interface SearchActivitiesUseCase {
	List<Activity> searchAll();

	// A null type means "all types"; otherwise filters by exact type.
	ActivityPage searchPage(int page, int size, String type);

	List<String> listTypes();
}
