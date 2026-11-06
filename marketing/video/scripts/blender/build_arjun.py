"""
Blender 5.2 Python Script: Generate Low-Poly 3D Arjun Character
Aspirant Arcade Brand Edition:
  - Flat-shaded low-poly geometric aesthetic (matching Blender EEVEE / @base.learn)
  - Navy Blue (#0F1E36) bomber jacket with Yellow (#FDC003) varsity sleeves & AA crest
  - Circular gold-wire spectacles
  - Gaming headphones around neck with cyan glow
  - Modern low-poly quiff fade
  - Articulated mouth with 'mouthOpen' shape key for real-time speech lip-sync
  - Exports to arjun.glb and saves arjun.blend
"""
import sys
import os
import math
import bpy

# 1. Clear Default Scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# 2. Material Helper Function (PBR Principled BSDF)
def create_flat_mat(name, rgba, roughness=0.6, metalness=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        # Base Color is socket 0 in Blender Principled BSDF
        if "Base Color" in bsdf.inputs:
            bsdf.inputs["Base Color"].default_value = rgba
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = roughness
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = metalness
    return mat

# Aspirant Arcade Brand Palette
mat_skin = create_flat_mat("Skin", (0.86, 0.62, 0.47, 1.0), roughness=0.7)
mat_hair = create_flat_mat("HairDark", (0.13, 0.08, 0.06, 1.0), roughness=0.8)
mat_navy = create_flat_mat("AANavy", (0.058, 0.117, 0.211, 1.0), roughness=0.65) # #0F1E36
mat_gold = create_flat_mat("AAGold", (0.992, 0.753, 0.012, 1.0), roughness=0.35, metalness=0.6) # #FDC003
mat_white = create_flat_mat("White", (0.95, 0.95, 0.95, 1.0), roughness=0.4)
mat_dark = create_flat_mat("DarkPlastic", (0.03, 0.05, 0.08, 1.0), roughness=0.4)
mat_screen = create_flat_mat("NeonScreen", (0.13, 0.77, 0.36, 1.0), roughness=0.2) # #22C55E

created_objects = []

def tag_flat_shading(obj):
    for poly in obj.data.polygons:
        poly.use_smooth = False
    created_objects.append(obj)

# ─── 1. HEAD & FACETED FACE ───
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.34, location=(0, 0, 1.48))
head = bpy.context.active_object
head.name = "Arjun_Head"
head.scale = (0.96, 1.08, 1.02)
bpy.ops.object.transform_apply(scale=True)
head.data.materials.append(mat_skin)
tag_flat_shading(head)

# Shape Key: mouthOpen (Lip-Sync Driver)
head.shape_key_add(name="Basis")
sk_mouth = head.shape_key_add(name="mouthOpen")
# Slightly depress chin/mouth vertices in shape key
for v in head.data.vertices:
    if v.co.y < -0.22 and v.co.z < 1.42:
        # Lower jaw vertex
        sk_mouth.data[v.index].co.z -= 0.06
        sk_mouth.data[v.index].co.y -= 0.02

# ─── 2. LOW-POLY MODERN QUIFF HAIR ───
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.36, location=(0, 0.02, 1.54))
hair_cap = bpy.context.active_object
hair_cap.name = "Arjun_HairCap"
hair_cap.scale = (1.02, 1.08, 1.02)
bpy.ops.object.transform_apply(scale=True)
hair_cap.data.materials.append(mat_hair)
tag_flat_shading(hair_cap)

# Front Hair Spikes (Angled Quiff)
for i in range(5):
    x_pos = -0.12 + (i * 0.06)
    z_pos = 1.76 - abs(i - 2) * 0.035
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.07, depth=0.18, location=(x_pos, -0.16, z_pos), rotation=(-0.4, 0, (i - 2) * -0.18))
    spike = bpy.context.active_object
    spike.name = f"HairSpike_{i}"
    spike.data.materials.append(mat_hair)
    tag_flat_shading(spike)

