# Clinic Signal — Light Messaging System

A smart visual messaging system for clinics powered by Philips Hue lights.  
Different light colors = different messages. Controlled through a simple internal web app.

| Signal         | Color  | Meaning                          |
|----------------|--------|----------------------------------|
| 🟢 Room Ready  | Green  | Room is clean, ready for patient |
| 🟡 Assistance  | Yellow | Staff help needed (not urgent)   |
| 🔵 Doctor      | Blue   | Doctor requested in room         |
| 🔴 Emergency   | Red    | Immediate attention required     |
| ⚪ Clear        | Off    | Reset to normal                  |

---

## Quick Start (Demo Mode)

No Hue Bridge needed — the app works immediately with simulated rooms.

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. Done.

---

## Test with the Fake Bridge (Recommended First Step)

Before connecting to a real bridge, you can run a fake one locally.  
It responds to the exact same API calls as a real Hue Bridge, so your app doesn't know the difference.

**Terminal 1 — Start the fake bridge:**
```bash
npm install express cors
node fake-bridge.js
```

**Terminal 2 — Start the app:**
```bash
npm run dev
```

**In the app:**
1. Go to **Settings**
2. Bridge IP: `localhost:3100`
3. API Key: `any-key-works`
4. Click **Connect to Bridge**

Now every signal you send fires a real HTTP request. Watch Terminal 1 — you'll see every API call logged with the light name, color, and brightness. The status badge changes to "Bridge Connected" and the app fetches rooms from the fake bridge.

This is the closest experience to real hardware without buying anything.

---

## Connect to a Real Hue Bridge

### Step 1: Find Your Bridge IP

Open the **Philips Hue app** on your phone:
- Go to **Settings → Hue Bridges**
- Tap the **(i)** icon next to your bridge
- Note the **IP address** (e.g. `192.168.1.42`)

Or visit `https://discovery.meethue.com` from a browser on the clinic network.

### Step 2: Create an API Key (One-Time)

1. **Physically press** the round button on top of your Hue Bridge
2. **Within 30 seconds**, run this command:

```bash
curl -X POST \
  -d '{"devicetype":"clinic-signal#app","generateclientkey":true}' \
  -k https://YOUR_BRIDGE_IP/api
```

3. You'll get a response like:
```json
[{"success":{"username":"aBcDeFgHiJkLmNoPqRsTuVwXyZ","clientkey":"..."}}]
```

4. Copy the `username` value — that's your **API key**.

### Step 3: Connect in the App

1. Open the app → go to **Settings**
2. Enter your **Bridge IP** and **API key**
3. Click **Connect to Bridge**
4. Your real rooms and lights appear automatically

### HTTPS Certificate Note

The Hue Bridge uses a self-signed certificate. Your browser will show a warning.  
**Fix:** Visit `https://YOUR_BRIDGE_IP/api` in your browser once, click  
"Advanced" → "Proceed to site" to trust the certificate.

---

## Project Structure

```
clinic-signal/
├── src/
│   ├── services/
│   │   └── hueBridge.js        ← All Hue API communication (READ THIS FIRST)
│   ├── config/
│   │   ├── signals.js          ← Signal definitions (colors, priorities)
│   │   └── demoRooms.js        ← Demo room data (used without a bridge)
│   ├── components/
│   │   ├── RoomCard.jsx        ← Room card with signal buttons
│   │   ├── ActivityLog.jsx     ← Timestamped log of all signals sent
│   │   ├── Settings.jsx        ← Bridge connection + reference
│   │   └── Toast.jsx           ← Notification popups
│   ├── App.jsx                 ← Main app (state management, routing)
│   ├── App.module.css
│   ├── index.css               ← Global styles + CSS variables
│   └── main.jsx                ← React entry point
├── index.html
├── package.json
└── vite.config.js
```

---

## How to Customize

### Add a New Signal

Edit `src/config/signals.js` and add an entry:

```js
{
  id: "patient_discharge",
  label: "Patient Discharge",
  icon: "↗",
  color: { x: 0.3, y: 0.15 },   // Purple (CIE xy coordinates)
  hex: "#a855f7",                  // For the UI only
  brightness: 90,
  description: "Patient is ready for discharge",
  priority: 2,
}
```

The UI picks it up automatically — no other changes needed.

### Change Demo Rooms

Edit `src/config/demoRooms.js` to match your clinic's actual room layout.  
This makes the demo mode look realistic for presentations.

### CIE xy Color Reference

The Hue API uses CIE xy color coordinates. Common values:

| Color   | x     | y     |
|---------|-------|-------|
| Red     | 0.68  | 0.31  |
| Green   | 0.17  | 0.70  |
| Blue    | 0.15  | 0.08  |
| Yellow  | 0.42  | 0.50  |
| Purple  | 0.30  | 0.15  |
| White   | 0.31  | 0.33  |
| Orange  | 0.57  | 0.41  |

Full converter: https://developers.meethue.com/develop/application-design-guidance/color-conversion-formulas-rgb-to-xy-and-back/

---

## Future Enhancements (Easy to Add)

These were designed into the architecture but not implemented yet:

- **Express backend** — proxy Hue API calls to avoid browser HTTPS issues
- **Bridge heartbeat** — periodic health checks with disconnection alerts
- **Conflict resolution** — priority-based signal override (priority field exists)
- **Persistence** — swap `useActivityLog` hook with SQLite/Firestore calls
- **Multi-user** — WebSocket sync so multiple staff see live signal state
- **Mobile layout** — responsive CSS is included, can be refined further
- **Custom rooms** — admin UI to map rooms to lights without using the Hue app

---

## Tech Stack

- **React 18** + Vite (fast dev server, instant HMR)
- **Philips Hue CLIP v2** (local REST API, no cloud dependency)
- **CSS Modules** (scoped styles, no conflicts)
- **Zero dependencies** beyond React (no state libraries, no UI frameworks)

---

## License

Internal clinic use.
