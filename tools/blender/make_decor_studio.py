"""
Visuels de décor du Studio Lanterne, générés (aucun asset tiers) : enseigne, affiches de
« Brume » et de « Petits Cailloux », tableau des jalons, dessins du mur de concept art,
écrans secondaires, image du jeu sur la télévision de playtest, borne d'arcade.
Écrit art/build/studio-lanterne/decor/*.png (bible : docs/fil-rouge-studio.md).

    ART_WORLD=studio-lanterne python3 tools/blender/make_decor_studio.py
"""
import json
import math
import os
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
BUILD = ROOT / "art" / "build" / os.environ.get("ART_WORLD", "studio-lanterne")
OUT = BUILD / "decor"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"

INK = (28, 30, 36)
LANTERN = (255, 184, 82)
FOG = (176, 192, 201)
SEA = (44, 66, 84)
PAPER = (246, 241, 230)


def font(size, path=FONT):
    return ImageFont.truetype(path, size)


def centered(draw, y, text, f, fill, width, x0=0):
    w = draw.textlength(text, font=f)
    draw.text((x0 + (width - w) / 2, y), text, font=f, fill=fill)


def gradient(w, h, top, bottom):
    im = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(im)
    for y in range(h):
        t = y / max(1, h - 1)
        d.line((0, y, w, y), fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return im


def fog_layer(im, seed, density=40, color=(220, 228, 232), blur=28, band=(0.35, 0.9)):
    """Nappes de brume : ellipses claires très floues, superposées à l'image."""
    rnd = random.Random(seed)
    w, h = im.size
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(density):
        cx = rnd.uniform(-0.1, 1.1) * w
        cy = rnd.uniform(*band) * h
        rx, ry = rnd.uniform(0.15, 0.4) * w, rnd.uniform(0.03, 0.08) * h
        d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=(*color, rnd.randint(30, 80)))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    return Image.alpha_composite(im.convert("RGBA"), layer).convert("RGB")


def glow(im, cx, cy, r, color=LANTERN, strength=200):
    layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for k in range(12, 0, -1):
        rr = r * k / 12
        d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=(*color, int(strength * (1 - k / 13) ** 2)))
    layer = layer.filter(ImageFilter.GaussianBlur(r / 6))
    return Image.alpha_composite(im.convert("RGBA"), layer).convert("RGB")


def lantern_icon(d, cx, cy, s, color):
    """Petite lanterne stylisée (anse, toit, corps vitré, flamme)."""
    d.arc((cx - s * 0.35, cy - s * 1.25, cx + s * 0.35, cy - s * 0.55), 180, 360, fill=color, width=max(2, int(s * 0.09)))
    d.polygon([(cx - s * 0.55, cy - s * 0.55), (cx + s * 0.55, cy - s * 0.55), (cx + s * 0.35, cy - s * 0.8), (cx - s * 0.35, cy - s * 0.8)], fill=color)
    d.rounded_rectangle((cx - s * 0.45, cy - s * 0.5, cx + s * 0.45, cy + s * 0.55), int(s * 0.12), outline=color, width=max(2, int(s * 0.1)))
    d.ellipse((cx - s * 0.16, cy - s * 0.2, cx + s * 0.16, cy + s * 0.3), fill=color)
    d.rectangle((cx - s * 0.55, cy + s * 0.55, cx + s * 0.55, cy + s * 0.7), fill=color)


def lighthouse(d, x, base, h, color, lamp=None):
    w0, w1 = h * 0.16, h * 0.1
    d.polygon([(x - w0, base), (x + w0, base), (x + w1, base - h), (x - w1, base - h)], fill=color)
    d.rectangle((x - w1 * 1.2, base - h - h * 0.12, x + w1 * 1.2, base - h), fill=color)
    d.polygon([(x - w1 * 1.3, base - h - h * 0.12), (x + w1 * 1.3, base - h - h * 0.12), (x, base - h - h * 0.24)], fill=color)
    if lamp:
        d.rectangle((x - w1 * 0.8, base - h - h * 0.1, x + w1 * 0.8, base - h - h * 0.02), fill=lamp)


