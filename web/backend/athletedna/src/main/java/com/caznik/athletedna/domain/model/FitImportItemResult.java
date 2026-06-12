package com.caznik.athletedna.domain.model;

import java.util.UUID;

// Outcome of importing one file in a multi-file upload (AC-8/AC-9). activityId is set
// for IMPORTED/ENRICHED/DUPLICATE; error is set for FAILED.
public record FitImportItemResult(
	String filename,
	Status status,
	UUID activityId,
	String error
) {
	public enum Status {
		IMPORTED,
		ENRICHED,
		DUPLICATE,
		FAILED
	}

	public static FitImportItemResult imported(String filename, UUID activityId) {
		return new FitImportItemResult(filename, Status.IMPORTED, activityId, null);
	}

	public static FitImportItemResult enriched(String filename, UUID activityId) {
		return new FitImportItemResult(filename, Status.ENRICHED, activityId, null);
	}

	public static FitImportItemResult duplicate(String filename, UUID activityId) {
		return new FitImportItemResult(filename, Status.DUPLICATE, activityId, null);
	}

	public static FitImportItemResult failed(String filename, String error) {
		return new FitImportItemResult(filename, Status.FAILED, null, error);
	}
}
