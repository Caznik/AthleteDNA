package com.caznik.athletedna.infrastructure.web.dtos;

// Per-file outcome in the import response. status ∈ {imported,enriched,duplicate,failed}
// (lower-case); activityId is set unless the file failed; error is set only on failure.
public record FitImportItemDTO(
	String filename,
	String status,
	String activityId,
	String error
) {}