def island(d, w, h, base, color, seed):
    rnd = random.Random(seed)
    pts = [(0, h)]
    x = 0
    while x <= w:
        pts.append((x, base - rnd.uniform(0, 0.12) * h - (0.08 * h if 0.3 * w < x < 0.75 * w else 0)))
        x += w / 18
    pts.append((w, h))
    d.polygon(pts, fill=color)


# --- Enseigne, affiches -------------------------------------------------------------


def logo():
    w, h = 1200, 300
    im = Image.new("RGB", (w, h), (24, 22, 20))
    d = ImageDraw.Draw(im)
    im = glow(im, 150, 150, 120, strength=150)
    d = ImageDraw.Draw(im)
    lantern_icon(d, 150, 160, 95, LANTERN)
    d.text((290, 70), "STUDIO", font=font(64, BOLD), fill=(244, 236, 220))
    d.text((290, 145), "LANTERNE", font=font(92, BOLD), fill=LANTERN)
    im.save(OUT / "logo_studio.png")


def poster_brume():
    w, h = 600, 840
    im = gradient(w, h, (60, 82, 100), (186, 199, 205))
    d = ImageDraw.Draw(im)
    island(d, w, h, 600, (34, 48, 60), 3)
    lighthouse(d, 400, 560, 230, (26, 34, 42), lamp=LANTERN)
    im = glow(im, 400, 315, 90, strength=170)
    im = fog_layer(im, 4, density=50, band=(0.45, 0.85))
    d = ImageDraw.Draw(im)
    # Maëlle et sa lanterne, petite silhouette au premier plan.
    d.ellipse((150, 610, 168, 628), fill=(20, 24, 28))
    d.polygon([(146, 628), (172, 628), (178, 690), (140, 690)], fill=(20, 24, 28))
    im = glow(im, 190, 650, 70, strength=230)
    d = ImageDraw.Draw(im)
    lantern_icon(d, 190, 650, 12, (255, 220, 150))
    centered(d, 60, "BRUME", font(110, SERIF), (246, 240, 228), w)
    centered(d, 190, "Éclairez l'île, pas à pas.", font(28), (240, 236, 226), w)
    d.rectangle((0, 760, w, h), fill=(20, 26, 32))
    d.text((40, 780), "STUDIO LANTERNE", font=font(22, BOLD), fill=LANTERN)
    d.text((40, 808), "Sur Steam · printemps 2028", font=font(20), fill=(220, 220, 220))
    im.save(OUT / "poster_brume.png")


def poster_petits_cailloux():
    w, h = 600, 840
    im = Image.new("RGB", (w, h), (234, 223, 198))
    d = ImageDraw.Draw(im)
    # Jardin sec : sable ratissé autour de cailloux.
    for y in range(260, 720, 14):
        d.arc((-200, y - 40, w + 200, y + 40), 0, 180, fill=(212, 198, 168), width=3)
    for cx, cy, r in [(170, 430, 46), (330, 520, 34), (450, 400, 56), (250, 620, 24)]:
        for k in range(1, 4):
            d.ellipse((cx - r - k * 18, cy - r * 0.6 - k * 11, cx + r + k * 18, cy + r * 0.6 + k * 11), outline=(205, 188, 152), width=3)
        d.ellipse((cx - r, cy - r * 0.6, cx + r, cy + r * 0.6), fill=(118, 116, 110))
    # Le petit robot.
    d.rounded_rectangle((285, 300, 345, 350), 12, fill=(80, 150, 140))
    d.ellipse((298, 314, 312, 328), fill=(255, 255, 255))
    d.ellipse((318, 314, 332, 328), fill=(255, 255, 255))
    d.line((315, 300, 315, 280), fill=(80, 150, 140), width=4)
    d.ellipse((309, 270, 321, 282), fill=(232, 112, 72))
    d.text((40, 70), "Petits", font=font(78, BOLD), fill=(60, 72, 70))
    d.text((40, 150), "Cailloux", font=font(78, BOLD), fill=(80, 150, 140))
    d.rectangle((0, 760, w, h), fill=(60, 72, 70))
    d.text((40, 778), "92 % d'avis positifs sur Steam", font=font(22, BOLD), fill=(255, 255, 255))
    d.text((40, 808), "Studio Lanterne · 2023", font=font(20), fill=(230, 230, 220))
    im.save(OUT / "poster_petits_cailloux.png")


