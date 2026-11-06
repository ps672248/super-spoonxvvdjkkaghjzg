"""
Blender 5.2 Python Script: High-Fidelity Rigged Arjun for Aspirant Arcade
- Loads Casual_Male.glb with complete humanoid armature (30+ bones)
- Splits jacket into Navy (#0F1E36) body and Gold (#FDC003) varsity sleeves
- Customizes PBR materials: Indian student skin tone, dark hair, denim jeans
- Adds 'mouthOpen' shape key on Casual_Head for real-time lip-sync
- Poses armature into natural speaking posture holding smartphone
- Attaches brand accessories with exact bone parenting:
  * Gold wireframe circular glasses (Head)
  * Arcade headphones around neck (Neck)
  * Gold "AA" crest badge on chest (Chest)
  * Smartphone with glowing green screen (Hand.R)
- Exports public/models/arjun_rigged.glb with skins and morph targets
- Renders high-res portrait to output/arjun_rigged_render.jpg
"""
import os
import math
import bpy
import mathutils

bpy.ops.wm.read_factory_settings(use_empty=True)

script_dir = os.path.dirname(os.path.abspath(__file__))
video_root = os.path.abspath(os.path.join(script_dir, "../.."))
base_glb = os.path.join(video_root, "public", "models", "quaternius", "Casual_Male.glb")
out_glb = os.path.join(video_root, "public", "models", "arjun_rigged.glb")
out_blend = os.path.join(video_root, "models", "arjun_rigged.blend")
out_render = os.path.join(video_root, "output", "arjun_rigged_render.jpg")

print(f"Loading base rigged model from: {base_glb}")
bpy.ops.import_scene.gltf(filepath=base_glb)

# Find Armature
arm_obj = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
print(f"Found Armature: {arm_obj.name}")

# PBR Material Helper
def make_pbr_mat(name, rgba, roughness=0.55, metallic=0.0):
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        if "Base Color" in bsdf.inputs:
            bsdf.inputs["Base Color"].default_value = rgba
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = roughness
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = metallic
    return mat

mat_navy = make_pbr_mat("AANavyJacket", (0.058, 0.117, 0.211, 1.0), roughness=0.6) # #0F1E36
mat_gold = make_pbr_mat("AAGoldSleeve", (0.992, 0.753, 0.012, 1.0), roughness=0.45) # #FDC003
mat_skin = make_pbr_mat("AASkin", (0.86, 0.62, 0.47, 1.0), roughness=0.68) # Indian student tone
mat_hair = make_pbr_mat("AAHair", (0.12, 0.08, 0.06, 1.0), roughness=0.85) # Dark brown / black
mat_jeans = make_pbr_mat("AAJeans", (0.09, 0.12, 0.20, 1.0), roughness=0.75) # Dark denim
mat_white = make_pbr_mat("AAWhite", (0.95, 0.95, 0.95, 1.0), roughness=0.4)
mat_phone_dark = make_pbr_mat("AAPhoneDark", (0.03, 0.04, 0.06, 1.0), roughness=0.25, metallic=0.5)
mat_phone_screen = make_pbr_mat("AAPhoneScreen", (0.13, 0.77, 0.36, 1.0), roughness=0.2)
mat_gold_metal = make_pbr_mat("AAGoldMetal", (0.992, 0.753, 0.012, 1.0), roughness=0.3, metallic=0.75)

# Re-link base materials
mat_map = {
    "Purple": mat_navy,
    "Skin": mat_skin,
    "Hair": mat_hair,
    "Eyebrows": mat_hair,
    "LightBlue": mat_jeans,
    "White": mat_white
}

for obj in bpy.data.objects:
    if obj.type == 'MESH':
        for i, slot in enumerate(obj.material_slots):
            if slot.material and slot.material.name in mat_map:
                slot.material = mat_map[slot.material.name]

# 2. Split Varsity Sleeves on Casual_Body
body_obj = bpy.data.objects.get("Casual_Body")
if body_obj:
    # Add Gold Sleeve material slot
    body_obj.data.materials.append(mat_gold)
    gold_slot_idx = len(body_obj.data.materials) - 1
    
    # Assign polygons outside torso (abs(x) > 0.22) and above waist (z > 1.15) to gold
    sleeve_count = 0
    for poly in body_obj.data.polygons:
        # Check if currently jacket navy
        if poly.material_index == 0:
            poly_center = sum((body_obj.matrix_world @ body_obj.data.vertices[v].co for v in poly.vertices), mathutils.Vector()) / len(poly.vertices)
            if abs(poly_center.x) > 0.22 and poly_center.z > 1.15:
                poly.material_index = gold_slot_idx
                sleeve_count += 1
    print(f"Assigned {sleeve_count} polygons to Gold Varsity Sleeves!")

