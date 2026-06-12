package com.caznik.athletedna.domain.model;

import java.util.List;

import com.caznik.athletedna.domain.model.FitImportItemResult.Status;

// Aggregate result of a multi-file FIT upload. Counts are derived from the per-file
// results so imported+enriched+duplicates+failed always sums to results.size() (AC-8).
public record FitImportSummary(
	int imported,
	int enriched,
	int duplicates,
	int failed,
	List<FitImportItemResult> results
) {
	public static FitImportSummary from(List<FitImportItemResult> results) {
		int imported = count(results, Status.IMPORTED);
		int enriched = count(results, Status.ENRICHED);
		int duplicates = count(results, Status.DUPLICATE);
		int failed = count(results, Status.FAILED);
		return new FitImportSummary(imported, enriched, duplicates, failed, List.copyOf(results));
	}

	private static int count(List<FitImportItemResult> results, Status status) {
		return (int) results.stream().filter(r -> r.status() == status).count();
	}
}
