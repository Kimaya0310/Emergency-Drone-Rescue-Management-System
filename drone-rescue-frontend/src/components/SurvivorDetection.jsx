import { useRef, useState } from "react";
import { detectSurvivors } from "../services/api";

export default function SurvivorDetection() {
  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [latitude, setLatitude] = useState("21.1458");
  const [longitude, setLongitude] = useState("79.0882");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    setError("");
    setResult(null);

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be 10 MB or less.");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleDetection(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!image) {
      setError("Please upload an image first.");
      return;
    }

    if (
      latitude.trim() === "" ||
      longitude.trim() === "" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      setError("Enter valid latitude and longitude values.");
      return;
    }

    setLoading(true);

    try {
      const data = await detectSurvivors(image, lat, lng);
      setResult(data);
    } catch (err) {
      setError(
        err.message ||
          "Detection failed. Check whether the Flask backend and YOLO model are running."
      );
    } finally {
      setLoading(false);
    }
  }

  function clearImage() {
    if (preview) URL.revokeObjectURL(preview);

    setImage(null);
    setPreview("");
    setResult(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <section className="workspace">
      <div className="section-heading">
        <div>
          <span className="eyebrow">SEARCH & RESCUE</span>
          <h2>Survivor Detection</h2>
          <p>
            Analyse an image for people and associate detections with a
            reported location.
          </p>
        </div>

        <span className="status-pill">
          <span className="status-dot" />
          Image analysis
        </span>
      </div>

      <div className="detection-layout">
        <div className="panel upload-panel">
          <div className="panel-heading">
            <div>
              <h3>Image Input</h3>
              <p>Upload a JPG, PNG, or other supported image.</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="file-input"
            id="rescue-image"
          />

          {preview ? (
            <div className="image-preview-wrap">
              <img
                src={preview}
                alt="Uploaded scene for analysis"
                className="image-preview"
              />
              <button
                type="button"
                className="button button-secondary clear-image"
                onClick={clearImage}
              >
                Remove image
              </button>
            </div>
          ) : (
            <label htmlFor="rescue-image" className="upload-dropzone">
              <span className="upload-icon">↑</span>
              <strong>Upload an image</strong>
              <span>Click here to browse your files</span>
              <small>Maximum file size: 10 MB</small>
            </label>
          )}

          {preview && (
            <p className="file-name">
              Selected file: <strong>{image?.name}</strong>
            </p>
          )}

          <form onSubmit={handleDetection} className="detection-form">
            <h3>Reported Location</h3>
            <p className="field-help">
              Enter the coordinates associated with the uploaded image.
            </p>

            <div className="coordinate-grid">
              <label className="field-label">
                Latitude
                <input
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={latitude}
                  onChange={(event) => setLatitude(event.target.value)}
                  required
                />
              </label>

              <label className="field-label">
                Longitude
                <input
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={longitude}
                  onChange={(event) => setLongitude(event.target.value)}
                  required
                />
              </label>
            </div>

            {error && <div className="feedback feedback-error">{error}</div>}

            <button
              className="button button-primary full-width"
              type="submit"
              disabled={loading}
            >
              {loading ? "Analysing image..." : "Analyse Image"}
            </button>
          </form>
        </div>

        <div className="panel results-panel">
          <div className="panel-heading">
            <div>
              <h3>Detection Results</h3>
              <p>Model output and potential survivor alerts.</p>
            </div>
          </div>

          {!result && !loading && (
            <div className="empty-results">
              <div className="empty-results-icon">⌕</div>
              <h3>Awaiting image analysis</h3>
              <p>
                Upload a scene image, verify its coordinates, and select
                Analyse Image to view the results.
              </p>
            </div>
          )}

          {loading && (
            <div className="empty-results">
              <div className="loading-spinner" />
              <h3>Analysing image</h3>
              <p>The backend is running the object detection model.</p>
            </div>
          )}

          {result && (
            <div className="results-content">
              <div
                className={`alert-banner ${
                  result.alert ? "alert-detected" : "alert-clear"
                }`}
              >
                <strong>
                  {result.alert
                    ? "Potential survivor detected"
                    : "No people detected"}
                </strong>
                <p>
                  {result.alert
                    ? "Review the detections and verify the location before dispatching responders."
                    : "The model did not identify a person at its current confidence threshold. This does not confirm that the area is empty."}
                </p>
              </div>

              <div className="result-stat-grid">
                <div className="result-stat">
                  <span>People detected</span>
                  <strong>{result.detectionCount ?? 0}</strong>
                </div>

                <div className="result-stat">
                  <span>Confidence threshold</span>
                  <strong>
                    {result.confidenceThreshold != null
                      ? `${(result.confidenceThreshold * 100).toFixed(0)}%`
                      : "45%"}
                  </strong>
                </div>
              </div>

              <h3 className="detections-title">Detection Details</h3>

              {result.detections?.length > 0 ? (
                <div className="detection-list">
                  {result.detections.map((detection, index) => (
                    <article className="detection-card" key={index}>
                      <div className="detection-card-top">
                        <strong>
                          Potential Survivor #{index + 1}
                        </strong>
                        <span className="confidence-pill">
                          {detection.confidence}%
                        </span>
                      </div>

                      <div className="detection-details">
                        <span>
                          <b>Latitude:</b> {detection.latitude}
                        </span>
                        <span>
                          <b>Longitude:</b> {detection.longitude}
                        </span>
                      </div>

                      {detection.boundingBox && (
                        <details>
                          <summary>Bounding box coordinates</summary>
                          <p>
                            x1: {detection.boundingBox.x1}, y1:{" "}
                            {detection.boundingBox.y1}
                          </p>
                          <p>
                            x2: {detection.boundingBox.x2}, y2:{" "}
                            {detection.boundingBox.y2}
                          </p>
                        </details>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="no-detections">
                  No detections met the model's confidence threshold.
                </p>
              )}

              <p className="disclaimer">
                YOLO detects people, not confirmed survivors. A detection
                requires human verification. The displayed coordinates are
                supplied by the operator and are not automatically derived
                from the image.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}