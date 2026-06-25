import "@testing-library/jest-dom";
import { vi } from "vitest";
import React from "react";

// Mock Google Font
vi.mock("next/font/google", () => ({
  Outfit: () => ({
    variable: "--font-outfit",
    className: "mock-outfit-class",
  }),
}));

// Mock React Three Fiber Canvas and hooks using React.createElement
vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "r3f-canvas" }, children),
  useFrame: vi.fn(),
  useThree: () => ({
    pointer: { x: 0, y: 0 },
    viewport: { width: 10, height: 10 },
    camera: { position: { x: 0, y: 0, z: 4.5 } },
  }),
}));

// Mock Drei components using React.createElement
vi.mock("@react-three/drei", () => {
  const FakePointerLockControls = React.forwardRef<HTMLDivElement, any>((props, ref) =>
    React.createElement("div", { ref, "data-testid": "pointer-lock-controls", ...props })
  );
  FakePointerLockControls.displayName = "PointerLockControls";

  return {
    PointerLockControls: FakePointerLockControls,
    Html: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", { "data-testid": "r3f-html" }, children),
  };
});
