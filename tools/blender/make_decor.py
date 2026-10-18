"""
Visuels de décor générés (aucun asset tiers) : affiches de l'entreprise, écran
d'accueil, plan d'évacuation, calendrier du sprint. Écrit art/build/<monde>/decor/*.png.

    python3 tools/blender/make_decor.py
"""
import json
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
BUILD = ROOT / "art" / "build" / os.environ.get("ART_WORLD", "atelier-lumen")
OUT = BUILD / "decor"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

INK = (23, 32, 43)
LUMEN = (242, 165, 65)
PAPER = (250, 248, 244)
TEAL = (15, 139, 141)


def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else FONT, size)


def centered(draw, y, text, f, fill, width):
    w = draw.textlength(text, font=f)
    draw.text(((width - w) / 2, y), text, font=f, fill=fill)


def sun(draw, cx, cy, r, fill):
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=fill)
    for i in range(12):
        import math

        a = i * math.pi / 6
        draw.line(
            (cx + math.cos(a) * r * 1.35, cy + math.sin(a) * r * 1.35, cx + math.cos(a) * r * 1.8, cy + math.sin(a) * r * 1.8),
            fill=fill,
            width=max(2, r // 6),
        )


def welcome():
    w, h = 1024, 576
    im = Image.new("RGB", (w, h), INK)
    d = ImageDraw.Draw(im)
    sun(d, w // 2, 150, 46, LUMEN)
    centered(d, 230, "Bienvenue chez", font(40), (215, 220, 230), w)
    centered(d, 285, "Atelier Lumen", font(78, True), (255, 255, 255), w)
    centered(d, 395, "Des logiciels utiles, fabriqués avec soin.", font(30), LUMEN, w)
    centered(d, 470, "Jeudi 14 novembre · Sprint 24, jour 9", font(24), (138, 147, 166), w)
    im.save(OUT / "welcome_screen.png")


def poster(name, title, subtitle, color, motif):
    w, h = 600, 840
    im = Image.new("RGB", (w, h), color)
    d = ImageDraw.Draw(im)
    if motif == "phone":
        d.rounded_rectangle((200, 140, 400, 520), 36, fill=(255, 255, 255))
        d.rounded_rectangle((222, 190, 378, 260), 14, fill=(225, 240, 240))
        d.rounded_rectangle((222, 280, 378, 350), 14, fill=(225, 240, 240))
        d.rounded_rectangle((290, 310, 370, 338), 10, fill=(179, 38, 30))
    elif motif == "invoice":
        d.rectangle((190, 140, 410, 500), fill=(255, 255, 255))
        for i in range(6):
            d.rectangle((215, 190 + i * 45, 385 - (i % 3) * 40, 205 + i * 45), fill=(220, 220, 220))
        d.rectangle((300, 450, 385, 475), fill=color)
    else:
        sun(d, w // 2, 330, 90, (255, 255, 255))
    d.text((50, 600), title, font=font(56, True), fill=(255, 255, 255))
    d.text((50, 680), subtitle, font=font(26), fill=(255, 255, 255))
    d.text((50, 790), "ATELIER LUMEN", font=font(20, True), fill=(255, 255, 255))
    im.save(OUT / f"{name}.png")


def evacuation(plan):
    w, h = 600, 840
    im = Image.new("RGB", (w, h), (255, 255, 255))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, w, 110), fill=(0, 135, 70))
    centered(d, 30, "PLAN D'ÉVACUATION", font(44, True), (255, 255, 255), w)
    s = 17
    ox, oy = (w - plan["width"] * s) / 2, 200
    d.rectangle((ox, oy, ox + plan["width"] * s, oy + plan["depth"] * s), outline=INK, width=4)

    def px(x, z):
        return ox + (x + plan["width"] / 2) * s, oy + (z + plan["depth"] / 2) * s

    for b in plan["boxes"]:
        if not b["collider"]:
            continue
        x, _, z = b["position"]
        sx, _, sz = b["size"]
        if abs(b.get("rotationY", 0) or 0) > 0.1:
            sx, sz = sz, sx
        a = px(x - sx / 2, z - sz / 2)
        c = px(x + sx / 2, z + sz / 2)
        d.rectangle((*a, *c), fill=(190, 196, 204))
    ex, ey = px(0, plan["depth"] / 2)
    d.rectangle((ex - 30, ey - 6, ex + 30, ey + 6), fill=(0, 135, 70))
    sx_, sy_ = px(0, 6.4)
    d.ellipse((sx_ - 10, sy_ - 10, sx_ + 10, sy_ + 10), fill=(208, 59, 59))
    d.text((sx_ + 14, sy_ - 14), "Vous êtes ici", font=font(20, True), fill=(208, 59, 59))
    d.text((40, 620), "En cas d'alarme :", font=font(30, True), fill=INK)
    for i, line in enumerate(["Gardez votre calme", "Suivez les flèches vertes", "N'utilisez pas l'ascenseur", "Point de rassemblement : parvis"]):
        d.text((60, 670 + i * 38), "• " + line, font=font(24), fill=INK)
    im.save(OUT / "evacuation_plan.png")


def sprint_calendar():
    w, h = 1024, 512
    im = Image.new("RGB", (w, h), PAPER)
    d = ImageDraw.Draw(im)
    d.text((30, 20), "SPRINT 24", font=font(44, True), fill=INK)
    d.text((300, 32), "4 → 15 novembre 2026", font=font(30), fill=(90, 98, 110))
    days = ["L 4", "M 5", "M 6", "J 7", "V 8", "L 11", "M 12", "M 13", "J 14", "V 15"]
    cw = (w - 60) / 10
    for i, day in enumerate(days):
        x = 30 + i * cw
        today = day == "J 14"
        d.rectangle((x + 4, 110, x + cw - 4, 470), fill=LUMEN if today else (235, 232, 226))
        d.text((x + 14, 122), day, font=font(26, True), fill=INK)
        if i < 8:
            d.line((x + 18, 200, x + cw - 18, 440), fill=(150, 150, 150), width=5)
        if today:
            d.text((x + 10, 200), "Aujour-", font=font(18, True), fill=INK)
            d.text((x + 10, 224), "d'hui", font=font(18, True), fill=INK)
    d.text((30 + 9 * cw + 8, 400), "Démo !", font=font(20, True), fill=(179, 38, 30))
    im.save(OUT / "sprint_calendar.png")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    plan = json.loads((BUILD / "floorplan.json").read_text())
    welcome()
    poster("poster_pocket_sante", "Pocket Santé", "Le bon soin, au bon moment.", TEAL, "phone")
    poster("poster_facturo", "Facturo", "La facture en 2 minutes chrono.", (217, 89, 38), "invoice")
    poster("poster_valeurs", "Faire simple", "Utile · Soigné · Ensemble", (57, 135, 229), "sun")
    evacuation(plan)
    sprint_calendar()
    print("✓ décor →", OUT.relative_to(ROOT))


if __name__ == "__main__":
    main()
