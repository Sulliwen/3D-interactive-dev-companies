"""
Construit la scène Blender du Studio Lanterne (ancien chai des Chartrons, Bordeaux) à partir
du plan du jeu (art/build/studio-lanterne/floorplan.json). Écrit art/studio-lanterne.blend.

    ART_WORLD=studio-lanterne ~/apps/blender/blender --background \\
        --python tools/blender/scene_studio_lanterne.py -- [--force]

Reprend les briques génériques de build_scene.py (Builder, matériaux, bureaux, écrans,
chaises, assets, repères) et ajoute ce qui est propre au studio : murs de briques et
fenêtres d'atelier, poutres, colonnes en fonte, salle de playtest, cabine son, war room,
mur de concept art, cuisine et borne d'arcade, ludothèque, accueil.
Mêmes conventions que build_scene.py (collections, repères, col_*).
"""
import math
import os
import sys
from pathlib import Path

os.environ.setdefault("ART_WORLD", "studio-lanterne")
sys.path.insert(0, str(Path(__file__).resolve().parent))

import bpy  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

import build_scene as bs  # noqa: E402
from build_scene import B, MATS, Builder, boxes, by_suffix, coll, flat, pbr, shash, task_chair  # noqa: E402

PLAN, H, HW, HD = bs.PLAN, bs.H, bs.HW, bs.HD
BUILD, BLEND, ROOT = bs.BUILD, bs.BLEND, bs.ROOT
DECOR = BUILD / "decor"

# Lumière chaude des suspensions, un peu plus ambrée qu'à Atelier Lumen.
WARM = (1.0, 0.82, 0.62)


def box(name):
    return boxes(name)[0]


def place(asset_id, name, location, **kwargs):
    """bs.place, la bibliothèque rendue sélectionnable le temps de l'import : sinon, à partir
    du deuxième modèle importé, la fusion de ses morceaux échoue (collection cachée) et seul
    le premier morceau est gardé (feuilles des plantes, corps de la caméra…)."""
    if "bibliotheque" in bs.COLLECTIONS:
        coll("bibliotheque").hide_viewport = False
    return bs.place(asset_id, name, location, **kwargs)


# ---------------------------------------------------------------------------
# Matériaux
# ---------------------------------------------------------------------------


def materials():
    pbr("floor_concrete", "smooth_concrete_floor", "floor_concrete", tile=2.5, normal_strength=0.3)
    pbr("carpet_meeting", "poly_wool_herringbone", "carpet_meeting", tile=0.8)
    pbr("rug_daily", "poly_wool_herringbone", "rug_daily", tile=0.8)
    pbr("planks", "worn_planks", "planks", tile=1.4, normal_strength=0.5)
    pbr("brick", "red_brick_03", "brick", tile=1.0, normal_strength=0.8)
    pbr("beam", "rough_wood", "beam", tile=1.0, normal_strength=0.6)
    pbr("ceiling_wood", "rough_wood", "ceiling_wood", tile=1.2, normal_strength=0.4)
    pbr("oak", "white_oak_veneer", "oak", tile=1.2, normal_strength=0.3)
    pbr("plaster", "white_plaster_02", "plaster", tile=2.0, normal_strength=0.25)
    pbr("fabric_dark", "poly_wool_herringbone", "fabric_dark", tile=0.5)
    pbr("fabric_sage", "poly_wool_herringbone", "fabric_sage", tile=0.5)
    pbr("fabric_blue", "poly_wool_herringbone", "fabric_blue", tile=0.5)
    pbr("felt_light", "poly_wool_herringbone", "felt_light", tile=0.6)
    flat("metal_black", "#1d1f22", 0.45, 0.6)
    flat("metal_steel", "#b9bec4", 0.3, 0.9)
    flat("iron_paint", "#2b3a35", 0.5, 0.35)
    flat("plastic_dark", "#2a2d33", 0.45)
    flat("plastic_white", "#eceae6", 0.35)
    flat("lacquer_white", "#f1efea", 0.25)
    flat("lacquer_green", "#3f5a4c", 0.3)
    flat("whiteboard", "#fbfbf8", 0.12)
    flat("cork", "#b98b5c", 0.9)
    flat("foam", "#34373d", 0.95)
    flat("screen_off", "#0b0d12", 0.08)
    flat("ceramic", "#f4f2ee", 0.2)
    flat("ceramic_lumen", "#e8a24a", 0.25)
    flat("rubber", "#202124", 0.8)
    flat("lantern_glow", "#ffb852", 0.4, emission="#ffb852", strength=2.5)
    flat("bulb", "#fff1d6", 0.4, emission="#ffd9a0", strength=8.0)
    flat("glass", "#a9c7d6", 0.02, alpha=0.16)
    flat("glass_mirror", "#39424a", 0.04, metallic=0.4, alpha=0.55)
    for name, color in {
        "postit_yellow": "#f7d154",
        "postit_blue": "#7fc8f8",
        "postit_red": "#f4978e",
        "postit_green": "#a8e6a3",
    }.items():
        flat(name, color, 0.85)
    for i, color in enumerate(["#c0392b", "#2e86c1", "#f1c40f", "#27ae60", "#8e44ad", "#e67e22", "#ecf0f1", "#34495e"]):
        flat(f"game_box_{i}", color, 0.4)
    for name in ("poster_brume", "poster_petits_cailloux", "milestone_board", *[f"concept_{i}" for i in range(7)]):
        flat(name, "#ffffff", 0.6, image=DECOR / f"{name}.png")
    for name, strength in (
        ("logo_studio", 1.6),
        ("tv_brume", 1.2),
        ("screen_engine", 1.0),
        ("screen_art", 1.0),
        ("screen_code", 1.0),
        ("screen_audio", 1.0),
        ("arcade_screen", 1.4),
        ("arcade_marquee", 1.6),
    ):
        flat(name, "#ffffff", 0.3, emission=True, strength=strength, image=DECOR / f"{name}.png")


