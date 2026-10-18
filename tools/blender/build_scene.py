"""
Construit la scène Blender de l'étage à partir du plan du jeu (art/build/<monde>/floorplan.json) :
architecture, mobilier modélisé sur mesure, assets Poly Haven, matériaux PBR, éclairage.
Écrit art/atelier-lumen.blend.

    ~/apps/blender/blender --background --python tools/blender/build_scene.py -- [--force]

Sans --force, un .blend existant n'est pas écrasé (il peut contenir vos retouches).

Conventions (lues par le code du jeu ou par l'export) :
  - collections : architecture, mobilier, decor, verre, lumieres, reperes, collisions ;
  - repères : spawn_main, anchor_station_NN (où se tenir), screen_station_NN (écran) ;
  - col_* : boîtes de collision (non exportées, le jeu les tire du plan) ;
  - 1 unité = 1 m. Le jeu est en Y vers le haut ; Blender en Z vers le haut : (x, y, z)
    du jeu = (x, -z, y) dans Blender. La conversion inverse est faite par l'export glTF.
"""
import json
import math
import os
import sys
import zlib
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "art" / "sources"
# Monde construit (dossier art/build/<monde>/) ; ce script décrit l'étage d'Atelier Lumen.
WORLD = os.environ.get("ART_WORLD", "atelier-lumen")
BUILD = ROOT / "art" / "build" / WORLD
BLEND = ROOT / "art" / f"{WORLD}.blend"
ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []

PLAN = json.loads((BUILD / "floorplan.json").read_text())
W, D, H = PLAN["width"], PLAN["depth"], PLAN["wallHeight"]
HW, HD = W / 2, D / 2


def shash(text):
    """Hachage stable (contrairement à hash(), aléatoire d'un lancement à l'autre)."""
    return zlib.crc32(text.encode())


def B(x, y, z):
    """Coordonnées du jeu (Y en haut) → Blender (Z en haut)."""
    return Vector((x, -z, y))


# ---------------------------------------------------------------------------
# Scène et collections
# ---------------------------------------------------------------------------


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    return scene


COLLECTIONS = {}


def coll(name):
    if name not in COLLECTIONS:
        c = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(c)
        COLLECTIONS[name] = c
    return COLLECTIONS[name]


# ---------------------------------------------------------------------------
# Matériaux (Principled BSDF uniquement : exportables en glTF)
# ---------------------------------------------------------------------------

MATS = {}


def _principled(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    return mat, nodes, mat.node_tree.links, bsdf


def pbr(name, tex_id, variant=None, tile=1.0, roughness_scale=None, normal_strength=0.6):
    """Matériau texturé (albédo éventuellement teinté, rugosité, normales). `tile` en mètres."""
    mat, nodes, links, bsdf = _principled(name)
    folder = SRC / "textures" / tex_id

    def image(file, non_color=False, y=0):
        node = nodes.new("ShaderNodeTexImage")
        node.image = bpy.data.images.load(str(folder / file), check_existing=True)
        if non_color:
            node.image.colorspace_settings.name = "Non-Color"
        node.location = (-600, y)
        return node

    diff = image(f"diff_{variant}.jpg" if variant else "diff.jpg", y=300)
    links.new(diff.outputs["Color"], bsdf.inputs["Base Color"])
    rough = image("rough.jpg", True, 0)
    links.new(rough.outputs["Color"], bsdf.inputs["Roughness"])
    nrm = image("nor_gl.jpg", True, -300)
    nmap = nodes.new("ShaderNodeNormalMap")
    nmap.inputs["Strength"].default_value = normal_strength
    links.new(nrm.outputs["Color"], nmap.inputs["Color"])
    links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
    mat["tile"] = tile
    MATS[name] = mat
    return mat


def flat(name, color, roughness=0.5, metallic=0.0, emission=None, strength=1.0, alpha=None, image=None, tile=1.0):
    mat, nodes, links, bsdf = _principled(name)
    bsdf.inputs["Base Color"].default_value = (*srgb(color), 1)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if image:
        tex = nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(str(image), check_existing=True)
        tex.location = (-500, 200)
        links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        if emission:
            links.new(tex.outputs["Color"], bsdf.inputs["Emission Color"])
            bsdf.inputs["Emission Strength"].default_value = strength
    elif emission:
        bsdf.inputs["Emission Color"].default_value = (*srgb(emission), 1)
        bsdf.inputs["Emission Strength"].default_value = strength
    if alpha is not None:
        bsdf.inputs["Alpha"].default_value = alpha
        mat.surface_render_method = "BLENDED"
    mat["tile"] = tile
    MATS[name] = mat
    return mat


def srgb(hex_or_rgb):
    if isinstance(hex_or_rgb, str):
        h = hex_or_rgb.lstrip("#")
        rgb = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    else:
        rgb = hex_or_rgb
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb)