# --- Tableau des jalons de la war room ----------------------------------------------


def milestone_board():
    w, h = 1800, 800
    im = Image.new("RGB", (w, h), (250, 250, 247))
    d = ImageDraw.Draw(im)
    d.text((50, 36), "BRUME · JALONS", font=font(64, BOLD), fill=INK)
    d.text((50, 120), "Aujourd'hui : jeudi 12 novembre 2026", font=font(34), fill=(110, 116, 126))
    steps = [
        ("Concept", "été 2025", "done"),
        ("Prototype", "automne 2025", "done"),
        ("Vertical slice", "4 déc. 2026", "now"),
        ("Production", "2027", ""),
        ("Alpha", "sept. 2027", ""),
        ("Bêta", "janv. 2028", ""),
        ("Sortie", "printemps 2028", ""),
    ]
    y = 330
    x0, x1 = 120, w - 120
    d.line((x0, y, x1, y), fill=(160, 166, 174), width=10)
    step = (x1 - x0) / (len(steps) - 1)
    # Chemin parcouru : jusqu'à aujourd'hui, un peu avant la vertical slice.
    d.line((x0, y, x0 + step * 1.8, y), fill=(84, 150, 110), width=10)
    for i, (name, date, state) in enumerate(steps):
        x = x0 + i * step
        r = 40 if state == "now" else 28
        fill = (84, 150, 110) if state == "done" else (232, 120, 50) if state == "now" else (255, 255, 255)
        d.ellipse((x - r, y - r, x + r, y + r), fill=fill, outline=INK, width=5)
        f = font(34 if state == "now" else 28, BOLD)
        tw = d.textlength(name, font=f)
        d.text((x - tw / 2, y + 60), name, font=f, fill=(232, 120, 50) if state == "now" else INK)
        f2 = font(24)
        tw = d.textlength(date, font=f2)
        d.text((x - tw / 2, y + 112), date, font=f2, fill=(110, 116, 126))
    # Compte à rebours et post-it de la vertical slice.
    vx = x0 + 2 * step
    d.rounded_rectangle((vx - 210, 520, vx + 210, 700), 18, fill=(255, 226, 120))
    centered(d, 540, "J-22", font(72, BOLD), INK, 420, vx - 210)
    centered(d, 630, "Présentation chez Ondine", font(28, BOLD), INK, 420, vx - 210)
    notes = [
        ("Phare de Kerlaz : 15 min", (127, 200, 248)),
        ("Brume à 60 images/s ?", (244, 151, 142)),
        ("Playtest vendredi", (168, 230, 163)),
        ("Voix de la brume : V2", (255, 226, 120)),
    ]
    for i, (text, color) in enumerate(notes):
        nx = 1000 + (i % 2) * 390
        ny = 500 + (i // 2) * 130
        d.rectangle((nx, ny, nx + 370, ny + 110), fill=color)
        d.text((nx + 16, ny + 38), text, font=font(24, BOLD), fill=INK)
    for i, (text, color) in enumerate([("Pas de crunch.", (255, 226, 120)), ("Versement par jalon", (127, 200, 248))]):
        d.rectangle((50, 500 + i * 130, 380, 610 + i * 130), fill=color)
        d.text((68, 538 + i * 130), text, font=font(26, BOLD), fill=INK)
    im.save(OUT / "milestone_board.png")


# --- Mur de concept art --------------------------------------------------------------


def sketch_paper(w, h, seed):
    im = Image.new("RGB", (w, h), (238, 232, 218))
    rnd = random.Random(seed)
    d = ImageDraw.Draw(im)
    for _ in range(400):
        x, y = rnd.uniform(0, w), rnd.uniform(0, h)
        d.point((x, y), fill=(226, 219, 204))
    return im


def concept(index, w_m, h_m):
    w, h = int(w_m * 400), int(h_m * 400)
    kind = index % 7
    if kind == 0:  # Carte de l'île
        im = sketch_paper(w, h, index)
        d = ImageDraw.Draw(im)
        rnd = random.Random(7)
        pts = [(w / 2 + math.cos(a) * w * (0.3 + rnd.uniform(-0.05, 0.06)), h / 2 + math.sin(a) * h * (0.34 + rnd.uniform(-0.05, 0.05))) for a in [i * math.pi / 12 for i in range(24)]]
        d.polygon(pts, fill=(214, 204, 178), outline=(70, 60, 50))
        for k in range(6):
            d.ellipse((w * (0.2 + k * 0.04), h * (0.25 + k * 0.035), w * (0.8 - k * 0.04), h * (0.75 - k * 0.035)), outline=(150, 140, 120))
        d.text((20, 14), "Ys-Morvan", font=font(int(h * 0.1), SERIF), fill=(70, 60, 50))
        lighthouse(d, w * 0.72, h * 0.5, h * 0.18, (70, 60, 50))
    elif kind == 1:  # Phare dans la brume
        im = gradient(w, h, (58, 78, 96), (168, 182, 190))
        d = ImageDraw.Draw(im)
        island(d, w, h, h * 0.78, (30, 42, 52), index)
        lighthouse(d, w * 0.55, h * 0.75, h * 0.45, (24, 30, 38), lamp=LANTERN)
        im = glow(im, int(w * 0.55), int(h * 0.75 - h * 0.45 - h * 0.06), int(h * 0.25))
        im = fog_layer(im, index, density=30, band=(0.55, 0.95), blur=18)
    elif kind == 2:  # Planche personnage : Maëlle
        im = sketch_paper(w, h, index)
        d = ImageDraw.Draw(im)
        for k, x in enumerate((0.2, 0.5, 0.8)):
            cx = w * x
            s = h * 0.08
            d.ellipse((cx - s * 0.6, h * 0.18, cx + s * 0.6, h * 0.18 + s * 1.2), outline=INK, width=3)
            d.polygon([(cx - s, h * 0.32), (cx + s, h * 0.32), (cx + s * 1.3, h * 0.8), (cx - s * 1.3, h * 0.8)], outline=INK, width=3)
            lantern_icon(d, cx + s * 1.6, h * 0.55, s * 0.5, (190, 120, 40))
        d.text((16, h - h * 0.12), "Maëlle · face, profil, dos", font=font(int(h * 0.06), BOLD), fill=INK)
    elif kind == 3:  # Palette de couleurs
        im = Image.new("RGB", (w, h), (34, 36, 40))
        d = ImageDraw.Draw(im)
        colors = [(44, 66, 84), (96, 120, 134), (176, 192, 201), (230, 226, 214), (255, 184, 82), (196, 98, 52)]
        for k, c in enumerate(colors):
            d.rectangle((k * w / 6, h * 0.25, (k + 1) * w / 6, h * 0.8), fill=c)
        d.text((16, 14), "Palette · brume et lanterne", font=font(int(h * 0.09), BOLD), fill=(240, 240, 240))
    elif kind == 4:  # Village englouti
        im = gradient(w, h, (80, 98, 112), (190, 200, 204))
        d = ImageDraw.Draw(im)
        rnd = random.Random(index)
        for k in range(7):
            x = rnd.uniform(0.05, 0.9) * w
            hh = rnd.uniform(0.18, 0.32) * h
            base = h * 0.82
            d.rectangle((x, base - hh, x + w * 0.09, base), fill=(52, 62, 72))
            d.polygon([(x - w * 0.01, base - hh), (x + w * 0.1, base - hh), (x + w * 0.045, base - hh - h * 0.1)], fill=(42, 50, 58))
        im = fog_layer(im, index, density=40, band=(0.6, 1.0), blur=16)
        im = glow(im, int(w * 0.3), int(h * 0.7), int(h * 0.12))
    elif kind == 5:  # Accessoire : la lanterne
        im = sketch_paper(w, h, index)
        d = ImageDraw.Draw(im)
        lantern_icon(d, w * 0.3, h * 0.55, h * 0.3, (60, 50, 40))
        lantern_icon(d, w * 0.72, h * 0.55, h * 0.2, (190, 120, 40))
        d.text((16, 14), "Lanterne · v3", font=font(int(h * 0.08), BOLD), fill=INK)
    else:  # Falaises, panorama
        im = gradient(w, h, (210, 160, 110), (110, 120, 130))
        d = ImageDraw.Draw(im)
        island(d, w, h, h * 0.6, (60, 54, 60), index + 3)
        island(d, w, h, h * 0.75, (36, 34, 40), index + 5)
        im = fog_layer(im, index, density=26, band=(0.5, 0.9), blur=14, color=(240, 220, 200))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, w - 1, h - 1), outline=(250, 250, 250), width=6)
    im.save(OUT / f"concept_{index}.png")


