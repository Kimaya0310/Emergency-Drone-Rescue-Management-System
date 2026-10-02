import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Marker,
  CircleMarker,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  generateFlightPath,
} from "../services/api";

import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [21.1458, 79.0882];

const waypointIcon = L.divIcon({
  className: "waypoint-icon",
  html: '<div class="waypoint-dot"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

function MapClickHandler({ onMapClick, enabled }) {
  useMapEvents({
    click(event) {
      if (enabled) {
        onMapClick({
          lat: Number(event.latlng.lat.toFixed(6)),
          lng: Number(event.latlng.lng.toFixed(6)),
        });
      }
    },
  });

  return null;
}

export default function MissionPlanning() {
  const [boundary, setBoundary] = useState([]);
  const [waypoints, setWaypoints] = useState([]);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [rows, setRows] = useState(6);
  const [columns, setColumns] = useState(8);

  function addBoundaryPoint(point) {
    setBoundary((previous) => [...previous, point]);
    setWaypoints([]);
    setDistance(null);
    setMessage("");
    setError("");
  }

  function undoLastPoint() {
    setBoundary((previous) => previous.slice(0, -1));
    setWaypoints([]);
    setDistance(null);
  }

  function resetMission() {
    setBoundary([]);
    setWaypoints([]);
    setDistance(null);
    setError("");
    setMessage("");
  }

  async function handleGeneratePath() {
    setError("");
    setMessage("");

    if (boundary.length < 3) {
      setError("Select at least three boundary points on the map.");
      return;
    }

    setLoading(true);

    try {
      const result = await generateFlightPath(
        boundary,
        Number(rows),
        Number(columns)
      );

      if (!result.success) {
        throw new Error(result.message || "Could not generate the path.");
      }

      setWaypoints(result.waypoints || []);
      setDistance(result.distanceKm ?? 0);
      setMessage(result.message || "Search path generated successfully.");
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the backend. Check whether Flask is running."
      );
    } finally {
      setLoading(false);
    }
  }

  const boundaryPositions = boundary.map((point) => [
    point.lat,
    point.lng,
  ]);

  const waypointPositions = waypoints.map((point) => [
    point.lat,
    point.lng,
  ]);

  return (
    <section className="workspace">
      <div className="section-heading">
        <div>
          <span className="eyebrow">MISSION OPERATIONS</span>
          <h2>Mission Planning</h2>
          <p>
            Define the search boundary and generate a simulated drone search
            route.
          </p>
        </div>

        <span className="status-pill">
          <span className="status-dot" />
          Simulation mode
        </span>
      </div>

      <div className="mission-layout">
        <div className="map-panel panel">
          <div className="panel-heading">
            <div>
              <h3>Search Area Map</h3>
              <p>Click on the map to mark boundary points.</p>
            </div>
            <span className="count-pill">{boundary.length} points</span>
          </div>

          <div className="map-container">
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={14}
              scrollWheelZoom
              className="rescue-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapClickHandler
                onMapClick={addBoundaryPoint}
                enabled={!loading}
              />

              {boundaryPositions.length >= 3 && (
                <Polygon
                  positions={boundaryPositions}
                  pathOptions={{
                    color: "#3978d4",
                    fillColor: "#6da5f5",
                    fillOpacity: 0.16,
                    weight: 2,
                  }}
                />
              )}

              {boundary.map((point, index) => (
                <CircleMarker
                  key={`boundary-${index}`}
                  center={[point.lat, point.lng]}
                  radius={6}
                  pathOptions={{
                    color: "#ffffff",
                    weight: 2,
                    fillColor: "#3978d4",
                    fillOpacity: 1,
                  }}
                >
                  <></>
                </CircleMarker>
              ))}

              {waypointPositions.length > 0 && (
                <Polyline
                  positions={waypointPositions}
                  pathOptions={{
                    color: "#e28b42",
                    weight: 3,
                    opacity: 0.9,
                  }}
                />
              )}

              {waypoints.map((point, index) => (
                <Marker
                  key={`waypoint-${index}`}
                  position={[point.lat, point.lng]}
                  icon={waypointIcon}
                />
              ))}
            </MapContainer>
          </div>

          <div className="map-legend">
            <span><i className="legend-boundary" /> Boundary</span>
            <span><i className="legend-route" /> Flight route</span>
            <span><i className="legend-waypoint" /> Waypoints</span>
          </div>
        </div>

        <aside className="mission-sidebar">
          <div className="panel settings-panel">
            <div className="panel-heading">
              <div>
                <h3>Mission Configuration</h3>
                <p>Configure the simulated search pattern.</p>
              </div>
            </div>

            <label className="field-label">
              Search rows
              <input
                type="number"
                min="2"
                max="30"
                value={rows}
                onChange={(event) => setRows(event.target.value)}
              />
            </label>

            <label className="field-label">
              Sampling density
              <input
                type="number"
                min="2"
                max="30"
                value={columns}
                onChange={(event) => setColumns(event.target.value)}
              />
            </label>

            <div className="button-stack">
              <button
                className="button button-primary"
                onClick={handleGeneratePath}
                disabled={loading}
              >
                {loading ? "Generating route..." : "Generate Flight Path"}
              </button>

              <div className="button-row">
                <button
                  className="button button-secondary"
                  onClick={undoLastPoint}
                  disabled={boundary.length === 0 || loading}
                >
                  Undo Point
                </button>

                <button
                  className="button button-secondary"
                  onClick={resetMission}
                  disabled={loading}
                >
                  Reset
                </button>
              </div>
            </div>

            {error && <div className="feedback feedback-error">{error}</div>}
            {message && (
              <div className="feedback feedback-success">{message}</div>
            )}
          </div>

          <div className="panel metrics-panel">
            <h3>Mission Summary</h3>

            <div className="metric-row">
              <span>Boundary points</span>
              <strong>{boundary.length}</strong>
            </div>

            <div className="metric-row">
              <span>Generated waypoints</span>
              <strong>{waypoints.length}</strong>
            </div>

            <div className="metric-row">
              <span>Estimated route distance</span>
              <strong>{distance === null ? "—" : `${distance} km`}</strong>
            </div>
          </div>

          <div className="notice-card">
            <strong>Prototype limitation</strong>
            <p>
              This is a simulated search route. It does not control a real
              drone or account for terrain, obstacles, weather, or airspace
              restrictions.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}