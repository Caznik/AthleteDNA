import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileFitUpload } from "./profile-fit-upload";

function fitFile(name: string): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type: "" });
}

describe("ProfileFitUpload", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("disables Upload until a file is selected", () => {
    render(<ProfileFitUpload />);
    expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled();
  });

  it("enables Upload once .fit files are chosen", () => {
    render(<ProfileFitUpload />);
    const input = screen.getByLabelText("Choose .fit files") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [fitFile("run.fit")] } });
    expect(screen.getByRole("button", { name: "Upload" })).toBeEnabled();
  });

  // AC-10 — posts the chosen files to the BFF and renders the per-file outcome list.
  it("uploads selected files and renders the per-file outcome list", async () => {
    const summary = {
      imported: 1,
      enriched: 0,
      duplicates: 0,
      failed: 1,
      results: [
        { filename: "run.fit", status: "imported", activityId: "a1", error: null },
        { filename: "bad.fit", status: "failed", activityId: null, error: "Not a valid FIT file" },
      ],
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(summary), { status: 200 }));

    render(<ProfileFitUpload />);
    const input = screen.getByLabelText("Choose .fit files") as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [fitFile("run.fit"), fitFile("bad.fit")] },
    });

    fireEvent.click(screen.getByRole("button", { name: "Upload" }));

    await waitFor(() => {
      expect(screen.getByTestId("fit-import-results")).toBeInTheDocument();
    });

    // POSTed to the BFF with multipart FormData carrying both files under "files".
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/fit/import");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBeInstanceOf(FormData);
    expect((init?.body as FormData).getAll("files")).toHaveLength(2);

    // Both outcomes are rendered, including the failure message.
    expect(screen.getByText("run.fit")).toBeInTheDocument();
    expect(screen.getByText("bad.fit")).toBeInTheDocument();
    expect(screen.getByText("Imported")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("Not a valid FIT file")).toBeInTheDocument();
  });

  it("shows an inline error when the upload request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 502 }),
    );

    render(<ProfileFitUpload />);
    const input = screen.getByLabelText("Choose .fit files") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [fitFile("run.fit")] } });
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));

    await waitFor(() => {
      expect(
        screen.getByText("Could not upload the files. Try again."),
      ).toBeInTheDocument();
    });
  });
});
