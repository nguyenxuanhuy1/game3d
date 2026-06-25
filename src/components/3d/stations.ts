// Single source of truth for every interactive "daily activity" in the home.
// Both the player controller (proximity detection) and the HUD read from this.

export type Zone = "kitchen" | "living" | "garden" | "garage";
export type StationKind = "hold" | "tap"; // hold = keep pressing/holding, tap = single press

export interface Station {
  id: string;
  zone: Zone;
  /** World position used for proximity detection. */
  pos: [number, number, number];
  /** How close the player must be to interact (metres). */
  radius: number;
  kind: StationKind;
  /** Short Vietnamese label shown in the HUD prompt. */
  label: string;
  /** How much progress one interaction adds (hold = per second, tap = per press). */
  step: number;
  /** Accent colour for the HUD chip. */
  accent: string;
}

export const STATIONS: Station[] = [
  // ---- Kitchen ----
  {
    id: "coffee",
    zone: "kitchen",
    pos: [-11.4, 1.0, -7.4],
    radius: 2.4,
    kind: "hold",
    label: "Pha cà phê",
    step: 55,
    accent: "#b45309",
  },
  {
    id: "stove",
    zone: "kitchen",
    pos: [-9.0, 1.0, -7.4],
    radius: 2.4,
    kind: "tap",
    label: "Đảo chảo (nấu ăn)",
    step: 20,
    accent: "#ea580c",
  },
  {
    id: "dishes",
    zone: "kitchen",
    pos: [-13.4, 1.0, -4.4],
    radius: 2.4,
    kind: "hold",
    label: "Rửa bát",
    step: 45,
    accent: "#0ea5e9",
  },

  // ---- Living / Relax ----
  {
    id: "read",
    zone: "living",
    pos: [-1.4, 0.7, -5.6],
    radius: 2.2,
    kind: "hold",
    label: "Đọc sách bên lò sưởi",
    step: 40,
    accent: "#a855f7",
  },
  {
    id: "music",
    zone: "living",
    pos: [3.6, 0.9, -7.4],
    radius: 2.2,
    kind: "tap",
    label: "Bật đĩa than",
    step: 100,
    accent: "#f43f5e",
  },
  {
    id: "cat",
    zone: "living",
    pos: [-2.6, 0.2, 2.6],
    radius: 2.2,
    kind: "tap",
    label: "Cho mèo ăn",
    step: 50,
    accent: "#f59e0b",
  },

  // ---- Outdoor: Garden ----
  {
    id: "plant",
    zone: "garden",
    pos: [10.2, 0.7, -5.6],
    radius: 2.6,
    kind: "hold",
    label: "Tưới cây",
    step: 38,
    accent: "#22c55e",
  },

  // ---- Outdoor: Garage / Carport ----
  {
    id: "bike",
    zone: "garage",
    pos: [10.8, 0.8, 1.6],
    radius: 3.0,
    kind: "hold",
    label: "Rửa xe máy",
    step: 30,
    accent: "#38bdf8",
  },
];

export const STATION_MAP: Record<string, Station> = Object.fromEntries(
  STATIONS.map((s) => [s.id, s])
);
