// ============================================================
// SIGNAL DEFINITIONS
// ============================================================
//
// This is the single source of truth for all clinic signals.
// Each signal maps a MESSAGE → COLOR → PRIORITY.
//
// To add a new signal:
//   1. Add a new object below
//   2. That's it — the UI picks it up automatically
//
// Color format: CIE xy coordinates (what the Hue API expects).
//   You can convert hex/RGB to CIE xy using:
//   https://developers.meethue.com/develop/application-design-guidance/color-conversion-formulas-rgb-to-xy-and-back/
//
// Priority: Higher number = more urgent. Used for future conflict
//   resolution (e.g., Emergency always overrides Room Ready).
// ============================================================

const SIGNALS = [
  {
    id: "room_ready",
    label: "Room Ready",
    icon: "✓",
    color: { x: 0.17, y: 0.7 },     // Green
    hex: "#22c55e",
    brightness: 80,
    description: "Room is clean and ready for the next patient",
    priority: 1,
  },
  {
    id: "need_assistance",
    label: "Need Assistance",
    icon: "!",
    color: { x: 0.42, y: 0.505 },    // Yellow / Amber
    hex: "#eab308",
    brightness: 100,
    description: "Staff assistance needed — not urgent",
    priority: 2,
  },
  {
    id: "doctor_needed",
    label: "Doctor Needed",
    icon: "⚕",
    color: { x: 0.154, y: 0.08 },    // Blue
    hex: "#3b82f6",
    brightness: 100,
    description: "Doctor is requested in this room",
    priority: 3,
  },
  {
    id: "emergency",
    label: "Emergency",
    icon: "✕",
    color: { x: 0.68, y: 0.31 },     // Red
    hex: "#ef4444",
    brightness: 100,
    description: "Urgent — immediate attention required",
    priority: 4,
  },
  {
    id: "clear",
    label: "Clear / Off",
    icon: "○",
    color: null,                       // No color — turns light off
    hex: "#71717a",
    brightness: 0,
    description: "Turn off signal — return to normal",
    priority: 0,
  },
];

export default SIGNALS;
