package com.caznik.athletedna.infrastructure.web.dtos;

import java.util.List;

public record ActivityPageDTO(
	List<ActivityDTO> items,
	long total,
	int page,
	int size,
	int totalPages
) {}