# ---------------------------------------------------------------------------
# Architecture : briques, fenêtres d'atelier, poutres, colonnes
# ---------------------------------------------------------------------------


def industrial_window(name, center, size, door=False):
    """Verrière d'atelier : cadre acier noir à petits carreaux, vitrage séparé."""
    x, y, z = center
    sx, sy, sz = size
    along_x = sx > sz
    length = sx if along_x else sz
    frame = Builder(name.replace("col_", "frame_"))
    panes = Builder(name.replace("col_", "glass_"))
    t = 0.035
    cols = max(2, round(length / 0.55))
    rows = max(2, round(sy / 0.6))
    for i in range(cols + 1):
        off = -length / 2 + i * length / cols
        px, pz = (x + off, z) if along_x else (x, z + off)
        w = 0.06 if i in (0, cols) else t
        frame.box((w, 0.06, sy) if along_x else (0.06, w, sy), B(px, y, pz), "metal_black")
    for j in range(rows + 1):
        hy = y - sy / 2 + j * sy / rows
        w = 0.06 if j in (0, rows) else t
        frame.box((length, 0.06, w) if along_x else (0.06, length, w), B(x, hy, z), "metal_black")
    if door:
        # Poignées de la grande porte.
        for side in (-0.12, 0.12):
            frame.box((0.03, 0.12, 0.5) if along_x else (0.12, 0.03, 0.5), B(x + side, 1.1, z), "metal_steel")
    panes.box((length, 0.012, sy - 0.04) if along_x else (0.012, length, sy - 0.04), B(x, y, z), "glass")
    frame.build("architecture")
    ob = panes.build("verre")
    ob.visible_shadow = False
    ob.visible_diffuse = False


def architecture():
    W, D = PLAN["width"], PLAN["depth"]
    Builder("floor_slab").plane((W, D), (0, 0, 0), "floor_concrete", tiled=True).build("architecture")
    Builder("ceiling_slab").plane((W, D), (0, 0, H), "ceiling_wood", rot=(math.pi, 0, 0), tiled=True).build("architecture")

    floors = {"carpet": "carpet_meeting", "woodFloor": "planks", "rug": "rug_daily"}
    for z in PLAN["zones"]:
        mat = floors.get(z["floor"])
        if not mat:
            continue
        (x0, z0), (x1, z1) = z["min"], z["max"]
        Builder(f"floor_{z['id']}").box((x1 - x0, z1 - z0, 0.006), B((x0 + x1) / 2, 0.003, (z0 + z1) / 2), mat).build("architecture")

    for b in PLAN["boxes"]:
        name = b["name"]
        x, y, z = b["position"]
        sx, sy, sz = b["size"]
        if name.startswith("col_window") or name.startswith("col_door_entrance"):
            industrial_window(name, (x, y, z), (sx, sy, sz), door=name.startswith("col_door"))
        elif name.startswith(("col_wall", "col_door_lintel")):
            Builder(name.replace("col_", "wall_")).box((sx, sz, sy), B(x, y, z), "brick").build("architecture")
        elif name.startswith(("col_playtest_wall", "col_booth")):
            w = Builder(name.replace("col_", "wall_"))
            w.box((sx, sz, sy), B(x, y, z), "plaster")
            w.box((sx + 0.01, sz + 0.03, 0.08), B(x, 0.04, z), "metal_black")
            w.build("architecture")
        elif name.startswith("col_playtest_mirror"):
            mirror(name, (x, y, z), (sx, sy, sz))
        elif name.startswith("col_warroom_glass"):
            bs.glazing(name, (x, y, z), (sx, sy, sz))
        elif name.startswith("col_pillar"):
            column(name, x, z)

    # Charpente : poutres de chêne d'une façade à l'autre, sous le plafond en planches.
    beams = Builder("ceiling_beams")
    for k in range(10):
        bx = -13.5 + k * 3
        beams.box((0.22, D - 0.2, 0.3), B(bx, H - 0.15, 0), "beam", bevel=0.01)
    # Deux poutrelles d'acier rivetées, en travers, posées sur les colonnes.
    for gz in (1.2,):
        beams.box((W - 0.2, 0.18, 0.28), B(0, H - 0.44, gz), "iron_paint")
    beams.build("architecture")


