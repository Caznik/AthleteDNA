package com.caznik.athletedna.infrastructure.web.mappers;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Component;

import com.caznik.athletedna.domain.model.FitImportItemResult;
import com.caznik.athletedna.domain.model.FitImportSummary;
import com.caznik.athletedna.infrastructure.web.dtos.FitImportItemDTO;
import com.caznik.athletedna.infrastructure.web.dtos.FitImportResponseDTO;

@Component
public class FitImportWebMapper {

	public FitImportResponseDTO toDTO(FitImportSummary summary) {
		List<FitImportItemDTO> items = summary.results().stream()
			.map(FitImportWebMapper::toItemDTO)
			.toList();
		return new FitImportResponseDTO(
			summary.imported(),
			summary.enriched(),
			summary.duplicates(),
			summary.failed(),
			items
		);
	}

	private static FitImportItemDTO toItemDTO(FitImportItemResult result) {
		return new FitImportItemDTO(
			result.filename(),
			// Wire contract uses lower-case status strings.
			result.status().name().toLowerCase(Locale.ROOT),
			result.activityId() == null ? null : result.activityId().toString(),
			result.error()
		);
	}
}
