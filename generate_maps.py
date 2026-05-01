"""Generate professional GHT trail-map PDFs for each map product.

Creates a topographic-style PDF for each of the 12 digital map products:
- Title block with map code, name, scale
- Grid with lat/long coordinates
- Trail waypoints, passes, and villages
- Elevation profile and legend
- Compass rose and copyright
"""
import os
import math
from reportlab.lib.pagesizes import A3, landscape
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import (
    HexColor, white, black, Color
)
from reportlab.pdfgen.canvas import Canvas
from reportlab.lib.enums import TA_CENTER


# ── Colours ──
FOREST      = HexColor("#2D5F52")
MOSS        = HexColor("#7BA882")
SAND        = HexColor("#D4C5B9")
GOLD        = HexColor("#C4860A")
INK         = HexColor("#1A3A3A")
WATER       = HexColor("#7FB5D4")
SNOW        = HexColor("#E8EEF2")
CONTOUR     = HexColor("#B8C9B2")
TRAIL_RED   = HexColor("#D64545")
GRID_LINE   = HexColor("#C8D8C8")
LIGHT_GREEN = HexColor("#D4E6D1")

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "public", "maps")

# ── Map data: region → { bounds, passes, villages, trails } ──
MAP_DATA = {
    "NP101": {
        "name": "Kanchenjunga",
        "subtitle": "North Base Camp · South Base Camp · Full Circuit",
        "lat_range": (27.55, 27.95),
        "lon_range": (87.70, 88.20),
        "elevation_range": (1200, 8586),
        "peak": "Kanchenjunga 8,586 m",
        "passes": [
            ("Sele La", 27.78, 87.92, 4290),
            ("Mirgin La", 27.81, 87.89, 4480),
            ("Lapsang La", 27.76, 87.95, 5160),
        ],
        "villages": [
            ("Taplejung", 27.35, 87.67, 1820),
            ("Ghunsa", 27.65, 87.92, 3430),
            ("Pangpema (NBC)", 27.81, 88.06, 5143),
            ("Oktang (SBC)", 27.67, 88.08, 4730),
            ("Yamphudin", 27.49, 87.86, 2080),
            ("Sekathum", 27.58, 87.86, 1640),
            ("Amjilosa", 27.62, 87.90, 2510),
        ],
        "trails": [
            [("Taplejung", 27.35, 87.67), ("Sekathum", 27.58, 87.86), ("Amjilosa", 27.62, 87.90),
             ("Ghunsa", 27.65, 87.92), ("Pangpema", 27.81, 88.06)],
            [("Ghunsa", 27.65, 87.92), ("Sele La", 27.78, 87.92), ("Mirgin La", 27.81, 87.89),
             ("Oktang", 27.67, 88.08)],
        ],
    },
    "NP102": {
        "name": "Makalu",
        "subtitle": "Makalu Base Camp · Barun Valley · Arun Valley",
        "lat_range": (27.60, 27.95),
        "lon_range": (87.00, 87.50),
        "elevation_range": (800, 8485),
        "peak": "Makalu 8,485 m",
        "passes": [
            ("Shipton La", 27.78, 87.22, 4210),
            ("Tutu La", 27.82, 87.30, 5830),
        ],
        "villages": [
            ("Num", 27.55, 87.28, 1560),
            ("Seduwa", 27.59, 87.30, 1540),
            ("Tashigaon", 27.65, 87.32, 2100),
            ("Khongma", 27.72, 87.30, 3560),
            ("Makalu BC", 27.84, 87.08, 4870),
        ],
        "trails": [
            [("Num", 27.55, 87.28), ("Seduwa", 27.59, 87.30), ("Tashigaon", 27.65, 87.32),
             ("Khongma", 27.72, 87.30), ("Makalu BC", 27.84, 87.08)],
        ],
    },
    "NP103": {
        "name": "Everest Region",
        "subtitle": "EBC · Gokyo · Three Passes · Khumbu",
        "lat_range": (27.65, 28.05),
        "lon_range": (86.65, 87.10),
        "elevation_range": (2600, 8849),
        "peak": "Sagarmatha (Everest) 8,849 m",
        "passes": [
            ("Cho La", 27.88, 86.78, 5420),
            ("Renjo La", 27.92, 86.72, 5340),
            ("Kongma La", 27.90, 86.85, 5535),
        ],
        "villages": [
            ("Lukla", 27.69, 86.73, 2860),
            ("Namche Bazaar", 27.81, 86.71, 3440),
            ("Tengboche", 27.84, 86.77, 3860),
            ("Dingboche", 27.87, 86.83, 4410),
            ("Gorak Shep", 27.95, 86.83, 5164),
            ("EBC", 27.99, 86.85, 5364),
            ("Gokyo", 27.95, 86.70, 4750),
        ],
        "trails": [
            [("Lukla", 27.69, 86.73), ("Namche Bazaar", 27.81, 86.71), ("Tengboche", 27.84, 86.77),
             ("Dingboche", 27.87, 86.83), ("Gorak Shep", 27.95, 86.83), ("EBC", 27.99, 86.85)],
            [("Namche Bazaar", 27.81, 86.71), ("Gokyo", 27.95, 86.70)],
        ],
    },
    "NP104": {
        "name": "Rolwaling",
        "subtitle": "Rolwaling Valley · Tesi Lapcha Pass · Khumbu Link",
        "lat_range": (27.75, 28.05),
        "lon_range": (86.30, 86.70),
        "elevation_range": (1800, 7181),
        "peak": "Gauri Shankar 7,181 m",
        "passes": [
            ("Tesi Lapcha", 27.88, 86.52, 5755),
        ],
        "villages": [
            ("Simigaon", 27.78, 86.35, 2000),
            ("Beding", 27.84, 86.40, 3690),
            ("Na", 27.87, 86.45, 4180),
            ("Tsho Rolpa", 27.86, 86.48, 4550),
        ],
        "trails": [
            [("Simigaon", 27.78, 86.35), ("Beding", 27.84, 86.40), ("Na", 27.87, 86.45),
             ("Tsho Rolpa", 27.86, 86.48), ("Tesi Lapcha", 27.88, 86.52)],
        ],
    },
    "NP105": {
        "name": "Langtang & Helambu",
        "subtitle": "Langtang Valley · Gosaikunda · Laurebina · Helambu",
        "lat_range": (27.90, 28.30),
        "lon_range": (85.30, 85.80),
        "elevation_range": (1400, 7234),
        "peak": "Langtang Lirung 7,234 m",
        "passes": [
            ("Laurebina La", 28.08, 85.42, 4610),
            ("Ganja La", 28.12, 85.55, 5122),
        ],
        "villages": [
            ("Syabrubesi", 28.16, 85.34, 1460),
            ("Lama Hotel", 28.12, 85.40, 2480),
            ("Langtang Village", 28.11, 85.47, 3430),
            ("Kyanjin Gompa", 28.11, 85.55, 3870),
            ("Gosaikunda", 28.08, 85.42, 4380),
            ("Melamchi Ghyang", 27.95, 85.53, 2530),
        ],
        "trails": [
            [("Syabrubesi", 28.16, 85.34), ("Lama Hotel", 28.12, 85.40), ("Langtang Village", 28.11, 85.47),
             ("Kyanjin Gompa", 28.11, 85.55)],
            [("Syabrubesi", 28.16, 85.34), ("Gosaikunda", 28.08, 85.42), ("Melamchi Ghyang", 27.95, 85.53)],
        ],
    },
    "NP106": {
        "name": "Manaslu & Ganesh",
        "subtitle": "Manaslu Circuit · Larkya La · Tsum Valley",
        "lat_range": (28.20, 28.65),
        "lon_range": (84.50, 85.10),
        "elevation_range": (700, 8163),
        "peak": "Manaslu 8,163 m",
        "passes": [
            ("Larkya La", 28.52, 84.72, 5106),
        ],
        "villages": [
            ("Soti Khola", 28.24, 84.83, 730),
            ("Jagat", 28.35, 84.78, 1340),
            ("Deng", 28.42, 84.72, 1860),
            ("Namrung", 28.48, 84.68, 2630),
            ("Samagaon", 28.55, 84.65, 3530),
            ("Samdo", 28.58, 84.63, 3860),
            ("Dharapani", 28.48, 84.55, 1960),
        ],
        "trails": [
            [("Soti Khola", 28.24, 84.83), ("Jagat", 28.35, 84.78), ("Deng", 28.42, 84.72),
             ("Namrung", 28.48, 84.68), ("Samagaon", 28.55, 84.65), ("Samdo", 28.58, 84.63),
             ("Larkya La", 28.52, 84.72), ("Dharapani", 28.48, 84.55)],
        ],
    },
    "NP107": {
        "name": "Annapurna, Naar & Phu",
        "subtitle": "Full Circuit · Sanctuary · Thorong La · Naar-Phu",
        "lat_range": (28.30, 28.80),
        "lon_range": (83.70, 84.40),
        "elevation_range": (800, 8091),
        "peak": "Annapurna I 8,091 m",
        "passes": [
            ("Thorong La", 28.65, 83.92, 5416),
            ("Kang La", 28.72, 84.10, 5322),
        ],
        "villages": [
            ("Besisahar", 28.23, 84.38, 760),
            ("Chame", 28.55, 84.23, 2670),
            ("Manang", 28.67, 84.02, 3540),
            ("Naar", 28.72, 84.15, 4110),
            ("Phu", 28.76, 84.22, 4080),
            ("Muktinath", 28.82, 83.87, 3760),
            ("Jomsom", 28.78, 83.73, 2720),
            ("ABC", 28.53, 83.86, 4130),
        ],
        "trails": [
            [("Besisahar", 28.23, 84.38), ("Chame", 28.55, 84.23), ("Manang", 28.67, 84.02),
             ("Thorong La", 28.65, 83.92), ("Muktinath", 28.82, 83.87), ("Jomsom", 28.78, 83.73)],
            [("Manang", 28.67, 84.02), ("Naar", 28.72, 84.15), ("Phu", 28.76, 84.22)],
        ],
    },
    "NP108": {
        "name": "Mustang",
        "subtitle": "Lo Manthang · Upper Mustang · Kali Gandaki",
        "lat_range": (28.70, 29.30),
        "lon_range": (83.50, 84.10),
        "elevation_range": (2700, 6500),
        "peak": "Nilgiri North 7,061 m",
        "passes": [
            ("Chogo La", 28.95, 83.72, 4325),
            ("Marang La", 29.12, 83.80, 4230),
        ],
        "villages": [
            ("Kagbeni", 28.83, 83.78, 2810),
            ("Chele", 28.88, 83.83, 3050),
            ("Samar", 28.92, 83.82, 3660),
            ("Ghami", 29.00, 83.78, 3520),
            ("Tsarang", 29.05, 83.75, 3560),
            ("Lo Manthang", 29.18, 83.95, 3810),
        ],
        "trails": [
            [("Kagbeni", 28.83, 83.78), ("Chele", 28.88, 83.83), ("Samar", 28.92, 83.82),
             ("Ghami", 29.00, 83.78), ("Tsarang", 29.05, 83.75), ("Lo Manthang", 29.18, 83.95)],
        ],
    },
    "NP109": {
        "name": "Dolpo & Mugu",
        "subtitle": "Phoksundo Lake · Shey Gompa · GHT Western Route",
        "lat_range": (28.80, 29.50),
        "lon_range": (82.50, 83.40),
        "elevation_range": (2000, 6883),
        "peak": "Kanjiroba 6,883 m",
        "passes": [
            ("Baga La", 29.05, 82.82, 5070),
            ("Numa La", 29.08, 82.90, 5238),
            ("Kagmara La", 28.95, 82.78, 5115),
        ],
        "villages": [
            ("Dunai", 28.95, 82.87, 2140),
            ("Phoksundo Lake", 29.15, 82.95, 3611),
            ("Ringmo", 29.14, 82.94, 3640),
            ("Shey Gompa", 29.22, 83.05, 4360),
            ("Gamgadhi", 29.38, 82.58, 2095),
        ],
        "trails": [
            [("Dunai", 28.95, 82.87), ("Ringmo", 29.14, 82.94), ("Phoksundo Lake", 29.15, 82.95),
             ("Shey Gompa", 29.22, 83.05)],
            [("Dunai", 28.95, 82.87), ("Kagmara La", 28.95, 82.78), ("Gamgadhi", 29.38, 82.58)],
        ],
    },
    "NP110": {
        "name": "Far West Nepal",
        "subtitle": "Humla · Limi Valley · Saipal · Khaptad",
        "lat_range": (29.10, 30.00),
        "lon_range": (80.80, 82.00),
        "elevation_range": (1200, 7031),
        "peak": "Saipal 7,031 m",
        "passes": [
            ("Nara La", 29.92, 81.58, 4507),
            ("Nyalu La", 30.05, 81.82, 4980),
        ],
        "villages": [
            ("Simikot", 29.97, 81.82, 2985),
            ("Muchu", 29.82, 81.65, 3500),
            ("Halji", 30.22, 81.32, 3660),
            ("Til", 30.15, 81.28, 3780),
            ("Chainpur", 29.45, 81.22, 1300),
        ],
        "trails": [
            [("Simikot", 29.97, 81.82), ("Muchu", 29.82, 81.65), ("Nara La", 29.92, 81.58),
             ("Halji", 30.22, 81.32), ("Til", 30.15, 81.28)],
        ],
    },
    "NP111": {
        "name": "Dhorpatan & Dhaulagiri",
        "subtitle": "Dhaulagiri Circuit · French Pass · Dhorpatan Reserve",
        "lat_range": (28.50, 28.90),
        "lon_range": (83.10, 83.65),
        "elevation_range": (1200, 8167),
        "peak": "Dhaulagiri I 8,167 m",
        "passes": [
            ("French Pass", 28.72, 83.38, 5360),
            ("Dhampus Pass", 28.68, 83.42, 5240),
            ("Jaljala La", 28.58, 83.25, 3410),
        ],
        "villages": [
            ("Beni", 28.34, 83.57, 830),
            ("Babichaur", 28.48, 83.45, 1220),
            ("Muri", 28.58, 83.38, 2200),
            ("Italian BC", 28.65, 83.35, 3660),
            ("Dhaulagiri BC", 28.72, 83.32, 4750),
            ("Marpha", 28.75, 83.68, 2670),
        ],
        "trails": [
            [("Beni", 28.34, 83.57), ("Babichaur", 28.48, 83.45), ("Muri", 28.58, 83.38),
             ("Italian BC", 28.65, 83.35), ("Dhaulagiri BC", 28.72, 83.32),
             ("French Pass", 28.72, 83.38), ("Marpha", 28.75, 83.68)],
        ],
    },
    "NP301": {
        "name": "Nepal Route Planner",
        "subtitle": "All 9 GHT Regions · 1,700 km Overview",
        "lat_range": (26.50, 30.50),
        "lon_range": (80.00, 88.50),
        "elevation_range": (60, 8849),
        "peak": "Sagarmatha 8,849 m",
        "passes": [
            ("Thorong La", 28.65, 83.92, 5416),
            ("Larkya La", 28.52, 84.72, 5106),
            ("Tesi Lapcha", 27.88, 86.52, 5755),
            ("Cho La", 27.88, 86.78, 5420),
            ("Sele La", 27.78, 87.92, 4290),
        ],
        "villages": [
            ("Kathmandu", 27.70, 85.33, 1400),
            ("Lukla", 27.69, 86.73, 2860),
            ("Jomsom", 28.78, 83.73, 2720),
            ("Simikot", 29.97, 81.82, 2985),
            ("Taplejung", 27.35, 87.67, 1820),
            ("Dunai", 28.95, 82.87, 2140),
            ("Namche", 27.81, 86.71, 3440),
            ("Manang", 28.67, 84.02, 3540),
            ("Pokhara", 28.22, 83.98, 822),
        ],
        "trails": [
            [("Simikot", 29.97, 81.82), ("Dunai", 28.95, 82.87), ("Jomsom", 28.78, 83.73),
             ("Manang", 28.67, 84.02), ("Kathmandu", 27.70, 85.33), ("Lukla", 27.69, 86.73),
             ("Namche", 27.81, 86.71), ("Taplejung", 27.35, 87.67)],
        ],
    },
}


