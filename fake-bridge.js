// ============================================================
// FAKE HUE BRIDGE SERVER
// ============================================================
//
// This mimics the Philips Hue Bridge CLIP v2 REST API locally.
// Your app can connect to this exactly like a real bridge.
//
// HOW TO USE:
//   1. npm install express cors
//   2. node fake-bridge.js
//   3. In the app's Settings, enter:
//        Bridge IP:  localhost:3100
//        API Key:    any-key-works
//   4. Click "Connect to Bridge"
//
// WHAT IT DOES:
//   - Responds to GET /clip/v2/resource/light   (list lights)
//   - Responds to GET /clip/v2/resource/room    (list rooms)
//   - Responds to PUT /clip/v2/resource/light/:id        (set light)
//   - Responds to PUT /clip/v2/resource/grouped_light/:id (set group)
//   - Tracks light state in memory
//   - Logs every API call to the console so you can see what's happening
//
// The rooms and lights match demoRooms.js so they connect seamlessly.
//
// ============================================================

import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ── In-memory light state ──
// Matches the lights defined in demoRooms.js
const lights = {
  "light-1a": {
    id: "light-1a",
    metadata: { name: "Consultation Lamp" },
    on: { on: false },
    dimming: { brightness: 0 },
    color: { xy: { x: 0.31, y: 0.33 } },
  },
  "light-2a": {
    id: "light-2a",
    metadata: { name: "Examination Ceiling" },
    on: { on: false },
    dimming: { brightness: 0 },
    color: { xy: { x: 0.31, y: 0.33 } },
  },
  "light-2b": {
    id: "light-2b",
    metadata: { name: "Examination Desk" },
    on: { on: false },
    dimming: { brightness: 0 },
    color: { xy: { x: 0.31, y: 0.33 } },
  },
  "light-3a": {
    id: "light-3a",
    metadata: { name: "Treatment Overhead" },
    on: { on: false },
    dimming: { brightness: 0 },
    color: { xy: { x: 0.31, y: 0.33 } },
  },
  "light-4a": {
    id: "light-4a",
    metadata: { name: "Waiting Area Left" },
    on: { on: false },
    dimming: { brightness: 0 },
    color: { xy: { x: 0.31, y: 0.33 } },
  },
  "light-4b": {
    id: "light-4b",
    metadata: { name: "Waiting Area Right" },
    on: { on: false },
    dimming: { brightness: 0 },
    color: { xy: { x: 0.31, y: 0.33 } },
  },
};

// ── Room definitions ──
// Mirrors demoRooms.js structure but in Hue API response format
const rooms = [
  {
    id: "room-1",
    metadata: { name: "Room 1 — Consultation" },
    children: [{ rtype: "device", rid: "light-1a" }],
    services: [{ rtype: "grouped_light", rid: "group-1" }],
  },
  {
    id: "room-2",
    metadata: { name: "Room 2 — Examination" },
    children: [
      { rtype: "device", rid: "light-2a" },
      { rtype: "device", rid: "light-2b" },
    ],
    services: [{ rtype: "grouped_light", rid: "group-2" }],
  },
  {
    id: "room-3",
    metadata: { name: "Room 3 — Treatment" },
    children: [{ rtype: "device", rid: "light-3a" }],
    services: [{ rtype: "grouped_light", rid: "group-3" }],
  },
  {
    id: "room-4",
    metadata: { name: "Room 4 — Waiting Area" },
    children: [
      { rtype: "device", rid: "light-4a" },
      { rtype: "device", rid: "light-4b" },
    ],
    services: [{ rtype: "grouped_light", rid: "group-4" }],
  },
];

// ── Map grouped_light IDs to their member lights ──
const groupToLights = {
  "group-1": ["light-1a"],
  "group-2": ["light-2a", "light-2b"],
  "group-3": ["light-3a"],
  "group-4": ["light-4a", "light-4b"],
};

// ── Helper: CIE xy to rough color name for console logs ──
function xyToColorName(x, y) {
  if (x > 0.6 && y < 0.35) return "🔴 RED";
  if (x < 0.2 && y > 0.5) return "🟢 GREEN";
  if (x < 0.2 && y < 0.15) return "🔵 BLUE";
  if (x > 0.35 && y > 0.4) return "🟡 YELLOW";
  return "⚪ WHITE";
}

