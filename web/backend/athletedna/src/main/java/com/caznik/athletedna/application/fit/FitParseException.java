package com.caznik.athletedna.application.fit;

// Thrown when a byte stream is not a valid FIT file (failed integrity check or the
// decoder errored part-way). The FitImportService catches this per file and records a
// "failed" result, so one bad file never aborts a multi-file upload (AC-9).
public class FitParseException extends RuntimeException {

	public FitParseException(String message) {
		super(message);
	}

	public FitParseException(String message, Throwable cause) {
		super(message, cause);
	}
}
