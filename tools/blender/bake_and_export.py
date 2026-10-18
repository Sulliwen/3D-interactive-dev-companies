"""
Précalcul de l'éclairage (lightmaps) et export glTF de l'étage.

    ~/apps/blender/blender --background art/atelier-lumen.blend --python tools/blender/bake_and_export.py -- [--samples 96] [--size 2048] [--no-bake]

Travaille sur une copie en mémoire : art/atelier-lumen.blend n'est jamais modifié.
Produit dans art/build/<monde>/ :
  - office.glb : géométrie, matériaux, repères (spawn_*, anchor_station_*, screen_station_*) ;
  - lightmap_<groupe>.png : éclairage précalculé (8 bits sRGB, divisé par `scale`) ;
  - office.json : description des lightmaps (fichier, échelle) lue par le jeu.

Principe : les objets fixes sont fusionnés en deux groupes (architecture, mobilier).
Chaque groupe reçoit un second jeu d'UV (« lightmap », TEXCOORD_1 en glTF) et une image
où Cycles précalcule la lumière reçue (directe + indirecte, sans la couleur des matériaux).
Dans le jeu, couleur du matériau × lightmap = rendu final, sans calcul d'éclairage coûteux.
"""
import json
import math
import sys
from pathlib import Path

import bpy
import numpy as np

ROOT = Path(bpy.data.filepath).resolve().parent.parent
# art/<monde>.blend → art/build/<monde>/
BUILD = ROOT / "art" / "build" / Path(bpy.data.filepath).stem
ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def arg(name, default):
    if name in ARGS:
        return type(default)(ARGS[ARGS.index(name) + 1])
    return default


SAMPLES = arg("--samples", 96)
SIZE = arg("--size", 2048)
# Les grandes surfaces (sols, murs, plafond) gagnent le plus à une lightmap plus fine.
GROUP_SIZE = {"architecture": arg("--size-arch", SIZE), "mobilier": SIZE}
BAKE = "--no-bake" not in ARGS
GROUPS = {"architecture": ["architecture"], "mobilier": ["mobilier", "decor"]}


def objects_in(collection_names):
    out = []
    for name in collection_names:
        c = bpy.data.collections.get(name)
        if c:
            out += [o for o in c.all_objects if o.type == "MESH" and not o.get("no_bake")]
    return out


def join_group(name, objects):
    """Rend chaque objet indépendant (instances, modificateurs) puis fusionne le groupe."""
    bpy.ops.object.select_all(action="DESELECT")
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.make_single_user(object=True, obdata=True)
    bpy.ops.object.convert(target="MESH")
    bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    ob.name = f"lm_{name}"
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return ob


def lightmap_uv(ob, size):
    """Second jeu d'UV, sans chevauchement, pour la lightmap."""
    me = ob.data
    # Un seul jeu d'UV « matières » (certains modèles importés en apportent deux) : la
    # lightmap doit être le second jeu, TEXCOORD_1, celui que lit le jeu.
    while len(me.uv_layers) > 1:
        me.uv_layers.remove(me.uv_layers[-1])
    if "lightmap" not in me.uv_layers:
        me.uv_layers.new(name="lightmap")
    me.uv_layers.active = me.uv_layers["lightmap"]
    me.uv_layers[0].active_render = True
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.0, area_weight=0.0, scale_to_bounds=False)
    bpy.ops.uv.pack_islands(margin=2.5 / size * 4, rotate=True)
    bpy.ops.object.mode_set(mode="OBJECT")


def bake(ob, image):
    for slot in ob.material_slots:
        mat = slot.material
        nodes = mat.node_tree.nodes
        node = nodes.get("lightmap_target") or nodes.new("ShaderNodeTexImage")
        node.name = "lightmap_target"
        node.image = image
        nodes.active = node
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    scene = bpy.context.scene
    scene.cycles.samples = SAMPLES
    scene.render.bake.use_pass_direct = True
    scene.render.bake.use_pass_indirect = True
    scene.render.bake.use_pass_color = False
    scene.render.bake.margin = 6
    scene.render.bake.margin_type = "EXTEND"
    bpy.ops.object.bake(type="DIFFUSE")


