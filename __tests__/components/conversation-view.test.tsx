import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConversationView } from "@/components/conversation/conversation-view";

describe("ConversationView", () => {
  it("shows loading state when isLoading and no question", () => {
    render(
      <ConversationView
        messages={[]}
        currentQuestion=""
        isStreaming={false}
        isLoading={true}
      />
    );

    expect(
      screen.getByText("Considering...")
    ).toBeInTheDocument();
  });

  it("shows question when present (not loading)", () => {
    render(
      <ConversationView
        messages={[]}
        currentQuestion="What matters most to you?"
        isStreaming={false}
        isLoading={false}
      />
    );

    expect(
      screen.getByText("What matters most to you?")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Considering...")
    ).not.toBeInTheDocument();
  });

  it("shows question over loading once streaming begins", () => {
    render(
      <ConversationView
        messages={[]}
        currentQuestion="What"
        isStreaming={true}
        isLoading={false}
      />
    );

    expect(screen.getByText("What")).toBeInTheDocument();
    expect(
      screen.queryByText("Considering...")
    ).not.toBeInTheDocument();
  });

  it("renders past messages", () => {
    render(
      <ConversationView
        messages={[
          { id: "1", role: "agent", content: "First question?" },
          { id: "2", role: "user", content: "My answer" },
        ]}
        currentQuestion="Second question?"
        isStreaming={false}
        isLoading={false}
      />
    );

    expect(screen.getByText("First question?")).toBeInTheDocument();
    expect(screen.getByText("My answer")).toBeInTheDocument();
    expect(screen.getByText("Second question?")).toBeInTheDocument();
  });
});