def build_materials():
    pbr("floor_concrete", "smooth_concrete_floor", "floor_concrete", tile=2.5, normal_strength=0.3)
    pbr("carpet_team", "poly_wool_herringbone", "carpet_team", tile=0.8)
    pbr("carpet_meeting", "poly_wool_herringbone", "carpet_meeting", tile=0.8)
    pbr("rug_daily", "poly_wool_herringbone", "rug_daily", tile=0.8)
    pbr("parquet", "wood_floor", "parquet", tile=2.0, normal_strength=0.4)
    pbr("oak", "white_oak_veneer", "oak", tile=1.2, normal_strength=0.3)
    pbr("plaster", "white_plaster_02", "plaster", tile=2.0, normal_strength=0.25)
    pbr("fabric_dark", "poly_wool_herringbone", "fabric_dark", tile=0.5)
    pbr("fabric_sage", "poly_wool_herringbone", "fabric_sage", tile=0.5)
    pbr("fabric_blue", "poly_wool_herringbone", "fabric_blue", tile=0.5)
    pbr("felt_light", "poly_wool_herringbone", "felt_light", tile=0.6)
    flat("metal_black", "#1d1f22", 0.45, 0.6)
    flat("metal_steel", "#b9bec4", 0.3, 0.9)
    flat("plastic_dark", "#2a2d33", 0.45)
    flat("plastic_white", "#eceae6", 0.35)
    flat("lacquer_white", "#f1efea", 0.25)
    flat("whiteboard", "#fbfbf8", 0.12)
    flat("screen_off", "#0b0d12", 0.08)
    flat("ceramic", "#f4f2ee", 0.2)
    flat("ceramic_lumen", "#f2a541", 0.25)
    flat("rubber", "#202124", 0.8)
    flat("led", "#fff4e0", 0.5, emission="#fff4e0", strength=6.0)
    flat("logo", "#f2a541", 0.4, emission="#f2a541", strength=2.5)
    flat("glass", "#a9c7d6", 0.02, alpha=0.16)
    flat("glass_frosted", "#e8eef1", 0.3, alpha=0.55)
    for name, color in {"postit_yellow": "#f7d154", "postit_blue": "#7fc8f8", "postit_red": "#f4978e", "postit_green": "#a8e6a3"}.items():
        flat(name, color, 0.85)
    decor = BUILD / "decor"
    flat("welcome_screen", "#ffffff", 0.2, emission=True, strength=1.4, image=decor / "welcome_screen.png")
    flat("sprint_calendar", "#ffffff", 0.7, image=decor / "sprint_calendar.png")
    flat("evacuation_plan", "#ffffff", 0.4, image=decor / "evacuation_plan.png")
    for p in ("poster_pocket_sante", "poster_facturo", "poster_valeurs"):
        flat(p, "#ffffff", 0.6, image=decor / f"{p}.png")


# ---------------------------------------------------------------------------
# Géométrie : un « Builder » assemble des pièces (boîtes, cylindres) en un objet
# ---------------------------------------------------------------------------


def box_uv(bm, tile, mat_index=None):
    """UV « boîte » en mètres / taille de tuile : les textures gardent leur échelle réelle."""
    uv = bm.loops.layers.uv.verify()
    for f in bm.faces:
        if mat_index is not None and f.material_index != mat_index:
            continue
        n = f.normal
        ax = max(range(3), key=lambda i: abs(n[i]))
        for loop in f.loops:
            co = loop.vert.co
            if ax == 0:
                u, v = co.y, co.z
            elif ax == 1:
                u, v = co.x, co.z
            else:
                u, v = co.x, co.y
            loop[uv].uv = (u / tile, v / tile)


class Builder:
    def __init__(self, name):
        self.name = name
        self.bm = bmesh.new()
        self.mats = []

    def _mat_index(self, mat_name):
        mat = MATS[mat_name]
        if mat not in self.mats:
            self.mats.append(mat)
        return self.mats.index(mat)

    def _append(self, part, mat_name, matrix):
        idx = self._mat_index(mat_name)
        bmesh.ops.transform(part, matrix=matrix, verts=part.verts)
        part.normal_update()
        for f in part.faces:
            f.material_index = idx
        box_uv(part, MATS[mat_name].get("tile", 1.0))
        me = bpy.data.meshes.new("tmp")
        part.to_mesh(me)
        part.free()
        self.bm.from_mesh(me)
        bpy.data.meshes.remove(me)

    def box(self, size, center, mat, rot=(0, 0, 0), bevel=0.0):
        part = bmesh.new()
        bmesh.ops.create_cube(part, size=1.0)
        bmesh.ops.scale(part, vec=Vector(size), verts=part.verts)
        if bevel > 0:
            bmesh.ops.bevel(
                part, geom=part.edges[:], offset=min(bevel, min(size) / 2.2), segments=2, profile=0.5, affect="EDGES", clamp_overlap=True
            )
        m = Matrix.Translation(Vector(center)) @ Matrix.Rotation(rot[2], 4, "Z") @ Matrix.Rotation(rot[1], 4, "Y") @ Matrix.Rotation(rot[0], 4, "X")
        self._append(part, mat, m)
        return self

    def cylinder(self, radius, depth, center, mat, segments=16, rot=(0, 0, 0), radius2=None):
        part = bmesh.new()
        bmesh.ops.create_cone(
            part, cap_ends=True, segments=segments, radius1=radius, radius2=radius if radius2 is None else radius2, depth=depth
        )
        m = Matrix.Translation(Vector(center)) @ Matrix.Rotation(rot[2], 4, "Z") @ Matrix.Rotation(rot[1], 4, "Y") @ Matrix.Rotation(rot[0], 4, "X")
        self._append(part, mat, m)
        return self

    def plane(self, size, center, mat, rot=(0, 0, 0), tiled=False):
        """Rectangle (x, y) face +Z avant rotation ; UV 0..1 (images) ou en tuiles (`tiled`)."""
        part = bmesh.new()
        bmesh.ops.create_grid(part, x_segments=1, y_segments=1, size=0.5)
        bmesh.ops.scale(part, vec=Vector((size[0], size[1], 1)), verts=part.verts)
        idx = self._mat_index(mat)
        uv = part.loops.layers.uv.verify()
        for f in part.faces:
            f.material_index = idx
            for loop in f.loops:
                co = loop.vert.co
                if tiled:
                    tile = MATS[mat].get("tile", 1.0)
                    loop[uv].uv = (co.x / tile, co.y / tile)
                else:
                    loop[uv].uv = (co.x / size[0] + 0.5, co.y / size[1] + 0.5)
        m = Matrix.Translation(Vector(center)) @ Matrix.Rotation(rot[2], 4, "Z") @ Matrix.Rotation(rot[1], 4, "Y") @ Matrix.Rotation(rot[0], 4, "X")
        bmesh.ops.transform(part, matrix=m, verts=part.verts)
        me = bpy.data.meshes.new("tmp")
        part.to_mesh(me)
        part.free()
        self.bm.from_mesh(me)
        bpy.data.meshes.remove(me)
        return self

    def build(self, collection, location=(0, 0, 0), rot_z=0.0):
        me = bpy.data.meshes.new(self.name)
        self.bm.to_mesh(me)
        self.bm.free()
        for m in self.mats:
            me.materials.append(m)
        ob = bpy.data.objects.new(self.name, me)
        ob.location = Vector(location)
        ob.rotation_euler = (0, 0, rot_z)
        coll(collection).objects.link(ob)
        return ob


