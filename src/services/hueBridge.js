// ============================================================
// HUE BRIDGE SERVICE — v2 (with certificate handling)
// ============================================================
//
// WHAT CHANGED FROM THE ORIGINAL:
// ─────────────────────────────────
// 1. Added a "certificate check" flow — before connecting, we
//    verify if the browser can reach the bridge. If not, we
//    return a specific error telling the user to accept the cert.
//
// 2. Added dual API support — tries CLIP v2 first, falls back
//    to v1 if needed. Both work with the same credentials.
//
// WHY THE ORIGINAL DIDN'T WORK FROM VERCEL:
// ─────────────────────────────────────────
// The Hue Bridge uses a SELF-SIGNED HTTPS certificate.
// When the app is served from https://clinic-signal.vercel.app,
// and the browser tries to fetch https://192.168.x.x/clip/v2/...,
// the browser sees the self-signed cert and SILENTLY BLOCKS
// the request. No popup, no warning — just a "Failed to fetch".
//
// The Philips debug tool works because it's served FROM the
// bridge itself (same origin = no cert issue).
//
// THE FIX:
// The user must first visit https://<bridge-ip>/api in their
// browser and click "Advanced → Proceed" to accept the cert.
// After that, fetch() calls from ANY origin will work because
// the browser has cached the certificate exception.
//
// Our improved Settings page detects this exact problem and
// guides the user through accepting the certificate.
// ============================================================