# --- Écrans ----------------------------------------------------------------------------


def game_frame(w, h, hud=True):
    """Une image du jeu : Maëlle, sa lanterne, la brume repoussée autour d'elle."""
    im = gradient(w, h, (70, 88, 100), (150, 162, 168))
    d = ImageDraw.Draw(im)
    island(d, w, h, h * 0.62, (48, 58, 64), 11)
    lighthouse(d, w * 0.78, h * 0.6, h * 0.36, (34, 40, 48), lamp=LANTERN)
    d.polygon([(w * 0.35, h), (w * 0.65, h), (w * 0.52, h * 0.62), (w * 0.48, h * 0.62)], fill=(120, 110, 92))
    im = fog_layer(im, 12, density=60, band=(0.4, 1.0), blur=22)
    im = glow(im, int(w * 0.5), int(h * 0.78), int(h * 0.32), strength=190)
    d = ImageDraw.Draw(im)
    cx, cy = w * 0.5, h * 0.8
    d.ellipse((cx - 9, cy - 58, cx + 9, cy - 40), fill=(24, 26, 30))
    d.polygon([(cx - 12, cy - 40), (cx + 12, cy - 40), (cx + 16, cy), (cx - 16, cy)], fill=(24, 26, 30))
    lantern_icon(d, cx + 22, cy - 22, 8, (255, 225, 160))
    if hud:
        d.text((24, 20), "Huile", font=font(22, BOLD), fill=(240, 236, 226))
        d.rectangle((24, 50, 244, 64), outline=(240, 236, 226), width=2)
        d.rectangle((26, 52, 160, 62), fill=LANTERN)
    return im


