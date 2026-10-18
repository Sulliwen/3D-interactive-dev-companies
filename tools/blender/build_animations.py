"""
Animations des personnages : une sélection de la Universal Animation Library (Quaternius,
CC0) et des gestes de bureau créés ici par cinématique inverse (IK) : taper au clavier,
téléphoner, réfléchir, boire un café, montrer un post-it, taper debout.

Principe : on part d'une animation de base (assis ou debout), on place des cibles pour les
mains (clavier, oreille, menton…), Blender calcule la position des bras, puis on « cuit »
le résultat en animation classique, lisible par n'importe quel moteur.

    ~/apps/blender/blender --background --python tools/blender/build_animations.py -- [--preview]

Sortie : art/build/characters/animations.glb (squelette + clips, sans maillage utile).
"""
import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
UAL = ROOT / "art/sources/manuel/quaternius/ual/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb"
OUT = ROOT / "art/build/characters"
POLE_ANGLE = float(next((a.split("=")[1] for a in sys.argv if a.startswith("--pole=")), "-90"))
ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []

KEEP = {
    "Idle_Loop": "idle",
    "Idle_Talking_Loop": "talk",
    "Walk_Loop": "walk",
    "Jog_Fwd_Loop": "run",
    "Sitting_Idle_Loop": "sit",
    "Sitting_Talking_Loop": "sit_talk",
}


def setup():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(UAL))
    arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    arm.animation_data_create()
    bpy.context.scene.render.fps = 30
    return arm


def world_bone(arm, bone, frame):
    bpy.context.scene.frame_set(frame)
    return arm.matrix_world @ arm.pose.bones[bone].head


def ik_action(arm, base_name, new_name, targets, length=None, poles=None):
    """
    `targets` : {os_de_l_avant-bras: fonction(frame) -> position monde de la main}.
    Les autres os suivent l'animation de base.
    """
    base = bpy.data.actions[base_name]
    start, end = (int(base.frame_range[0]), int(base.frame_range[1]))
    end = start + (length or end - start)
    arm.animation_data.action = base
    scene = bpy.context.scene
    empties = []
    for bone, fn in targets.items():
        e = bpy.data.objects.new(f"target_{bone}", None)
        scene.collection.objects.link(e)
        empties.append(e)
        for f in range(start, end + 1):
            e.location = fn(f)
            e.keyframe_insert("location", frame=f)
        c = arm.pose.bones[bone].constraints.new("IK")
        c.target = e
        c.chain_count = 2
        c.use_tail = True
        if poles and bone in poles:
            pe = bpy.data.objects.new(f"pole_{bone}", None)
            scene.collection.objects.link(pe)
            pe.location = poles[bone]
            empties.append(pe)
            c.pole_target = pe
            c.pole_angle = math.radians(POLE_ANGLE)
    bpy.context.view_layer.objects.active = arm
    arm.select_set(True)
    bpy.ops.object.mode_set(mode="POSE")
    bpy.ops.pose.select_all(action="SELECT")
    bpy.ops.nla.bake(
        frame_start=start,
        frame_end=end,
        only_selected=False,
        visual_keying=True,
        clear_constraints=True,
        use_current_action=False,
        bake_types={"POSE"},
    )
    bpy.ops.object.mode_set(mode="OBJECT")
    act = arm.animation_data.action
    act.name = new_name
    act.use_fake_user = True
    for e in empties:
        bpy.data.objects.remove(e)
    arm.animation_data.action = None
    return act


HAND_TWIST = float(next((a.split("=")[1] for a in sys.argv if a.startswith("--twist=")), "120"))


def twist_hands(arm, act, degrees):
    """Tourne les mains autour de l'axe de l'avant-bras (paumes vers le clavier)."""
    if not degrees:
        return
    from mathutils import Quaternion

    arm.animation_data.action = act
    start, end = int(act.frame_range[0]), int(act.frame_range[1])
    for f in range(start, end + 1):
        bpy.context.scene.frame_set(f)
        for bone, sign in (("hand_l", 1), ("hand_r", -1)):
            pb = arm.pose.bones[bone]
            pb.rotation_mode = "QUATERNION"
            pb.rotation_quaternion = pb.rotation_quaternion @ Quaternion((0, 1, 0), math.radians(sign * degrees))
            pb.keyframe_insert("rotation_quaternion", frame=f)
    arm.animation_data.action = None


def jitter(seed, amp, period):
    """Petit mouvement pseudo-aléatoire, périodique (boucle sans à-coup)."""
    rnd = random.Random(seed)
    phases = [rnd.random() * math.tau for _ in range(3)]
    freqs = [rnd.choice([3, 5, 7, 9]) for _ in range(3)]

    def f(frame):
        t = frame / period * math.tau
        return Vector(tuple(amp[i] * math.sin(freqs[i] * t + phases[i]) for i in range(3)))

    return f


