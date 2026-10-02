from pathlib import Path
from ultralytics import YOLO


BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "yolo11n.pt"

CONFIDENCE_THRESHOLD = 0.45

if not MODEL_PATH.is_file():
    raise FileNotFoundError(
        f"YOLO model not found: {MODEL_PATH}"
    )

model = YOLO(str(MODEL_PATH))


def detect_survivors(image, latitude, longitude):
    """
    Detect people in an image.

    COCO class 0 represents a person. These detections are
    treated as potential survivors, not confirmed survivors.
    """

    results = model.predict(
        source=image,
        conf=CONFIDENCE_THRESHOLD,
        verbose=False
    )

    detections = []

    for result in results:
        if result.boxes is None:
            continue

        for box in result.boxes:
            class_id = int(box.cls[0].item())

            if class_id != 0:
                continue

            confidence = float(box.conf[0].item())

            x1, y1, x2, y2 = [
                round(float(value), 2)
                for value in box.xyxy[0].tolist()
            ]

            detections.append({
                "label": "Potential Survivor",
                "confidence": round(confidence * 100, 2),
                "boundingBox": {
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2
                },
                "latitude": latitude,
                "longitude": longitude
            })

    return detections