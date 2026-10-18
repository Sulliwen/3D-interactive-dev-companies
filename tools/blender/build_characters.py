"""
Compose les personnages (collaborateurs, figurants, avatars visiteurs) à partir des corps
de base Quaternius (CC0) : vêtements générés depuis le corps, coiffures, teintes, accessoires,
badge. Chaque personnage est fusionné en un seul maillage avec une seule texture (atlas
cuit par Cycles) : un appel de dessin par personnage. Un niveau de détail allégé (LOD1)
est ajouté pour la distance.

    ~/apps/blender/blender --background --python tools/blender/build_characters.py -- [ids…] [--preview]

Entrées : tools/blender/characters.json, art/sources/manuel/quaternius/ (zips décompressés).
Sorties : art/build/characters/<id>.glb (+ art/build/characters/preview_<id>.png avec --preview).
"""
import json
import math
import sys
import zlib
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[2]
Q = ROOT / "art/sources/manuel/quaternius"
UBC = Q / "ubc/Universal Base Characters[Standard]"
OUT = ROOT / "art/build/characters"
SPEC = json.loads((Path(__file__).parent / "characters.json").read_text(encoding="utf-8"))
ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
PREVIEW = "--preview" in ARGS
ONLY = [a for a in ARGS if not a.startswith("--")]
ATLAS = 1024

SKIN = {  # mélange texture claire / foncée, puis teinte
    "light": (0.0, (1.0, 1.0, 1.0)),
    "fair": (0.15, (1.0, 0.95, 0.9)),
    "medium": (0.45, (1.0, 0.97, 0.93)),
    "tan": (0.65, (1.0, 0.96, 0.9)),
    "dark": (1.0, (0.72, 0.68, 0.66)),
    "deep": (1.0, (0.5, 0.46, 0.45)),
}

TOP_BONES = {"spine_01", "spine_02", "spine_03", "clavicle_l", "clavicle_r", "upperarm_l", "upperarm_r"}
SLEEVES = {"lowerarm_l", "lowerarm_r"}
PANTS_BONES = {"pelvis", "thigh_l", "thigh_r", "calf_l", "calf_r"}
SHOE_BONES = {"foot_l", "foot_r", "ball_l", "ball_r", "ball_leaf_l", "ball_leaf_r"}


def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)


def shash(s):
    return zlib.crc32(s.encode())


# ---------------------------------------------------------------------------


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"


def import_gltf(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    return list(set(bpy.data.objects) - before)


def flat_material(name, color, roughness=0.7, metallic=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = srgb(color)
    b.inputs["Roughness"].default_value = roughness
    b.inputs["Metallic"].default_value = metallic
    return m


def tint_material(mat, color):
    """Multiplie la couleur de base (texture) par une teinte : sert aux cheveux."""
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    link = bsdf.inputs["Base Color"].links[0] if bsdf.inputs["Base Color"].links else None
    if not link:
        bsdf.inputs["Base Color"].default_value = srgb(color)
        return
    src = link.from_socket
    bw = nt.nodes.new("ShaderNodeRGBToBW")
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = 1.0
    nt.links.new(src, bw.inputs["Color"])
    # Luminance remontée (les mèches restent visibles), puis multipliée par la teinte.
    ramp = nt.nodes.new("ShaderNodeMapRange")
    ramp.inputs["From Max"].default_value = 0.7
    nt.links.new(bw.outputs["Val"], ramp.inputs["Value"])
    nt.links.new(ramp.outputs["Result"], mix.inputs["A"])
    mix.inputs["B"].default_value = srgb(color)
    nt.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])


def skin_material(mat, body, tone):
    """Carnation : mélange des textures claire et foncée du pack, puis teinte."""
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    tex_dir = UBC / "Base Characters/Textures"
    light = tex_dir / ("T_Superhero_Female_Light_BaseColor.png" if body == "female" else "T_Superhero_Male_Ligh.png")
    dark = tex_dir / ("T_Superhero_Female_Dark_BaseColor.png" if body == "female" else "T_Superhero_Male_Dark.png")
    t1 = nt.nodes.new("ShaderNodeTexImage")
    t1.image = bpy.data.images.load(str(light), check_existing=True)
    t2 = nt.nodes.new("ShaderNodeTexImage")
    t2.image = bpy.data.images.load(str(dark), check_existing=True)
    fac, tint = SKIN[tone]
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs["Factor"].default_value = fac
    nt.links.new(t1.outputs["Color"], mix.inputs["A"])
    nt.links.new(t2.outputs["Color"], mix.inputs["B"])
    mul = nt.nodes.new("ShaderNodeMix")
    mul.data_type = "RGBA"
    mul.blend_type = "MULTIPLY"
    mul.inputs["Factor"].default_value = 1.0
    mul.inputs["B"].default_value = (*tint, 1.0)
    nt.links.new(mix.outputs["Result"], mul.inputs["A"])
    nt.links.new(mul.outputs["Result"], bsdf.inputs["Base Color"])