# ---------------------------------------------------------------------------
# Architecture
# ---------------------------------------------------------------------------


def architecture():
    # Dalle de sol et plafond (épais : pas de fuite de lumière au précalcul).
    # Sol et plafond en simples faces : les murs (pleins jusqu'au plafond) en cachent les bords.
    Builder("floor_slab").plane((W, D), (0, 0, 0), "floor_concrete", tiled=True).build("architecture")
    Builder("ceiling_slab").plane((W, D), (0, 0, H), "plaster", rot=(math.pi, 0, 0), tiled=True).build("architecture")

    floors = {"carpet": "carpet_meeting", "carpetTeam": "carpet_team", "woodFloor": "parquet", "rug": "rug_daily"}
    for z in PLAN["zones"]:
        mat = floors.get(z["floor"])
        if not mat:
            continue
        (x0, z0), (x1, z1) = z["min"], z["max"]
        c = B((x0 + x1) / 2, 0.003, (z0 + z1) / 2)
        Builder(f"floor_{z['id']}").box((x1 - x0, z1 - z0, 0.006), c, mat).build("architecture")

    for b in PLAN["boxes"]:
        name = b["name"]
        if not name.startswith(("col_wall", "col_door", "col_meeting", "col_pillar")):
            continue
        x, y, z = b["position"]
        sx, sy, sz = b["size"]
        if b["material"] == "wall":
            builder = Builder(name.replace("col_", "wall_"))
            builder.box((sx, sz, sy), B(x, y, z), "plaster")
            # Plinthe sombre au pied des murs pleins.
            if sy > 2 and not name.startswith("col_pillar"):
                builder.box((sx + 0.01, sz + 0.03, 0.08), B(x, 0.04, z), "metal_black")
            builder.build("architecture")
        elif b["material"] == "glass":
            glazing(name, (x, y, z), (sx, sy, sz))


def glazing(name, center, size):
    """Paroi vitrée : montants noirs tous les ~1,5 m, traverses, vitrage séparé."""
    x, y, z = center
    sx, sy, sz = size
    along_x = sx > sz
    length = sx if along_x else sz
    frame = Builder(name.replace("col_", "frame_"))
    panes = Builder(name.replace("col_", "glass_"))
    t = 0.06
    n = max(1, round(length / 1.5))
    for i in range(n + 1):
        off = -length / 2 + i * length / n
        px, pz = (x + off, z) if along_x else (x, z + off)
        frame.box((t, 0.1, sy) if along_x else (0.1, t, sy), B(px, y, pz), "metal_black")
    for hy in (0.04, sy - 0.04):
        frame.box((length, 0.1, 0.08) if along_x else (0.1, length, 0.08), B(x, hy, z), "metal_black")
    panes.box((length, 0.012, sy - 0.16) if along_x else (0.012, length, sy - 0.16), B(x, y, z), "glass")
    frame.build("architecture")
    ob = panes.build("verre")
    ob.visible_shadow = False
    ob.visible_diffuse = False


def ceiling_details():
    """Panneaux acoustiques suspendus et réglettes LED au-dessus des îlots et des allées."""
    acoustic = Builder("ceiling_acoustic")
    leds = Builder("ceiling_led")
    lights = []
    islands = [(-3, -6.5, 0), (3.5, -6.5, 0), (11, -1, math.pi / 2), (-4, 6.5, 0)]
    for cx, cz, rot in islands:
        for dx in (-0.8, 0.8):
            ox, oz = (dx, 0) if rot == 0 else (0, dx)
            acoustic.box((1.4, 2.6, 0.04) if rot == 0 else (2.6, 1.4, 0.04), B(cx + ox, 2.75, cz + oz), "felt_light", bevel=0.01)
        for dz in (-0.9, 0.9):
            lx, lz = (cx, cz + dz) if rot == 0 else (cx + dz, cz)
            leds.box((2.6, 0.06, 0.04) if rot == 0 else (0.06, 2.6, 0.04), B(lx, 2.6, lz), "led")
            leds.box((0.01, 0.01, 0.38), B(lx, 2.8, lz), "metal_black")
            lights.append((lx, lz, rot))
    # Allées et coins communs : lignes de réglettes régulières.
    for lx, lz in [(0, 2.5), (-1, -2.5), (6.5, 4.5), (2, 8), (-11, 6), (-11, -7.25), (12.5, 6), (8, -7), (-7, -1.5), (13, -6)]:
        leds.box((1.8, 0.06, 0.04), B(lx, 2.6, lz), "led")
        leds.box((0.01, 0.01, 0.38), B(lx, 2.8, lz), "metal_black")
        lights.append((lx, lz, 0))
    acoustic.build("architecture")
    led_obj = leds.build("lumieres")
    led_obj["no_bake"] = True
    for i, (lx, lz, rot) in enumerate(lights):
        data = bpy.data.lights.new(f"led_{i:02d}", "AREA")
        data.shape = "RECTANGLE"
        data.size, data.size_y = (2.2, 0.15) if rot == 0 else (0.15, 2.2)
        data.energy = 90
        data.color = (1.0, 0.95, 0.88)
        ob = bpy.data.objects.new(f"led_{i:02d}", data)
        ob.location = B(lx, 2.57, lz)
        coll("lumieres").objects.link(ob)


# ---------------------------------------------------------------------------
# Mobilier
# ---------------------------------------------------------------------------


def boxes(prefix):
    return [b for b in PLAN["boxes"] if b["name"].startswith(prefix)]


def by_suffix(suffix):
    return [b for b in PLAN["boxes"] if b["name"].endswith(suffix)]


def facing_towards(frm, to):
    """Angle (autour de Z Blender) pour que l'axe -Y local regarde de `frm` vers `to`."""
    dx, dy = to[0] - frm[0], to[1] - frm[1]
    return math.atan2(dx, -dy)


