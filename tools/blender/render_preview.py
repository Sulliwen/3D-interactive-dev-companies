"""
Rendus d'aperçu de la scène (caméras « preview_* ») : art/build/<monde>/preview_*.png.

    ~/apps/blender/blender --background art/atelier-lumen.blend --python tools/blender/render_preview.py -- [samples]
"""
import sys
from pathlib import Path

import bpy

ROOT = Path(bpy.data.filepath).resolve().parent.parent
ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
samples = int(ARGS[0]) if ARGS else 32

scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = samples
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 6
scene.render.resolution_x = 960
scene.render.resolution_y = 540
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = 0.0

for cam in [o for o in bpy.data.objects if o.type == "CAMERA" and o.name.startswith("preview_")]:
    scene.camera = cam
    out = ROOT / "art" / "build" / Path(bpy.data.filepath).stem / f"{cam.name}.png"
    scene.render.filepath = str(out)
    bpy.ops.render.render(write_still=True)
    print("✓", out.name)
