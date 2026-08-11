// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CoverLetterEditor from "@/components/CoverLetterEditor";
import type { GeneratedCoverLetter } from "@/types";

const initialLetter: GeneratedCoverLetter = {
  headline: "Original headline",
  greeting: "Dear team,",
  paragraphs: ["One.", "Two.", "Three.", "Four.", "Five."],
  closing: "Regards,",
  signature: "Test User",
};

function deferredResponse() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("CoverLetterEditor humanization", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it("applies rewritten paragraphs without overwriting newer letter fields", async () => {
    const pending = deferredResponse();
    vi.spyOn(globalThis, "fetch").mockReturnValue(pending.promise);
    const onChange = vi.fn();

    await act(async () => {
      root.render(
        createElement(CoverLetterEditor, {
          letter: initialLetter,
          language: "english",
          onChange,
        })
      );
    });

    const humanizeButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Humanize draft")
    );
    expect(humanizeButton).toBeDefined();
    act(() => humanizeButton?.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    const editedLetter = { ...initialLetter, headline: "Newer headline" };
    await act(async () => {
      root.render(
        createElement(CoverLetterEditor, {
          letter: editedLetter,
          language: "english",
          onChange,
        })
      );
    });

    await act(async () => {
      pending.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          humanizedText:
            "New one.\n\nNew two.\n\nNew three.\n\nNew four.\n\nNew five.",
          mode: "ai",
        }),
      } as Response);
      await pending.promise;
    });

    expect(onChange).toHaveBeenCalledWith({
      ...editedLetter,
      paragraphs: [
        "New one.",
        "New two.",
        "New three.",
        "New four.",
        "New five.",
      ],
    });
  });

  it("ignores and aborts a response after the language changes", async () => {
    const pending = deferredResponse();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockReturnValue(pending.promise);
    const onChange = vi.fn();

    await act(async () => {
      root.render(
        createElement(CoverLetterEditor, {
          letter: initialLetter,
          language: "english",
          onChange,
        })
      );
    });
    const humanizeButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Humanize draft")
    );
    act(() => humanizeButton?.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    await act(async () => {
      root.render(
        createElement(CoverLetterEditor, {
          letter: initialLetter,
          language: "danish",
          onChange,
        })
      );
    });
    const signal = (fetchMock.mock.calls[0]?.[1] as RequestInit).signal;
    expect(signal?.aborted).toBe(true);

    await act(async () => {
      pending.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          humanizedText:
            "New one.\n\nNew two.\n\nNew three.\n\nNew four.\n\nNew five.",
          mode: "ai",
        }),
      } as Response);
      await pending.promise;
    });

    expect(onChange).not.toHaveBeenCalled();
  });
});