def desk(b):
    x, y, z = b["position"]
    sx, sy, sz = b["size"]
    rot = b.get("rotationY", 0) or 0
    top = 0.03
    d = Builder(b["name"])
    d.box((sx, sz, top), (0, 0, sy - top / 2), "oak", bevel=0.004)
    for lx in (-sx / 2 + 0.05, sx / 2 - 0.05):
        d.box((0.05, sz - 0.1, 0.03), (lx, 0, 0.015), "metal_black")
        d.box((0.05, 0.05, sy - top), (lx, 0, (sy - top) / 2), "metal_black")
        d.box((0.04, sz - 0.14, 0.04), (lx, 0, sy - top - 0.06), "metal_black")
    d.box((sx - 0.14, 0.02, 0.25), (0, 0, sy - top - 0.16), "metal_black")  # voile de fond / goulotte
    # Caisson à tiroirs sur la moitié des postes.
    if shash(b["name"]) % 2 == 0:
        d.box((0.42, 0.55, 0.58), (sx / 2 - 0.3, 0, 0.3), "lacquer_white", bevel=0.01)
        for k in range(3):
            d.box((0.12, 0.012, 0.012), (sx / 2 - 0.3, -0.28, 0.12 + k * 0.19), "metal_steel")
    d.build("mobilier", B(x, 0, z), rot)


def monitor(b, station_facing=None):
    x, y, z = b["position"]
    rot = b.get("rotationY", 0) or 0
    # Sens de l'écran : vers la place assise (s'éloigne du centre du bureau voisin).
    desks = by_suffix("_desk") + boxes("scrum_master_desk")
    near = min(desks, key=lambda d: (d["position"][0] - x) ** 2 + (d["position"][2] - z) ** 2)
    fx, fz = near["position"][0] - x, near["position"][2] - z
    face = math.atan2(fx, fz)  # angle dans le plan du jeu (0 = +Z)
    m = Builder(b["name"])
    w, h = b["size"][0], b["size"][1]
    desk_top = near["position"][1] + near["size"][1] / 2
    m.box((w + 0.02, 0.025, h + 0.02), (0, 0.0, 0), "plastic_dark", bevel=0.004)
    m.box((w, 0.004, h), (0, -0.0135, 0), "screen_off")
    m.box((0.05, 0.03, y - desk_top - h / 2 + 0.02), (0, 0.04, -(y - desk_top) / 2 - h / 4 + 0.01), "plastic_dark")
    m.box((0.24, 0.18, 0.012), (0, 0.04, desk_top - y + 0.006), "plastic_dark", bevel=0.004)
    # Clavier et souris devant l'écran.
    m.box((0.44, 0.14, 0.02), (0, -0.3, desk_top - y + 0.01), "plastic_white", bevel=0.005)
    m.box((0.06, 0.1, 0.03), (0.33, -0.3, desk_top - y + 0.015), "plastic_white", bevel=0.012)
    # Un mug sur un poste sur deux.
    if shash(b["name"]) % 2 == 1:
        m.cylinder(0.04, 0.1, (-0.42, -0.22, desk_top - y + 0.05), "ceramic_lumen" if shash(b["name"]) % 3 else "ceramic")
    ob = m.build("mobilier", B(x, y, z), face)
    return ob


def task_chair(name, center, yaw):
    c = Builder(name)
    for k in range(5):
        a = k * 2 * math.pi / 5
        c.box((0.32, 0.04, 0.03), (math.cos(a) * 0.16, math.sin(a) * 0.16, 0.06), "metal_black", rot=(0, 0, a))
        c.cylinder(0.025, 0.04, (math.cos(a) * 0.3, math.sin(a) * 0.3, 0.025), "rubber", segments=10, rot=(math.pi / 2, 0, a))
    c.cylinder(0.035, 0.36, (0, 0, 0.25), "metal_black", segments=12)
    c.box((0.5, 0.48, 0.08), (0, 0, 0.46), "fabric_dark", bevel=0.03)
    c.box((0.46, 0.05, 0.52), (0, 0.27, 0.8), "fabric_dark", rot=(-0.14, 0, 0), bevel=0.025)
    c.box((0.06, 0.04, 0.3), (0, 0.27, 0.56), "metal_black")
    for side in (-1, 1):
        c.box((0.05, 0.26, 0.03), (side * 0.27, 0.0, 0.66), "plastic_dark", bevel=0.01)
        c.box((0.025, 0.04, 0.18), (side * 0.27, 0.05, 0.56), "metal_black")
    return c.build("mobilier", center, yaw)


def wheelchair_seat():
    """Chaise retirée : le titulaire du poste 3 (Julien) a son propre fauteuil roulant."""
    s = next(s for s in PLAN["stations"] if s["number"] == 3)
    x, _, z = s["screenPosition"]
    nx, nz = math.sin(s["screenRotationY"]), math.cos(s["screenRotationY"])
    tx, tz = x + nx * 0.9, z + nz * 0.9
    return min(by_suffix("_chair"), key=lambda c: (c["position"][0] - tx) ** 2 + (c["position"][2] - tz) ** 2)["name"]


def chairs():
    desks = by_suffix("_desk") + boxes("scrum_master_desk")
    skip = wheelchair_seat()
    for b in by_suffix("_chair"):
        if b["name"] == skip:
            continue
        x, _, z = b["position"]
        near = min(desks, key=lambda d: (d["position"][0] - x) ** 2 + (d["position"][2] - z) ** 2)
        yaw = facing_towards(B(x, 0, z), B(near["position"][0], 0, near["position"][2]))
        task_chair(b["name"], B(x, 0, z), yaw + (shash(b["name"]) % 7 - 3) * 0.05)
    table = boxes("meeting_table")[0]["position"]
    for b in boxes("meeting_chair"):
        x, _, z = b["position"]
        yaw = facing_towards(B(x, 0, z), B(x, 0, table[2]))
        task_chair(b["name"], B(x, 0, z), yaw)


def partitions():
    for b in by_suffix("_partition"):
        x, y, z = b["position"]
        sx, sy, sz = b["size"]
        p = Builder(b["name"])
        p.box((sx, 0.03, sy), (0, 0, 0), "fabric_sage", bevel=0.01)
        p.box((sx + 0.02, 0.035, 0.02), (0, 0, sy / 2), "metal_black")
        p.build("mobilier", B(x, y, z), b.get("rotationY", 0) or 0)


