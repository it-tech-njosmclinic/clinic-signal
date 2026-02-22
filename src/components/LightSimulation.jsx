import styles from "./LightSimulation.module.css";

// ============================================================
// LIGHT SIMULATION
// ============================================================
//
// Visual representation of the lights in a room.
// Shows animated "bulbs" that glow and change color when a
// signal is active. Makes demo mode feel like real lights.
// ============================================================

export default function LightSimulation({ lights, activeSignal }) {
  const isOn = !!activeSignal;
  const color = activeSignal ? activeSignal.hex : "#2a2a35";
  const brightness = activeSignal ? activeSignal.brightness / 100 : 0;

  return (
    <div className={styles.room}>
      {/* Room background glow */}
      {isOn && (
        <div
          className={styles.ambientGlow}
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${color}30 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Light fixtures */}
      <div className={styles.fixtures}>
        {lights.map((lightId, i) => (
          <div key={lightId} className={styles.fixtureWrapper}>
            {/* Fixture mount */}
            <div className={styles.mount} />
            <div className={styles.cord} />

            {/* The bulb */}
            <div
              className={`${styles.bulb} ${isOn ? styles.bulbOn : ""}`}
              style={{
                "--bulb-color": color,
                "--bulb-opacity": brightness,
                animationDelay: `${i * 150}ms`,
              }}
            >
              {/* Inner glow */}
              {isOn && (
                <>
                  <div
                    className={styles.innerGlow}
                    style={{ backgroundColor: color }}
                  />
                  <div
                    className={styles.outerGlow}
                    style={{
                      boxShadow: `0 0 20px ${color}80, 0 0 40px ${color}40, 0 0 60px ${color}20`,
                    }}
                  />
                  {/* Pulse ring for emergency */}
                  {activeSignal?.priority >= 4 && (
                    <div
                      className={styles.pulseRing}
                      style={{ borderColor: color }}
                    />
                  )}
                </>
              )}
            </div>

            {/* Light cone */}
            {isOn && (
              <div
                className={styles.lightCone}
                style={{
                  background: `linear-gradient(180deg, ${color}25 0%, ${color}08 60%, transparent 100%)`,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Floor reflection */}
      {isOn && (
        <div
          className={styles.floorReflection}
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${color}18 0%, transparent 70%)`,
          }}
        />
      )}
    </div>
  );
}
