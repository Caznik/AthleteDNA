package com.caznik.athletedna.application.port.in;

import java.util.List;

import com.caznik.athletedna.domain.model.FitImportSummary;

// Inbound port for importing uploaded FIT files for the authenticated user. Each file
// is independently deduped (AC-5), enriched (AC-6) or inserted (AC-7); a bad file is
// isolated as a failed result without aborting the others (AC-9).
public interface ImportFitFilesUseCase {

	FitImportSummary importForCurrentUser(List<NamedBytes> files);

	// One uploaded file: its original name (for the per-file result) and raw bytes.
	record NamedBytes(String filename, byte[] bytes) {}
}