def screens():
    game_frame(1280, 720).save(OUT / "tv_brume.png")
    # Écran secondaire : vue de l'éditeur de niveau.
    w, h = 960, 540
    im = Image.new("RGB", (w, h), (30, 32, 38))
    im.paste(game_frame(640, 400, hud=False), (180, 50))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, w, 36), fill=(44, 46, 54))
    d.text((12, 8), "Lanterne Editor — Phare_de_Kerlaz", font=font(18, BOLD), fill=(220, 220, 228))
    for k in range(12):
        d.text((12, 60 + k * 30), f"▸ {['Rochers', 'Maisons', 'Phare', 'Brume', 'Lumières', 'Voix', 'Chemins', 'Sons'][k % 8]}", font=font(16), fill=(170, 176, 188))
    for k in range(10):
        d.rectangle((836, 60 + k * 44, 944, 88 + k * 44), fill=(52, 56, 66))
    d.line((500, 250, 560, 250), fill=(232, 80, 80), width=4)
    d.line((500, 250, 500, 190), fill=(80, 200, 100), width=4)
    im.save(OUT / "screen_engine.png")
    # Écran secondaire : peinture numérique.
    im = Image.new("RGB", (w, h), (52, 52, 56))
    im.paste(Image.open(OUT / "concept_1.png").resize((600, 410)), (180, 70))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, w, 36), fill=(36, 36, 40))
    d.text((12, 8), "Planche — phare_ambiance_v4.psd", font=font(18, BOLD), fill=(220, 220, 228))
    for k, c in enumerate([(44, 66, 84), (176, 192, 201), (255, 184, 82), (196, 98, 52), (30, 30, 30)]):
        d.rectangle((820, 80 + k * 50, 900, 120 + k * 50), fill=c)
    im.save(OUT / "screen_art.png")
    # Écran secondaire : code.
    im = Image.new("RGB", (w, h), (24, 26, 32))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, w, 36), fill=(36, 38, 46))
    d.text((12, 8), "Atelier Code — LanternController.cs", font=font(18, BOLD), fill=(220, 220, 228))
    lines = [
        ("void Update() {", (198, 146, 255)),
        ("  if (lantern.IsLit) {", (220, 220, 220)),
        ("    oil -= burnRate * Time.deltaTime;", (220, 220, 220)),
        ("    fog.PushBack(transform.position, radius);", (130, 200, 255)),
        ("  }", (220, 220, 220)),
        ("  // Karim : burnRate dans le tableau d'équilibrage", (110, 160, 110)),
        ("  if (oil <= 0f) lantern.Extinguish();", (220, 220, 220)),
        ("}", (198, 146, 255)),
    ]
    for k, (text, color) in enumerate(lines):
        d.text((24, 60 + k * 34), f"{k + 41:>3}  {text}", font=font(20, MONO), fill=color)
    im.save(OUT / "screen_code.png")
    # Écran secondaire : son (formes d'onde).
    im = Image.new("RGB", (w, h), (28, 30, 36))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, w, 36), fill=(40, 42, 50))
    d.text((12, 8), "Console son — voix_brume_03", font=font(18, BOLD), fill=(220, 220, 228))
    rnd = random.Random(5)
    for row in range(4):
        y0 = 80 + row * 110
        d.rectangle((20, y0, w - 20, y0 + 90), fill=(38, 42, 50))
        for x in range(24, w - 24, 3):
            a = abs(math.sin(x * 0.02 + row)) * rnd.uniform(0.3, 1) * 40
            d.line((x, y0 + 45 - a, x, y0 + 45 + a), fill=[(120, 200, 255), (255, 184, 82), (160, 230, 160), (240, 140, 140)][row])
    im.save(OUT / "screen_audio.png")