def main():
    arm = setup()
    for act in list(bpy.data.actions):
        if act.name in KEEP:
            act.use_fake_user = True

    # Repères du corps en position assise / debout (pour placer les cibles).
    arm.animation_data.action = bpy.data.actions["Sitting_Idle_Loop"]
    pelvis = world_bone(arm, "pelvis", 1)
    head = world_bone(arm, "Head", 1)
    arm.animation_data.action = bpy.data.actions["Idle_Loop"]
    head_up = world_bone(arm, "Head", 1)
    print("repères assis : bassin", tuple(round(c, 2) for c in pelvis), "tête", tuple(round(c, 2) for c in head))

    # Le personnage regarde vers -Y. Clavier : 0,77 m du sol, devant le bassin.
    kb_y = pelvis.y - 0.42
    kb_z = 0.78
    period = 120

    def typing(side, seed):
        j = jitter(seed, (0.012, 0.01, 0.012), period)
        return lambda f: Vector((side * 0.13, kb_y, kb_z)) + j(f)

    poles_sit = {"lowerarm_l": Vector((0.45, pelvis.y + 0.3, 0.6)), "lowerarm_r": Vector((-0.45, pelvis.y + 0.3, 0.6))}
    act = ik_action(arm, "Sitting_Idle_Loop", "type", {"lowerarm_l": typing(1, 1), "lowerarm_r": typing(-1, 2)}, period, poles_sit)
    twist_hands(arm, act, HAND_TWIST)

    # Téléphone : main droite à l'oreille, main gauche posée sur le bureau.
    ear = head + Vector((-0.09, 0.0, -0.01))
    ik_action(
        arm,
        "Sitting_Idle_Loop",
        "phone",
        {
            "lowerarm_r": lambda f: ear + jitter(3, (0.006, 0.006, 0.006), period)(f),
            "lowerarm_l": lambda f: Vector((0.18, kb_y + 0.08, kb_z)) + jitter(4, (0.01, 0.01, 0.005), period)(f),
        },
        period,
        poles_sit,
    )

    # Réfléchir : main droite au menton, coude sur le bureau.
    chin = head + Vector((-0.02, -0.08, -0.1))
    ik_action(
        arm,
        "Sitting_Idle_Loop",
        "think",
        {
            "lowerarm_r": lambda f: chin + jitter(5, (0.005, 0.005, 0.008), period)(f),
            "lowerarm_l": typing(1, 6),
        },
        period,
        poles_sit,
    )

    # Debout : taper au bureau haut (Scrum Master), clavier à 1,07 m.
    arm.animation_data.action = bpy.data.actions["Idle_Loop"]
    stand_pelvis = world_bone(arm, "pelvis", 1)
    poles_stand = {"lowerarm_l": Vector((0.45, stand_pelvis.y + 0.3, 1.0)), "lowerarm_r": Vector((-0.45, stand_pelvis.y + 0.3, 1.0))}
    stand = ik_action(
        arm,
        "Idle_Loop",
        "stand_type",
        {
            "lowerarm_l": lambda f: Vector((0.13, stand_pelvis.y - 0.36, 1.08)) + jitter(7, (0.012, 0.01, 0.01), period)(f),
            "lowerarm_r": lambda f: Vector((-0.13, stand_pelvis.y - 0.36, 1.08)) + jitter(8, (0.012, 0.01, 0.01), period)(f),
        },
        period,
        poles_stand,
    )
    twist_hands(arm, stand, HAND_TWIST)

    # Boire un café : la tasse monte aux lèvres toutes les ~5 s.
    mouth = head_up + Vector((0.0, -0.11, -0.05))
    rest = Vector((-0.12, stand_pelvis.y - 0.3, 1.1))
    drink_period = 150

    def sip(f):
        t = (f % drink_period) / drink_period
        lift = max(0.0, math.sin(min(1.0, max(0.0, (t - 0.55) / 0.35)) * math.pi))
        return rest.lerp(mouth, lift)

    ik_action(arm, "Idle_Loop", "drink", {"lowerarm_r": sip}, drink_period, poles_stand)

    # Montrer un post-it sur le mur Scrum (devant, en hauteur).
    board = Vector((-0.2, stand_pelvis.y - 0.55, 1.5))
    ik_action(
        arm,
        "Idle_Talking_Loop",
        "point",
        {"lowerarm_r": lambda f: board + jitter(9, (0.04, 0.01, 0.03), period)(f)},
        period,
        poles_stand,
    )

    # Ne garder que les clips utiles, renommés.
    for act in list(bpy.data.actions):
        if act.name in KEEP:
            act.name = KEEP[act.name]
        elif act.name not in {"type", "phone", "think", "stand_type", "drink", "point"}:
            bpy.data.actions.remove(act)

    if "--preview" in ARGS:
        preview(arm)
    export(arm)


def preview(arm):
    """Image de contrôle : le mannequin dans chaque nouvelle pose."""
    scene = bpy.context.scene
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    scene.collection.objects.link(cam)
    cam.location = (1.6, -2.2, 1.4)
    cam.rotation_euler = (Vector((0, -0.2, 0.9)) - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3
    sun.rotation_euler = (0.8, 0.2, 0.6)
    scene.collection.objects.link(sun)
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x, scene.render.resolution_y = 400, 400
    for name in ("type", "phone", "think", "stand_type", "drink", "point", "sit"):
        arm.animation_data.action = bpy.data.actions[name]
        scene.frame_set(40 if name != "drink" else 120)
        scene.render.filepath = str(OUT / f"anim_{name}.png")
        bpy.ops.render.render(write_still=True)
    arm.animation_data.action = None
    bpy.data.objects.remove(cam)
    bpy.data.objects.remove(sun)


def export(arm):
    OUT.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for o in bpy.data.objects:
        if o.type in {"ARMATURE", "MESH"}:
            o.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(OUT / "animations.glb"),
        export_format="GLB",
        use_selection=True,
        export_animations=True,
        export_animation_mode="ACTIONS",
        export_force_sampling=True,
        export_frame_step=2,
        export_yup=True,
    )
    print("✓ animations :", sorted(a.name for a in bpy.data.actions))


main()