# ---------------------------------------------------------------------------
# Vêtements générés à partir du corps
# ---------------------------------------------------------------------------


def dominant_bones(ob):
    names = {g.index: g.name for g in ob.vertex_groups}
    out = []
    for v in ob.data.vertices:
        if v.groups:
            g = max(v.groups, key=lambda g: g.weight)
            out.append(names[g.group])
        else:
            out.append(None)
    return out


def clothing_piece(body, name, keep, thickness, material, smooth=8, cut_below=None):
    """Copie des sommets du corps sélectionnés, lissée (tissu, pas muscles) puis gonflée."""
    ob = body.copy()
    ob.data = body.data.copy()
    ob.name = name
    body.users_collection[0].objects.link(ob)
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bm.verts.ensure_lookup_table()
    drop = [v for v in bm.verts if not keep[v.index]]
    bmesh.ops.delete(bm, geom=drop, context="VERTS")
    # Le glTF est découpé le long des coutures d'UV : on recoud avant de lisser, sinon les
    # sommets de couture restent fixes et le tissu s'ouvre en fentes.
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    if cut_below is not None:
        # Ourlet net : coupe horizontale plutôt que la frontière en escalier des os.
        bmesh.ops.bisect_plane(
            bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, cut_below), plane_no=(0, 0, 1), clear_inner=True
        )
    # Lisser gomme l'anatomie (abdominaux, muscles) que le tissu ne suit pas.
    inner = [v for v in bm.verts if not v.is_boundary]
    for _ in range(smooth):
        bmesh.ops.smooth_vert(bm, verts=inner, factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bm.normal_update()
    for v in bm.verts:
        v.co += v.normal * thickness
    bm.to_mesh(ob.data)
    bm.free()
    ob.data.materials.clear()
    ob.data.materials.append(material)
    return ob


def dress(body, arm, p):
    bones = dominant_bones(body)
    me = body.data
    pelvis_z = (arm.matrix_world @ arm.data.bones["pelvis"].head_local).z
    zs = [(body.matrix_world @ v.co).z for v in me.vertices]

    long_sleeves = p["top"] != "tshirt"
    top_set = TOP_BONES | (SLEEVES if long_sleeves else set())
    hem = pelvis_z + 0.06  # bas du haut : coupe nette, aux hanches
    top = [(b in top_set or b == "pelvis") and z > hem - 0.05 for b, z in zip(bones, zs)]
    pants = [b in PANTS_BONES for b in bones]
    shoes = [b in SHOE_BONES or (b in {"calf_l", "calf_r"} and z < 0.13) for b, z in zip(bones, zs)]

    top_thick = 0.03 if p["top"] in ("blazer", "hoodie", "sweater") else 0.022
    clothing_piece(body, "top", top, top_thick, flat_material("top", p["topColor"], 0.85), smooth=12, cut_below=hem)
    clothing_piece(body, "pants", pants, 0.02, flat_material("pants", p["pants"], 0.8), smooth=10)
    clothing_piece(body, "shoes", shoes, 0.016, flat_material("shoes", p["shoes"], 0.45), smooth=3)

    # Retirer la peau entièrement recouverte (pas de peau qui « traverse » les habits).
    covered = [a or b or c for a, b, c in zip(top, pants, shoes)]
    bm = bmesh.new()
    bm.from_mesh(me)
    bm.verts.ensure_lookup_table()
    hidden = [f for f in bm.faces if all(covered[v.index] for v in f.verts)]
    bmesh.ops.delete(bm, geom=hidden, context="FACES_ONLY")
    bm.to_mesh(me)
    bm.free()


# ---------------------------------------------------------------------------
# Accessoires (pondérés à 100 % sur un os)
# ---------------------------------------------------------------------------


def rigid_mesh(name, bm, bone, arm, material, collection):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(material)
    ob = bpy.data.objects.new(name, me)
    collection.objects.link(ob)
    vg = ob.vertex_groups.new(name=bone)
    vg.add(list(range(len(me.vertices))), 1.0, "REPLACE")
    mod = ob.modifiers.new("Armature", "ARMATURE")
    mod.object = arm
    ob.parent = arm
    return ob


def head_frame(arm, eyes):
    bb = [eyes.matrix_world @ Vector(c) for c in eyes.bound_box]
    ex = (min(v.x for v in bb), max(v.x for v in bb))
    ey = min(v.y for v in bb)
    ez = (min(v.z for v in bb) + max(v.z for v in bb)) / 2
    head = arm.matrix_world @ arm.data.bones["Head"].head_local
    return ex, ey, ez, head


def glasses(arm, eyes, coll):
    (x0, x1), ey, ez, head = head_frame(arm, eyes)
    half = (x1 - x0) / 4
    bm = bmesh.new()
    for cx in (x0 + half, x1 - half):
        ring = bmesh.ops.create_cone(bm, cap_ends=False, segments=16, radius1=0.024, radius2=0.024, depth=0.005)
        bmesh.ops.transform(bm, matrix=Matrix.Translation((cx, ey - 0.012, ez)) @ Matrix.Rotation(math.pi / 2, 4, "X"), verts=ring["verts"])
    bridge = bmesh.ops.create_cube(bm, size=1)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(((x0 + x1) / 2, ey - 0.012, ez + 0.008)) @ Matrix.Diagonal((x1 - x0 - 4 * half + 0.012, 0.004, 0.004, 1)), verts=bridge["verts"])
    for sx in (x0 - 0.008, x1 + 0.008):
        arm_ = bmesh.ops.create_cube(bm, size=1)
        bmesh.ops.transform(bm, matrix=Matrix.Translation((sx, ey + 0.045, ez + 0.005)) @ Matrix.Diagonal((0.004, 0.11, 0.005, 1)), verts=arm_["verts"])
    return rigid_mesh("glasses", bm, "Head", arm, flat_material("glasses", "#1b1b1d", 0.3), coll)