def _lat_lon_to_xy(lat, lon, lat_range, lon_range, map_x, map_y, map_w, map_h):
    """Convert geographic coordinates to canvas coordinates."""
    x = map_x + (lon - lon_range[0]) / (lon_range[1] - lon_range[0]) * map_w
    y = map_y + (lat - lat_range[0]) / (lat_range[1] - lat_range[0]) * map_h
    return x, y


def _draw_contour_lines(c, map_x, map_y, map_w, map_h, seed_val):
    """Draw topographic contour-style lines."""
    import random
    rng = random.Random(seed_val)
    c.setStrokeColor(CONTOUR)
    c.setLineWidth(0.3)
    # horizontal wavy lines
    n_lines = 25
    for i in range(n_lines):
        y_base = map_y + (i / n_lines) * map_h
        pts = []
        for j in range(50):
            x = map_x + (j / 49) * map_w
            y = y_base + rng.uniform(-8, 8) + 5 * math.sin(j * 0.3 + seed_val)
            pts.append((x, y))
        p = c.beginPath()
        p.moveTo(*pts[0])
        for pt in pts[1:]:
            p.lineTo(*pt)
        c.drawPath(p, stroke=1, fill=0)


def _draw_rivers(c, map_x, map_y, map_w, map_h, seed_val):
    """Draw river lines."""
    import random
    rng = random.Random(seed_val + 100)
    c.setStrokeColor(WATER)
    c.setLineWidth(1.2)
    n_rivers = 3
    for r in range(n_rivers):
        x_start = map_x + rng.uniform(0.1, 0.9) * map_w
        y_start = map_y + map_h - 5
        pts = [(x_start, y_start)]
        for _ in range(20):
            x_start += rng.uniform(-15, 15)
            y_start -= map_h / 20
            pts.append((x_start, max(map_y, y_start)))
        p = c.beginPath()
        p.moveTo(*pts[0])
        for pt in pts[1:]:
            p.lineTo(*pt)
        c.drawPath(p, stroke=1, fill=0)


