import styles from "./ActivityLog.module.css";

export default function ActivityLog({ logs }) {
  if (logs.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No activity yet</p>
        <span>Send a signal from the Control Panel to see it here.</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {logs.map((log, i) => (
        <div
          key={log.id}
          className={styles.entry}
          style={{ animationDelay: `${i * 30}ms` }}
        >
          <div
            className={styles.status}
            style={{ backgroundColor: log.success ? "var(--signal-green)" : "var(--signal-red)" }}
          />
          <div className={styles.content}>
            <span className={styles.signal}>{log.signalLabel}</span>
            <span className={styles.arrow}>→</span>
            <span className={styles.room}>{log.roomName}</span>
          </div>
          <time className={styles.time}>
            {log.timestamp.toLocaleTimeString()}
          </time>
        </div>
      ))}
    </div>
  );
}
