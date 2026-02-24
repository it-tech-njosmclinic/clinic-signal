import { useState, useCallback, useRef, useEffect } from "react";
import HueBridgeService from "./services/hueBridge";
import SIGNALS from "./config/signals";
import DEMO_ROOMS from "./config/demoRooms";
import RoomCard from "./components/RoomCard";
import ActivityLog from "./components/ActivityLog";
import Settings from "./components/Settings";
import Toast from "./components/Toast";
import styles from "./App.module.css";

// ============================================================
// ACTIVITY LOG HOOK
// ============================================================
function useActivityLog() {
  const [logs, setLogs] = useState([]);

  const addLog = useCallback((roomName, signalLabel, success = true) => {
    setLogs((prev) => [
      {
        id: Date.now(),
        timestamp: new Date(),
        roomName,
        signalLabel,
        success,
      },
      ...prev.slice(0, 49),
    ]);
  }, []);

  return { logs, addLog };
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  // Navigation
  const [view, setView] = useState("control");

  // Bridge connection — load saved credentials from localStorage
  const [bridgeIp, setBridgeIp] = useState(
    () => localStorage.getItem("clinic-signal-ip") || ""
  );
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("clinic-signal-key") || ""
  );
  const [connected, setConnected] = useState(false);
  const [demoMode, setDemoMode] = useState(true);
  const [connectionError, setConnectionError] = useState("");
  const [needsCert, setNeedsCert] = useState(false);
  const [certUrl, setCertUrl] = useState("");
  const [apiVersion, setApiVersion] = useState("");

  // Room & signal state
  const [rooms, setRooms] = useState(DEMO_ROOMS);
  const [roomSignals, setRoomSignals] = useState({});

  // Toast
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // Activity log
  const { logs, addLog } = useActivityLog();

  // ── Save credentials to localStorage when they change ──
  useEffect(() => {
    if (bridgeIp) localStorage.setItem("clinic-signal-ip", bridgeIp);
  }, [bridgeIp]);

  useEffect(() => {
    if (apiKey) localStorage.setItem("clinic-signal-key", apiKey);
  }, [apiKey]);

  // ── Toast helper ──
  const showToast = useCallback((message, type = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  // ── Connect to bridge ──
  const handleConnect = async () => {
    if (!bridgeIp || !apiKey) {
      setConnectionError("Please enter both Bridge IP and API key.");
      setNeedsCert(false);
      return;
    }

    setConnectionError("");
    setNeedsCert(false);
    setCertUrl("");

    HueBridgeService.configure(bridgeIp, apiKey);
    const result = await HueBridgeService.testConnection();

    if (result.success) {
      setConnected(true);
      setDemoMode(false);
      setApiVersion(result.apiVersion || "");
      showToast(`Connected via API ${result.apiVersion}`);

      // Fetch real rooms from bridge
      try {
        const bridgeRooms = await HueBridgeService.getRooms();
        const mapped = bridgeRooms.map((r) => ({
          id: r.id,
          name: r.metadata?.name || r.id,
          lights: r.children
            ?.filter((c) => c.rtype === "device")
            .map((c) => c.rid) || [],
          groupedLightId: r.services?.find(
            (s) => s.rtype === "grouped_light"
          )?.rid,
        }));
        if (mapped.length > 0) setRooms(mapped);
      } catch {
        // Keep demo rooms if fetch fails
      }
    } else if (result.needsCert) {
      // Certificate needs to be accepted
      setNeedsCert(true);
      setCertUrl(result.certUrl || HueBridgeService.getCertAcceptUrl());
      setConnectionError(result.error);
    } else {
      setConnectionError(result.error);
    }
  };

  // ── Retry after user accepts certificate ──
  const handleRetryAfterCert = async () => {
    setNeedsCert(false);
    setCertUrl("");
    setConnectionError("");
    await handleConnect();
  };

  const handleDisconnect = () => {
    setConnected(false);
    setDemoMode(true);
    setApiVersion("");
    setRooms(DEMO_ROOMS);
    setRoomSignals({});
    showToast("Disconnected — demo mode", "info");
  };

  // ── Send signal to a room ──
  const sendSignal = async (roomId, signalId) => {
    const room = rooms.find((r) => r.id === roomId);
    const signal = SIGNALS.find((s) => s.id === signalId);
    if (!room || !signal) return;

    try {
      if (!demoMode && connected) {
        if (signal.id === "clear") {
          if (room.groupedLightId) {
            await HueBridgeService.turnOffGroup(room.groupedLightId);
          } else {
            for (const lid of room.lights) {
              await HueBridgeService.turnOff(lid);
            }
          }
        } else if (room.groupedLightId) {
          await HueBridgeService.setGroupedLightColor(
            room.groupedLightId,
            signal.color,
            signal.brightness
          );
        } else {
          for (const lid of room.lights) {
            await HueBridgeService.setLightColor(
              lid,
              signal.color,
              signal.brightness
            );
          }
        }
      }

      if (signal.id === "clear") {
        setRoomSignals((prev) => {
          const next = { ...prev };
          delete next[roomId];
          return next;
        });
      } else {
        setRoomSignals((prev) => ({ ...prev, [roomId]: signalId }));
      }

      addLog(room.name, signal.label, true);
      showToast(`${signal.label} → ${room.name}`);
    } catch (err) {
      addLog(room.name, signal.label, false);
      showToast(`Failed: ${err.message}`, "error");
    }
  };

  // ── Clear all rooms ──
  const clearAll = async () => {
    for (const room of rooms) {
      await sendSignal(room.id, "clear");
    }
    showToast("All rooms cleared");
  };

  // ── Render ──
  return (
    <div className={styles.app}>
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <span className={styles.logoDot} />
          </div>
          <div>
            <h1 className={styles.title}>Clinic Signal</h1>
            <p className={styles.subtitle}>Light Messaging System</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div
            className={styles.statusBadge}
            data-connected={connected ? "true" : "false"}
          >
            <span className={styles.statusDot} />
            {connected ? "Bridge Connected" : "Demo Mode"}
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav className={styles.nav}>
        {[
          { id: "control", label: "Control Panel" },
          { id: "log", label: `Activity Log${logs.length ? ` (${logs.length})` : ""}` },
          { id: "settings", label: "Settings" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`${styles.tab} ${view === tab.id ? styles.tabActive : ""}`}
          >
            {tab.label}
          </button>
        ))}

        {view === "control" && Object.keys(roomSignals).length > 0 && (
          <button onClick={clearAll} className={styles.clearAllBtn}>
            Clear All
          </button>
        )}
      </nav>

      {/* Main content */}
      <main className={styles.main}>
        {view === "control" && (
          <div className={styles.roomGrid}>
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                activeSignalId={roomSignals[room.id]}
                onSendSignal={sendSignal}
              />
            ))}
          </div>
        )}

        {view === "log" && <ActivityLog logs={logs} />}

        {view === "settings" && (
          <Settings
            bridgeIp={bridgeIp}
            setBridgeIp={setBridgeIp}
            apiKey={apiKey}
            setApiKey={setApiKey}
            connected={connected}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            connectionError={connectionError}
            needsCert={needsCert}
            certUrl={certUrl}
            onRetryAfterCert={handleRetryAfterCert}
            apiVersion={apiVersion}
          />
        )}
      </main>
    </div>
  );
}