"""Build Sneaker Run's 3D source scene and render raw animation/background frames.

Run with:
  blender --background --python blender/build_assets.py
"""

from __future__ import annotations

import math
import random
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets" / "3d-raw"
RAW.mkdir(parents=True, exist_ok=True)

# Keep the character budget explicit. These counts are the source-of-truth
# renders behind the packed web sheets and add up to 360 frames.
ACTION_FRAMES = {
    "run": 48,
    "roll": 36,
    "crouch": 24,
    "jump": 24,
}
CHASER_RUN_FRAMES = 96


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.materials, bpy.data.curves, bpy.data.meshes, bpy.data.cameras, bpy.data.lights):
        for item in list(block):
            if item.users == 0:
                block.remove(item)


def material(name, color, metallic=0.0, roughness=0.72):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.metallic = metallic
    mat.roughness = roughness
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    return mat


def link_to_collection(obj, collection):
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    collection.objects.link(obj)


def cube(name, size, location=(0, 0, 0), mat=None, bevel=0.08, collection=None, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new("Soft edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
    if mat:
        obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
    if collection:
        link_to_collection(obj, collection)
    return obj


def sphere(name, radius, location=(0, 0, 0), mat=None, scale=(1, 1, 1), collection=None, parent=None):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=radius, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat:
        obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
    if collection:
        link_to_collection(obj, collection)
    return obj


def cylinder(name, radius, depth, location=(0, 0, 0), mat=None, vertices=10, collection=None, parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    if mat:
        obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
    if collection:
        link_to_collection(obj, collection)
    return obj


def cone(name, radius, depth, location=(0, 0, 0), mat=None, vertices=8, collection=None, parent=None):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius, radius2=0, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    if mat:
        obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
    if collection:
        link_to_collection(obj, collection)
    return obj


def pivot(name, location, parent, collection):
    obj = bpy.data.objects.new(name, None)
    collection.objects.link(obj)
    obj.empty_display_type = "PLAIN_AXES"
    obj.empty_display_size = 0.18
    obj.parent = parent
    obj.location = location
    return obj


def local_cube(name, size, location, mat, parent, collection, bevel=0.08):
    obj = cube(name, size, (0, 0, 0), mat, bevel, collection, parent)
    obj.location = location
    return obj


def make_control_armature(name, controls, collection):
    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
    armature = bpy.context.object
    armature.name = f"{name}_armature"
    armature.data.name = f"{name}_skeleton"
    link_to_collection(armature, collection)
    bones = armature.data.edit_bones
    root = bones[0]
    root.name = "root"
    root.head = (0, 0, 0)
    root.tail = (0, 0, 3.25)

    def add_bone(bone_name, head, tail, parent=None):
        bone = bones.new(bone_name)
        bone.head = head
        bone.tail = tail
        bone.parent = parent
        return bone

    spine = add_bone("spine", (0, 0, 3.25), (0, 0, 5.12), root)
    add_bone("head", (0, 0, 5.12), (0, 0, 6.18), spine)
    for suffix, side in (("L", -1), ("R", 1)):
        thigh = add_bone(f"thigh.{suffix}", (0, side * 0.23, 3.25), (0, side * 0.23, 1.77), root)
        add_bone(f"shin.{suffix}", (0, side * 0.23, 1.77), (0, side * 0.23, 0.29), thigh)
        upper = add_bone(f"upper_arm.{suffix}", (0, side * 0.59, 4.78), (0, side * 0.59, 3.64), spine)
        add_bone(f"forearm.{suffix}", (0, side * 0.59, 3.64), (0, side * 0.59, 2.61), upper)
    bpy.ops.object.mode_set(mode="POSE")
    for pose_bone in armature.pose.bones:
        pose_bone.rotation_mode = "XYZ"
    bpy.ops.object.mode_set(mode="OBJECT")

    mapping = {
        controls["root"]: "root",
        controls["legs"][0][0]: "thigh.L",
        controls["legs"][0][1]: "shin.L",
        controls["legs"][1][0]: "thigh.R",
        controls["legs"][1][1]: "shin.R",
        controls["arms"][0][0]: "upper_arm.L",
        controls["arms"][0][1]: "forearm.L",
        controls["arms"][1][0]: "upper_arm.R",
        controls["arms"][1][1]: "forearm.R",
    }
    for owner, bone_name in mapping.items():
        rotation = owner.constraints.new("COPY_ROTATION")
        rotation.name = f"Driven by {bone_name}"
        rotation.target = armature
        rotation.subtarget = bone_name
        rotation.target_space = "LOCAL"
        rotation.owner_space = "LOCAL"
        if bone_name == "root":
            location = owner.constraints.new("COPY_LOCATION")
            location.name = "Driven by root translation"
            location.target = armature
            location.subtarget = "root"
            location.target_space = "LOCAL"
            location.owner_space = "LOCAL"
    return armature


def make_leg(name, side, root, mats, collection):
    hip = pivot(f"{name}_{side}_hip", (0, side * 0.23, 3.25), root, collection)
    local_cube(f"{name}_{side}_thigh", (0.62, 0.48, 1.52), (0, 0, -0.76), mats["pants"], hip, collection, 0.15)
    knee = pivot(f"{name}_{side}_knee", (0, 0, -1.48), hip, collection)
    local_cube(f"{name}_{side}_shin", (0.52, 0.42, 1.42), (0, 0, -0.71), mats["pants"], knee, collection, 0.13)
    shoe = local_cube(f"{name}_{side}_shoe", (1.0, 0.52, 0.38), (0.26, -0.01, -1.46), mats["shoe"], knee, collection, 0.12)
    shoe.rotation_euler[1] = math.radians(6)
    return hip, knee


def make_arm(name, side, root, mats, collection):
    shoulder = pivot(f"{name}_{side}_shoulder", (0, side * 0.59, 4.78), root, collection)
    local_cube(f"{name}_{side}_upper_arm", (0.42, 0.42, 1.18), (0, 0, -0.59), mats["shirt"], shoulder, collection, 0.12)
    elbow = pivot(f"{name}_{side}_elbow", (0, 0, -1.14), shoulder, collection)
    local_cube(f"{name}_{side}_forearm", (0.36, 0.36, 1.0), (0, 0, -0.50), mats["skin"], elbow, collection, 0.12)
    sphere(f"{name}_{side}_hand", 0.24, (0, 0, 0), mats["skin"], (1, 0.84, 1), collection, elbow).location = (0, 0, -1.03)
    return shoulder, elbow


def make_character(name, runner, collection, palette, variant="cover"):
    mats = {
        "skin": material(f"{name}_skin", palette["skin"]),
        "hair": material(f"{name}_hair", palette["hair"]),
        "shirt": material(f"{name}_shirt", palette["shirt"]),
        "inner": material(f"{name}_inner", palette["inner"]),
        "pants": material(f"{name}_pants", palette["pants"]),
        "shoe": material(f"{name}_shoe", palette["shoe"]),
    }
    root = pivot(f"{name}_rig", (0, 0, 0), None, collection)
    torso = local_cube(f"{name}_torso", (1.16, 0.78, 1.66), (0, 0, 4.12), mats["shirt"], root, collection, 0.18)
    torso.rotation_euler[1] = math.radians(-7)
    local_cube(f"{name}_inner_shirt", (0.82, 0.805, 1.25), (0.05, -0.01, 4.04), mats["inner"], root, collection, 0.08)
    local_cube(f"{name}_shirt_tail", (0.62, 0.81, 0.62), (-0.35, 0, 3.38), mats["shirt"], root, collection, 0.08).rotation_euler[1] = math.radians(-18)

    sphere(f"{name}_head", 0.63, (0, 0, 0), mats["skin"], (0.9, 0.85, 1.02), collection, root).location = (0.24, 0, 5.42)
    local_cube(f"{name}_nose", (0.25, 0.24, 0.25), (0.83, -0.02, 5.4), mats["skin"], root, collection, 0.07)
    sphere(f"{name}_hair_cap", 0.66, (0, 0, 0), mats["hair"], (1.0, 0.9, 0.7), collection, root).location = (0.12, 0, 5.79)
    if variant == "v1":
        cap_mat = material(f"{name}_cap", palette["cap"])
        cap = sphere(f"{name}_red_cap", 0.72, (0, 0, 0), cap_mat, (1.03, 0.94, 0.42), collection, root)
        cap.location = (0.10, 0, 6.02)
        brim = local_cube(f"{name}_cap_brim", (0.82, 0.82, 0.13), (0.68, 0, 5.91), cap_mat, root, collection, 0.06)
        brim.rotation_euler[1] = math.radians(-8)
    else:
        for index, (x, z, angle) in enumerate(((0.66, 6.02, -58), (0.35, 6.20, -28), (0.0, 6.23, 2), (-0.34, 6.13, 32), (-0.58, 5.95, 54))):
            spike = cone(f"{name}_hair_spike_{index}", 0.22, 0.72, (0, 0, 0), mats["hair"], 7, collection, root)
            spike.location = (x, 0, z)
            spike.rotation_euler[1] = math.radians(angle)

    left_leg = make_leg(name, -1, root, mats, collection)
    right_leg = make_leg(name, 1, root, mats, collection)
    left_arm = make_arm(name, -1, root, mats, collection)
    right_arm = make_arm(name, 1, root, mats, collection)
    controls = {
        "root": root,
        "legs": (left_leg, right_leg),
        "arms": (left_arm, right_arm),
    }
    armature = make_control_armature(name, controls, collection)
    armature.show_in_front = True
    return {
        "root": root,
        "legs": (left_leg, right_leg),
        "arms": (left_arm, right_arm),
        "armature": armature,
        "slug": name.replace("_", "-"),
        "objects": [obj for obj in collection.objects if obj.name.startswith(name)],
        "runner": runner,
    }


def key(obj, frame, location=True, rotation=True):
    if location:
        obj.keyframe_insert(data_path="location", frame=frame)
    if rotation:
        obj.keyframe_insert(data_path="rotation_euler", frame=frame)


def pose_character(rig, frame, action, step):
    bones = rig["armature"].pose.bones
    root = bones["root"]
    leg_l, knee_l = bones["thigh.L"], bones["shin.L"]
    leg_r, knee_r = bones["thigh.R"], bones["shin.R"]
    arm_l, elbow_l = bones["upper_arm.L"], bones["forearm.L"]
    arm_r, elbow_r = bones["upper_arm.R"], bones["forearm.R"]
    spine, head = bones["spine"], bones["head"]
    phase = math.tau * step

    root.location = (0, 0, 0)
    root.rotation_euler = (0, math.radians(-5), 0)
    for obj in (leg_l, knee_l, leg_r, knee_r, arm_l, elbow_l, arm_r, elbow_r, spine, head):
        obj.location = (0, 0, 0)
        obj.rotation_euler = (0, 0, 0)

    if action == "run":
        stride = math.sin(phase)
        rebound = math.cos(phase * 2)
        root.location.x = -0.08 * rebound
        root.location.z = 0.11 + rebound * 0.10
        root.rotation_euler.y = math.radians(-13) + math.sin(phase * 2) * 0.045
        spine.rotation_euler.y = -0.035 * math.sin(phase * 2)
        head.rotation_euler.y = 0.025 * math.sin(phase * 2)
        leg_l.rotation_euler.y = stride * 0.92
        leg_r.rotation_euler.y = -stride * 0.92
        knee_l.rotation_euler.y = max(0, -stride) * 1.18 + 0.06
        knee_r.rotation_euler.y = max(0, stride) * 1.18 + 0.06
        arm_l.rotation_euler.y = -stride * 0.94 - 0.08
        arm_r.rotation_euler.y = stride * 0.94 - 0.08
        elbow_l.rotation_euler.y = -0.64 - max(0, stride) * 0.32
        elbow_r.rotation_euler.y = -0.64 - max(0, -stride) * 0.32
    elif action == "roll":
        angle = math.tau * step
        root.location.x = -math.sin(angle) * 3.0
        root.location.z = 2.7 - math.cos(angle) * 3.0
        root.rotation_euler.y = angle
        tuck = 0.15 + abs(math.sin(angle)) * 0.22
        leg_l.rotation_euler.y = 1.12 + tuck
        leg_r.rotation_euler.y = 0.82 + tuck
        knee_l.rotation_euler.y = -1.62
        knee_r.rotation_euler.y = -1.46
        arm_l.rotation_euler.y = -1.24
        arm_r.rotation_euler.y = -0.96
        elbow_l.rotation_euler.y = -1.0
        elbow_r.rotation_euler.y = -1.0
    elif action == "crouch":
        root.location.z = -0.86 + math.sin(phase) * 0.04
        root.rotation_euler.y = math.radians(-25)
        leg_l.rotation_euler.y = 0.84
        leg_r.rotation_euler.y = 0.58
        knee_l.rotation_euler.y = -1.42
        knee_r.rotation_euler.y = -1.25
        arm_l.rotation_euler.y = -0.72
        arm_r.rotation_euler.y = 0.52
        elbow_l.rotation_euler.y = -0.84
        elbow_r.rotation_euler.y = -0.84
    elif action == "jump":
        root.location.z = math.sin(math.pi * step) * 0.45
        root.rotation_euler.y = math.radians(-10)
        leg_l.rotation_euler.y = 0.52 - step * 0.28
        leg_r.rotation_euler.y = -0.38 + step * 0.44
        knee_l.rotation_euler.y = -1.08
        knee_r.rotation_euler.y = -0.78
        arm_l.rotation_euler.y = -0.72
        arm_r.rotation_euler.y = 0.82
        elbow_l.rotation_euler.y = -0.66
        elbow_r.rotation_euler.y = -0.54

    for obj in (root, spine, head, leg_l, knee_l, leg_r, knee_r, arm_l, elbow_l, arm_r, elbow_r):
        key(obj, frame)


def point_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def setup_render(scene):
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = True
    scene.render.resolution_percentage = 100
    scene.render.image_settings.color_depth = "8"
    scene.render.resolution_x = 320
    scene.render.resolution_y = 320
    scene.render.use_file_extension = True
    scene.render.image_settings.compression = 55
    scene.render.fps = 4
    scene.world.color = (0.035, 0.035, 0.055)

    camera_data = bpy.data.cameras.new("Sprite Camera")
    camera = bpy.data.objects.new("Sprite Camera", camera_data)
    scene.collection.objects.link(camera)
    camera.location = (0, -20, 3.35)
    camera.rotation_euler = (math.pi / 2, 0, 0)
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = 7.2
    scene.camera = camera

    light_data = bpy.data.lights.new("Key Light", "AREA")
    light_data.energy = 1150
    light_data.shape = "DISK"
    light_data.size = 7
    light = bpy.data.objects.new("Key Light", light_data)
    scene.collection.objects.link(light)
    light.location = (-4, -8, 11)
    point_at(light, (0, 0, 3.2))

    fill_data = bpy.data.lights.new("Fill Light", "AREA")
    fill_data.energy = 620
    fill_data.color = (0.42, 0.60, 1.0)
    fill_data.size = 8
    fill = bpy.data.objects.new("Fill Light", fill_data)
    scene.collection.objects.link(fill)
    fill.location = (6, 2, 7)
    point_at(fill, (0, 0, 3.6))
    return camera


def render_sprites(scene, camera, rigs):
    actions = ACTION_FRAMES
    for rig in rigs:
        rig["actions"] = {}
        render_actions = actions if rig["runner"] else {"run": CHASER_RUN_FRAMES}
        armature = rig["armature"]
        armature.animation_data_create()
        for action, count in render_actions.items():
            clip = bpy.data.actions.new(f"{rig['slug']}_{action}")
            clip.use_fake_user = True
            armature.animation_data.action = clip
            for index in range(count):
                pose_character(rig, index + 1, action, index / count)
            rig["actions"][action] = clip

    for rig in rigs:
        for obj in rig["objects"]:
            obj.hide_render = False
        for other in rigs:
            if other is rig:
                continue
            for obj in other["objects"]:
                obj.hide_render = True
        render_actions = actions if rig["runner"] else {"run": CHASER_RUN_FRAMES}
        for action, count in render_actions.items():
            rig["armature"].animation_data.action = rig["actions"][action]
            out_dir = RAW / f"{rig['slug']}-{action}"
            out_dir.mkdir(parents=True, exist_ok=True)
            for index in range(count):
                scene.frame_set(index + 1)
                scene.render.filepath = str(out_dir / f"{index:02d}.png")
                bpy.ops.render.render(write_still=True)

    for rig in rigs:
        for obj in rig["objects"]:
            obj.hide_render = True
    scene.frame_start = 1
    scene.frame_end = max(actions.values())


def building(name, x, y, width, height, depth, body_mat, window_mat, collection, window_rows=4):
    body = cube(name, (width, depth, height), (x, y, height / 2), body_mat, 0.12, collection)
    columns = max(1, int(width / 1.25))
    for row in range(window_rows):
        z = 1.1 + row * max(1.0, (height - 1.6) / max(1, window_rows))
        for col in range(columns):
            wx = x - width / 2 + (col + 0.5) * width / columns
            cube(f"{name}_window", (width / columns * 0.42, 0.08, 0.46), (wx, y - depth / 2 - 0.05, z), window_mat, 0.02, collection)
    return body


def tree(name, x, y, scale, trunk_mat, leaf_mat, collection):
    cylinder(f"{name}_trunk", 0.16 * scale, 2.0 * scale, (x, y, 1.0 * scale), trunk_mat, 8, collection)
    for index, (dx, dz, radius) in enumerate(((-0.45, 2.0, 0.78), (0.35, 2.1, 0.9), (0, 2.7, 0.8))):
        sphere(f"{name}_leaf_{index}", radius * scale, (x + dx * scale, y, dz * scale), leaf_mat, (1.0, 0.72, 1.0), collection)


def clear_collection(collection):
    for obj in list(collection.objects):
        bpy.data.objects.remove(obj, do_unlink=True)


def make_environment(env, collections, mats):
    far, mid, near = collections
    random.seed(41 + ["downtown", "park", "industrial", "underground"].index(env))
    for collection in collections:
        clear_collection(collection)

    if env == "downtown":
        for index in range(13):
            x = -16 + index * 2.7
            h = random.uniform(5.0, 11.2)
            building(f"far_tower_{index}", x, 8, 2.25, h, 1.6, mats["blue"], mats["sky_window"], far, 6)
        for index in range(8):
            x = -15 + index * 4.3
            h = random.uniform(5.0, 8.4)
            body = mats["brick"] if index % 2 else mats["cream"]
            building(f"street_building_{index}", x, 2, 3.65, h, 1.8, body, mats["warm_window"], mid, 4)
        cube("sidewalk", (38, 2.8, 0.32), (0, -3.2, 0.16), mats["sidewalk"], 0.04, near)
        for x in (-12, -4, 5, 13):
            cylinder("lamp", 0.08, 3.2, (x, -4.5, 1.6), mats["ink"], 8, near)
            sphere("lamp_globe", 0.22, (x, -4.5, 3.2), mats["lime"], (1, 1, 1), near)
    elif env == "park":
        for index in range(10):
            x = -16 + index * 3.7
            h = random.uniform(4.0, 8.0)
            building(f"park_skyline_{index}", x, 9, 2.8, h, 1.5, mats["blue"], mats["sky_window"], far, 4)
        cube("park_lawn", (38, 3.0, 0.3), (0, 2.8, 0.15), mats["grass"], 0.03, mid)
        for index, x in enumerate(range(-15, 17, 4)):
            tree(f"tree_{index}", x, 2, random.uniform(0.85, 1.2), mats["trunk"], mats["lime"], mid)
        cube("park_path", (38, 2.8, 0.28), (0, -3.2, 0.14), mats["sidewalk"], 0.03, near)
        for x in (-9, 2, 11):
            cube("bench_seat", (2.1, 0.55, 0.18), (x, -4.0, 0.75), mats["brick"], 0.06, near)
            cube("bench_back", (2.1, 0.18, 0.8), (x, -3.77, 1.1), mats["brick"], 0.06, near)
    elif env == "industrial":
        for index, x in enumerate(range(-15, 18, 5)):
            cylinder(f"tank_{index}", 1.2, random.uniform(4.0, 7.0), (x, 8, 3.0), mats["blue"], 14, far)
        for index in range(7):
            x = -15 + index * 5
            building(f"warehouse_{index}", x, 2, 4.4, random.uniform(3.5, 5.4), 2.0, mats["industrial"], mats["warm_window"], mid, 2)
            cylinder("stack", 0.28, 3.4, (x + 1.2, 1.5, 5.4), mats["ink"], 10, mid)
        cube("industrial_road", (38, 2.8, 0.3), (0, -3.2, 0.15), mats["asphalt"], 0.03, near)
        for x in range(-15, 17, 4):
            cylinder("barrel", 0.42, 0.9, (x, -4.0, 0.45), mats["red"], 10, near)
    else:
        cube("tunnel_wall", (38, 1.2, 11), (0, 8, 5.0), mats["underground"], 0.04, far)
        for x in range(-16, 18, 3):
            cube("wall_tile", (0.08, 0.09, 10), (x, 7.35, 5), mats["blue"], 0, far)
        for x in range(-14, 16, 5):
            cube("column", (0.7, 1.0, 8.5), (x, 2, 4.25), mats["cream"], 0.08, mid)
            cube("column_band", (0.78, 1.08, 0.5), (x, 1.96, 3.1), mats["red"], 0.03, mid)
        cube("subway_platform", (38, 3.0, 0.42), (0, -3.2, 0.21), mats["sidewalk"], 0.03, near)
        cube("platform_edge", (38, 0.55, 0.2), (0, -4.6, 0.54), mats["lime"], 0.02, near)
        for x in (-11, -1, 9):
            cylinder("pipe", 0.13, 5.0, (x, -4.3, 3.2), mats["industrial"], 10, near)
            cube("pipe_cross", (2.5, 0.28, 0.28), (x + 1.1, -4.3, 5.65), mats["industrial"], 0.05, near)


def render_environments(scene, camera, collections, mats):
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 512
    camera.location = (0, -34, 5.0)
    camera.data.ortho_scale = 38.0
    point_at(camera, (0, 0, 4.6))
    for env in ("downtown", "park", "industrial", "underground"):
        make_environment(env, collections, mats)
        for active in collections:
            for collection in collections:
                collection.hide_render = collection is not active
            scene.render.filepath = str(RAW / f"{env}-{active.name.lower()}.png")
            bpy.ops.render.render(write_still=True)
    for collection in collections:
        collection.hide_render = True


def main():
    clear_scene()
    scene = bpy.context.scene
    camera = setup_render(scene)

    character_collection = bpy.data.collections.new("CHARACTERS")
    scene.collection.children.link(character_collection)
    runner = make_character("runner", True, character_collection, {
        "skin": (0.76, 0.40, 0.23),
        "hair": (0.94, 0.13, 0.025),
        "shirt": (0.46, 0.70, 0.90),
        "inner": (0.025, 0.028, 0.05),
        "pants": (0.05, 0.20, 0.48),
        "shoe": (0.95, 0.91, 0.79),
    }, "cover")
    runner_v1 = make_character("runner_v1", True, character_collection, {
        "skin": (0.73, 0.43, 0.27),
        "hair": (0.10, 0.045, 0.025),
        "shirt": (0.92, 0.88, 0.76),
        "inner": (0.92, 0.88, 0.76),
        "pants": (0.04, 0.16, 0.52),
        "shoe": (0.96, 0.94, 0.87),
        "cap": (0.88, 0.035, 0.025),
    }, "v1")
    chaser = make_character("chaser", False, character_collection, {
        "skin": (0.64, 0.34, 0.20),
        "hair": (0.018, 0.018, 0.028),
        "shirt": (0.025, 0.03, 0.06),
        "inner": (0.80, 0.82, 0.78),
        "pants": (0.018, 0.023, 0.05),
        "shoe": (0.018, 0.018, 0.025),
    }, "chaser")
    render_sprites(scene, camera, (runner, runner_v1, chaser))

    env_collections = []
    for name in ("FAR", "MID", "NEAR"):
        collection = bpy.data.collections.new(name)
        scene.collection.children.link(collection)
        env_collections.append(collection)
    env_mats = {
        "blue": material("Env blue", (0.06, 0.18, 0.42)),
        "brick": material("Brick", (0.55, 0.15, 0.08)),
        "cream": material("Cream", (0.72, 0.53, 0.30)),
        "sky_window": material("Sky window", (0.44, 0.67, 0.82), 0.05, 0.35),
        "warm_window": material("Warm window", (0.96, 0.61, 0.18), 0.05, 0.35),
        "sidewalk": material("Sidewalk", (0.61, 0.52, 0.42)),
        "ink": material("Ink", (0.025, 0.02, 0.06)),
        "lime": material("Lime", (0.54, 0.82, 0.08)),
        "grass": material("Grass", (0.16, 0.46, 0.09)),
        "trunk": material("Trunk", (0.30, 0.12, 0.045)),
        "industrial": material("Industrial", (0.20, 0.25, 0.31), 0.22, 0.48),
        "asphalt": material("Asphalt", (0.055, 0.065, 0.10)),
        "red": material("Red", (0.79, 0.045, 0.035)),
        "underground": material("Underground", (0.035, 0.045, 0.075)),
    }
    render_environments(scene, camera, env_collections, env_mats)

    source = ROOT / "blender" / "sneaker-run-source.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source))
    print(f"Saved Blender source to {source}")
    print(f"Rendered raw frames to {RAW}")


if __name__ == "__main__":
    main()
