import { useState } from "react";
import SIGNALS from "../config/signals";
import LightSimulation from "./LightSimulation";
import styles from "./RoomCard.module.css";

export default function RoomCard({ room, activeSignalId, onSendSignal }) {
  const [sending, setSending] = useState(false);
  const activeSignal = SIGNALS.find((s) => s.id === activeSignalId) || null;

  const handleSignal = async (signalId) => {
    setSending(true);
    await onSendSignal(room.id, signalId);
    setTimeout(() => setSending(false), 300);
  };

  return (
    <div
      className={styles.card}
      style={{
        borderColor: activeSignal ? activeSignal.hex : undefined,
        boxShadow: activeSignal
          ? `0 0 24px ${activeSignal.hex}20, 0 1px 3px rgba(0,0,0,0.3)`
          : undefined,
      }}
    >
      {/* Active signal glow bar */}
      {activeSignal && (
        <div
          className={styles.glowBar}
          style={{ backgroundColor: activeSignal.hex }}
        />
      )}

      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.name}>{room.name}</h3>
        {activeSignal ? (
          <span
            className={styles.badge}
            style={{
              backgroundColor: `${activeSignal.hex}15`,
              color: activeSignal.hex,
              borderColor: `${activeSignal.hex}40`,
            }}
          >
            <span className={styles.badgeIcon}>{activeSignal.icon}</span>
            {activeSignal.label}
          </span>
        ) : (
          <span className={styles.idle}>Idle</span>
        )}
      </div>

      {/* Visual light simulation */}
      <LightSimulation lights={room.lights} activeSignal={activeSignal} />

      {/* Signal buttons */}
      <div className={styles.signals}>
        {SIGNALS.map((signal) => {
          const isActive = activeSignal && activeSignal.id === signal.id;
          return (
            <button
              key={signal.id}
              className={`${styles.signalBtn} ${isActive ? styles.signalBtnActive : ""}`}
              onClick={() => handleSignal(signal.id)}
              disabled={sending}
              title={signal.description}
              style={{
                "--signal-color": signal.hex,
                borderColor: isActive ? signal.hex : undefined,
                backgroundColor: isActive ? `${signal.hex}12` : undefined,
              }}
            >
              <span
                className={styles.dot}
                style={{
                  backgroundColor: signal.id === "clear" ? "transparent" : signal.hex,
                  border: signal.id === "clear" ? `2px solid ${signal.hex}` : "none",
                }}
              />
              <span className={styles.label}>{signal.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        {room.lights.length} light{room.lights.length !== 1 ? "s" : ""} in this
        room
      </div>
    </div>
  );
}
