package com.caznik.athletedna.domain.port;

import com.caznik.athletedna.application.fit.FitParseException;
import com.caznik.athletedna.domain.model.Activity;

// Port-out for decoding a FIT file's bytes into a domain Activity (summary fields +
// ordered laps + raw lowercase sport/subSport + manufacturer/productName). The
// canonical `type`, owning user, source and fitFileHash are NOT set here — the
// FitImportService owns that mapping/stamping so it lives in one place.
public interface FitActivityParser {

	// Decodes one FIT file. Throws FitParseException for a non-FIT / corrupt stream.
	Activity parse(byte[] bytes) throws FitParseException;
}
