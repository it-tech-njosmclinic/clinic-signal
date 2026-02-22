import { useState } from "react";
import SIGNALS from "../config/signals";
import styles from "./Settings.module.css";

export default function Settings({
  bridgeIp,
  setBridgeIp,
  apiKey,
  setApiKey,
  connected,
  onConnect,
  onDisconnect,
  connectionError,
}) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className={styles.container}>
      {/* Bridge connection */}
      <section className={styles.section}>
        <h2 className={styles.title}>Hue Bridge Connection</h2>
        <p className={styles.desc}>
          Connect to your Philips Hue Bridge to control real lights. See the
          README for detailed setup instructions.
        </p>

        <div className={styles.field}>
          <label className={styles.label}>Bridge IP Address</label>
          <input
            type="text"
            placeholder="e.g. 192.168.1.100"
            value={bridgeIp}
            onChange={(e) => setBridgeIp(e.target.value)}
            className={styles.input}
          />
          <span className={styles.hint}>
            Find this in the Hue app → Settings → Hue Bridges
          </span>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>API Key</label>
          <div className={styles.inputRow}>
            <input
              type={showKey ? "text" : "password"}
              placeholder="Your hue-application-key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className={styles.input}
            />
            <button
              className={styles.toggleBtn}
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {connectionError && (
          <p className={styles.error}>{connectionError}</p>
        )}

        <div className={styles.actions}>
          {!connected ? (
            <button onClick={onConnect} className={styles.primaryBtn}>
              Connect to Bridge
            </button>
          ) : (
            <button onClick={onDisconnect} className={styles.dangerBtn}>
              Disconnect
            </button>
          )}
        </div>
      </section>

      {/* Signal reference */}
      <section className={styles.section}>
        <h2 className={styles.title}>Signal Reference</h2>
        <p className={styles.desc}>
          Current signal definitions. To customize, edit{" "}
          <code className={styles.code}>src/config/signals.js</code>
        </p>

        <div className={styles.signalList}>
          {SIGNALS.filter((s) => s.id !== "clear").map((signal) => (
            <div key={signal.id} className={styles.signalItem}>
              <span
                className={styles.signalDot}
                style={{ backgroundColor: signal.hex }}
              />
              <div>
                <strong className={styles.signalName}>{signal.label}</strong>
                <p className={styles.signalDesc}>{signal.description}</p>
                <span className={styles.signalMeta}>
                  Priority: {signal.priority} · Brightness: {signal.brightness}%
                  · CIE: ({signal.color.x}, {signal.color.y})
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick reference */}
      <section className={styles.section}>
        <h2 className={styles.title}>Quick Reference</h2>
        <div className={styles.notes}>
          <p>
            <strong>Local-first:</strong> All communication happens directly
            between this browser and the Hue Bridge on your WiFi. No internet
            needed.
          </p>
          <p>
            <strong>Rate limits:</strong> The Hue Bridge handles ~10
            commands/sec. Grouped lights (entire room) count as 1 command.
          </p>
          <p>
            <strong>Add rooms:</strong> Rooms are configured in the Hue app.
            Once connected, this app auto-discovers them.
          </p>
          <p>
            <strong>Add signals:</strong> Edit{" "}
            <code className={styles.code}>src/config/signals.js</code> to add
            new colors/messages.
          </p>
        </div>
      </section>
    </div>
  );
}