def meeting_room():
    t = boxes("meeting_table")[0]
    x, y, z = t["position"]
    sx, sy, sz = t["size"]
    m = Builder("meeting_table")
    m.box((sx, sz, 0.04), (0, 0, sy - 0.02), "oak", bevel=0.006)
    for lx in (-sx / 2 + 0.4, sx / 2 - 0.4):
        m.box((0.06, sz - 0.3, 0.06), (lx, 0, 0.03), "metal_black")
        m.box((0.06, 0.06, sy - 0.04), (lx, 0, (sy - 0.04) / 2), "metal_black")
    m.cylinder(0.08, 0.02, (0, 0, sy + 0.01), "plastic_dark", segments=20)  # pieuvre de visioconférence
    m.build("mobilier", B(x, 0, z), 0)

    s = boxes("meeting_screen")[0]
    x, y, z = s["position"]
    scr = Builder("meeting_screen_body")
    scr.box((1.76, 0.04, 1.04), (0, 0, 0), "plastic_dark", bevel=0.005)
    scr.build("mobilier", B(x, y, z), math.pi / 2)

    p = boxes("meeting_paperboard")[0]
    x, y, z = p["position"]
    pb = Builder("meeting_paperboard")
    pb.box((0.72, 0.02, 1.0), (0, 0, 1.25), "whiteboard", bevel=0.005)
    for lx in (-0.3, 0.3):
        pb.box((0.03, 0.03, 1.8), (lx, 0.12, 0.9), "metal_steel", rot=(0.12, 0, 0))
    pb.box((0.03, 0.03, 1.75), (0, -0.25, 0.87), "metal_steel", rot=(-0.28, 0, 0))
    pb.build("mobilier", B(x, 0, z), p.get("rotationY", 0) or 0)


def scrum_wall():
    b = boxes("scrum_board")[0]
    x, y, z = b["position"]
    sx, sy, sz = b["size"]
    s = Builder("scrum_board")
    s.box((sx, 0.03, sy), (0, 0, y), "whiteboard", bevel=0.004)
    s.box((sx + 0.04, 0.035, 0.03), (0, 0, y + sy / 2), "metal_steel")
    s.box((sx + 0.04, 0.035, 0.03), (0, 0, y - sy / 2), "metal_steel")
    for lx in (-sx / 2 + 0.1, sx / 2 - 0.1):
        s.box((0.04, 0.04, y + sy / 2), (lx, 0.02, (y + sy / 2) / 2), "metal_steel")
        s.box((0.06, 0.5, 0.03), (lx, 0, 0.015), "metal_black")
    for k in range(1, 4):
        s.box((0.008, 0.032, sy - 0.25), (-sx / 2 + k * sx / 4, 0, y - 0.1), "plastic_dark")
    s.box((sx - 0.1, 0.032, 0.008), (0, 0, y + sy / 2 - 0.2), "plastic_dark")
    s.build("mobilier", B(x, 0, z), 0)

    colors = {"#f7d154": "postit_yellow", "#7fc8f8": "postit_blue", "#f4978e": "postit_red", "#a8e6a3": "postit_green"}
    notes = Builder("scrum_postits")
    for p in boxes("scrum_postit"):
        px, py, pz = p["position"]
        notes.box((0.14, 0.004, 0.14), B(px, py, pz), colors.get(p.get("color"), "postit_yellow"), rot=(0, 0, 0))
    notes.build("decor")

    # Calendrier du sprint au mur ouest du coin daily.
    cal = Builder("sprint_calendar")
    cal.box((1.64, 0.02, 0.84), (0, 0, 0), "metal_steel")
    cal.plane((1.6, 0.8), (0, -0.011, 0), "sprint_calendar", rot=(math.pi / 2, 0, 0))
    cal.build("decor", B(-6.0, 1.6, HD - 0.11), math.pi)

    sm = boxes("scrum_master_desk")[0]
    x, y, z = sm["position"]
    sx, sy, sz = sm["size"]
    d = Builder("scrum_master_desk")
    d.box((sx, sz, 0.03), (0, 0, sy - 0.015), "oak", bevel=0.004)
    for lx in (-sx / 2 + 0.08, sx / 2 - 0.08):
        d.box((0.07, 0.05, sy - 0.03), (lx, 0, (sy - 0.03) / 2), "metal_black")
        d.box((0.08, sz - 0.05, 0.03), (lx, 0, 0.015), "metal_black")
    d.build("mobilier", B(x, 0, z), 0)