def mirror(name, center, size):
    """Miroir sans tain de la salle de playtest : vitrage sombre dans un cadre."""
    x, y, z = center
    sx, sy, sz = size
    frame = Builder(name.replace("col_", "frame_"))
    frame.box((0.1, sz, 0.08), B(x, 0.04, z), "metal_black")
    frame.box((0.1, sz, 0.08), B(x, sy - 0.04, z), "metal_black")
    frame.box((0.1, sz, 0.9), B(x, 0.45, z), "plaster")  # allège
    for k in range(4):
        frame.box((0.1, 0.06, sy), B(x, y, z - sz / 2 + k * sz / 3), "metal_black")
    frame.build("architecture")
    pane = Builder(name.replace("col_", "glass_"))
    pane.box((0.012, sz, sy - 1.0), B(x, 0.9 + (sy - 1.0) / 2, z), "glass_mirror")
    ob = pane.build("verre")
    ob.visible_shadow = False
    ob.visible_diffuse = False


def column(name, x, z):
    """Colonne en fonte de l'ancien chai : fût, base et chapiteau."""
    c = Builder(name.replace("col_", ""))
    c.cylinder(0.11, H, B(x, H / 2, z), "iron_paint", segments=20)
    c.cylinder(0.2, 0.12, B(x, 0.06, z), "iron_paint", segments=20)
    c.cylinder(0.16, 0.08, B(x, 0.16, z), "iron_paint", segments=20)
    c.cylinder(0.2, 0.1, B(x, H - 0.62, z), "iron_paint", segments=20, radius2=0.12)
    c.box((0.36, 0.36, 0.06), B(x, H - 0.55, z), "iron_paint")
    c.build("architecture")


# ---------------------------------------------------------------------------
# Postes de travail : bureaux, deux écrans, chaises
# ---------------------------------------------------------------------------

# Second écran de chaque poste, selon le métier (voir docs/fil-rouge-studio.md).
SECOND_SCREEN = {
    1: "screen_art",
    2: "screen_engine",
    3: "screen_code",
    4: "screen_engine",
    5: "screen_art",
    6: "screen_art",
    7: "screen_engine",
    8: "screen_code",
    9: "screen_code",
    10: "screen_engine",
    11: "screen_audio",
    12: "screen_code",
    13: "screen_engine",
    14: "tv_brume",
}

WORK_DESKS = ("island_", "playtest_research", "sound")


def workstations():
    desks = [b for b in by_suffix("_desk") if b["name"].startswith(WORK_DESKS)]
    for b in desks:
        bs.desk(b)
    for b in by_suffix("_monitor"):
        ob = bs.monitor(b)
        x, y, z = b["position"]
        station = min(PLAN["stations"], key=lambda s: (s["screenPosition"][0] - x) ** 2 + (s["screenPosition"][2] - z) ** 2)
        second = Builder(f"{b['name']}_second")
        w, h = 0.56, 0.32
        # À droite de l'écran principal, tourné vers la place assise.
        # (rotation négative : l'écran de droite se tourne vers le centre du poste)
        rot = (0, 0, -0.35)
        local = Matrix.Translation(Vector((0.62, 0.06, -0.01))) @ Matrix.Rotation(-0.35, 4, "Z")
        cx, cy, cz = local @ Vector((0, 0, 0))
        second.box((w + 0.02, 0.025, h + 0.02), (cx, cy, cz), "plastic_dark", rot=rot, bevel=0.004)
        front = local @ Vector((0, -0.0135, 0))
        second.plane((w, h), tuple(front), SECOND_SCREEN.get(station["number"], "screen_code"), rot=(math.pi / 2, 0, -0.35))
        stand = local @ Vector((0, 0.04, 0))
        desk_top = 0.75
        second.box((0.04, 0.03, y - desk_top - 0.05), (stand.x, stand.y, -(y - desk_top) / 2 - 0.02), "plastic_dark")
        second.box((0.2, 0.15, 0.012), (stand.x, stand.y, desk_top - y + 0.006), "plastic_dark", bevel=0.004)
        second.build("mobilier", ob.location, ob.rotation_euler.z)
    bs.partitions()

    for b in by_suffix("_chair"):
        if b["name"].startswith("warroom_"):
            continue
        x, _, z = b["position"]
        near = min(desks, key=lambda d: (d["position"][0] - x) ** 2 + (d["position"][2] - z) ** 2)
        yaw = bs.facing_towards(B(x, 0, z), B(near["position"][0], 0, near["position"][2]))
        task_chair(b["name"], B(x, 0, z), yaw + (shash(b["name"]) % 7 - 3) * 0.05)