const HueBridgeService = {
  _bridgeIp: null,
  _apiKey: null,
  _connected: false,
  _apiVersion: null, // "v2" or "v1"

  get isConnected() {
    return this._connected;
  },

  get apiVersion() {
    return this._apiVersion;
  },

  /**
   * Configure bridge credentials.
   */
  configure(ip, apiKey) {
    let cleanIp = ip.trim();
    cleanIp = cleanIp.replace(/^https?:\/\//, "");
    cleanIp = cleanIp.replace(/\/+$/, "");
    this._bridgeIp = cleanIp;
    this._apiKey = apiKey.trim();
    this._connected = false;
    this._apiVersion = null;
  },

  _bridgeOrigin() {
    // Use HTTP for localhost (fake bridge), HTTPS for real bridges
    const protocol = this._bridgeIp?.startsWith("localhost") ? "http" : "https";
    return `${protocol}://${this._bridgeIp}`;
  },

  _baseUrlV2() {
    return `${this._bridgeOrigin()}/clip/v2`;
  },

  _baseUrlV1() {
    return `${this._bridgeOrigin()}/api/${this._apiKey}`;
  },

  _headersV2() {
    return {
      "hue-application-key": this._apiKey,
      "Content-Type": "application/json",
    };
  },

  _headersV1() {
    return { "Content-Type": "application/json" };
  },

  /**
   * URL the user needs to visit to accept the bridge's self-signed cert.
   */
  getCertAcceptUrl() {
    return `https://${this._bridgeIp}/api`;
  },

  /**
   * Check if the browser can reach the bridge at all.
   * Returns: { reachable: true } or { reachable: false, reason: "cert"|"network" }
   */
  async checkReachability() {
    // Skip check for localhost (fake bridge)
    if (this._bridgeIp?.startsWith("localhost")) {
      try {
        const res = await fetch(`${this._bridgeOrigin()}/api`);
        return { reachable: true };
      } catch {
        return { reachable: false, reason: "network" };
      }
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`https://${this._bridgeIp}/api`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      // Any response means cert is accepted and bridge is reachable
      return { reachable: true };
    } catch (err) {
      if (err.name === "AbortError") {
        return { reachable: false, reason: "network" };
      }
      return { reachable: false, reason: "cert" };
    }
  },

  /**
   * Test connection. Checks cert first, then tries v2, then v1.
   */
  async testConnection() {
    // Step 1: Reachability check
    const reach = await this.checkReachability();
    if (!reach.reachable) {
      this._connected = false;
      if (reach.reason === "cert") {
        return {
          success: false,
          needsCert: true,
          certUrl: this.getCertAcceptUrl(),
          error: "Cannot reach the bridge — you need to accept its security certificate first.",
        };
      }
      return {
        success: false,
        error: "Cannot reach the bridge. Check the IP address and make sure you're on the same network.",
      };
    }

    // Step 2: Try CLIP v2
    try {
      const res = await fetch(`${this._baseUrlV2()}/resource/light`, {
        headers: this._headersV2(),
      });
      if (res.ok) {
        this._connected = true;
        this._apiVersion = "v2";
        return { success: true, apiVersion: "v2" };
      }
      if (res.status === 403 || res.status === 401) {
        this._connected = false;
        return { success: false, error: "Invalid API key." };
      }
    } catch {
      // v2 failed, try v1
    }

    // Step 3: Fallback to v1
    try {
      const res = await fetch(`${this._baseUrlV1()}/lights`, {
        headers: this._headersV1(),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data[0]?.error) {
          this._connected = false;
          return { success: false, error: `API key rejected: ${data[0].error.description}` };
        }
        this._connected = true;
        this._apiVersion = "v1";
        return { success: true, apiVersion: "v1" };
      }
    } catch {
      // Both failed
    }

    this._connected = false;
    return { success: false, error: "Connected to bridge but API calls failed. Check your API key." };
  },

  // ════════════════════════════════════════════════════════════
  // LIGHT CONTROL — uses the right API version automatically
  // ════════════════════════════════════════════════════════════

  async getLights() {
    if (this._apiVersion === "v2") {
      const res = await fetch(`${this._baseUrlV2()}/resource/light`, { headers: this._headersV2() });
      if (!res.ok) throw new Error("Failed to fetch lights");
      const data = await res.json();
      return data.data || [];
    } else {
      const res = await fetch(`${this._baseUrlV1()}/lights`, { headers: this._headersV1() });
      if (!res.ok) throw new Error("Failed to fetch lights");
      const data = await res.json();
      return Object.entries(data).map(([id, light]) => ({
        id,
        metadata: { name: light.name },
        on: { on: light.state?.on },
        dimming: { brightness: light.state?.bri },
        color: light.state?.xy ? { xy: { x: light.state.xy[0], y: light.state.xy[1] } } : undefined,
      }));
    }
  },

  async getRooms() {
    if (this._apiVersion === "v2") {
      const res = await fetch(`${this._baseUrlV2()}/resource/room`, { headers: this._headersV2() });
      if (!res.ok) throw new Error("Failed to fetch rooms");
      const data = await res.json();
      return data.data || [];
    } else {
      const res = await fetch(`${this._baseUrlV1()}/groups`, { headers: this._headersV1() });
      if (!res.ok) throw new Error("Failed to fetch rooms");
      const data = await res.json();
      return Object.entries(data)
        .filter(([, group]) => group.type === "Room")
        .map(([id, group]) => ({
          id,
          metadata: { name: group.name },
          children: (group.lights || []).map((lid) => ({ rtype: "device", rid: lid })),
          services: [{ rtype: "grouped_light", rid: id }],
        }));
    }
  },

  async setLightColor(lightId, color, brightness = 100) {
    if (this._apiVersion === "v2") {
      const body = { on: { on: true }, dimming: { brightness }, color: { xy: { x: color.x, y: color.y } } };
      const res = await fetch(`${this._baseUrlV2()}/resource/light/${lightId}`, { method: "PUT", headers: this._headersV2(), body: JSON.stringify(body) });
      if (!res.ok) throw new Error(`Failed to set light ${lightId}`);
      return res.json();
    } else {
      const body = { on: true, bri: Math.round((brightness / 100) * 254), xy: [color.x, color.y] };
      const res = await fetch(`${this._baseUrlV1()}/lights/${lightId}/state`, { method: "PUT", headers: this._headersV1(), body: JSON.stringify(body) });
      if (!res.ok) throw new Error(`Failed to set light ${lightId}`);
      return res.json();
    }
  },

  async setGroupedLightColor(groupId, color, brightness = 100) {
    if (this._apiVersion === "v2") {
      const body = { on: { on: true }, dimming: { brightness }, color: { xy: { x: color.x, y: color.y } } };
      const res = await fetch(`${this._baseUrlV2()}/resource/grouped_light/${groupId}`, { method: "PUT", headers: this._headersV2(), body: JSON.stringify(body) });
      if (!res.ok) throw new Error(`Failed to set group ${groupId}`);
      return res.json();
    } else {
      const body = { on: true, bri: Math.round((brightness / 100) * 254), xy: [color.x, color.y] };
      const res = await fetch(`${this._baseUrlV1()}/groups/${groupId}/action`, { method: "PUT", headers: this._headersV1(), body: JSON.stringify(body) });
      if (!res.ok) throw new Error(`Failed to set group ${groupId}`);
      return res.json();
    }
  },

  async turnOff(lightId) {
    if (this._apiVersion === "v2") {
      const res = await fetch(`${this._baseUrlV2()}/resource/light/${lightId}`, { method: "PUT", headers: this._headersV2(), body: JSON.stringify({ on: { on: false } }) });
      if (!res.ok) throw new Error(`Failed to turn off ${lightId}`);
      return res.json();
    } else {
      const res = await fetch(`${this._baseUrlV1()}/lights/${lightId}/state`, { method: "PUT", headers: this._headersV1(), body: JSON.stringify({ on: false }) });
      if (!res.ok) throw new Error(`Failed to turn off ${lightId}`);
      return res.json();
    }
  },

  async turnOffGroup(groupId) {
    if (this._apiVersion === "v2") {
      const res = await fetch(`${this._baseUrlV2()}/resource/grouped_light/${groupId}`, { method: "PUT", headers: this._headersV2(), body: JSON.stringify({ on: { on: false } }) });
      if (!res.ok) throw new Error(`Failed to turn off group ${groupId}`);
      return res.json();
    } else {
      const res = await fetch(`${this._baseUrlV1()}/groups/${groupId}/action`, { method: "PUT", headers: this._headersV1(), body: JSON.stringify({ on: false }) });
      if (!res.ok) throw new Error(`Failed to turn off group ${groupId}`);
      return res.json();
    }
  },

  async signalLight(lightId) {
    if (this._apiVersion === "v2") {
      const res = await fetch(`${this._baseUrlV2()}/resource/light/${lightId}`, { method: "PUT", headers: this._headersV2(), body: JSON.stringify({ alert: { action: "breathe" } }) });
      return res.json();
    } else {
      const res = await fetch(`${this._baseUrlV1()}/lights/${lightId}/state`, { method: "PUT", headers: this._headersV1(), body: JSON.stringify({ alert: "lselect" }) });
      return res.json();
    }
  },
};

export default HueBridgeService;