"""
Prépare les sons d'ambiance (Freesound, CC0) : découpe, fondus, mono, MP3 96 kbit/s.
Blender sert ici d'outil de mixage (pas besoin de ffmpeg).

    ~/apps/blender/blender --background --python tools/blender/build_audio.py

Entrées : art/sources/manuel/audio/<numéro Freesound>__*.{wav,mp3,flac,ogg}
Sorties : public/audio/*.mp3
"""
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "art/sources/manuel/audio"
OUT = ROOT / "public/audio"

# numéro Freesound → (fichier de sortie, début (s), durée (s) ou None = tout, fondu (s), gain)
SOUNDS = {
    534123: ("ambience_room.mp3", 0.0, None, 0.0, 1.0),  # déjà une boucle
    636861: ("ambience_chatter.mp3", 20.0, 75.0, 1.5, 4.0),  # enregistrement très discret
    396304: ("keyboard.mp3", 5.0, 30.0, 0.4, 1.6),
    832445: ("coffee.mp3", 0.0, None, 1.0, 1.0),
}


def find(number):
    for f in SRC.glob(f"{number}__*"):
        return f
    raise SystemExit(f"Son {number} introuvable dans {SRC} (voir docs/blender-pipeline.md)")


def mixdown(src, out, start, length, fade, gain):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    fps = 50
    scene.render.fps = fps
    scene.sequence_editor_create()
    strip = scene.sequence_editor.strips.new_sound("s", str(src), channel=1, frame_start=1)
    total = strip.frame_final_duration / fps
    length = length or total - start
    first = 1 + int(start * fps)
    last = first + int(length * fps) - 1
    strip.frame_offset_start = int(start * fps)
    scene.frame_start, scene.frame_end = first, last
    strip.volume = gain
    if fade > 0:
        n = int(fade * fps)
        strip.volume = 0.0
        strip.keyframe_insert("volume", frame=first)
        strip.volume = gain
        strip.keyframe_insert("volume", frame=first + n)
        strip.keyframe_insert("volume", frame=last - n)
        strip.volume = 0.0
        strip.keyframe_insert("volume", frame=last)
    scene.render.ffmpeg.audio_channels = "MONO"
    scene.render.ffmpeg.audio_mixrate = 44100
    OUT.mkdir(parents=True, exist_ok=True)
    bpy.ops.sound.mixdown(filepath=str(OUT / out), container="MP3", codec="MP3", bitrate=96, split_channels=False)
    print(f"✓ {out} ({length:.1f} s)")


for number, (out, start, length, fade, gain) in SOUNDS.items():
    mixdown(find(number), out, start, length, fade, gain)