def _draw_grid(c, data, map_x, map_y, map_w, map_h):
    """Draw lat/lon grid with labels."""
    lat_range = data["lat_range"]
    lon_range = data["lon_range"]

    c.setStrokeColor(GRID_LINE)
    c.setLineWidth(0.4)
    c.setDash(3, 3)

    # Latitude lines
    lat_step = round((lat_range[1] - lat_range[0]) / 5, 2)
    if lat_step < 0.05:
        lat_step = 0.05
    lat = lat_range[0]
    while lat <= lat_range[1]:
        _, y = _lat_lon_to_xy(lat, lon_range[0], lat_range, lon_range, map_x, map_y, map_w, map_h)
        c.line(map_x, y, map_x + map_w, y)
        c.setFont("Helvetica", 6)
        c.setFillColor(INK)
        c.drawString(map_x - 38, y - 2, f"{lat:.2f}°N")
        lat += lat_step

    # Longitude lines
    lon_step = round((lon_range[1] - lon_range[0]) / 5, 2)
    if lon_step < 0.05:
        lon_step = 0.05
    lon = lon_range[0]
    while lon <= lon_range[1]:
        x, _ = _lat_lon_to_xy(lat_range[0], lon, lat_range, lon_range, map_x, map_y, map_w, map_h)
        c.line(x, map_y, x, map_y + map_h)
        c.setFont("Helvetica", 6)
        c.setFillColor(INK)
        c.drawCentredString(x, map_y - 10, f"{lon:.2f}°E")
        lon += lon_step

    c.setDash()