def headphones(arm, eyes, coll, mic=False):
    (x0, x1), ey, ez, head = head_frame(arm, eyes)
    cy = head.y + 0.005
    bm = bmesh.new()
    band = bmesh.ops.create_cone(bm, cap_ends=False, segments=24, radius1=0.112, radius2=0.112, depth=0.03)
    bmesh.ops.transform(bm, matrix=Matrix.Translation((0, cy, ez + 0.03)) @ Matrix.Rotation(math.pi / 2, 4, "Y"), verts=band["verts"])
    lower = [v for v in band["verts"] if v.co.z < ez + 0.03 - 0.01]
    bmesh.ops.delete(bm, geom=lower, context="VERTS")
    for sx in (-1, 1):
        cup = bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=0.04, radius2=0.04, depth=0.035)
        bmesh.ops.transform(bm, matrix=Matrix.Translation((sx * 0.098, cy, ez + 0.0)) @ Matrix.Rotation(math.pi / 2, 4, "Y"), verts=cup["verts"])
    if mic:
        boom = bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.004, radius2=0.004, depth=0.11)
        bmesh.ops.transform(
            bm,
            matrix=Matrix.Translation((-0.07, ey + 0.02, ez - 0.05)) @ Matrix.Rotation(-0.9, 4, "Z") @ Matrix.Rotation(math.pi / 2, 4, "X"),
            verts=boom["verts"],
        )
    return rigid_mesh("headphones", bm, "Head", arm, flat_material("headphones", "#202226", 0.4), coll)


