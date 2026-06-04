package com.caznik.athletedna.application.usecases;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.caznik.athletedna.application.port.in.SearchActivitiesUseCase;
import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.ActivityPage;
import com.caznik.athletedna.domain.port.ActivityRepository;

@Service
public class ActivitiesSearchUseCase implements SearchActivitiesUseCase {
	
	private final ActivityRepository activityRepository;
	
	public ActivitiesSearchUseCase(ActivityRepository activityRepository) {
		this.activityRepository = activityRepository;
	}
	
	@Transactional(readOnly = true)
	public List<Activity> searchAll() {
		return activityRepository.findAll();
	}

	@Transactional(readOnly = true)
	public ActivityPage searchPage(int page, int size, String type) {
		return activityRepository.findPage(page, size, type);
	}

	@Transactional(readOnly = true)
	public List<String> listTypes() {
		return activityRepository.findDistinctTypes();
	}

}
