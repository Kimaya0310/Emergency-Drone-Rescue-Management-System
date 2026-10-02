import { useEffect, useState } from "react";
import {
  Activity,
  MapPinned,
  ScanSearch,
  ShieldCheck,
  Radio,
} from "lucide-react";

import MissionPlanning from "./components/MissionPlanning";
import SurvivorDetection from "./components/SurvivorDetection";
import { checkBackendHealth } from "./services/api";

export default function App() {
  const [activeTab, setActiveTab] = useState("mission");
  const [backendStatus, setBackendStatus] = useState("checking");

  useEffect(() => {
    let mounted = true;

    async function checkConnection() {
      try {
        await checkBackendHealth();
        if (mounted) setBackendStatus("online");
      } catch {
        if (mounted) setBackendStatus("offline");
      }
    }

    checkConnection();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard">
          <div className="brand-mark">
            <Radio size={22} />
          </div>
          <div>
            <strong>ResQ</strong>
            <span>DRONE RESPONSE</span>
          </div>
        </a>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <button
            className={`nav-item ${
              activeTab === "mission" ? "active" : ""
            }`}
            onClick={() => setActiveTab("mission")}
          >
            <MapPinned size={18} />
            <span>Mission Planning</span>
          </button>

          <button
            className={`nav-item ${
              activeTab === "detection" ? "active" : ""
            }`}
            onClick={() => setActiveTab("detection")}
          >
            <ScanSearch size={18} />
            <span>Survivor Detection</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-status-icon">
            <ShieldCheck size={18} />
          </div>
          <div>
            <strong>Rescue System</strong>
            <span>Academic prototype</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <span className="topbar-kicker">EMERGENCY RESPONSE PLATFORM</span>
            <h1>Rescue Operations</h1>
          </div>

          <div className="connection-status">
            <span
              className={`connection-dot ${backendStatus}`}
            />
            <span>
              {backendStatus === "checking"
                ? "Checking backend"
                : backendStatus === "online"
                  ? "Backend connected"
                  : "Backend offline"}
            </span>
          </div>
        </header>

        <div className="page-content">
          {activeTab === "mission" ? (
            <MissionPlanning />
          ) : (
            <SurvivorDetection />
          )}
        </div>

        <footer className="app-footer">
          <span>
            <Activity size={14} />
            ResQ · Drone-Based Emergency Rescue Management
          </span>
          <span>Prototype · Simulation only</span>
        </footer>
      </main>
    </div>
  );
}