# ─── 3. EYES & BROWS ───
for side, x in [("L", -0.11), ("R", 0.11)]:
    # Black Pupil Box
    bpy.ops.mesh.primitive_cube_add(size=0.06, location=(x, -0.31, 1.50))
    eye = bpy.context.active_object
    eye.name = f"Eye_{side}"
    eye.scale = (1, 0.25, 1)
    bpy.ops.object.transform_apply(scale=True)
    eye.data.materials.append(mat_dark)
    tag_flat_shading(eye)

    # Specular White Glint
    bpy.ops.mesh.primitive_cube_add(size=0.02, location=(x + (0.015 if side == 'L' else -0.015), -0.325, 1.515))
    glint = bpy.context.active_object
    glint.name = f"Glint_{side}"
    glint.data.materials.append(mat_white)
    tag_flat_shading(glint)

    # Eyebrows
    tilt = 0.08 if side == 'R' else -0.08
    bpy.ops.mesh.primitive_cube_add(size=0.08, location=(x, -0.32, 1.58), rotation=(0, 0, tilt))
    brow = bpy.context.active_object
    brow.name = f"Brow_{side}"
    brow.scale = (1.2, 0.2, 0.35)
    bpy.ops.object.transform_apply(scale=True)
    brow.data.materials.append(mat_hair)
    tag_flat_shading(brow)

# ─── 4. CIRCULAR GOLD SPECTACLES ───
for side, x in [("L", -0.11), ("R", 0.11)]:
    bpy.ops.mesh.primitive_torus_add(major_radius=0.075, minor_radius=0.009, major_segments=16, minor_segments=6, location=(x, -0.33, 1.50), rotation=(math.pi / 2, 0, 0))
    rim = bpy.context.active_object
    rim.name = f"GlassesRim_{side}"
    rim.data.materials.append(mat_gold)
    tag_flat_shading(rim)

# Glasses Bridge
bpy.ops.mesh.primitive_cylinder_add(vertices=4, radius=0.008, depth=0.08, location=(0, -0.33, 1.50), rotation=(0, math.pi / 2, 0))
bridge = bpy.context.active_object
bridge.name = "GlassesBridge"
bridge.data.materials.append(mat_gold)
tag_flat_shading(bridge)

# ─── 5. ARCADE HEADPHONES AROUND NECK ───
# Headband
bpy.ops.mesh.primitive_torus_add(major_radius=0.24, minor_radius=0.03, major_segments=16, minor_segments=6, location=(0, 0, 1.25), rotation=(math.pi / 2, 0, 0))
hp_band = bpy.context.active_object
hp_band.name = "HeadphoneBand"
hp_band.data.materials.append(mat_gold)
tag_flat_shading(hp_band)

# Left and Right Ear Cups
for side, x in [("L", -0.25), ("R", 0.25)]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.08, depth=0.05, location=(x, 0, 1.25), rotation=(0, math.pi / 2, 0))
    cup = bpy.context.active_object
    cup.name = f"HeadphoneCup_{side}"
    cup.data.materials.append(mat_dark)
    tag_flat_shading(cup)

# ─── 6. NECK & VARSITY JACKET TORSO ───
# Slender Neck
bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.10, depth=0.22, location=(0, 0, 1.25))
neck = bpy.context.active_object
neck.name = "Arjun_Neck"
neck.data.materials.append(mat_skin)
tag_flat_shading(neck)

# Bomber Jacket Body (Octagonal faceted cylinder)
bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.34, depth=0.68, location=(0, 0, 0.88))
chest = bpy.context.active_object
chest.name = "Arjun_Torso"
chest.scale = (1.05, 0.92, 1.0)
bpy.ops.object.transform_apply(scale=True)
chest.data.materials.append(mat_navy)
tag_flat_shading(chest)

# Ribbed Gold Collar
bpy.ops.mesh.primitive_torus_add(major_radius=0.20, minor_radius=0.035, major_segments=14, minor_segments=6, location=(0, 0, 1.22), rotation=(math.pi / 2, 0, 0))
collar = bpy.context.active_object
collar.name = "JacketCollar"
collar.data.materials.append(mat_gold)
tag_flat_shading(collar)