# ---------------------------------------------------------------------------
# Salles : playtest, cabine son, war room, mur de concept art
# ---------------------------------------------------------------------------


def image_panel(name, mat, center, size, rot_z, frame="metal_black", depth=0.03, collection="decor"):
    """Panneau mural : cadre et image. Pour rot_z = 0, l'image regarde vers +Z du jeu."""
    w, h = size
    p = Builder(name)
    p.box((w + 0.04, depth, h + 0.04), (0, depth / 2, 0), frame)
    p.plane((w, h), (0, -0.002, 0), mat, rot=(math.pi / 2, 0, 0))
    return p.build(collection, center, rot_z)


def playtest_room():
    tv = box("playtest_tv")
    x, y, z = tv["position"]
    w, h = tv["size"][0], tv["size"][1]
    t = Builder("playtest_tv")
    t.box((w + 0.03, 0.04, h + 0.03), (0, 0.02, 0), "plastic_dark", bevel=0.004)
    t.plane((w, h), (0, -0.001, 0), "tv_brume", rot=(math.pi / 2, 0, 0))
    t.build("decor", B(x + 0.02, y, z), math.pi / 2)

    st = box("playtest_tv_stand")
    x, _, z = st["position"]
    sx, sy, sz = st["size"]
    s = Builder("playtest_tv_stand")
    s.box((sx, sz, sy), (0, 0, sy / 2), "oak", bevel=0.008)
    s.box((0.36, 0.26, 0.06), (0.02, -0.35, sy + 0.03), "plastic_white", bevel=0.01)  # console
    for k, dz in enumerate((0.25, 0.55)):
        s.box((0.16, 0.1, 0.04), (0.05, dz, sy + 0.02), "plastic_dark", bevel=0.015)  # manettes
    s.build("mobilier", B(x, 0, z), 0)

    so = box("playtest_sofa")
    x, _, z = so["position"]
    sofa = place("sofa_02", "playtest_sofa", B(x + 0.05, 0, z), rot_z=-math.pi / 2, collection="mobilier")
    sofa.scale = (1.25, 1.05, 1.0)

    cam = box("playtest_camera")
    x, _, z = cam["position"]
    tri = Builder("playtest_tripod")
    for k in range(3):
        a = k * 2 * math.pi / 3
        tri.cylinder(0.012, 1.3, (math.cos(a) * 0.17, math.sin(a) * 0.17, 0.62), "metal_black", segments=8, rot=(math.sin(a) * 0.26, -math.cos(a) * 0.26, 0))
    tri.cylinder(0.02, 0.3, (0, 0, 1.25), "metal_black", segments=10)
    tri.build("mobilier", B(x, 0, z), 0)
    # La caméra filme le canapé (vers le sud-est).
    yaw = bs.facing_towards(B(x, 0, z), B(-11.9, 0, -7.4))
    c = place("Camera_01", "playtest_camera", B(x, 1.4, z), rot_z=yaw, collection="mobilier", decimate=0.3)
    c.scale = (1.4, 1.4, 1.4)


def sound_booth():
    foam = Builder("booth_foam")
    # Panneaux de mousse sur les faces intérieures de la cabine (x -15 → -11, z -3,4 → 0,6).
    inner = [
        ("x", -3.29, (-14.8, -11.2)),  # mur nord, face sud
        ("x", 0.49, (-14.8, -11.2)),  # mur sud, face nord
        ("z", -14.89, (-3.2, 0.4)),  # mur ouest (briques), face est
    ]
    for axis, fixed, (a, b) in inner:
        n = int((b - a) / 0.6)
        for i in range(n):
            for j in range(3):
                c = a + (i + 0.5) * (b - a) / n
                yy = 0.9 + j * 0.6
                size = (0.55, 0.06, 0.55) if axis == "x" else (0.06, 0.55, 0.55)
                pos = B(c, yy, fixed) if axis == "x" else B(fixed, yy, c)
                foam.box(size, pos, "foam", bevel=0.02)
    foam.build("mobilier")

    roof = box("booth_ceiling")
    x, y, z = roof["position"]
    sx, sy, sz = roof["size"]
    r = Builder("booth_ceiling")
    r.box((sx, sz, sy), B(x, y, z), "felt_light")
    r.build("architecture")

    sp = Builder("booth_speakers")
    for b in boxes("booth_speaker_"):
        x, y, z = b["position"]
        sx, sy, sz = b["size"]
        sp.box((sx, sz, sy), B(x, y, z), "plastic_dark", bevel=0.01)
        sp.cylinder(0.08, 0.02, B(x + sx / 2, y - 0.06, z), "rubber", segments=18, rot=(0, math.pi / 2, 0))
        sp.cylinder(0.04, 0.02, B(x + sx / 2, y + 0.13, z), "metal_steel", segments=14, rot=(0, math.pi / 2, 0))
        sp.box((0.24, 0.05, 0.03), B(x, y - 0.24, z), "metal_black")  # console murale
    # Micro sur bras articulé, fixé au bureau.
    sp.cylinder(0.015, 0.45, B(-14.5, 0.98, -0.95), "metal_black", segments=8)
    sp.cylinder(0.012, 0.5, B(-14.3, 1.25, -0.95), "metal_black", segments=8, rot=(0, math.pi / 2.6, 0))
    sp.cylinder(0.035, 0.14, B(-14.08, 1.32, -0.95), "metal_steel", segments=14, rot=(0, math.pi / 2, 0))
    sp.build("mobilier")