def denoise(image):
    """Débruitage (Open Image Denoise) via le compositeur, sur l'image précalculée."""
    scene = bpy.context.scene
    scene.use_nodes = True
    tree = scene.node_tree
    tree.nodes.clear()
    src = tree.nodes.new("CompositorNodeImage")
    src.image = image
    dn = tree.nodes.new("CompositorNodeDenoise")
    out = tree.nodes.new("CompositorNodeComposite")
    tree.links.new(src.outputs["Image"], dn.inputs["Image"])
    tree.links.new(dn.outputs["Image"], out.inputs["Image"])
    scene.render.resolution_x = image.size[0]
    scene.render.resolution_y = image.size[1]
    scene.render.resolution_percentage = 100
    exr = BUILD / f"{image.name}_denoised.exr"
    scene.render.image_settings.file_format = "OPEN_EXR"
    scene.render.image_settings.color_depth = "32"
    scene.render.filepath = str(exr)
    # Le rendu d'une scène vide sert seulement à exécuter le compositeur.
    hidden = [o for o in scene.objects if not o.hide_render]
    for o in hidden:
        o.hide_render = True
    samples = scene.cycles.samples
    scene.cycles.samples = 1
    scene.camera = scene.camera or next(o for o in bpy.data.objects if o.type == "CAMERA")
    bpy.ops.render.render(write_still=True)
    scene.cycles.samples = samples
    for o in hidden:
        o.hide_render = False
    scene.use_nodes = False
    return bpy.data.images.load(str(exr))


def encode_png(float_image, name):
    """Lightmap 8 bits : valeurs divisées par une échelle (percentile 99,5), encodées en sRGB."""
    w, h = float_image.size
    px = np.empty(w * h * 4, dtype=np.float32)
    float_image.pixels.foreach_get(px)
    rgb = px.reshape(-1, 4)[:, :3]
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    scale = float(np.percentile(lum[lum > 1e-4], 99.5)) if np.any(lum > 1e-4) else 1.0
    scale = max(scale, 1e-3)
    lin = np.clip(rgb / scale, 0.0, 1.0)
    srgb = np.where(lin <= 0.0031308, lin * 12.92, 1.055 * np.power(lin, 1 / 2.4) - 0.055)
    out = bpy.data.images.new(name, w, h, alpha=False, float_buffer=False)
    out.colorspace_settings.name = "sRGB"
    data = np.ones((w * h, 4), dtype=np.float32)
    data[:, :3] = srgb
    out.pixels.foreach_set(data.ravel())
    path = BUILD / f"{name}.png"
    out.filepath_raw = str(path)
    out.file_format = "PNG"
    out.save()
    return path.name, scale


def main():
    BUILD.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.max_bounces = 6
    scene.cycles.diffuse_bounces = 4

    # Le verre laisse passer la lumière et n'apparaît pas dans les lightmaps.
    for o in bpy.data.collections["verre"].all_objects:
        o.visible_shadow = False
        o.visible_diffuse = False

    meta = {"lightmaps": {}}
    for group, collections in GROUPS.items():
        objects = objects_in(collections)
        print(f"Groupe {group} : {len(objects)} objets")
        ob = join_group(group, objects)
        size = GROUP_SIZE[group]
        lightmap_uv(ob, size)
        if BAKE:
            img = bpy.data.images.new(f"lightmap_{group}", size, size, alpha=False, float_buffer=True)
            bake(ob, img)
            clean = denoise(img)
            file, scale = encode_png(clean, f"lightmap_{group}")
            meta["lightmaps"][ob.name] = {"file": file, "scale": round(scale, 5)}
            print(f"  ✓ lightmap {file} (échelle {scale:.3f})")
        for slot in ob.material_slots:
            node = slot.material.node_tree.nodes.get("lightmap_target")
            if node:
                slot.material.node_tree.nodes.remove(node)

    # Le verre de chaque paroi : un seul objet.
    glass = [o for o in bpy.data.collections["verre"].all_objects if o.type == "MESH"]
    if glass:
        join_group("verre", glass).name = "glass"

    export(meta)


def export(meta):
    keep = set()
    for name in ("architecture", "mobilier", "decor", "verre", "lumieres", "reperes"):
        c = bpy.data.collections.get(name)
        if c:
            keep |= {o for o in c.all_objects if o.type in {"MESH", "EMPTY"}}
    bpy.ops.object.select_all(action="DESELECT")
    for o in keep:
        o.select_set(True)
    out = BUILD / "office.glb"
    bpy.ops.export_scene.gltf(
        filepath=str(out),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
        export_extras=True,
        export_lights=False,
        export_cameras=False,
        export_yup=True,
    )
    (BUILD / "office.json").write_text(json.dumps(meta, indent=2))
    print(f"✓ export {out.relative_to(ROOT)} ({out.stat().st_size / 1e6:.1f} Mo)")


main()
