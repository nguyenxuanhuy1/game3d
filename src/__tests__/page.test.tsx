import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import Home from "@/app/page";
import { useGameStore } from "@/store/gameStore";
import React from "react";

describe("Home Page Integration & Rendering", () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  it("should render instructions and canvas when outside the house", () => {
    render(<Home />);

    // Header elements are rendered
    expect(screen.getByText("No Stress")).toBeInTheDocument();
    expect(screen.getByText("Immersive 3D Sensory Space")).toBeInTheDocument();

    // Interaction instructions are shown
    expect(screen.getByText("Interact with the door handle to enter")).toBeInTheDocument();

    // Canvas container wrapper is mounted
    expect(screen.getByTestId("r3f-canvas")).toBeInTheDocument();
  });

  it("should hide entrance instruction subtitle once door starts opening", () => {
    render(<Home />);

    // Trigger door opening state inside act
    act(() => {
      useGameStore.getState().openDoor();
    });

    // The instructions should now be hidden
    expect(screen.queryByText("Interact with the door handle to enter")).not.toBeInTheDocument();
    expect(screen.getByText("No Stress")).toBeInTheDocument();
  });

  it("should hide all intro page overlays once camera transitions inside the house", () => {
    render(<Home />);

    // Enter the house completely inside act
    act(() => {
      useGameStore.getState().enterHouse();
    });

    // Title overlays and subtitles should be hidden
    expect(screen.queryByText("No Stress")).not.toBeInTheDocument();
    expect(screen.queryByText("Interact with the door handle to enter")).not.toBeInTheDocument();
  });
});
