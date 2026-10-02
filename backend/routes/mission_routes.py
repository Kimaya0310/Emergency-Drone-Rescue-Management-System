from flask import Blueprint, request, jsonify

from services.path_planning import (
    generate_grid_path,
    calculate_route_distance
)
from utils.validators import validate_boundary


mission_bp = Blueprint(
    "mission",
    __name__,
    url_prefix="/api/mission"
)


@mission_bp.post("/generate-path")
def generate_path():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "error": "A valid JSON request body is required."
        }), 400

    boundary = data.get("boundary")

    valid, message = validate_boundary(boundary)

    if not valid:
        return jsonify({
            "success": False,
            "error": message
        }), 400

    try:
        rows = int(data.get("rows", 6))
        columns = int(data.get("columns", 8))

        if not 2 <= rows <= 30 or not 2 <= columns <= 30:
            return jsonify({
                "success": False,
                "error": "Rows and columns must be between 2 and 30."
            }), 400

        waypoints = generate_grid_path(
            boundary,
            rows=rows,
            columns=columns
        )

        if len(waypoints) < 2:
            return jsonify({
                "success": False,
                "error": (
                    "Unable to generate a usable path. "
                    "Try selecting a larger search area."
                )
            }), 400

        distance = calculate_route_distance(waypoints)

        return jsonify({
            "success": True,
            "boundary": boundary,
            "waypoints": waypoints,
            "waypointCount": len(waypoints),
            "distanceKm": distance,
            "message": "Simulated flight path generated successfully."
        }), 200

    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "error": "Rows and columns must be valid integers."
        }), 400

    except Exception:
        return jsonify({
            "success": False,
            "error": "An unexpected error occurred during path generation."
        }), 500