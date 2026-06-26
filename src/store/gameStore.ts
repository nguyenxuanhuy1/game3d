import { create } from "zustand";
import { STATIONS } from "@/components/3d/stations";

const initialProgress: Record<string, number> = Object.fromEntries(
  STATIONS.map((s) => [s.id, 0])
);

// Time of day: 0 = dawn, 0.5 = noon, ~0.8 = sunset, 1 = night.
const MORNING = 0.16;

export interface GameState {
  /** Player has stepped through the front door into the home. */
  entered: boolean;
  doorOpening: boolean;

  /** Player is in the dedicated auto-shop wash bay (scene transition). */
  inWorkshop: boolean;

  /** Target time-of-day (DayCycle smoothly lerps toward this). */
  timeTarget: number;

  /** Station the player is currently close enough to interact with. */
  nearbyStationId: string | null;
  /** Station currently being actively worked on (E held / just tapped). */
  interactingId: string | null;

  /** 0..100 completion for every station. */
  progress: Record<string, number>;
  /** Ids of stations that reached 100. */
  completed: string[];

  // Actions
  openDoor: () => void;
  enterHome: () => void;
  enterWorkshop: () => void;
  exitWorkshop: () => void;
  setNearby: (id: string | null) => void;
  setInteracting: (id: string | null) => void;
  addProgress: (id: string, amount: number) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  entered: false,
  doorOpening: false,
  inWorkshop: false,
  timeTarget: MORNING,
  nearbyStationId: null,
  interactingId: null,
  progress: initialProgress,
  completed: [],

  openDoor: () => set({ doorOpening: true }),
  enterHome: () => set({ entered: true, doorOpening: false, timeTarget: MORNING }),
  enterWorkshop: () => set({ inWorkshop: true, interactingId: null }),
  exitWorkshop: () => set({ inWorkshop: false, interactingId: null }),

  setNearby: (id) =>
    set((state) => (state.nearbyStationId === id ? {} : { nearbyStationId: id })),

  setInteracting: (id) =>
    set((state) => (state.interactingId === id ? {} : { interactingId: id })),

  addProgress: (id, amount) =>
    set((state) => {
      const cur = state.progress[id] ?? 0;
      if (cur >= 100) return {};
      const next = Math.min(100, cur + amount);
      const progress = { ...state.progress, [id]: next };

      if (next >= 100 && !state.completed.includes(id)) {
        const completed = [...state.completed, id];
        // Each finished chore nudges the day forward toward evening.
        const timeTarget = Math.min(0.99, MORNING + completed.length * 0.105);
        return { progress, completed, timeTarget };
      }
      return { progress };
    }),

  resetGame: () =>
    set({
      entered: false,
      doorOpening: false,
      inWorkshop: false,
      timeTarget: MORNING,
      nearbyStationId: null,
      interactingId: null,
      progress: { ...initialProgress },
      completed: [],
    }),
}));