def war_room():
    t = box("warroom_table")
    x, y, z = t["position"]
    sx, sy, sz = t["size"]
    m = Builder("warroom_table")
    m.box((sx, sz, 0.05), (0, 0, sy - 0.025), "oak", bevel=0.006)
    for lx in (-sx / 2 + 0.3, sx / 2 - 0.3):
        m.box((0.08, sz - 0.3, 0.06), (lx, 0, 0.03), "metal_black")
        m.box((0.08, 0.08, sy - 0.05), (lx, 0, (sy - 0.05) / 2), "metal_black")
    m.box((0.32, 0.22, 0.02), (-0.4, 0.1, sy + 0.01), "metal_steel", bevel=0.004)  # ordinateur portable
    m.build("mobilier", B(x, 0, z), 0)
    for b in boxes("warroom_chair_"):
        cx, _, cz = b["position"]
        task_chair(b["name"], B(cx, 0, cz), bs.facing_towards(B(cx, 0, cz), B(cx, 0, z)))

    mb = box("milestone_board")
    x, y, z = mb["position"]
    w, h = mb["size"][0], mb["size"][1]
    image_panel("milestone_board", "milestone_board", B(x, y, z + 0.02), (w - 0.06, h - 0.06), 0, frame="metal_steel")


def concept_wall():
    b = box("concept_wall")
    x, y, z = b["position"]
    sx, sy, sz = b["size"]
    c = Builder("concept_wall")
    c.box((sx, sz - 0.04, sy), (0, 0, y), "cork", bevel=0.01)
    c.box((sx + 0.06, sz, 0.05), (0, 0, y + sy / 2), "oak")
    c.box((sx + 0.06, sz, 0.05), (0, 0, y - sy / 2), "oak")
    for lx in (-sx / 2 + 0.15, sx / 2 - 0.15):
        c.box((0.06, 0.6, 0.04), (lx, 0, 0.02), "metal_black")
        c.box((0.05, 0.05, y - sy / 2), (lx, 0, (y - sy / 2) / 2), "metal_black")
    c.build("mobilier", B(x, 0, z), 0)

    prints = Builder("concept_prints")
    pins = Builder("concept_pins")
    for p in boxes("concept_print_"):
        px, py, pz = p["position"]
        w, h = p["size"][0], p["size"][1]
        idx = int(p["name"].rsplit("_", 1)[1])
        prints.plane((w, h), B(px, py, pz), f"concept_{idx}", rot=(math.pi / 2, 0, 0))
        for dx in (-w / 2 + 0.04, w / 2 - 0.04):
            pins.cylinder(0.012, 0.012, B(px + dx, py + h / 2 - 0.04, pz + 0.006), "lantern_glow", segments=8, rot=(math.pi / 2, 0, 0))
    # Post-it sur l'autre face (côté îlots), notes de l'équipe.
    colors = ["postit_yellow", "postit_blue", "postit_red", "postit_green"]
    back = z - sz / 2 - 0.003
    for k in range(18):
        nx = -2.1 + (k % 9) * 0.5 + (shash(f"pn{k}") % 10) / 100
        ny = 1.9 - (k // 9) * 0.35 - (shash(f"py{k}") % 8) / 100
        prints.box((0.14, 0.004, 0.14), B(nx, ny, back), colors[k % 4])
    prints.build("decor")
    pins.build("decor")


# ---------------------------------------------------------------------------
# Cuisine, détente, ludothèque, accueil
# ---------------------------------------------------------------------------


def kitchen():
    """Cuisine le long du mur est (miroir de celle d'Atelier Lumen, au mur ouest)."""
    k = box("kitchen_counter")
    x, y, z = k["position"]
    sx, sy, sz = k["size"]
    c = Builder("kitchen")
    c.box((sx, sz, sy - 0.04), (0, 0, (sy - 0.04) / 2), "lacquer_green", bevel=0.005)
    c.box((sx + 0.02, sz + 0.02, 0.04), (0, 0, sy - 0.02), "oak", bevel=0.004)
    for i in range(5):
        c.box((0.01, 0.12, 0.012), (-sx / 2 - 0.005, -sz / 2 + 0.45 + i * 0.9, sy - 0.12), "metal_steel")
    c.box((0.45, 0.5, 0.02), (0, -0.9, sy + 0.001), "metal_steel")  # évier
    c.cylinder(0.015, 0.3, (0.25, -0.9, sy + 0.15), "metal_steel", segments=10)
    # Étagères ouvertes en bois sur la brique (plutôt que des placards).
    for k2 in range(2):
        c.box((0.3, sz - 0.4, 0.04), (sx / 2 - 0.15, 0, 1.6 + k2 * 0.45), "oak")
        for j in range(8):
            c.cylinder(0.045, 0.1, (sx / 2 - 0.15, -sz / 2 + 0.5 + j * 0.45, 1.67 + k2 * 0.45), "ceramic" if j % 3 else "ceramic_lumen", segments=12)
    c.build("mobilier", B(x, 0, z), 0)

    f = box("kitchen_fridge")
    x, y, z = f["position"]
    fr = Builder("kitchen_fridge")
    fr.box((0.7, 0.7, 1.9), (0, 0, 0.95), "metal_steel", bevel=0.01)
    fr.box((0.02, 0.03, 0.5), (-0.36, 0.25, 1.2), "metal_black")
    fr.build("mobilier", B(x, 0, z), 0)

    m = box("coffee_machine")
    x, y, z = m["position"]
    cm = Builder("coffee_machine")
    cm.box((0.38, 0.32, 0.42), (0, 0, 0.21), "metal_steel", bevel=0.02)
    cm.box((0.02, 0.12, 0.08), (-0.2, 0, 0.3), "metal_black")
    cm.cylinder(0.04, 0.09, (-0.14, 0, 0.1), "ceramic", segments=12)
    cm.build("mobilier", B(x, 0.9, z), 0)

    t = box("cafe_bar_table")
    x, y, z = t["position"]
    sx, sy, sz = t["size"]
    bt = Builder("cafe_bar_table")
    bt.box((sx, sz, 0.05), (0, 0, sy - 0.025), "oak", bevel=0.006)
    for lx in (-sx / 2 + 0.2, sx / 2 - 0.2):
        bt.box((0.06, sz - 0.2, sy - 0.05), (lx, 0, (sy - 0.05) / 2), "metal_black")
    bt.build("mobilier", B(x, 0, z), 0)
    for i, (dx, dz) in enumerate([(-0.75, 0.75), (0.0, 0.75), (0.75, 0.75)]):
        st = Builder(f"bar_stool_{i}")
        st.cylinder(0.19, 0.05, (0, 0, 0.76), "oak", segments=20)
        st.cylinder(0.025, 0.72, (0, 0, 0.38), "metal_black", segments=10)
        st.cylinder(0.2, 0.015, (0, 0, 0.008), "metal_black", segments=20)
        st.cylinder(0.17, 0.015, (0, 0, 0.3), "metal_black", segments=20, radius2=0.17)
        st.build("mobilier", B(x + dx, 0, z + dz), 0)


def arcade_cabinet():
    a = box("arcade_cabinet")
    x, y, z = a["position"]
    sx, sy, sz = a["size"]
    c = Builder("arcade_cabinet")
    # Repère local : face avant vers -Y (puis tournée vers le nord du jeu).
    for side in (-1, 1):
        c.box((0.04, sz, sy), (side * (sx / 2 - 0.02), 0, sy / 2), "lacquer_green", bevel=0.01)
    c.box((sx - 0.08, sz - 0.1, 0.9), (0, 0.05, 0.45), "plastic_dark")
    c.box((sx - 0.08, 0.3, 0.06), (0, -sz / 2 + 0.15, 0.95), "plastic_dark", rot=(-0.25, 0, 0))  # panneau de commande
    c.cylinder(0.012, 0.08, (-0.15, -sz / 2 + 0.12, 1.02), "metal_black", segments=8)
    c.cylinder(0.03, 0.02, (-0.15, -sz / 2 + 0.12, 1.07), "postit_red", segments=12)
    for k in range(3):
        c.cylinder(0.025, 0.02, (0.04 + k * 0.08, -sz / 2 + 0.14, 1.0), ["postit_yellow", "postit_blue", "postit_green"][k], segments=12)
    c.box((sx - 0.08, 0.04, 0.6), (0, -0.02, 1.35), "plastic_dark", rot=(-0.12, 0, 0))
    c.plane((0.5, 0.56), (0, -0.045, 1.35), "arcade_screen", rot=(math.pi / 2 - 0.12, 0, 0))
    c.box((sx - 0.08, 0.2, 0.18), (0, -0.05, sy - 0.09), "plastic_dark")
    c.plane((sx - 0.12, 0.14), (0, -0.152, sy - 0.09), "arcade_marquee", rot=(math.pi / 2, 0, 0))
    c.build("mobilier", B(x, 0, z), math.pi)


def sofas_and_library():
    for name, rot in (("lounge_sofa", math.pi), ("library_sofa", math.pi)):
        b = box(name)
        x, _, z = b["position"]
        s = place("sofa_02", name, B(x, 0, z - 0.05), rot_z=rot, collection="mobilier")
        s.scale = (1.3, 1.05, 1.0)
    t = box("library_low_table")["position"]
    place("coffee_table_round_01", "library_low_table", B(t[0], 0, t[2]), collection="mobilier").scale = (0.7, 0.7, 0.8)
    place("mid_century_lounge_chair", "library_chair", B(-13.6, 0, 7.6), rot_z=-math.pi / 2 - 0.5, collection="mobilier")
    place("mid_century_lounge_chair", "lounge_chair", B(13.6, 0, 8.2), rot_z=math.pi / 2 + 0.5, collection="mobilier")

    g = box("game_shelf")
    x, y, z = g["position"]
    sx, sy, sz = g["size"]
    sh = Builder("game_shelf")
    # Étagère contre le mur ouest, ouverte vers l'est (+X du jeu).
    sh.box((sx, sz, 0.04), (0, 0, 0.02), "oak")
    for k in range(5):
        sh.box((sx, sz, 0.03), (0, 0, 0.4 + k * 0.44), "oak")
    for lz in (-sz / 2, 0, sz / 2):
        sh.box((sx, 0.04, sy), (0, lz, sy / 2), "oak")
    sh.box((0.02, sz, sy), (-sx / 2 + 0.01, 0, sy / 2), "oak")
    i = 0
    for k in range(4):
        cursor = -sz / 2 + 0.08
        while cursor < sz / 2 - 0.1:
            if abs(cursor) < 0.06:
                cursor += 0.08
                continue
            th = 0.03 + (shash(f"g{i}") % 3) * 0.01
            hh = 0.18 + (shash(f"h{i}") % 5) * 0.02
            sh.box((0.14, th, hh), (0.05, cursor, 0.43 + k * 0.44 + hh / 2), f"game_box_{shash(f'c{i}') % 8}")
            cursor += th + 0.008
            i += 1
            if shash(f"gap{i}") % 9 == 0:
                cursor += 0.15
    # Consoles et manettes sur l'étagère du haut.
    sh.box((0.3, 0.25, 0.08), (0.05, -1.2, 2.21), "plastic_white", bevel=0.01)
    sh.box((0.28, 0.32, 0.06), (0.05, 0.9, 2.2), "plastic_dark", bevel=0.01)
    sh.build("mobilier", B(x, 0, z), 0)


def reception():
    r = box("reception_desk")
    x, y, z = r["position"]
    sx, sy, sz = r["size"]
    rd = Builder("reception_desk")
    rd.box((sx, sz, sy - 0.03), (0, 0, (sy - 0.03) / 2), "beam", bevel=0.01)
    rd.box((sx + 0.06, sz + 0.1, 0.04), (0, -0.02, sy - 0.02), "oak", bevel=0.005)
    rd.box((sx - 0.2, 0.01, 0.06), (0, -sz / 2 - 0.005, sy - 0.2), "lantern_glow")
    rd.build("mobilier", B(x, 0, z), 0)

    logo = box("reception_logo")
    x, y, z = logo["position"]
    image_panel("reception_logo", "logo_studio", B(x, y, z), (2.8, 0.7), math.pi, frame="metal_black", depth=0.05)
    for name in ("poster_brume", "poster_petits_cailloux"):
        p = box(name)
        x, y, z = p["position"]
        image_panel(name, name, B(x, y, z), (0.96, 1.36), math.pi, frame="oak")


def plants():
    for b in boxes("plant_"):
        x, y, z = b["position"]
        ob = place("potted_plant_02", b["name"], B(x, 0, z), rot_z=shash(b["name"]) % 6, height=1.25, decimate=0.18)
        ob["no_bake"] = True
    for i, b in enumerate(d for d in by_suffix("_desk") if d["name"].startswith("island_")):
        x, y, z = b["position"]
        rot = b.get("rotationY", 0) or 0
        top = b["size"][1]
        if i % 3 == 0:
            ob = place("potted_plant_04", f"desk_plant_{i}", B(x, top, z) + Matrix.Rotation(rot, 4, "Z") @ Vector((-0.55, 0.0, 0)), rot_z=i, height=0.22, decimate=0.5)
            ob["no_bake"] = True
        if i % 2 == 1:
            # Le modèle regroupe plusieurs carnets (≈ 1,1 m) : réduit à une petite pile.
            pad = place("office_notepads", f"notepads_{i}", B(x, top, z) + Matrix.Rotation(rot, 4, "Z") @ Vector((0.45, 0.1, 0)), rot_z=rot + 0.3)
            pad.scale = (0.3, 0.3, 0.3)


# ---------------------------------------------------------------------------
# Éclairage : suspensions industrielles et lumière d'appoint
# ---------------------------------------------------------------------------

PENDANTS = [
    (-4.4, -7.0), (-2.8, -7.0),  # îlot design
    (2.8, -7.0), (4.4, -7.0),  # îlot art
    (-4.4, 4.4), (-2.8, 4.4),  # îlot code
    (-1.2, 0.6), (1.2, 0.6),  # mur de concept art
    (11.6, -6.6), (13.2, -6.6),  # war room
    (10.8, 6.4), (12.0, 6.4),  # bar de la cuisine
    (-11.6, 7.9),  # ludothèque
    (4.6, 7.4),  # accueil
    (-12.6, -6.4),  # salle de playtest
    (6.5, -2.5), (-7.0, -2.5), (0.0, -3.4), (3.0, 4.0), (-9.0, 4.0),  # allées
]


def lights():
    # Ampoules visibles dans les cages des suspensions (le modèle n'en a pas d'émissive).
    bulbs = Builder("pendant_bulbs")
    for lx, lz in PENDANTS:
        bulbs.cylinder(0.06, 0.12, B(lx, H - 0.1 - 1.22, lz), "bulb", segments=12)
    bulbs.build("lumieres")["no_bake"] = True
    for i, (lx, lz) in enumerate(PENDANTS):
        # Le modèle pend sous son origine (tige comprise, 1,34 m) : accroché à 3,9 m, sous les poutres.
        lamp = place("hanging_industrial_lamp", f"pendant_{i}", B(lx, H - 0.1, lz), collection="lumieres", decimate=0.25)
        lamp.location.z = H - 0.1
        light = bpy.data.lights.new(f"pendant_{i}", "POINT")
        light.energy = 110
        light.color = WARM
        light.shadow_soft_size = 0.25
        lo = bpy.data.objects.new(f"pendant_light_{i}", light)
        lo.location = Vector((lamp.location.x, lamp.location.y, H - 0.1 - 1.28))
        coll("lumieres").objects.link(lo)
    # Lumière d'appoint douce sous le plafond, au-dessus des grandes zones.
    for i, (lx, lz, sx, sz) in enumerate([(0, -6, 12, 6), (-3, 3.5, 10, 6), (10, 5.5, 9, 7), (-11, 7, 7, 5), (12, -7, 6, 5), (-12, -7.2, 5, 5)]):
        data = bpy.data.lights.new(f"fill_{i}", "AREA")
        data.shape = "RECTANGLE"
        data.size, data.size_y = sx, sz
        data.energy = 260
        data.color = (1.0, 0.9, 0.78)
        ob = bpy.data.objects.new(f"fill_{i}", data)
        ob.location = B(lx, H - 0.5, lz)
        coll("lumieres").objects.link(ob)
    # Cabine son : une seule lampe, plus froide.
    data = bpy.data.lights.new("booth", "AREA")
    data.size = 1.2
    data.energy = 60
    data.color = (0.9, 0.93, 1.0)
    ob = bpy.data.objects.new("booth_light", data)
    ob.location = B(-13, 2.75, -1.4)
    coll("lumieres").objects.link(ob)


def preview_cameras():
    views = {
        "preview_accueil": ((0.6, 1.65, 9.3), (0.0, 1.2, -4.0)),
        "preview_ilots": ((-8.0, 1.8, -2.5), (3.0, 1.0, -8.0)),
        "preview_playtest": ((-9.6, 1.7, -5.0), (-14.5, 1.1, -8.0)),
        "preview_cuisine": ((6.5, 1.7, 2.5), (14.0, 1.0, 9.0)),
        "preview_warroom": ((10.0, 1.7, -4.8), (12.0, 1.4, -10.0)),
    }
    for name, (eye, target) in views.items():
        cam = bpy.data.cameras.new(name)
        cam.lens = 20
        ob = bpy.data.objects.new(name, cam)
        ob.location = B(*eye)
        ob.rotation_euler = (B(*target) - B(*eye)).to_track_quat("-Z", "Y").to_euler()
        coll("apercus").objects.link(ob)
    coll("apercus").hide_render = False


def main():
    if BLEND.exists() and "--force" not in bs.ARGS:
        print(f"{BLEND} existe déjà (relancez avec --force pour le régénérer).")
        return
    bs.reset_scene()
    materials()
    architecture()
    workstations()
    playtest_room()
    sound_booth()
    war_room()
    concept_wall()
    kitchen()
    arcade_cabinet()
    sofas_and_library()
    reception()
    plants()
    lights()
    bs.markers()
    bs.world_and_sun()
    preview_cameras()
    BLEND.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
    n = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == "MESH" and "bibliotheque" not in [c.name for c in o.users_collection])
    print(f"✓ scène construite : {len(bpy.data.objects)} objets, ~{n} faces → {BLEND.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
