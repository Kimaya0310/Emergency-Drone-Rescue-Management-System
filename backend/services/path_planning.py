from math import radians, sin, cos, sqrt, atan2


def point_inside_polygon(latitude, longitude, polygon):
    inside = False
    j = len(polygon) - 1

    for i in range(len(polygon)):
        lat_i = float(polygon[i]["lat"])
        lng_i = float(polygon[i]["lng"])
        lat_j = float(polygon[j]["lat"])
        lng_j = float(polygon[j]["lng"])

        crosses = (lat_i > latitude) != (lat_j > latitude)

        if crosses:
            intersection_lng = (
                (lng_j - lng_i) * (latitude - lat_i)
                / (lat_j - lat_i)
                + lng_i
            )

            if longitude < intersection_lng:
                inside = not inside

        j = i

    return inside


def generate_grid_path(boundary, rows=6, columns=8):
    min_lat = min(float(p["lat"]) for p in boundary)
    max_lat = max(float(p["lat"]) for p in boundary)
    min_lng = min(float(p["lng"]) for p in boundary)
    max_lng = max(float(p["lng"]) for p in boundary)

    waypoints = []
    samples_per_row = max(columns * 3, 10)

    for row in range(rows):
        ratio = row / (rows - 1) if rows > 1 else 0.5
        latitude = min_lat + (max_lat - min_lat) * ratio
        row_points = []

        for column in range(samples_per_row + 1):
            longitude = (
                min_lng
                + (max_lng - min_lng) * column / samples_per_row
            )

            if point_inside_polygon(latitude, longitude, boundary):
                row_points.append({
                    "lat": round(latitude, 6),
                    "lng": round(longitude, 6),
                })

        if row % 2 == 1:
            row_points.reverse()

        waypoints.extend(row_points)

    return waypoints


def calculate_route_distance(waypoints):
    if len(waypoints) < 2:
        return 0.0

    earth_radius_km = 6371.0
    total_distance = 0.0

    for i in range(len(waypoints) - 1):
        lat1 = radians(float(waypoints[i]["lat"]))
        lon1 = radians(float(waypoints[i]["lng"]))
        lat2 = radians(float(waypoints[i + 1]["lat"]))
        lon2 = radians(float(waypoints[i + 1]["lng"]))

        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = (
            sin(dlat / 2) ** 2
            + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
        )

        a = max(0.0, min(1.0, a))
        c = 2 * atan2(sqrt(a), sqrt(1 - a))

        total_distance += earth_radius_km * c

    return round(total_distance, 3)