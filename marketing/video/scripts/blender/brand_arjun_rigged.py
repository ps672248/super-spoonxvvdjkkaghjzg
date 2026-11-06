"""
Blender 5.2 Python Script: Pristine Rigged Arjun for Aspirant Arcade
- Loads Casual_Male.glb with complete humanoid armature (30+ bones)
- Splits jacket into Navy (#0F1E36) body and Gold (#FDC003) varsity sleeves
- Customizes PBR materials: Indian student warm skin tone, dark hair, denim jeans, sneakers
- Adds 55mm jaw-drop 'mouthOpen' shape key on Casual_Head for real-time lip-sync
- Poses armature into natural speaking posture
- Exports public/models/arjun_rigged.glb
- Renders high-res preview to output/arjun_rigged_render.jpg
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

arm_obj = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
print(f"Found Armature: {arm_obj.name}")

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

mat_navy = make_pbr_mat("AANavyJacket", (0.058, 0.117, 0.211, 1.0), roughness=0.50) # #0F1E36
mat_gold = make_pbr_mat("AAGoldSleeve", (0.992, 0.753, 0.012, 1.0), roughness=0.35, metallic=0.15) # #FDC003
mat_skin = make_pbr_mat("AASkin", (0.86, 0.62, 0.47, 1.0), roughness=0.55) # Warm Indian student tone
mat_hair = make_pbr_mat("AAHair", (0.10, 0.07, 0.05, 1.0), roughness=0.80) # Jet dark brown / black
mat_jeans = make_pbr_mat("AAJeans", (0.08, 0.11, 0.18, 1.0), roughness=0.70) # Dark denim
mat_white = make_pbr_mat("AAWhite", (0.95, 0.95, 0.95, 1.0), roughness=0.35)

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
        for slot in obj.material_slots:
            if slot.material and slot.material.name in mat_map:
                slot.material = mat_map[slot.material.name]

# 2. Split Varsity Sleeves on Casual_Body
body_obj = bpy.data.objects.get("Casual_Body")
if body_obj:
    body_obj.data.materials.append(mat_gold)
    gold_slot_idx = len(body_obj.data.materials) - 1
    
    sleeve_count = 0
    for poly in body_obj.data.polygons:
        if poly.material_index == 0:
            poly_center = sum((body_obj.matrix_world @ body_obj.data.vertices[v].co for v in poly.vertices), mathutils.Vector()) / len(poly.vertices)
            if abs(poly_center.x) > 0.22 and poly_center.z > 1.15:
                poly.material_index = gold_slot_idx
                sleeve_count += 1
    print(f"Assigned {sleeve_count} polygons to Gold Varsity Sleeves!")

# 3. Add Deep 55mm mouthOpen Shape Key on Casual_Head (Visibly Drops Jaw on Speech)
head_obj = bpy.data.objects.get("Casual_Head")
if head_obj:
    head_obj.shape_key_add(name="Basis")
    sk_mouth = head_obj.shape_key_add(name="mouthOpen")
    jaw_moved = 0
    for i, v in enumerate(head_obj.data.vertices):
        wco = head_obj.matrix_world @ v.co
        if abs(wco.x) < 0.055 and wco.y < -0.05 and 1.48 <= wco.z <= 1.62:
            factor = (1.62 - wco.z) / 0.14
            # 0.00055 * 100 = 0.055m = 55mm drop in world space
            sk_mouth.data[i].co.z -= 0.00055 * factor
            sk_mouth.data[i].co.y += 0.00025 * factor
            jaw_moved += 1
    print(f"Created deep mouthOpen shape key on Casual_Head ({jaw_moved} vertices morphed, 55mm drop)")

# 4. Pose Armature Bones (XYZ mode)
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.mode_set(mode='POSE')

for pb in arm_obj.pose.bones:
    pb.rotation_mode = 'XYZ'

# Right Arm: Lifted forward holding smartphone
if 'UpperArm.R' in arm_obj.pose.bones:
    arm_obj.pose.bones['UpperArm.R'].rotation_euler = (math.radians(18), math.radians(-12), math.radians(38))
if 'LowerArm.R' in arm_obj.pose.bones:
    arm_obj.pose.bones['LowerArm.R'].rotation_euler = (math.radians(-15), math.radians(-10), math.radians(68))
if 'Hand.R' in arm_obj.pose.bones:
    arm_obj.pose.bones['Hand.R'].rotation_euler = (math.radians(20), math.radians(0), math.radians(18))

# Left Arm: Natural forward conversational gesture
if 'UpperArm.L' in arm_obj.pose.bones:
    arm_obj.pose.bones['UpperArm.L'].rotation_euler = (math.radians(10), math.radians(6), math.radians(-30))
if 'LowerArm.L' in arm_obj.pose.bones:
    arm_obj.pose.bones['LowerArm.L'].rotation_euler = (math.radians(-8), math.radians(5), math.radians(-48))
if 'Hand.L' in arm_obj.pose.bones:
    arm_obj.pose.bones['Hand.L'].rotation_euler = (math.radians(12), math.radians(0), math.radians(-18))

# Head / Neck: Conversational speaking tilt
if 'Neck' in arm_obj.pose.bones:
    arm_obj.pose.bones['Neck'].rotation_euler = (math.radians(3), math.radians(4), math.radians(-2))
if 'Head' in arm_obj.pose.bones:
    arm_obj.pose.bones['Head'].rotation_euler = (math.radians(5), math.radians(6), math.radians(-3))

bpy.ops.object.mode_set(mode='OBJECT')
bpy.context.view_layer.update()

# 5. Export Pristine Rigged GLB
print(f"Exporting Rigged GLB to: {out_glb}")
bpy.ops.export_scene.gltf(
    filepath=out_glb,
    export_format='GLB',
    use_selection=False,
    export_apply=False,
    export_materials='EXPORT',
    export_skins=True,
    export_morph=True,
)

print(f"Saving .blend project to: {out_blend}")
bpy.ops.wm.save_as_mainfile(filepath=out_blend)

# 6. Render High-Res EEVEE Preview
bpy.context.scene.render.resolution_x = 1080
bpy.context.scene.render.resolution_y = 1920
bpy.context.scene.render.image_settings.file_format = 'JPEG'
bpy.context.scene.render.filepath = out_render
bpy.context.scene.render.engine = 'BLENDER_EEVEE'

cam_data = bpy.data.cameras.new("RenderCam")
cam_data.lens = 55
cam_obj = bpy.data.objects.new("RenderCam", cam_data)
cam_obj.location = (0.35, -2.1, 1.45)
cam_obj.rotation_euler = (math.radians(85), 0, math.radians(10))
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

key_l = bpy.data.lights.new("KeyLight", type='POINT')
key_l.energy = 500
key_l.color = (1.0, 0.96, 0.88)
key_obj = bpy.data.objects.new("KeyLight", key_l)
key_obj.location = (1.5, -1.5, 2.2)
bpy.context.scene.collection.objects.link(key_obj)

fill_l = bpy.data.lights.new("FillLight", type='POINT')
fill_l.energy = 220
fill_l.color = (0.3, 0.7, 1.0)
fill_obj = bpy.data.objects.new("FillLight", fill_l)
fill_obj.location = (-1.5, -1.2, 1.4)
bpy.context.scene.collection.objects.link(fill_obj)

rim_l = bpy.data.lights.new("RimLight", type='POINT')
rim_l.energy = 650
rim_l.color = (0.1, 0.9, 1.0)
rim_obj = bpy.data.objects.new("RimLight", rim_l)
rim_obj.location = (0, 1.5, 2.2)
bpy.context.scene.collection.objects.link(rim_obj)

print("Rendering Arjun frame in Blender EEVEE...")
bpy.ops.render.render(write_still=True)
print(f"SUCCESS! Render saved to: {out_render}")