# 3. Add mouthOpen Shape Key on Casual_Head
head_obj = bpy.data.objects.get("Casual_Head")
if head_obj:
    head_obj.shape_key_add(name="Basis")
    sk_mouth = head_obj.shape_key_add(name="mouthOpen")
    jaw_moved = 0
    for i, v in enumerate(head_obj.data.vertices):
        wco = head_obj.matrix_world @ v.co
        if abs(wco.x) < 0.05 and wco.y < -0.06 and 1.50 <= wco.z <= 1.58:
            factor = (1.58 - wco.z) / 0.08
            # In local coordinates (Casual_Head matrix_world scale is 100)
            sk_mouth.data[i].co.z -= (0.026 * factor) / 100.0
            sk_mouth.data[i].co.y += (0.010 * factor) / 100.0
            jaw_moved += 1
    print(f"Created mouthOpen shape key on Casual_Head ({jaw_moved} vertices morphed)")

# 4. Pose Armature Bones (XYZ mode)
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.mode_set(mode='POSE')

for pb in arm_obj.pose.bones:
    pb.rotation_mode = 'XYZ'

# Pose Right Arm: Bring hand up in front holding smartphone
if 'UpperArm.R' in arm_obj.pose.bones:
    arm_obj.pose.bones['UpperArm.R'].rotation_euler = (math.radians(15), math.radians(-10), math.radians(35))
if 'LowerArm.R' in arm_obj.pose.bones:
    arm_obj.pose.bones['LowerArm.R'].rotation_euler = (math.radians(-12), math.radians(-8), math.radians(65))
if 'Hand.R' in arm_obj.pose.bones:
    arm_obj.pose.bones['Hand.R'].rotation_euler = (math.radians(15), math.radians(0), math.radians(15))

# Pose Left Arm: Natural forward conversational gesture
if 'UpperArm.L' in arm_obj.pose.bones:
    arm_obj.pose.bones['UpperArm.L'].rotation_euler = (math.radians(8), math.radians(5), math.radians(-28))
if 'LowerArm.L' in arm_obj.pose.bones:
    arm_obj.pose.bones['LowerArm.L'].rotation_euler = (math.radians(-6), math.radians(4), math.radians(-45))
if 'Hand.L' in arm_obj.pose.bones:
    arm_obj.pose.bones['Hand.L'].rotation_euler = (math.radians(10), math.radians(0), math.radians(-15))

# Head / Neck: Slight conversational tilt
if 'Neck' in arm_obj.pose.bones:
    arm_obj.pose.bones['Neck'].rotation_euler = (math.radians(2), math.radians(3), math.radians(-1))
if 'Head' in arm_obj.pose.bones:
    arm_obj.pose.bones['Head'].rotation_euler = (math.radians(4), math.radians(5), math.radians(-2))

bpy.ops.object.mode_set(mode='OBJECT')
bpy.context.view_layer.update()

# Helper: Parent object rigidly to bone and lock world transform
def attach_to_bone(obj, bone_name):
    pb = arm_obj.pose.bones[bone_name]
    bone_world_mat = arm_obj.matrix_world @ pb.matrix
    obj.parent = arm_obj
    obj.parent_type = 'BONE'
    obj.parent_bone = bone_name
    obj.matrix_parent_inverse = bone_world_mat.inverted()

# 5. Create & Attach Props

# A. Gold Circular Spectacles (Head bone)
# Eyes at x: +/- 0.045, y: -0.168, z: 1.710
bpy.ops.mesh.primitive_torus_add(major_radius=0.038, minor_radius=0.005, major_segments=16, minor_segments=6, location=(-0.045, -0.168, 1.710), rotation=(math.pi / 2, 0, 0))
gl_l = bpy.context.active_object
gl_l.name = "Arjun_Glasses_L"
gl_l.data.materials.append(mat_gold_metal)
attach_to_bone(gl_l, 'Head')

bpy.ops.mesh.primitive_torus_add(major_radius=0.038, minor_radius=0.005, major_segments=16, minor_segments=6, location=(0.045, -0.168, 1.710), rotation=(math.pi / 2, 0, 0))
gl_r = bpy.context.active_object
gl_r.name = "Arjun_Glasses_R"
gl_r.data.materials.append(mat_gold_metal)
attach_to_bone(gl_r, 'Head')

# Glasses Center Bridge
bpy.ops.mesh.primitive_cylinder_add(vertices=4, radius=0.004, depth=0.035, location=(0, -0.168, 1.710), rotation=(0, math.pi / 2, 0))
bridge = bpy.context.active_object
bridge.name = "Arjun_Glasses_Bridge"
bridge.data.materials.append(mat_gold_metal)
attach_to_bone(bridge, 'Head')

# B. Arcade Headphones around Neck (Neck bone)
# Neck at z: 1.50
bpy.ops.mesh.primitive_torus_add(major_radius=0.12, minor_radius=0.018, major_segments=16, minor_segments=6, location=(0, -0.02, 1.49), rotation=(math.pi / 2, 0, 0))
hp_band = bpy.context.active_object
hp_band.name = "Arjun_Headphones_Band"
hp_band.data.materials.append(mat_gold_metal)
attach_to_bone(hp_band, 'Neck')

