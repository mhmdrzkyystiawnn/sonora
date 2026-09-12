import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AudioPlayerProvider } from "../context/audio";
import { AudioPreviewButton } from "./AudioPreviewButton";

function renderWithProvider(ui: React.ReactElement) {
  return render(<AudioPlayerProvider>{ui}</AudioPlayerProvider>);
}

describe("AudioPreviewButton", () => {
  it("renders nothing when no preview src is available", () => {
    const { container } = renderWithProvider(
      <AudioPreviewButton label="Track" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("toggles between play and pause preview", async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <AudioPreviewButton
        src="https://example.com/preview.mp3"
        label="Test Track"
      />,
    );

    const playButton = screen.getByRole("button", {
      name: /play preview of test track/i,
    });
    expect(playButton).toBeInTheDocument();

    await user.click(playButton);

    expect(
      screen.getByRole("button", { name: /pause preview of test track/i }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /pause preview of test track/i }),
    );

    expect(
      screen.getByRole("button", { name: /play preview of test track/i }),
    ).toBeInTheDocument();
  });
});