def kitchen():
    k = boxes("kitchen_counter")[0]
    x, y, z = k["position"]
    sx, sy, sz = k["size"]  # 0.7 × 0.9 × 5 (le long de Z du jeu)
    c = Builder("kitchen")
    c.box((sx, sz, sy - 0.04), (0, 0, (sy - 0.04) / 2), "lacquer_white", bevel=0.005)
    c.box((sx + 0.02, sz + 0.02, 0.04), (0, 0, sy - 0.02), "oak", bevel=0.004)
    for i in range(6):
        c.box((0.01, 0.12, 0.012), (sx / 2 + 0.005, -sz / 2 + 0.42 + i * 0.83, sy - 0.12), "metal_steel")
    c.box((0.45, 0.5, 0.02), (0, 0.9, sy + 0.001), "metal_steel")  # évier
    c.cylinder(0.015, 0.3, (-0.25, 0.9, sy + 0.15), "metal_steel", segments=10)
    c.box((0.35, sz, 0.7), (-sx / 2 + 0.175, 0, 1.95), "lacquer_white", bevel=0.005)  # placards hauts
    c.build("mobilier", B(x, 0, z), 0)

    f = boxes("kitchen_fridge")[0]
    x, y, z = f["position"]
    fr = Builder("kitchen_fridge")
    fr.box((0.7, 0.7, 1.9), (0, 0, 0.95), "metal_steel", bevel=0.01)
    fr.box((0.02, 0.03, 0.5), (0.36, 0.25, 1.2), "metal_black")
    fr.build("mobilier", B(x, 0, z), 0)

    m = boxes("coffee_machine")[0]
    x, y, z = m["position"]
    cm = Builder("coffee_machine")
    cm.box((0.38, 0.32, 0.42), (0, 0, 0.21), "plastic_dark", bevel=0.02)
    cm.box((0.02, 0.12, 0.08), (0.2, 0, 0.3), "metal_steel")
    cm.cylinder(0.04, 0.09, (0.14, 0, 0.1), "ceramic", segments=12)
    cm.build("mobilier", B(x, 0.9, z), 0)

    t = boxes("cafe_bar_table")[0]
    x, y, z = t["position"]
    sx, sy, sz = t["size"]
    bt = Builder("cafe_bar_table")
    bt.box((sx, sz, 0.04), (0, 0, sy - 0.02), "oak", bevel=0.006)
    for lx in (-sx / 2 + 0.2, sx / 2 - 0.2):
        bt.box((0.06, sz - 0.2, sy - 0.04), (lx, 0, (sy - 0.04) / 2), "metal_black")
    bt.build("mobilier", B(x, 0, z), 0)
    for i, (dx, dz) in enumerate([(-0.75, 0.75), (0.0, 0.75), (0.75, 0.75), (-0.4, -0.75), (0.4, -0.75)]):
        st = Builder(f"bar_stool_{i}")
        st.cylinder(0.19, 0.05, (0, 0, 0.76), "oak", segments=20)
        st.cylinder(0.025, 0.72, (0, 0, 0.38), "metal_black", segments=10)
        st.cylinder(0.2, 0.015, (0, 0, 0.008), "metal_black", segments=20)
        st.cylinder(0.17, 0.015, (0, 0, 0.3), "metal_black", segments=20, radius2=0.17)
        st.build("mobilier", B(x + dx, 0, z + dz), 0)


def sofa(name, center, size, rot, fabric):
    """Canapé contemporain : socle, assises, dossier et accoudoirs en blocs arrondis."""
    sx, sz = size
    s = Builder(name)
    s.box((sx, sz, 0.12), (0, 0, 0.1), "metal_black")
    s.box((sx - 0.3, sz - 0.25, 0.18), (0, -0.08, 0.3), fabric, bevel=0.05)
    s.box((sx, 0.22, 0.45), (0, sz / 2 - 0.11, 0.55), fabric, bevel=0.07)
    for side in (-1, 1):
        s.box((0.16, sz, 0.32), (side * (sx / 2 - 0.08), 0, 0.37), fabric, bevel=0.06)
    s.build("mobilier", center, rot)


def lounge_and_reception():
    b = boxes("cafe_sofa")[0]
    x, _, z = b["position"]
    sofa("cafe_sofa", B(x, 0, z), (2.2, 0.9), math.pi, "fabric_blue")
    b = boxes("lounge_sofa")[0]
    x, _, z = b["position"]
    sofa("lounge_sofa", B(x, 0, z), (2.2, 0.9), math.pi / 2, "fabric_sage")

    r = boxes("reception_desk")[0]
    x, y, z = r["position"]
    sx, sy, sz = r["size"]
    rd = Builder("reception_desk")
    rd.box((sx, sz, sy - 0.03), (0, 0, (sy - 0.03) / 2), "lacquer_white", bevel=0.01)
    rd.box((sx + 0.06, sz + 0.1, 0.03), (0, -0.02, sy - 0.015), "oak", bevel=0.005)
    rd.box((sx - 0.2, 0.01, 0.12), (0, -sz / 2 - 0.005, sy - 0.25), "logo")
    rd.build("mobilier", B(x, 0, z), 0)

    logo = boxes("reception_logo")[0]
    x, y, z = logo["position"]
    bpy.ops.object.text_add(location=B(x, y - 0.05, z - 0.02))
    t = bpy.context.object
    t.data.body = "atelier lumen"
    t.data.align_x = "CENTER"
    t.data.align_y = "CENTER"
    t.data.size = 0.42
    t.data.extrude = 0.012
    t.rotation_euler = (math.pi / 2, 0, math.pi)
    t.data.materials.append(MATS["logo"])
    bpy.ops.object.convert(target="MESH")
    t.name = "reception_logo"
    for c in t.users_collection:
        c.objects.unlink(t)
    coll("decor").objects.link(t)
    ring = Builder("reception_logo_sun")
    ring.cylinder(0.14, 0.02, B(x + 1.85, y - 0.02, z - 0.02), "logo", segments=24, rot=(math.pi / 2, 0, 0))
    ring.build("decor")

    ws = boxes("welcome_screen")[0]
    x, y, z = ws["position"]
    w = Builder("welcome_screen")
    w.box((1.44, 0.04, 0.84), (0, 0, 0), "plastic_dark", bevel=0.004)
    w.plane((1.4, 0.79), (0, -0.0205, 0), "welcome_screen", rot=(math.pi / 2, 0, 0))
    w.build("decor", B(x, y, z - 0.02), math.pi)


