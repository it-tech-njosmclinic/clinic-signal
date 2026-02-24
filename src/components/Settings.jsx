import { useState } from "react";
import SIGNALS from "../config/signals";
import HueBridgeService from "../services/hueBridge";
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
  needsCert,
  certUrl,
  onRetryAfterCert,
  apiVersion,
}) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className={styles.container}>
      {/* Bridge connection */}
      <section className={styles.section}>
        <h2 className={styles.title}>Hue Bridge Connection</h2>
        <p className={styles.desc}>
          Connect to your Philips Hue Bridge to control real lights. Works from
          any device on the same network as the bridge.
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
            Find this in the Hue app → Settings → Hue Bridges → (i) icon
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

        {/* Certificate acceptance prompt */}
        {needsCert && certUrl && (
          <div className={styles.certBox}>
            <div className={styles.certHeader}>
              <span className={styles.certIcon}>🔒</span>
              <strong>Certificate Required</strong>
            </div>
            <p className={styles.certText}>
              The Hue Bridge uses a self-signed security certificate. Your
              browser blocks requests to it until you accept the certificate.
              This is a one-time step.
            </p>
            <div className={styles.certSteps}>
              <div className={styles.certStep}>
                <span className={styles.stepNum}>1</span>
                <span>
                  Click the button below to open the bridge in a new tab
                </span>
              </div>
              <div className={styles.certStep}>
                <span className={styles.stepNum}>2</span>
                <span>
                  Click <strong>"Advanced"</strong> → then{" "}
                  <strong>"Proceed"</strong> (or "Accept the Risk")
                </span>
              </div>
              <div className={styles.certStep}>
                <span className={styles.stepNum}>3</span>
                <span>Come back here and click "Retry Connection"</span>
              </div>
            </div>
            <div className={styles.certActions}>
              <a
                href={certUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.certLink}
              >
                Open Bridge (Accept Certificate) →
              </a>
              <button onClick={onRetryAfterCert} className={styles.retryBtn}>
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* Regular error (not cert-related) */}
        {connectionError && !needsCert && (
          <p className={styles.error}>{connectionError}</p>
        )}

        {/* Connected success indicator */}
        {connected && (
          <div className={styles.connectedBox}>
            <span className={styles.connectedDot} />
            <span>
              Connected via API {apiVersion || ""}
            </span>
          </div>
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
            <strong>How it works:</strong> This app runs in your browser and
            talks directly to the Hue Bridge on your local WiFi. The Vercel
            hosting just delivers the app code — all bridge communication
            happens locally.
          </p>
          <p>
            <strong>First time setup:</strong> You'll need to accept the
            bridge's security certificate once. The app will guide you through
            this automatically.
          </p>
          <p>
            <strong>Rate limits:</strong> The Hue Bridge handles ~10
            commands/sec. Grouped lights (entire room) count as 1 command.
          </p>
          <p>
            <strong>Add rooms:</strong> Rooms are configured in the Hue app.
            Once connected, this app auto-discovers them.
          </p>
        </div>
      </section>
    </div>
  );
}