# Center Gold Zipper
bpy.ops.mesh.primitive_cube_add(size=0.03, location=(0, -0.32, 0.88))
zipper = bpy.context.active_object
zipper.name = "JacketZipper"
zipper.scale = (0.6, 0.3, 21.0)
bpy.ops.object.transform_apply(scale=True)
zipper.data.materials.append(mat_gold)
tag_flat_shading(zipper)

# Left Chest Aspirant Arcade Crest ("AA" Badge)
bpy.ops.mesh.primitive_cube_add(size=0.12, location=(-0.16, -0.30, 1.02), rotation=(0, 0, -0.28))
badge = bpy.context.active_object
badge.name = "AABadgeCrest"
badge.scale = (1.0, 0.2, 1.2)
bpy.ops.object.transform_apply(scale=True)
badge.data.materials.append(mat_gold)
tag_flat_shading(badge)

# ─── 7. ARMS & SMARTPHONE PROP ───
# Right Upper Arm (Yellow Varsity Sleeve)
bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.08, depth=0.32, location=(0.35, 0, 0.98), rotation=(0.3, 0.1, -0.2))
r_arm = bpy.context.active_object
r_arm.name = "RightUpperArm"
r_arm.data.materials.append(mat_gold)
tag_flat_shading(r_arm)

# Right Forearm (Holding Phone up)
bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.07, depth=0.30, location=(0.32, -0.22, 0.78), rotation=(-0.7, 0, 0.3))
r_forearm = bpy.context.active_object
r_forearm.name = "RightForearm"
r_forearm.data.materials.append(mat_gold)
tag_flat_shading(r_forearm)

# Smartphone Device in Hand
bpy.ops.mesh.primitive_cube_add(size=0.14, location=(0.28, -0.38, 0.82), rotation=(-0.7, -0.2, 0.1))
phone = bpy.context.active_object
phone.name = "Smartphone"
phone.scale = (1.0, 0.12, 1.8)
bpy.ops.object.transform_apply(scale=True)
phone.data.materials.append(mat_dark)
tag_flat_shading(phone)

# Glowing Phone Screen
bpy.ops.mesh.primitive_cube_add(size=0.12, location=(0.28, -0.39, 0.825), rotation=(-0.7, -0.2, 0.1))
phone_screen = bpy.context.active_object
phone_screen.name = "SmartphoneScreen"
phone_screen.scale = (0.95, 0.05, 1.7)
bpy.ops.object.transform_apply(scale=True)
phone_screen.data.materials.append(mat_screen)
tag_flat_shading(phone_screen)

# Left Upper Arm (Yellow Sleeve, relaxed towards desk)
bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.08, depth=0.32, location=(-0.35, 0, 0.98), rotation=(-0.2, -0.1, 0.2))
l_arm = bpy.context.active_object
l_arm.name = "LeftUpperArm"
l_arm.data.materials.append(mat_gold)
tag_flat_shading(l_arm)

# Left Forearm (rested towards desk/keyboard)
bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.07, depth=0.30, location=(-0.32, -0.18, 0.78), rotation=(0.4, 0, -0.15))
l_forearm = bpy.context.active_object
l_forearm.name = "LeftForearm"
l_forearm.data.materials.append(mat_gold)
tag_flat_shading(l_forearm)

# ─── 8. EXPORT TO .GLB & SAVE .BLEND ───
script_dir = os.path.dirname(os.path.abspath(__file__))
video_root = os.path.abspath(os.path.join(script_dir, "../.."))

out_glb = os.path.join(video_root, "public", "models", "arjun.glb")
out_blend = os.path.join(video_root, "models", "arjun.blend")

print(f"Exporting GLB to: {out_glb}")
bpy.ops.export_scene.gltf(
    filepath=out_glb,
    export_format='GLB',
    use_selection=False,
    export_apply=False,
    export_materials='EXPORT',
    export_morph=True, # Exports shape keys (mouthOpen) for lip-sync!
)

print(f"Saving .blend file to: {out_blend}")
bpy.ops.wm.save_as_mainfile(filepath=out_blend)

print("SUCCESS: Arjun 3D low-poly model generated and exported!")

