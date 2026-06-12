package com.caznik.athletedna.infrastructure.web.dtos;

import java.util.List;

// Response of POST api/fit/import. The four counts sum to results.size() (AC-8).
public record FitImportResponseDTO(
	int imported,
	int enriched,
	int duplicates,
	int failed,
	List<FitImportItemDTO> results
) {}
