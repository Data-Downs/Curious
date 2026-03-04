import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuestionDisplay } from "@/components/conversation/question-display";

describe("QuestionDisplay", () => {
  it("renders the question text", () => {
    render(<QuestionDisplay question="What matters most to you?" />);
    expect(screen.getByText("What matters most to you?")).toBeInTheDocument();
  });

  it("shows a streaming cursor when isStreaming is true", () => {
    const { container } = render(
      <QuestionDisplay question="What ma" isStreaming={true} />
    );
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("does not show a streaming cursor when isStreaming is false", () => {
    const { container } = render(
      <QuestionDisplay question="What matters most to you?" isStreaming={false} />
    );
    expect(container.querySelector(".animate-pulse")).not.toBeInTheDocument();
  });
});
