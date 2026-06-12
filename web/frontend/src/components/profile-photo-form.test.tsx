import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProfilePhotoForm } from "./profile-photo-form";
import type { AuthUser } from "@/lib/types";

const useUploadPhoto = vi.fn();
const useRemovePhoto = vi.fn();

vi.mock("@/lib/auth-queries", () => ({
  useUploadPhoto: () => useUploadPhoto(),
  useRemovePhoto: () => useRemovePhoto(),
}));

// jsdom lacks createObjectURL; the preview path calls it on a valid selection.
beforeEach(() => {
  globalThis.URL.createObjectURL = vi.fn(() => "blob:preview");
});

const baseUser: AuthUser = {
  id: "u1",
  email: "user@example.com",
  username: "carlos",
  photoUpdatedAt: null,
  themePreference: "system",
  languagePreference: "en",
};

describe("ProfilePhotoForm", () => {
  const uploadMutate = vi.fn().mockResolvedValue(undefined);
  const removeMutate = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    uploadMutate.mockClear();
    removeMutate.mockClear();
    useUploadPhoto.mockReturnValue({ mutateAsync: uploadMutate, isPending: false });
    useRemovePhoto.mockReturnValue({ mutateAsync: removeMutate, isPending: false });
  });

  function makeFile(name: string, type: string, size: number): File {
    const file = new File(["x"], name, { type });
    Object.defineProperty(file, "size", { value: size });
    return file;
  }

  it("disables Upload until a valid file is selected", () => {
    render(<ProfilePhotoForm user={baseUser} />);
    expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled();
  });

  it("hides Remove when the user has no photo", () => {
    render(<ProfilePhotoForm user={baseUser} />);
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
  });

  it("shows Replace and Remove when a photo exists", () => {
    render(<ProfilePhotoForm user={{ ...baseUser, photoUpdatedAt: 123 }} />);
    expect(screen.getByRole("button", { name: "Replace" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("rejects an unsupported type with an inline error and no upload", () => {
    render(<ProfilePhotoForm user={baseUser} />);
    const input = screen.getByLabelText("Choose a photo") as HTMLInputElement;
    // fireEvent (not user.upload) so the input's accept= filter does not drop the
    // disallowed file before our onChange validation can reject it.
    fireEvent.change(input, {
      target: { files: [makeFile("a.gif", "image/gif", 1000)] },
    });
    expect(screen.getByText(/Unsupported image type/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled();
  });

  it("rejects an oversize file with an inline error", async () => {
    const user = userEvent.setup();
    render(<ProfilePhotoForm user={baseUser} />);
    await user.upload(
      screen.getByLabelText("Choose a photo"),
      makeFile("big.png", "image/png", 2 * 1024 * 1024 + 1),
    );
    expect(screen.getByText(/too large/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled();
  });

  it("uploads a valid selected file", async () => {
    const user = userEvent.setup();
    render(<ProfilePhotoForm user={baseUser} />);
    const file = makeFile("ok.png", "image/png", 1000);
    await user.upload(screen.getByLabelText("Choose a photo"), file);
    await user.click(screen.getByRole("button", { name: "Upload" }));
    expect(uploadMutate).toHaveBeenCalledWith(file);
  });

  it("removes the photo when Remove is clicked", async () => {
    const user = userEvent.setup();
    render(<ProfilePhotoForm user={{ ...baseUser, photoUpdatedAt: 123 }} />);
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(removeMutate).toHaveBeenCalled();
  });
});