def misc_furniture():
    l = boxes("lockers")[0]
    x, y, z = l["position"]
    sx, sy, sz = l["size"]
    lk = Builder("lockers")
    lk.box((sx, sz, sy), (0, 0, sy / 2), "metal_black", bevel=0.005)
    cols, rows = 8, 3
    for i in range(cols):
        for j in range(rows):
            cx = -sx / 2 + (i + 0.5) * sx / cols
            cz = (j + 0.5) * sy / rows
            lk.box((sx / cols - 0.02, 0.01, sy / rows - 0.02), (cx, sz / 2 + 0.002, cz), "fabric_sage" if (i + j) % 5 == 0 else "plastic_dark")
            lk.box((0.012, 0.02, 0.06), (cx + sx / cols / 2 - 0.05, sz / 2 + 0.01, cz), "metal_steel")
    lk.build("mobilier", B(x, 0, z), math.pi)

    p = boxes("printer")[0]
    x, y, z = p["position"]
    pr = Builder("printer")
    pr.box((0.6, 0.55, 0.85), (0, 0, 0.425), "plastic_white", bevel=0.02)
    pr.box((0.55, 0.5, 0.15), (0, 0, 0.92), "plastic_dark", bevel=0.02)
    pr.box((0.2, 0.01, 0.1), (0.12, -0.28, 0.85), "screen_off")
    pr.build("mobilier", B(x, 0, z), math.pi)

    for b in boxes("col_phone_booth"):
        x, y, z = b["position"]
        sx, sy, sz = b["size"]
        bo = Builder(b["name"].replace("col_", ""))
        bo.box((sx, sz, 0.08), (0, 0, sy - 0.04), "plastic_white", bevel=0.01)
        bo.box((sx, 0.06, sy), (0, sz / 2 - 0.03, sy / 2), "fabric_sage")
        bo.box((0.06, sz, sy), (-sx / 2 + 0.03, 0, sy / 2), "fabric_sage")
        bo.box((0.06, sz, sy), (sx / 2 - 0.03, 0, sy / 2), "fabric_sage")
        bo.box((sx - 0.2, 0.3, 0.03), (0, sz / 2 - 0.2, 1.0), "oak")
        bo.box((0.04, 0.04, 0.6), (0, sz / 2 - 0.4, 0.3), "metal_black")
        bo.cylinder(0.18, 0.05, (0, sz / 2 - 0.4, 0.62), "fabric_dark", segments=18)
        bo.build("mobilier", B(x, 0, z), -math.pi / 2)
        gl = Builder(b["name"].replace("col_", "glass_"))
        gl.box((0.012, sz - 0.12, sy - 0.1), (0, 0, 0), "glass")
        ob = gl.build("verre", B(x + sx / 2 - 0.006, sy / 2, z), 0)
        ob.visible_shadow = False
        ob.visible_diffuse = False

    ev = boxes("evacuation_plan")[0]
    x, y, z = ev["position"]
    e = Builder("evacuation_plan")
    e.box((0.54, 0.02, 0.74), (0, 0, 0), "metal_steel")
    e.plane((0.5, 0.7), (0, -0.011, 0), "evacuation_plan", rot=(math.pi / 2, 0, 0))
    e.build("decor", B(x, y, z - 0.02), math.pi)

    # Affiches de l'entreprise sur le mur ouest (open space).
    posters = Builder("posters")
    for name, gz in [("poster_pocket_sante", 0.2), ("poster_facturo", 1.1), ("poster_valeurs", 2.0)]:
        posters.box((0.03, 0.64, 0.88), B(-HW + 0.12, 1.6, gz), "metal_black")
        posters.plane((0.6, 0.84), B(-HW + 0.137, 1.6, gz), name, rot=(math.pi / 2, 0, -math.pi / 2))
    posters.build("decor")


# ---------------------------------------------------------------------------
# Assets Poly Haven
# ---------------------------------------------------------------------------

LIBRARY = {}


def load_model(asset_id, decimate=None):
    """Importe un modèle glTF une fois (collection cachée « bibliotheque »)."""
    if asset_id in LIBRARY:
        return LIBRARY[asset_id]
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(SRC / "models" / asset_id / f"{asset_id}.gltf"))
    meshes = [o for o in set(bpy.data.objects) - before if o.type == "MESH"]
    for o in set(bpy.data.objects) - before:
        for c in o.users_collection:
            c.objects.unlink(o)
        coll("bibliotheque").objects.link(o)
    # Fusionner en un seul objet, transformations appliquées.
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    ob.parent = None
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for o in set(bpy.data.objects) - before:
        if o != ob and o.type != "MESH":
            bpy.data.objects.remove(o)
    if decimate:
        mod = ob.modifiers.new("decimate", "DECIMATE")
        mod.ratio = decimate
        bpy.ops.object.modifier_apply(modifier=mod.name)
    ob.name = f"lib_{asset_id}"
    coll("bibliotheque").hide_render = True
    coll("bibliotheque").hide_viewport = True
    LIBRARY[asset_id] = ob
    return ob


def place(asset_id, name, location, rot_z=0.0, height=None, collection="decor", decimate=None):
    lib = load_model(asset_id, decimate)
    ob = bpy.data.objects.new(name, lib.data)  # maillage partagé (instance)
    ob.location = Vector(location)
    ob.rotation_euler = (0, 0, rot_z)
    if height:
        z0 = min((v.co.z for v in lib.data.vertices))
        z1 = max((v.co.z for v in lib.data.vertices))
        s = height / max(1e-6, z1 - z0)
        ob.scale = (s, s, s)
        ob.location.z -= z0 * s
    coll(collection).objects.link(ob)
    return ob


def assets():
    for b in boxes("plant_"):
        x, y, z = b["position"]
        ob = place("potted_plant_02", b["name"], B(x, 0, z), rot_z=shash(b["name"]) % 6, height=1.25, decimate=0.18)
        ob["no_bake"] = True
    # Petites plantes et carnets sur quelques bureaux.
    for i, b in enumerate(by_suffix("_desk")):
        x, y, z = b["position"]
        rot = b.get("rotationY", 0) or 0
        top = b["size"][1]
        off = Matrix.Rotation(rot, 4, "Z") @ Vector((-0.55, 0.0, 0))
        if i % 3 == 0:
            ob = place("potted_plant_04", f"desk_plant_{i}", B(x, top, z) + off, rot_z=i, height=0.22, decimate=0.5)
            ob["no_bake"] = True
        if i % 2 == 1:
            place("office_notepads", f"notepads_{i}", B(x, top, z) + Matrix.Rotation(rot, 4, "Z") @ Vector((0.45, 0.1, 0)), rot_z=rot + 0.3)
    t = boxes("cafe_low_table")[0]["position"]
    place("coffee_table_round_01", "cafe_low_table", B(t[0], 0, t[2]))
    place("modern_arm_chair_01", "cafe_armchair_0", B(t[0] - 1.25, 0, t[2] - 0.3), rot_z=-math.pi / 2 + 0.4)
    place("modern_arm_chair_01", "cafe_armchair_1", B(t[0] + 1.25, 0, t[2] - 0.3), rot_z=math.pi / 2 - 0.4)
    place("mid_century_lounge_chair", "lounge_chair_0", B(13.4, 0, 2.6), rot_z=math.pi / 2 + 0.3)
    place("coffee_table_round_01", "lounge_table", B(13.2, 0, 4.5))
    place("mid_century_lounge_chair", "reception_chair_0", B(1.6, 0, 9.0), rot_z=math.pi - 0.5)
    place("mid_century_lounge_chair", "reception_chair_1", B(-0.6, 0, 9.2), rot_z=math.pi + 0.4)
    for i, (lx, lz) in enumerate([(-11.5, 6.2), (-11, -7.25), (-12.2, -7.25), (-9.8, -7.25)]):
        lamp = place("modern_ceiling_lamp_01", f"pendant_{i}", B(lx, 2.2, lz), collection="lumieres")
        lamp.location.z = H - lamp.dimensions.z
        light = bpy.data.lights.new(f"pendant_{i}", "POINT")
        light.energy = 60
        light.color = (1.0, 0.86, 0.7)
        light.shadow_soft_size = 0.2
        lo = bpy.data.objects.new(f"pendant_light_{i}", light)
        lo.location = Vector((lamp.location.x, lamp.location.y, lamp.location.z + 0.05))
        coll("lumieres").objects.link(lo)


