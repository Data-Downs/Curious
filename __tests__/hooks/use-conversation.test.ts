import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConversation } from "@/hooks/use-conversation";

// Helper to create a ReadableStream from SSE chunks
function createSSEStream(chunks: string[]) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

function mockFetchSSE(chunks: string[]) {
  return vi.fn().mockResolvedValue({
    ok: true,
    body: createSSEStream(chunks),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("useConversation", () => {
  it("has correct initial state", () => {
    const { result } = renderHook(() => useConversation());

    expect(result.current.messages).toEqual([]);
    expect(result.current.currentQuestion).toBe("");
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFirstQuestion).toBe(true);
    expect(result.current.conversationId).toBeTruthy();
  });

  it("streams question text from SSE response", async () => {
    global.fetch = mockFetchSSE([
      'data: {"text":"What "}\n\n',
      'data: {"text":"matters?"}\n\n',
      "data: [DONE]\n\n",
    ]);

    const { result } = renderHook(() => useConversation());

    await act(async () => {
      await result.current.startConversation();
    });

    expect(result.current.currentQuestion).toBe("What matters?");
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFirstQuestion).toBe(false);
  });

  it("prevents double-fire of startConversation (Strict Mode guard)", async () => {
    const fetchMock = mockFetchSSE([
      'data: {"text":"Hello"}\n\n',
      "data: [DONE]\n\n",
    ]);
    global.fetch = fetchMock;

    const { result } = renderHook(() => useConversation());

    await act(async () => {
      // Simulate Strict Mode double-fire
      await Promise.all([
        result.current.startConversation(),
        result.current.startConversation(),
      ]);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.currentQuestion).toBe("Hello");
  });

  it("transitions isLoading correctly", async () => {
    let resolveStream: (() => void) | undefined;
    const streamReady = new Promise<void>((r) => {
      resolveStream = r;
    });

    const encoder = new TextEncoder();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: new ReadableStream({
        async start(controller) {
          // Signal that stream is set up
          resolveStream!();
          // Wait a tick so we can observe isLoading=true
          await new Promise((r) => setTimeout(r, 0));
          controller.enqueue(
            encoder.encode('data: {"text":"Hi"}\n\n')
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      }),
    });

    const { result } = renderHook(() => useConversation());

    // isLoading starts false
    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      await result.current.startConversation();
    });

    // After completion, isLoading is false
    expect(result.current.isLoading).toBe(false);
    expect(result.current.currentQuestion).toBe("Hi");
  });

  it("sets fallback question on error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useConversation());

    await act(async () => {
      await result.current.startConversation();
    });

    expect(result.current.currentQuestion).toBe(
      "What's on your mind today?"
    );
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("sets fallback question on non-ok response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useConversation());

    await act(async () => {
      await result.current.startConversation();
    });

    expect(result.current.currentQuestion).toBe(
      "What's on your mind today?"
    );
  });

  it("sendMessage appends messages and streams next question", async () => {
    // First: start conversation
    global.fetch = mockFetchSSE([
      'data: {"text":"First question?"}\n\n',
      "data: [DONE]\n\n",
    ]);

    const { result } = renderHook(() => useConversation());

    await act(async () => {
      await result.current.startConversation();
    });

    expect(result.current.currentQuestion).toBe("First question?");

    // Now: send a message, expect next question
    global.fetch = mockFetchSSE([
      'data: {"text":"Second question?"}\n\n',
      "data: [DONE]\n\n",
    ]);

    await act(async () => {
      await result.current.sendMessage("My answer", "text");
    });

    // Messages should have the agent question + user answer
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe("agent");
    expect(result.current.messages[0].content).toBe("First question?");
    expect(result.current.messages[1].role).toBe("user");
    expect(result.current.messages[1].content).toBe("My answer");

    // Next question is now streaming
    expect(result.current.currentQuestion).toBe("Second question?");
  });
});