def badge(arm, body, coll, p):
    """Badge porté sur la poitrine : prénom (collaborateurs) ou « VISITEUR »."""
    me = body.data
    chest = [body.matrix_world @ v.co for v in me.vertices if 1.30 < (body.matrix_world @ v.co).z < 1.38 and 0.05 < (body.matrix_world @ v.co).x < 0.13]
    front = min(c.y for c in chest) if chest else -0.15
    img = badge_image(p)
    mat = bpy.data.materials.new("badge")
    mat.use_nodes = True
    tex = mat.node_tree.nodes.new("ShaderNodeTexImage")
    tex.image = img
    mat.node_tree.links.new(tex.outputs["Color"], mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"])
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
    uv = bm.loops.layers.uv.verify()
    for f in bm.faces:
        for loop in f.loops:
            loop[uv].uv = (loop.vert.co.x + 0.5, loop.vert.co.y + 0.5)
    bmesh.ops.transform(
        bm,
        matrix=Matrix.Translation((0.095, front - 0.04, 1.33)) @ Matrix.Rotation(math.pi / 2, 4, "X") @ Matrix.Diagonal((0.06, 0.085, 1, 1)),
        verts=bm.verts,
    )
    return rigid_mesh("badge", bm, "spine_03", arm, mat, coll)


def badge_image(p):
    w, h = 64, 96
    img = bpy.data.images.new(f"badge_{p['id']}", w, h)
    px = [1.0] * (w * h * 4)
    band = (0.95, 0.42, 0.14) if p.get("visitor") else (0.95, 0.65, 0.25)
    for y in range(h):
        for x in range(w):
            i = (y * w + x) * 4
            if y > h * 0.7 or (p.get("visitor") and y < h * 0.3):
                px[i : i + 3] = band
            elif h * 0.42 < y < h * 0.5 and 8 < x < w - 8:
                px[i : i + 3] = (0.15, 0.17, 0.2)  # « nom » (illisible à cette taille, suggestif)
            elif h * 0.32 < y < h * 0.37 and 14 < x < w - 14:
                px[i : i + 3] = (0.5, 0.52, 0.55)
    img.pixels = px
    return img


def hand_prop(arm, coll, kind):
    """
    Objet tenu en main droite (tasse, téléphone). On le place dans la pose du geste
    (frame de repos de « drink », oreille pour « phone »), puis on le ramène dans la pose
    de référence : pondéré à 100 % sur hand_r, il suit ensuite la main.
    """
    clip, frame = ("drink", 30) if kind == "cup" else ("phone", 30)
    pose_from_library(arm, clip)
    bpy.context.scene.frame_set(frame)
    bpy.context.view_layer.update()
    pb = arm.pose.bones["hand_r"]
    posed = arm.matrix_world @ pb.matrix
    rest = arm.matrix_world @ arm.data.bones["hand_r"].matrix_local
    head = posed.translation
    tail = arm.matrix_world @ pb.tail
    along = (tail - head).normalized()
    bm = bmesh.new()
    if kind == "cup":
        center = head + along * 0.06 + Vector((0, 0, 0.01))
        cup = bmesh.ops.create_cone(bm, cap_ends=True, segments=14, radius1=0.035, radius2=0.04, depth=0.09)
        bmesh.ops.translate(bm, vec=center, verts=cup["verts"])
        mat = flat_material("cup", "#f4f2ee", 0.25)
    else:
        center = head + along * 0.05
        ph = bmesh.ops.create_cube(bm, size=1)
        # Long côté vertical, collé à l'oreille.
        bmesh.ops.transform(bm, matrix=Matrix.Translation(center) @ Matrix.Rotation(0.3, 4, "X") @ Matrix.Diagonal((0.012, 0.07, 0.145, 1)), verts=ph["verts"])
        mat = flat_material("phone", "#16181c", 0.3)
    # Pose du geste → pose de référence.
    to_rest = rest @ posed.inverted()
    bmesh.ops.transform(bm, matrix=to_rest, verts=bm.verts)
    arm.animation_data.action = None
    arm.data.pose_position = "REST"
    for a in list(bpy.data.actions):
        bpy.data.actions.remove(a)
    return rigid_mesh(f"prop_{kind}", bm, "hand_r", arm, mat, coll)


# ---------------------------------------------------------------------------
# Atlas, LOD, export
# ---------------------------------------------------------------------------


def p_top_color(ob):
    return ob.get("fill_color", "#808080")


def bake_atlas(ob, name):
    """Remplace tous les matériaux par une seule texture cuite (couleur seule)."""
    me = ob.data
    atlas_uv = me.uv_layers.new(name="atlas")
    me.uv_layers.active = atlas_uv
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.01, area_weight=1.0)
    bpy.ops.object.mode_set(mode="OBJECT")
    img = bpy.data.images.new(f"{name}_atlas", ATLAS, ATLAS)
    # Fond neutre (et non noir) : il déborde au bord des îlots quand la texture est filtrée.
    import numpy as np

    fill = np.tile(np.array([*srgb(p_top_color(ob))[:3], 1.0], dtype=np.float32), ATLAS * ATLAS)
    img.pixels.foreach_set(fill)
    for slot in ob.material_slots:
        nodes = slot.material.node_tree.nodes
        n = nodes.new("ShaderNodeTexImage")
        n.image = img
        nodes.active = n
    scene = bpy.context.scene
    scene.cycles.samples = 4
    scene.render.bake.use_pass_direct = False
    scene.render.bake.use_pass_indirect = False
    scene.render.bake.use_pass_color = True
    scene.render.bake.margin = 24
    scene.render.bake.margin_type = "EXTEND"
    bpy.ops.object.bake(type="DIFFUSE")
    path = OUT / f"{name}_atlas.png"
    img.filepath_raw = str(path)
    img.file_format = "PNG"
    img.save()
    # Un seul matériau, une seule carte d'UV.
    mat = bpy.data.materials.new(f"{name}_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.75
    t = mat.node_tree.nodes.new("ShaderNodeTexImage")
    t.image = img
    mat.node_tree.links.new(t.outputs["Color"], bsdf.inputs["Base Color"])
    me.materials.clear()
    me.materials.append(mat)
    for f in me.polygons:
        f.material_index = 0
    while me.uv_layers[0].name != "atlas":
        me.uv_layers.remove(me.uv_layers[0])
    return mat


def build(p):
    reset()
    coll = bpy.context.scene.collection
    female = p["body"] == "female"
    objs = import_gltf(UBC / "Base Characters/Godot - UE" / ("Superhero_Female_FullBody.gltf" if female else "Superhero_Male_FullBody.gltf"))
    arm = next(o for o in objs if o.type == "ARMATURE")
    for o in [o for o in objs if o.type == "MESH" and o.name.startswith("Icosphere")]:
        bpy.data.objects.remove(o)
    body = next(o for o in bpy.data.objects if o.type == "MESH" and o.name.lower().startswith("superhero"))
    eyes = bpy.data.objects["Eyes"]
    skin_material(body.data.materials[0], p["body"], p["skin"])
    for o in bpy.data.objects:
        if o.name.startswith("Eyebrows"):
            tint_material(o.data.materials[0], p["hairColor"])

    def add_hair(file):
        new = import_gltf(UBC / "Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)" / file)
        for o in new:
            if o.type == "MESH" and not o.name.startswith("Icosphere"):
                o.parent = arm
                o.modifiers[0].object = arm if o.modifiers else None
                if not o.modifiers:
                    m = o.modifiers.new("Armature", "ARMATURE")
                    m.object = arm
                for slot in o.material_slots:
                    slot.material = slot.material.copy()
                    tint_material(slot.material, p["hairColor"])
        for o in new:
            if o.type != "MESH" or o.name.startswith("Icosphere"):
                bpy.data.objects.remove(o)

    add_hair(f"Hair_{p['hair']}.gltf")
    if p.get("beard"):
        add_hair("Hair_Beard.gltf")

    dress(body, arm, p)
    acc = p.get("accessories", [])
    if "glasses" in acc:
        glasses(arm, eyes, coll)
    if "headphones" in acc or "headset" in acc:
        headphones(arm, eyes, coll, mic="headset" in acc)
    badge(arm, body, coll, p)
    if p.get("prop"):
        hand_prop(arm, coll, p["prop"])

    # Fusion en un seul maillage skinné.
    meshes = [o for o in bpy.data.objects if o.type == "MESH" and o.parent == arm]
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.join()
    char = bpy.context.view_layer.objects.active
    char.name = p["id"]
    char["fill_color"] = p["topColor"]
    # Allègement léger (le corps de base est très détaillé pour une vue à distance).
    if "--no-decimate" not in ARGS:
        dec = char.modifiers.new("decimate", "DECIMATE")
        dec.ratio = 0.6
        bpy.ops.object.modifier_apply(modifier="decimate")
    if "--no-atlas" not in ARGS:
        bake_atlas(char, p["id"])

    lod = char.copy()
    lod.data = char.data.copy()
    lod.name = f"{p['id']}_lod1"
    coll.objects.link(lod)
    lod.modifiers.clear()
    lm = lod.modifiers.new("decimate", "DECIMATE")
    lm.ratio = 0.3
    bpy.context.view_layer.objects.active = lod
    bpy.ops.object.modifier_apply(modifier="decimate")
    am = lod.modifiers.new("Armature", "ARMATURE")
    am.object = arm
    if not any(m.type == "ARMATURE" for m in char.modifiers):
        m = char.modifiers.new("Armature", "ARMATURE")
        m.object = arm

    if p.get("wheelchair"):
        wheelchair(arm)

    arm.name = f"{p['id']}_rig"
    s = p.get("height", 1.0)
    arm.scale = (s, s, s)
    arm.data.pose_position = "REST"

    if PREVIEW:
        preview(p, arm)
    export(p)


def wheelchair(arm):
    """Fauteuil roulant (Poly Haven, CC0) sous le personnage, orienté comme lui (vers -Y)."""
    new = import_gltf(ROOT / "art/sources/models/wheelchair_01/wheelchair_01.gltf")
    meshes = [o for o in new if o.type == "MESH"]
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    wc = bpy.context.view_layer.objects.active
    wc.parent = None
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for o in new:
        if o != wc and o.name in bpy.data.objects:
            bpy.data.objects.remove(o)
    dec = wc.modifiers.new("decimate", "DECIMATE")
    dec.ratio = 0.12
    bpy.ops.object.modifier_apply(modifier="decimate")
    # Siège sous le bassin de la pose assise (bassin ~0,33 m derrière l'origine).
    bb = [Vector(c) for c in wc.bound_box]
    cx = (min(v.x for v in bb) + max(v.x for v in bb)) / 2
    cy = (min(v.y for v in bb) + max(v.y for v in bb)) / 2
    wc.location = (-cx, 0.3 - cy, -min(v.z for v in bb))
    bpy.ops.object.transform_apply(location=True)
    wc.name = "wheelchair"
    wc.parent = arm
    return wc


def pose_from_library(arm, clip):
    """Applique une animation (animations.glb) au squelette, pour l'aperçu."""
    before = set(bpy.data.actions)
    import_gltf(OUT / "animations.glb")
    for o in [o for o in bpy.data.objects if o.name.startswith("Mannequin") or (o.type == "ARMATURE" and o != arm)]:
        bpy.data.objects.remove(o)
    act = next((a for a in bpy.data.actions if a.name.startswith(clip)), None)
    arm.data.pose_position = "POSE"
    arm.animation_data_create()
    arm.animation_data.action = act
    # Blender 4.4+ : une action est rangée par « emplacements » (slots) ; on choisit le premier.
    if act is not None and hasattr(act, "slots") and len(act.slots):
        arm.animation_data.action_slot = act.slots[0]
    bpy.context.scene.frame_set(20)
    return before


def preview(p, arm):
    scene = bpy.context.scene
    clip = "idle" if p.get("visitor") else ("type" if p.get("wheelchair") else {"cup": "drink", "phone": "phone"}.get(p.get("prop"), "sit"))
    pose_from_library(arm, clip)
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    scene.collection.objects.link(cam)
    cam.location = (0.9, -2.4, 1.35)
    cam.rotation_euler = (Vector((0, 0, 1.0)) - cam.location).to_track_quat("-Z", "Y").to_euler()
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3
    sun.rotation_euler = (0.8, 0.2, 0.6)
    scene.collection.objects.link(sun)
    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.6, 0.65, 0.7, 1)
    scene.world = world
    scene.camera = cam
    scene.cycles.samples = 16
    scene.render.resolution_x, scene.render.resolution_y = 480, 640
    scene.render.filepath = str(OUT / f"preview_{p['id']}.png")
    for o in scene.objects:
        if o.name.endswith("_lod1"):
            o.hide_render = True
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam)
    bpy.data.objects.remove(sun)
    arm.animation_data.action = None
    arm.data.pose_position = "REST"
    for a in list(bpy.data.actions):
        bpy.data.actions.remove(a)


def export(p):
    bpy.ops.object.select_all(action="DESELECT")
    for o in bpy.data.objects:
        if o.type in {"MESH", "ARMATURE"}:
            o.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(OUT / f"{p['id']}.glb"),
        export_format="GLB",
        use_selection=True,
        export_animations=False,
        export_skins=True,
        export_apply=False,
        export_yup=True,
    )
    print(f"✓ {p['id']}")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    everyone = SPEC["people"] + SPEC["avatars"]
    for p in everyone:
        if ONLY and p["id"] not in ONLY:
            continue
        build(p)


main()