# ---------------------------------------------------------------------------
# Repères lus par le jeu, collisions, éclairage, caméras d'aperçu
# ---------------------------------------------------------------------------


def markers():
    sx, sy, sz = PLAN["spawn"]["position"]
    e = bpy.data.objects.new("spawn_main", None)
    e.location = B(sx, sy, sz)
    e.rotation_euler = (0, 0, PLAN["spawn"]["rotationY"])
    coll("reperes").objects.link(e)
    for s in PLAN["stations"]:
        n = s["number"]
        a = bpy.data.objects.new(f"anchor_station_{n:02d}", None)
        a.location = B(s["standPoint"][0], 0, s["standPoint"][1])
        a.empty_display_type = "SINGLE_ARROW"
        coll("reperes").objects.link(a)
        sc = bpy.data.objects.new(f"screen_station_{n:02d}", None)
        x, y, z = s["screenPosition"]
        sc.location = B(x, y, z)
        sc.rotation_euler = (0, 0, s["screenRotationY"])
        sc.empty_display_type = "PLAIN_AXES"
        sc["screenSize"] = list(s["screenSize"])
        coll("reperes").objects.link(sc)
    for b in PLAN["boxes"]:
        if not b["collider"]:
            continue
        x, y, z = b["position"]
        sx, sy, sz = b["size"]
        name = b["name"] if b["name"].startswith("col_") else f"col_{b['name']}"
        c = Builder(name)
        c.box((sx, sz, sy), (0, 0, 0), "metal_black")
        ob = c.build("collisions", B(x, y, z), b.get("rotationY", 0) or 0)
        ob.display_type = "WIRE"
    coll("collisions").hide_render = True


def world_and_sun():
    world = bpy.data.worlds.new("ciel")
    bpy.context.scene.world = world
    world.use_nodes = True
    nodes, links = world.node_tree.nodes, world.node_tree.links
    env = nodes.new("ShaderNodeTexEnvironment")
    env.image = bpy.data.images.load(str(SRC / "hdri" / "sky_2k.hdr"))
    mapping = nodes.new("ShaderNodeMapping")
    coord = nodes.new("ShaderNodeTexCoord")
    links.new(coord.outputs["Generated"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], env.inputs["Vector"])
    bg = nodes["Background"]
    bg.inputs["Strength"].default_value = 1.0
    links.new(env.outputs["Color"], bg.inputs["Color"])
    # Orienter le soleil du ciel vers les baies est (matinée lyonnaise).
    import numpy as np

    img = env.image
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    lum = px.reshape(h, w, 4)[..., :3].sum(axis=2)
    row, col = np.unravel_index(int(np.argmax(lum)), lum.shape)
    sun_azimuth = (col / w) * 2 * math.pi - math.pi  # azimut du soleil dans l'image
    wanted = math.radians(-20)  # vers +X (est), un peu au sud
    mapping.inputs["Rotation"].default_value[2] = wanted - sun_azimuth
    world["sun_pixel"] = [int(col), int(row)]


def preview_cameras():
    # (x, hauteur, z) dans le repère du jeu.
    views = {
        "preview_accueil": ((0.0, 1.65, 9.3), (0.0, 1.1, -2.0)),
        "preview_openspace": ((-6.5, 1.7, 3.5), (6.0, 0.9, -8.0)),
        "preview_dev": ((7.5, 1.6, -3.5), (2.0, 0.9, -7.5)),
        "preview_cafe": ((-7.8, 1.65, 3.2), (-14.0, 0.9, 8.5)),
    }
    for name, (eye, target) in views.items():
        cam = bpy.data.cameras.new(name)
        cam.lens = 22
        ob = bpy.data.objects.new(name, cam)
        ob.location = B(*eye)
        direction = B(*target) - B(*eye)
        ob.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        coll("apercus").objects.link(ob)
    coll("apercus").hide_render = False


def main():
    if BLEND.exists() and "--force" not in ARGS:
        print(f"{BLEND} existe déjà (relancez avec --force pour le régénérer).")
        return
    reset_scene()
    build_materials()
    architecture()
    ceiling_details()
    for b in by_suffix("_desk"):
        desk(b)
    for b in by_suffix("_monitor") + boxes("scrum_master_monitor"):
        monitor(b)
    chairs()
    partitions()
    meeting_room()
    scrum_wall()
    kitchen()
    lounge_and_reception()
    misc_furniture()
    assets()
    markers()
    world_and_sun()
    preview_cameras()
    BLEND.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
    n = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == "MESH" and "bibliotheque" not in [c.name for c in o.users_collection])
    print(f"✓ scène construite : {len(bpy.data.objects)} objets, ~{n} faces → {BLEND.relative_to(ROOT)}")


# Importable sans effet (les scènes des autres mondes réutilisent ses briques) ;
# Blender exécute un script --python sous le nom « __main__ ».
if __name__ == "__main__":
    main()
