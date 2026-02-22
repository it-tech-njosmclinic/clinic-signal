// ============================================================
// DEMO ROOMS
// ============================================================
//
// These are shown when no real Hue Bridge is connected.
// When you connect a bridge, real rooms are fetched automatically.
//
// You can customize these to match your clinic layout for demos.
// ============================================================

const DEMO_ROOMS = [
  {
    id: "room-1",
    name: "Room 1 — Consultation",
    lights: ["light-1a"],
    groupedLightId: "group-1",
  },
  {
    id: "room-2",
    name: "Room 2 — Examination",
    lights: ["light-2a", "light-2b"],
    groupedLightId: "group-2",
  },
  {
    id: "room-3",
    name: "Room 3 — Treatment",
    lights: ["light-3a"],
    groupedLightId: "group-3",
  },
  {
    id: "room-4",
    name: "Room 4 — Waiting Area",
    lights: ["light-4a", "light-4b"],
    groupedLightId: "group-4",
  },
];

export default DEMO_ROOMS;
