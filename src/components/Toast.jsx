import styles from "./Toast.module.css";

export default function Toast({ message, type = "success" }) {
  const colorMap = {
    success: "var(--signal-green)",
    error: "var(--signal-red)",
    info: "var(--signal-blue)",
  };

  return (
    <div className={styles.toast} style={{ backgroundColor: colorMap[type] }}>
      {message}
    </div>
  );
}
