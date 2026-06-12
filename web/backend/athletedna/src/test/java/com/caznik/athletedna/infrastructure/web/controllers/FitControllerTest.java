package com.caznik.athletedna.infrastructure.web.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;

import com.caznik.athletedna.application.auth.UnauthenticatedException;
import com.caznik.athletedna.application.port.in.ImportFitFilesUseCase;
import com.caznik.athletedna.application.port.in.ImportFitFilesUseCase.NamedBytes;
import com.caznik.athletedna.domain.model.FitImportItemResult;
import com.caznik.athletedna.domain.model.FitImportSummary;
import com.caznik.athletedna.infrastructure.web.dtos.FitImportResponseDTO;
import com.caznik.athletedna.infrastructure.web.mappers.FitImportWebMapper;

class FitControllerTest {

	private ImportFitFilesUseCase useCase;
	private FitController controller;

	@BeforeEach
	void setUp() {
		useCase = mock(ImportFitFilesUseCase.class);
		controller = new FitController(useCase, new FitImportWebMapper());
	}

	// AC-8 — two files in one request → results.length==2 and the four counts sum to 2.
	@Test
	void returnsPerFileResultsForTwoFiles() {
		UUID id = UUID.randomUUID();
		when(useCase.importForCurrentUser(anyList())).thenReturn(FitImportSummary.from(List.of(
			FitImportItemResult.imported("a.fit", id),
			FitImportItemResult.failed("b.fit", "Not a valid FIT file")
		)));

		MockMultipartFile a = new MockMultipartFile("files", "a.fit", null, new byte[] {1});
		MockMultipartFile b = new MockMultipartFile("files", "b.fit", null, new byte[] {2});

		FitImportResponseDTO response = controller.importFiles(new MockMultipartFile[] {a, b});

		assertThat(response.results()).hasSize(2);
		assertThat(response.imported() + response.enriched() + response.duplicates() + response.failed())
			.isEqualTo(2);
		assertThat(response.results().get(0).status()).isEqualTo("imported");
		assertThat(response.results().get(0).activityId()).isEqualTo(id.toString());
		assertThat(response.results().get(1).status()).isEqualTo("failed");
		assertThat(response.results().get(1).error()).isEqualTo("Not a valid FIT file");
	}

	// The controller forwards each part's original filename + bytes to the use case.
	@Test
	void forwardsFilenamesAndBytesToUseCase() {
		when(useCase.importForCurrentUser(anyList())).thenReturn(FitImportSummary.from(List.of()));

		MockMultipartFile a = new MockMultipartFile("files", "run.fit", null, new byte[] {7, 8, 9});

		controller.importFiles(new MockMultipartFile[] {a});

		@SuppressWarnings("unchecked")
		ArgumentCaptor<List<NamedBytes>> captor = ArgumentCaptor.forClass(List.class);
		verify(useCase).importForCurrentUser(captor.capture());
		assertThat(captor.getValue()).hasSize(1);
		assertThat(captor.getValue().get(0).filename()).isEqualTo("run.fit");
		assertThat(captor.getValue().get(0).bytes()).containsExactly(7, 8, 9);
	}

	// AC-8 — unauthenticated: the use case (via CurrentUserProvider) throws, which the
	// controller propagates to the 401 handler. Mirrors AuthControllerTest's pattern.
	@Test
	void propagatesUnauthenticated() {
		when(useCase.importForCurrentUser(anyList())).thenThrow(new UnauthenticatedException());

		MockMultipartFile a = new MockMultipartFile("files", "a.fit", null, new byte[] {1});

		assertThatThrownBy(() -> controller.importFiles(new MockMultipartFile[] {a}))
			.isInstanceOf(UnauthenticatedException.class);
	}

	@Test
	void unreadablePartBecomesEmptyBytesNotA500() throws Exception {
		when(useCase.importForCurrentUser(anyList())).thenReturn(FitImportSummary.from(List.of()));

		MockMultipartFile failing = mock(MockMultipartFile.class);
		when(failing.getOriginalFilename()).thenReturn("x.fit");
		when(failing.getBytes()).thenThrow(new java.io.IOException("boom"));

		controller.importFiles(new MockMultipartFile[] {failing});

		@SuppressWarnings("unchecked")
		ArgumentCaptor<List<NamedBytes>> captor = ArgumentCaptor.forClass(List.class);
		verify(useCase).importForCurrentUser(captor.capture());
		assertThat(captor.getValue().get(0).bytes()).isEmpty();
	}
}