def arcade():
    w, h = 480, 600
    im = Image.new("RGB", (w, h), (234, 223, 198))
    d = ImageDraw.Draw(im)
    px = 24
    rnd = random.Random(9)
    for y in range(0, h, px):
        for x in range(0, w, px):
            if rnd.random() < 0.12:
                d.rectangle((x, y, x + px - 2, y + px - 2), fill=(118, 116, 110))
            elif (y // px) % 3 == 0:
                d.rectangle((x, y + px // 2 - 2, x + px - 2, y + px // 2), fill=(212, 198, 168))
    d.rectangle((216, 280, 264, 320), fill=(80, 150, 140))
    d.rectangle((226, 290, 236, 300), fill=(255, 255, 255))
    d.rectangle((244, 290, 254, 300), fill=(255, 255, 255))
    d.text((20, 20), "NIVEAU 7", font=font(30, BOLD), fill=(60, 72, 70))
    im.save(OUT / "arcade_screen.png")
    w, h = 600, 160
    im = Image.new("RGB", (w, h), (60, 72, 70))
    d = ImageDraw.Draw(im)
    centered(d, 46, "PETITS CAILLOUX", font(54, BOLD), (255, 226, 120), w)
    im.save(OUT / "arcade_marquee.png")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    plan = json.loads((BUILD / "floorplan.json").read_text())
    logo()
    poster_brume()
    poster_petits_cailloux()
    milestone_board()
    for b in plan["boxes"]:
        if b["name"].startswith("concept_print_"):
            concept(int(b["name"].rsplit("_", 1)[1]), b["size"][0], b["size"][1])
    screens()
    arcade()
    print("✓ décor →", OUT.relative_to(ROOT))


if __name__ == "__main__":
    main()
