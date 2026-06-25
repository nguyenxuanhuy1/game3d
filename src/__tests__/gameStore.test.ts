import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "@/store/gameStore";

describe("gameStore State Machine", () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  it("should start with default outside state", () => {
    const state = useGameStore.getState();
    expect(state.isInsideHouse).toBe(false);
    expect(state.isDoorOpening).toBe(false);
    expect(state.currentRoom).toBe("entry");
    expect(state.activeTool).toBe("none");
    expect(state.activeActivity).toBeNull();
  });

  it("should transition state correctly when the door is opened", () => {
    useGameStore.getState().openDoor();
    const state = useGameStore.getState();
    expect(state.isDoorOpening).toBe(true);
    expect(state.isInsideHouse).toBe(false);
  });

  it("should transition to inside-house state on enterHouse", () => {
    useGameStore.getState().openDoor();
    useGameStore.getState().enterHouse();
    const state = useGameStore.getState();
    expect(state.isInsideHouse).toBe(true);
    expect(state.isDoorOpening).toBe(false);
    expect(state.currentRoom).toBe("living-room");
  });

  it("should transition to rooms and clear previous activities/tools", () => {
    useGameStore.getState().enterHouse();
    useGameStore.getState().selectTool("sponge");
    useGameStore.getState().startActivity("car-washing");

    expect(useGameStore.getState().activeTool).toBe("sponge");
    expect(useGameStore.getState().activeActivity).toBe("car-washing");

    // Regression defense: ensure moving to another room clears transient activity states
    useGameStore.getState().setRoom("garden");
    const state = useGameStore.getState();
    expect(state.currentRoom).toBe("garden");
    expect(state.activeTool).toBe("none");
    expect(state.activeActivity).toBeNull();
  });

  it("should allow activating and exiting specific sub-activities", () => {
    useGameStore.getState().enterHouse();
    useGameStore.getState().startActivity("plant-watering");
    useGameStore.getState().selectTool("watering-can");

    expect(useGameStore.getState().activeActivity).toBe("plant-watering");
    expect(useGameStore.getState().activeTool).toBe("watering-can");

    useGameStore.getState().exitActivity();
    const state = useGameStore.getState();
    expect(state.activeActivity).toBeNull();
    expect(state.activeTool).toBe("none");
  });

  it("should support resetting back to the gate entry point", () => {
    useGameStore.getState().enterHouse();
    useGameStore.getState().setRoom("garage");
    useGameStore.getState().selectTool("sponge");
    
    useGameStore.getState().resetGame();
    const state = useGameStore.getState();
    expect(state.isInsideHouse).toBe(false);
    expect(state.isDoorOpening).toBe(false);
    expect(state.currentRoom).toBe("entry");
    expect(state.activeTool).toBe("none");
  });
});