def _draw_compass(c, x, y, size=35):
    """Draw a simple compass rose."""
    c.setStrokeColor(INK)
    c.setFillColor(INK)
    c.setLineWidth(1)
    # N arrow
    p = c.beginPath()
    p.moveTo(x, y + size)
    p.lineTo(x - size * 0.15, y)
    p.lineTo(x + size * 0.15, y)
    p.close()
    c.drawPath(p, stroke=0, fill=1)
    # S arrow (outline)
    c.setFillColor(white)
    p2 = c.beginPath()
    p2.moveTo(x, y - size)
    p2.lineTo(x - size * 0.15, y)
    p2.lineTo(x + size * 0.15, y)
    p2.close()
    c.drawPath(p2, stroke=1, fill=1)
    # N label
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(x, y + size + 4, "N")


def _draw_elevation_bar(c, data, x, y, w, h):
    """Draw elevation gradient bar."""
    lo, hi = data["elevation_range"]
    steps = 20
    for i in range(steps):
        frac = i / steps
        # gradient: green at low, brown in mid, white at high
        if frac < 0.3:
            r, g, b = 0.48 + frac, 0.72 - frac * 0.3, 0.32 + frac * 0.3
        elif frac < 0.7:
            r, g, b = 0.7, 0.6 - (frac - 0.3) * 0.5, 0.4
        else:
            r, g, b = 0.85 + (frac - 0.7) * 0.5, 0.85 + (frac - 0.7) * 0.5, 0.9 + (frac - 0.7) * 0.3
        c.setFillColor(Color(min(r, 1), min(g, 1), min(b, 1)))
        c.rect(x + i * (w / steps), y, w / steps + 1, h, stroke=0, fill=1)

    c.setStrokeColor(INK)
    c.setLineWidth(0.5)
    c.rect(x, y, w, h, stroke=1, fill=0)
    c.setFillColor(INK)
    c.setFont("Helvetica", 6)
    c.drawString(x, y - 8, f"{lo} m")
    c.drawRightString(x + w, y - 8, f"{hi} m")
    c.drawCentredString(x + w / 2, y + h + 3, "Elevation")


