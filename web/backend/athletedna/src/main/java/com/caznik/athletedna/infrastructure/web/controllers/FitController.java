package com.caznik.athletedna.infrastructure.web.controllers;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.caznik.athletedna.application.port.in.ImportFitFilesUseCase;
import com.caznik.athletedna.application.port.in.ImportFitFilesUseCase.NamedBytes;
import com.caznik.athletedna.domain.model.FitImportSummary;
import com.caznik.athletedna.endpoints.Endpoints;
import com.caznik.athletedna.infrastructure.web.dtos.FitImportResponseDTO;
import com.caznik.athletedna.infrastructure.web.mappers.FitImportWebMapper;

// Multipart FIT upload. Authenticated (the JWT filter + CurrentUserProvider 401 an
// anonymous caller); per-file validation/dedup/enrich isolation lives in the use case
// so one bad file never fails the request (AC-8/AC-9).
@RestController
@Profile("jpa")
public class FitController {

	private final ImportFitFilesUseCase importFitFilesUseCase;
	private final FitImportWebMapper fitImportWebMapper;

	public FitController(
		ImportFitFilesUseCase importFitFilesUseCase,
		FitImportWebMapper fitImportWebMapper
	) {
		this.importFitFilesUseCase = importFitFilesUseCase;
		this.fitImportWebMapper = fitImportWebMapper;
	}

	@PostMapping(value = Endpoints.FIT_ENDPOINT + "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public FitImportResponseDTO importFiles(@RequestParam("files") MultipartFile[] files) {
		List<NamedBytes> inputs = new ArrayList<>();
		for (MultipartFile file : files) {
			inputs.add(new NamedBytes(file.getOriginalFilename(), readBytes(file)));
		}
		FitImportSummary summary = importFitFilesUseCase.importForCurrentUser(inputs);
		return fitImportWebMapper.toDTO(summary);
	}

	// A multipart part whose bytes can't be read becomes an empty byte[], which the use
	// case rejects as a failed result — never a 500 that loses the whole batch.
	private static byte[] readBytes(MultipartFile file) {
		try {
			return file.getBytes();
		} catch (IOException ex) {
			return new byte[0];
		}
	}
}
