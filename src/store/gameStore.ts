import { create } from "zustand";

export type Room = "entry" | "garage" | "garden" | "living-room";
export type Tool = "none" | "sponge" | "watering-can";

export interface GameState {
  isInsideHouse: boolean;
  isDoorOpening: boolean;
  currentRoom: Room;
  activeTool: Tool;
  activeActivity: string | null;
  // Activity Progress States
  spotsCleaned: boolean[];
  plantWaterLevel: number;
  
  // Navigation & Core Actions
  openDoor: () => void;
  enterHouse: () => void;
  setRoom: (room: Room) => void;
  selectTool: (tool: Tool) => void;
  startActivity: (activityId: string) => void;
  exitActivity: () => void;
  
  // Activity Interactivity Actions
  cleanSpot: (index: number) => void;
  cleanAllSpots: () => void;
  waterPlant: (amount: number) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  isInsideHouse: false,
  isDoorOpening: false,
  currentRoom: "entry",
  activeTool: "none",
  activeActivity: null,
  spotsCleaned: [false, false, false, false, false, false],
  plantWaterLevel: 0,

  openDoor: () => set({ isDoorOpening: true }),
  enterHouse: () => set({ isInsideHouse: true, currentRoom: "living-room", isDoorOpening: false }),
  setRoom: (room) => set({ currentRoom: room, activeActivity: null, activeTool: "none" }),
  selectTool: (tool) => set({ activeTool: tool }),
  startActivity: (activityId) => set({ activeActivity: activityId }),
  exitActivity: () => set({ activeActivity: null, activeTool: "none" }),

  cleanSpot: (index) =>
    set((state) => {
      const next = [...state.spotsCleaned];
      if (index >= 0 && index < next.length) {
        next[index] = true;
      }
      return { spotsCleaned: next };
    }),

  cleanAllSpots: () =>
    set({
      spotsCleaned: [true, true, true, true, true, true],
    }),

  waterPlant: (amount) =>
    set((state) => ({
      plantWaterLevel: Math.min(state.plantWaterLevel + amount, 100),
    })),

  resetGame: () =>
    set({
      isInsideHouse: false,
      isDoorOpening: false,
      currentRoom: "entry",
      activeTool: "none",
      activeActivity: null,
      spotsCleaned: [false, false, false, false, false, false],
      plantWaterLevel: 0,
    }),
}));
