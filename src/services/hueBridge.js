// ============================================================
// HUE BRIDGE SERVICE
// ============================================================
//
// This module handles ALL communication with the Philips Hue Bridge.
// It uses the CLIP v2 (local REST API) — no cloud, no internet needed.
//
// ┌─────────────┐      Local WiFi       ┌────────────┐
// │  This App    │  ──── PUT/GET ────▶  │ Hue Bridge │ ──▶ 💡 Lights
// │ (browser)    │     (HTTPS)           │ 192.168.x  │
// └─────────────┘                        └────────────┘
//
// ─── HOW TO CONNECT TO YOUR REAL BRIDGE ───────────────────
//
// STEP 1: Find your Bridge IP
//   → Open the Philips Hue app → Settings → Hue Bridges → (i) icon
//   → Or visit https://discovery.meethue.com from the clinic network
//
// STEP 2: Create an API key (one-time)
//   1. Physically press the round button on top of your Hue Bridge
//   2. Within 30 seconds, run this in your terminal:
//
//      curl -X POST -d '{"devicetype":"clinic-signal#app","generateclientkey":true}' \
//           -k https://<BRIDGE_IP>/api
//
//   3. You'll get back something like:
//      [{"success":{"username":"abc123...", "clientkey":"..."}}]
//
//   4. The "username" value is your API key. Save it.
//
// STEP 3: Enter both values in the app's Settings page.
//
// ─── HTTPS NOTE ──────────────────────────────────────────
//
// The Hue Bridge uses a self-signed HTTPS certificate.
// Your browser will warn about this. You have two options:
//   a) Visit https://<BRIDGE_IP>/api once in your browser,
//      click "Advanced" → "Proceed anyway" to accept the cert.
//   b) Run this app via the Express backend proxy (future enhancement).
//
// ============================================================

const HueBridgeService = {
  _bridgeIp: null,
  _apiKey: null,
  _connected: false,

  /**
   * Whether we have an active connection to the bridge.
   */
  get isConnected() {
    return this._connected;
  },

  /**
   * Configure bridge credentials. Call this before any API calls.
   * @param {string} ip - Bridge local IP, e.g. "192.168.1.100"
   * @param {string} apiKey - The "username" from the bridge registration
   */
  configure(ip, apiKey) {
    this._bridgeIp = ip;
    this._apiKey = apiKey;
    this._connected = false;
  },

  /** Base URL for CLIP v2 API */
  _baseUrl() {
    // Use HTTP for localhost (fake bridge), HTTPS for real bridges
    const protocol = this._bridgeIp?.startsWith("localhost") || this._bridgeIp?.startsWith("127.0.0.1")
      ? "http"
      : "https";
    return `${protocol}://${this._bridgeIp}/clip/v2`;
  },

  /** Required headers for every request */
  _headers() {
    return {
      "hue-application-key": this._apiKey,
      "Content-Type": "application/json",
    };
  },

  /**
   * Test connection to the bridge.
   * @returns {{ success: boolean, error?: string }}
   */
  async testConnection() {
    try {
      const res = await fetch(`${this._baseUrl()}/resource/light`, {
        headers: this._headers(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this._connected = true;
      return { success: true };
    } catch (err) {
      this._connected = false;
      return { success: false, error: err.message };
    }
  },

  /**
   * Get all lights registered on the bridge.
   * Each light has: id, metadata.name, on.on, dimming.brightness, color.xy
   */
  async getLights() {
    const res = await fetch(`${this._baseUrl()}/resource/light`, {
      headers: this._headers(),
    });
    if (!res.ok) throw new Error("Failed to fetch lights");
    const data = await res.json();
    return data.data || [];
  },

  /**
   * Get all rooms configured on the bridge.
   * Each room has: id, metadata.name, children (devices), services (grouped_light)
   */
  async getRooms() {
    const res = await fetch(`${this._baseUrl()}/resource/room`, {
      headers: this._headers(),
    });
    if (!res.ok) throw new Error("Failed to fetch rooms");
    const data = await res.json();
    return data.data || [];
  },

  /**
   * Set a single light's color and brightness.
   * @param {string} lightId - The light resource ID
   * @param {{ x: number, y: number }} color - CIE xy color coordinates
   * @param {number} brightness - 0 to 100
   */
  async setLightColor(lightId, color, brightness = 100) {
    const body = {
      on: { on: true },
      dimming: { brightness },
      color: { xy: { x: color.x, y: color.y } },
    };
    const res = await fetch(`${this._baseUrl()}/resource/light/${lightId}`, {
      method: "PUT",
      headers: this._headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Failed to set light ${lightId}`);
    return res.json();
  },

  /**
   * Set ALL lights in a room at once (recommended — counts as 1 API call).
   * @param {string} groupId - The grouped_light resource ID
   * @param {{ x: number, y: number }} color - CIE xy color coordinates
   * @param {number} brightness - 0 to 100
   */
  async setGroupedLightColor(groupId, color, brightness = 100) {
    const body = {
      on: { on: true },
      dimming: { brightness },
      color: { xy: { x: color.x, y: color.y } },
    };
    const res = await fetch(
      `${this._baseUrl()}/resource/grouped_light/${groupId}`,
      {
        method: "PUT",
        headers: this._headers(),
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) throw new Error(`Failed to set group ${groupId}`);
    return res.json();
  },

  /**
   * Turn off a single light.
   */
  async turnOff(lightId) {
    const res = await fetch(`${this._baseUrl()}/resource/light/${lightId}`, {
      method: "PUT",
      headers: this._headers(),
      body: JSON.stringify({ on: { on: false } }),
    });
    if (!res.ok) throw new Error(`Failed to turn off ${lightId}`);
    return res.json();
  },

  /**
   * Turn off ALL lights in a room.
   */
  async turnOffGroup(groupId) {
    const res = await fetch(
      `${this._baseUrl()}/resource/grouped_light/${groupId}`,
      {
        method: "PUT",
        headers: this._headers(),
        body: JSON.stringify({ on: { on: false } }),
      }
    );
    if (!res.ok) throw new Error(`Failed to turn off group ${groupId}`);
    return res.json();
  },

  /**
   * Trigger a "breathe" alert on a light (single pulse effect).
   * Useful for grabbing attention.
   */
  async signalLight(lightId) {
    const res = await fetch(`${this._baseUrl()}/resource/light/${lightId}`, {
      method: "PUT",
      headers: this._headers(),
      body: JSON.stringify({ alert: { action: "breathe" } }),
    });
    return res.json();
  },
};

export default HueBridgeService;