def generate_map_pdf(map_code, data, output_dir):
    """Generate one map PDF."""
    filepath = os.path.join(output_dir, f"{map_code}.pdf")
    page_w, page_h = landscape(A3)
    c = Canvas(filepath, pagesize=landscape(A3))

    # ── Background fill ──
    c.setFillColor(SAND)
    c.rect(0, 0, page_w, page_h, stroke=0, fill=1)

    # ── Map area ──
    margin = 50
    header_h = 65
    footer_h = 45
    map_x = margin + 40  # extra space for lat labels
    map_y = footer_h + 15
    map_w = page_w - map_x - margin - 20
    map_h = page_h - header_h - map_y - 10

    # Map background (light green)
    c.setFillColor(LIGHT_GREEN)
    c.rect(map_x, map_y, map_w, map_h, stroke=0, fill=1)

    # Contour lines
    _draw_contour_lines(c, map_x, map_y, map_w, map_h, hash(map_code) % 10000)

    # Rivers
    _draw_rivers(c, map_x, map_y, map_w, map_h, hash(map_code) % 10000)

    # Grid
    _draw_grid(c, data, map_x, map_y, map_w, map_h)

    # ── Trails (red dashed) ──
    lat_range, lon_range = data["lat_range"], data["lon_range"]
    c.setStrokeColor(TRAIL_RED)
    c.setLineWidth(2.5)
    c.setDash(6, 3)
    for trail in data["trails"]:
        points = []
        for name, lat, lon in trail:
            x, y = _lat_lon_to_xy(lat, lon, lat_range, lon_range, map_x, map_y, map_w, map_h)
            points.append((x, y))
        if len(points) >= 2:
            p = c.beginPath()
            p.moveTo(*points[0])
            for pt in points[1:]:
                p.lineTo(*pt)
            c.drawPath(p, stroke=1, fill=0)
    c.setDash()

    # ── Passes (triangle markers) ──
    for pass_name, lat, lon, elev in data["passes"]:
        x, y = _lat_lon_to_xy(lat, lon, lat_range, lon_range, map_x, map_y, map_w, map_h)
        # Triangle
        c.setFillColor(GOLD)
        c.setStrokeColor(INK)
        c.setLineWidth(0.8)
        p = c.beginPath()
        p.moveTo(x, y + 7)
        p.lineTo(x - 5, y - 3)
        p.lineTo(x + 5, y - 3)
        p.close()
        c.drawPath(p, stroke=1, fill=1)
        # Label
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 7)
        c.drawString(x + 7, y + 2, f"{pass_name}")
        c.setFont("Helvetica", 6)
        c.drawString(x + 7, y - 6, f"{elev:,} m")

    # ── Villages (circle markers) ──
    for v_name, lat, lon, elev in data["villages"]:
        x, y = _lat_lon_to_xy(lat, lon, lat_range, lon_range, map_x, map_y, map_w, map_h)
        # Circle
        c.setFillColor(white)
        c.setStrokeColor(FOREST)
        c.setLineWidth(1.2)
        c.circle(x, y, 4, stroke=1, fill=1)
        c.setFillColor(FOREST)
        c.circle(x, y, 1.5, stroke=0, fill=1)
        # Label
        c.setFillColor(INK)
        c.setFont("Helvetica", 7)
        c.drawString(x + 6, y + 2, f"{v_name}")
        c.setFont("Helvetica", 5.5)
        c.drawString(x + 6, y - 5, f"{elev:,} m")

    # ── Map border ──
    c.setStrokeColor(INK)
    c.setLineWidth(1.5)
    c.rect(map_x, map_y, map_w, map_h, stroke=1, fill=0)

    # ── Title bar (header) ──
    c.setFillColor(FOREST)
    c.rect(0, page_h - header_h, page_w, header_h, stroke=0, fill=1)
    # Title text
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(margin, page_h - 32, f"Great Himalaya Trail — {data['name']}")
    c.setFont("Helvetica", 11)
    c.drawString(margin, page_h - 50, data["subtitle"])
    # Map code and scale badge
    c.setFont("Helvetica-Bold", 14)
    c.drawRightString(page_w - margin, page_h - 32, map_code)
    scale_text = "1:100,000" if map_code != "NP301" else "1:500,000"
    c.setFont("Helvetica", 10)
    c.drawRightString(page_w - margin, page_h - 48, f"Scale {scale_text}  ·  Updated 2026")

    # ── Footer ──
    c.setFillColor(FOREST)
    c.rect(0, 0, page_w, footer_h, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica", 8)
    c.drawString(margin, 20,
        "© 2026 Great Himalaya Trail  ·  greathimalayatrail.com  ·  For personal trekking use only. Not for resale.")
    c.drawString(margin, 8,
        f"Coordinates: WGS 84  ·  Lat {data['lat_range'][0]:.2f}°–{data['lat_range'][1]:.2f}°N  ·  "
        f"Lon {data['lon_range'][0]:.2f}°–{data['lon_range'][1]:.2f}°E")

    # Peak label
    c.setFillColor(SNOW)
    c.setFont("Helvetica-Bold", 8)
    c.drawRightString(page_w - margin, 20, f"Highest peak: {data['peak']}")

    # ── Compass ──
    _draw_compass(c, map_x + map_w - 30, map_y + 55)

    # ── Elevation bar ──
    _draw_elevation_bar(c, data, map_x + 15, map_y + 12, 120, 10)

    # ── Legend ──
    legend_x = map_x + map_w - 165
    legend_y = map_y + map_h - 80
    c.setFillColor(Color(1, 1, 1, 0.85))
    c.rect(legend_x, legend_y, 150, 70, stroke=1, fill=1)
    c.setStrokeColor(INK)
    c.setLineWidth(0.5)
    c.rect(legend_x, legend_y, 150, 70, stroke=1, fill=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(legend_x + 8, legend_y + 56, "LEGEND")

    # Trail
    c.setStrokeColor(TRAIL_RED)
    c.setLineWidth(2)
    c.setDash(6, 3)
    c.line(legend_x + 8, legend_y + 44, legend_x + 35, legend_y + 44)
    c.setDash()
    c.setFillColor(INK)
    c.setFont("Helvetica", 7)
    c.drawString(legend_x + 40, legend_y + 41, "GHT Trail Route")

    # Pass
    c.setFillColor(GOLD)
    c.setStrokeColor(INK)
    c.setLineWidth(0.5)
    pk = c.beginPath()
    pk.moveTo(legend_x + 20, legend_y + 33)
    pk.lineTo(legend_x + 15, legend_y + 25)
    pk.lineTo(legend_x + 25, legend_y + 25)
    pk.close()
    c.drawPath(pk, stroke=1, fill=1)
    c.setFillColor(INK)
    c.drawString(legend_x + 40, legend_y + 26, "Mountain Pass")

    # Village
    c.setFillColor(white)
    c.setStrokeColor(FOREST)
    c.setLineWidth(1)
    c.circle(legend_x + 20, legend_y + 13, 4, stroke=1, fill=1)
    c.setFillColor(FOREST)
    c.circle(legend_x + 20, legend_y + 13, 1.5, stroke=0, fill=1)
    c.setFillColor(INK)
    c.drawString(legend_x + 40, legend_y + 10, "Village / Settlement")

    c.save()
    return filepath


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Generating {len(MAP_DATA)} map PDFs → {OUTPUT_DIR}/")
    for code, data in MAP_DATA.items():
        path = generate_map_pdf(code, data, OUTPUT_DIR)
        size_kb = os.path.getsize(path) / 1024
        print(f"  ✅ {code}.pdf — {data['name']} ({size_kb:.0f} KB)")
    print("Done.")


if __name__ == "__main__":
    main()