for side, x in [("L", -0.13), ("R", 0.13)]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.045, depth=0.035, location=(x, -0.02, 1.48), rotation=(0, math.pi / 2, 0))
    cup = bpy.context.active_object
    cup.name = f"Arjun_Headphones_Cup_{side}"
    cup.data.materials.append(mat_phone_dark)
    attach_to_bone(cup, 'Neck')

# C. Aspirant Arcade "AA" Gold Crest Badge on Left Chest (Chest bone)
bpy.ops.mesh.primitive_cube_add(size=0.065, location=(-0.11, -0.14, 1.36), rotation=(0, 0, -0.15))
badge = bpy.context.active_object
badge.name = "Arjun_AABadge"
badge.scale = (1.0, 0.15, 1.2)
bpy.ops.object.transform_apply(scale=True)
badge.data.materials.append(mat_gold_metal)
attach_to_bone(badge, 'Chest')

# D. Smartphone in Right Hand (Hand.R bone)
# Query posed Hand.R location
hand_r_bone = arm_obj.pose.bones['Hand.R']
hand_r_loc = (arm_obj.matrix_world @ hand_r_bone.matrix).to_translation()
print(f"Posed Hand.R location: {hand_r_loc}")

# Phone body
phone_pos = hand_r_loc + mathutils.Vector((0.02, -0.06, 0.04))
bpy.ops.mesh.primitive_cube_add(size=0.09, location=phone_pos, rotation=(math.radians(35), math.radians(-15), math.radians(20)))
phone = bpy.context.active_object
phone.name = "Arjun_Smartphone"
phone.scale = (0.75, 0.08, 1.5)
bpy.ops.object.transform_apply(scale=True)
phone.data.materials.append(mat_phone_dark)
attach_to_bone(phone, 'Hand.R')

# Glowing Phone Screen
screen_pos = phone_pos + mathutils.Vector((0.002, -0.007, 0.003))
bpy.ops.mesh.primitive_cube_add(size=0.082, location=screen_pos, rotation=(math.radians(35), math.radians(-15), math.radians(20)))
screen = bpy.context.active_object
screen.name = "Arjun_Smartphone_Screen"
screen.scale = (0.70, 0.03, 1.4)
bpy.ops.object.transform_apply(scale=True)
screen.data.materials.append(mat_phone_screen)
attach_to_bone(screen, 'Hand.R')

# 6. Export Rigged GLB with Armature Skins & Morph Targets
print(f"Exporting Rigged GLB to: {out_glb}")
bpy.ops.export_scene.gltf(
    filepath=out_glb,
    export_format='GLB',
    use_selection=False,
    export_apply=False,
    export_materials='EXPORT',
    export_skins=True,
    export_morph=True, # Exports mouthOpen shape key!
)

print(f"Saving .blend project to: {out_blend}")
bpy.ops.wm.save_as_mainfile(filepath=out_blend)

# 7. Render High-Res EEVEE Preview
bpy.context.scene.render.resolution_x = 1080
bpy.context.scene.render.resolution_y = 1920
bpy.context.scene.render.image_settings.file_format = 'JPEG'
bpy.context.scene.render.filepath = out_render
bpy.context.scene.render.engine = 'BLENDER_EEVEE'

# Camera: Waist-up 3/4 portrait
cam_data = bpy.data.cameras.new("RenderCam")
cam_data.lens = 55
cam_obj = bpy.data.objects.new("RenderCam", cam_data)
cam_obj.location = (0.35, -2.1, 1.45)
cam_obj.rotation_euler = (math.radians(85), 0, math.radians(10))
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

# 3-Point Studio Lighting
key_l = bpy.data.lights.new("KeyLight", type='POINT')
key_l.energy = 450
key_l.color = (1.0, 0.96, 0.88)
key_obj = bpy.data.objects.new("KeyLight", key_l)
key_obj.location = (1.5, -1.5, 2.2)
bpy.context.scene.collection.objects.link(key_obj)

fill_l = bpy.data.lights.new("FillLight", type='POINT')
fill_l.energy = 180
fill_l.color = (0.3, 0.7, 1.0)
fill_obj = bpy.data.objects.new("FillLight", fill_l)
fill_obj.location = (-1.5, -1.2, 1.4)
bpy.context.scene.collection.objects.link(fill_obj)

rim_l = bpy.data.lights.new("RimLight", type='POINT')
rim_l.energy = 550
rim_l.color = (0.1, 0.9, 1.0) # Arcade cyan rim
rim_obj = bpy.data.objects.new("RimLight", rim_l)
rim_obj.location = (0, 1.5, 2.2)
bpy.context.scene.collection.objects.link(rim_obj)

print("Rendering Arjun Rigged frame in Blender EEVEE...")
bpy.ops.render.render(write_still=True)
print(f"SUCCESS! Render saved to: {out_render}")
