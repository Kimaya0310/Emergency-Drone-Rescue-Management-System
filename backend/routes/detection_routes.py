from datetime import datetime, timezone
from io import BytesIO

from flask import Blueprint, request, jsonify
from PIL import Image, UnidentifiedImageError

from services.detection import (
    detect_survivors,
    CONFIDENCE_THRESHOLD
)
from utils.validators import (
    validate_latitude,
    validate_longitude
)


detection_bp = Blueprint(
    "detection",
    __name__,
    url_prefix="/api/detection"
)

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB


@detection_bp.post("/detect")
def detect():
    if "image" not in request.files:
        return jsonify({
            "success": False,
            "error": "No image file was uploaded."
        }), 400

    image_file = request.files["image"]

    if not image_file.filename:
        return jsonify({
            "success": False,
            "error": "Please select an image."
        }), 400

    image_bytes = image_file.read(MAX_IMAGE_SIZE + 1)

    if not image_bytes:
        return jsonify({
            "success": False,
            "error": "The uploaded image is empty."
        }), 400

    if len(image_bytes) > MAX_IMAGE_SIZE:
        return jsonify({
            "success": False,
            "error": "Image size must not exceed 10 MB."
        }), 413

    try:
        with Image.open(BytesIO(image_bytes)) as uploaded_image:
            uploaded_image.verify()

        with Image.open(BytesIO(image_bytes)) as uploaded_image:
            image = uploaded_image.convert("RGB")

    except (UnidentifiedImageError, OSError, ValueError):
        return jsonify({
            "success": False,
            "error": "The uploaded file is not a valid image."
        }), 400

    latitude = request.form.get("latitude")
    longitude = request.form.get("longitude")

    if not validate_latitude(latitude):
        return jsonify({
            "success": False,
            "error": "Latitude must be between -90 and 90."
        }), 400

    if not validate_longitude(longitude):
        return jsonify({
            "success": False,
            "error": "Longitude must be between -180 and 180."
        }), 400

    latitude = float(latitude)
    longitude = float(longitude)

    try:
        detections = detect_survivors(
            image,
            latitude,
            longitude
        )

        alert_generated = len(detections) > 0

        message = (
            f"{len(detections)} potential survivor(s) detected."
            if alert_generated
            else "No potential survivor detected above the confidence threshold."
        )

        return jsonify({
            "success": True,
            "filename": image_file.filename,
            "imageWidth": image.width,
            "imageHeight": image.height,
            "threshold": CONFIDENCE_THRESHOLD * 100,
            "detectionCount": len(detections),
            "detections": detections,
            "alert": {
                "generated": alert_generated,
                "message": message
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 200

    except Exception:
        # Keep internal exception details out of the API response.
        app_logger_message = "YOLO inference failed."
        print(app_logger_message)

        return jsonify({
            "success": False,
            "error": "Image analysis failed. Check the backend terminal."
        }), 500