// ── Helper: format a light state change for console ──
function logLightChange(lightId, light) {
  const state = light.on.on ? "ON" : "OFF";
  const color = light.on.on
    ? xyToColorName(light.color.xy.x, light.color.xy.y)
    : "⚫ OFF";
  const brightness = light.on.on ? `${light.dimming.brightness}%` : "0%";
  console.log(
    `  💡 ${light.metadata.name} (${lightId}): ${state} → ${color} @ ${brightness}`
  );
}

// ============================================================
// API ROUTES — matches Hue CLIP v2 exactly
// ============================================================

// GET lights
app.get("/clip/v2/resource/light", (req, res) => {
  console.log("\n📥 GET /clip/v2/resource/light");
  console.log("  Returning", Object.keys(lights).length, "lights");
  res.json({ data: Object.values(lights) });
});

// GET rooms
app.get("/clip/v2/resource/room", (req, res) => {
  console.log("\n📥 GET /clip/v2/resource/room");
  console.log("  Returning", rooms.length, "rooms");
  res.json({ data: rooms });
});

// PUT single light
app.put("/clip/v2/resource/light/:id", (req, res) => {
  const { id } = req.params;
  const body = req.body;

  console.log(`\n📤 PUT /clip/v2/resource/light/${id}`);
  console.log("  Body:", JSON.stringify(body));

  if (!lights[id]) {
    console.log(`  ❌ Light ${id} not found`);
    return res.status(404).json({ errors: [{ description: `Light ${id} not found` }] });
  }

  // Apply changes
  if (body.on !== undefined) lights[id].on = body.on;
  if (body.dimming !== undefined) lights[id].dimming = body.dimming;
  if (body.color !== undefined) lights[id].color = body.color;
  if (body.alert) {
    console.log(`  ⚡ Alert: ${body.alert.action} on ${lights[id].metadata.name}`);
  }

  logLightChange(id, lights[id]);

  res.json({ data: [{ id, type: "light" }] });
});

// PUT grouped light (all lights in a room)
app.put("/clip/v2/resource/grouped_light/:id", (req, res) => {
  const { id } = req.params;
  const body = req.body;

  console.log(`\n📤 PUT /clip/v2/resource/grouped_light/${id}`);
  console.log("  Body:", JSON.stringify(body));

  const memberLights = groupToLights[id];
  if (!memberLights) {
    console.log(`  ❌ Group ${id} not found`);
    return res.status(404).json({ errors: [{ description: `Group ${id} not found` }] });
  }

  console.log(`  Applying to ${memberLights.length} lights in group:`);

  // Apply to all lights in group
  for (const lightId of memberLights) {
    if (body.on !== undefined) lights[lightId].on = body.on;
    if (body.dimming !== undefined) lights[lightId].dimming = body.dimming;
    if (body.color !== undefined) lights[lightId].color = body.color;
    logLightChange(lightId, lights[lightId]);
  }

  res.json({ data: [{ id, type: "grouped_light" }] });
});

// ── Status endpoint (for quick checks) ──
app.get("/clip/v2/resource/bridge", (req, res) => {
  res.json({ data: [{ id: "fake-bridge-001", type: "bridge" }] });
});

// ── Catch-all for unrecognized Hue API paths ──
app.all("/clip/v2/{*path}", (req, res) => {
  console.log(`\n⚠️  Unhandled: ${req.method} ${req.path}`);
  res.status(404).json({ errors: [{ description: "Resource not found" }] });
});

// ============================================================
// START SERVER
// ============================================================
const PORT = 3100;

app.listen(PORT, () => {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║        FAKE HUE BRIDGE — RUNNING            ║");
  console.log("╠══════════════════════════════════════════════╣");
  console.log(`║  URL:     http://localhost:${PORT}              ║`);
  console.log("║  API Key: any-key-works                      ║");
  console.log("║                                              ║");
  console.log("║  In the app's Settings, connect with:        ║");
  console.log(`║    Bridge IP:  localhost:${PORT}               ║`);
  console.log("║    API Key:    any-key-works                  ║");
  console.log("║                                              ║");
  console.log("║  Rooms: 4 rooms, 6 lights total              ║");
  console.log("║  Watch this terminal for live API calls! 👀   ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log("");
});