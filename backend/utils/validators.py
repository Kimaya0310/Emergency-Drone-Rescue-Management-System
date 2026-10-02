def validate_latitude(latitude):
    """Validate latitude between -90 and 90 degrees."""
    try:
        latitude = float(latitude)
        return -90 <= latitude <= 90
    except (TypeError, ValueError):
        return False


def validate_longitude(longitude):
    """Validate longitude between -180 and 180 degrees."""
    try:
        longitude = float(longitude)
        return -180 <= longitude <= 180
    except (TypeError, ValueError):
        return False


def validate_boundary(boundary):
    """Validate a search boundary containing at least three points."""

    if not isinstance(boundary, list):
        return False, "Boundary must be a list."

    if len(boundary) < 3:
        return False, "At least 3 boundary points are required."

    for point in boundary:
        if not isinstance(point, dict):
            return False, "Each boundary point must be an object."

        if "lat" not in point or "lng" not in point:
            return False, "Each point must contain lat and lng."

        if not validate_latitude(point["lat"]):
            return False, "Invalid latitude value."

        if not validate_longitude(point["lng"]):
            return False, "Invalid longitude value."

    # Reject boundaries with no area.
    area = 0.0

    for i in range(len(boundary)):
        j = (i + 1) % len(boundary)
        area += (
            float(boundary[i]["lng"]) * float(boundary[j]["lat"])
            - float(boundary[j]["lng"]) * float(boundary[i]["lat"])
        )

    if abs(area) < 1e-12:
        return False, "The selected boundary must enclose an area."

    return True, "Valid boundary."