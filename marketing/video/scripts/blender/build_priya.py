"""
Blender 5.2 Python Script: Generate Low-Poly 3D Priya Mentor Character
Aspirant Arcade Brand Edition:
  - Cream/White (#F8FAFC) varsity blazer with Navy Blue (#0F1E36) accents & Gold (#FDC003) trim
  - Gold hoop earrings and sleek low-poly ponytail with gold hairband
  - Confident mentor demeanor holding study tablet
  - Articulated mouth with 'mouthOpen' shape key for real-time speech lip-sync
  - Exports to priya.glb and saves priya.blend
"""
import sys
import os
import math
import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)

def create_flat_mat(name, rgba, roughness=0.6, metalness=0.0):
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
            bsdf.inputs["Metallic"].default_value = metalness
    return mat

mat_skin = create_flat_mat("PriyaSkin", (0.89, 0.68, 0.54, 1.0), roughness=0.7)
mat_hair = create_flat_mat("PriyaHair", (0.14, 0.08, 0.06, 1.0), roughness=0.8)
mat_cream = create_flat_mat("CreamBlazer", (0.97, 0.98, 0.99, 1.0), roughness=0.55)
mat_navy = create_flat_mat("NavyAccent", (0.058, 0.117, 0.211, 1.0), roughness=0.65)
mat_gold = create_flat_mat("PriyaGold", (0.992, 0.753, 0.012, 1.0), roughness=0.35, metalness=0.65)
mat_white = create_flat_mat("White", (0.95, 0.95, 0.95, 1.0), roughness=0.4)
mat_dark = create_flat_mat("DarkPlastic", (0.03, 0.05, 0.08, 1.0), roughness=0.4)
mat_screen = create_flat_mat("TabletScreen", (0.22, 0.74, 0.97, 1.0), roughness=0.2) # #38BDF8

def tag_flat_shading(obj):
    for poly in obj.data.polygons:
        poly.use_smooth = False

# ─── 1. HEAD & SHAPE KEY ───
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.32, location=(0, 0, 1.48))
head = bpy.context.active_object
head.name = "Priya_Head"
head.scale = (0.92, 1.05, 1.02)
bpy.ops.object.transform_apply(scale=True)
head.data.materials.append(mat_skin)
tag_flat_shading(head)

head.shape_key_add(name="Basis")
sk_mouth = head.shape_key_add(name="mouthOpen")
for v in head.data.vertices:
    if v.co.y < -0.20 and v.co.z < 1.42:
        sk_mouth.data[v.index].co.z -= 0.05
        sk_mouth.data[v.index].co.y -= 0.015

# ─── 2. SLEEK HAIR WITH PONYTAIL ───
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.33, location=(0, 0.02, 1.52))
hair_cap = bpy.context.active_object
hair_cap.name = "Priya_HairCap"
hair_cap.scale = (1.02, 1.08, 1.02)
bpy.ops.object.transform_apply(scale=True)
hair_cap.data.materials.append(mat_hair)
tag_flat_shading(hair_cap)

# High Ponytail at back
bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.12, depth=0.45, location=(0, 0.22, 1.62), rotation=(-1.1, 0, 0))
pony = bpy.context.active_object
pony.name = "Priya_Ponytail"
pony.data.materials.append(mat_hair)
tag_flat_shading(pony)

# Gold Hairband
bpy.ops.mesh.primitive_torus_add(major_radius=0.08, minor_radius=0.02, major_segments=12, minor_segments=6, location=(0, 0.16, 1.68), rotation=(0.5, 0, 0))
band = bpy.context.active_object
band.name = "Priya_Hairband"
band.data.materials.append(mat_gold)
tag_flat_shading(band)

# Side Bangs
for side, x, tilt in [("L", -0.22, -0.12), ("R", 0.22, 0.12)]:
    bpy.ops.mesh.primitive_cube_add(size=0.08, location=(x, -0.18, 1.48), rotation=(0, 0, tilt))
    bang = bpy.context.active_object
    bang.name = f"Bang_{side}"
    bang.scale = (0.7, 1.2, 2.8)
    bpy.ops.object.transform_apply(scale=True)
    bang.data.materials.append(mat_hair)
    tag_flat_shading(bang)

# ─── 3. EYES & BROWS ───
for side, x in [("L", -0.10), ("R", 0.10)]:
    bpy.ops.mesh.primitive_cube_add(size=0.05, location=(x, -0.30, 1.50))
    eye = bpy.context.active_object
    eye.name = f"Eye_{side}"
    eye.scale = (1, 0.25, 1)
    bpy.ops.object.transform_apply(scale=True)
    eye.data.materials.append(mat_dark)
    tag_flat_shading(eye)

    bpy.ops.mesh.primitive_cube_add(size=0.016, location=(x + (0.012 if side == 'L' else -0.012), -0.315, 1.512))
    glint = bpy.context.active_object
    glint.name = f"Glint_{side}"
    glint.data.materials.append(mat_white)
    tag_flat_shading(glint)

    tilt = 0.06 if side == 'R' else -0.06
    bpy.ops.mesh.primitive_cube_add(size=0.07, location=(x, -0.31, 1.57), rotation=(0, 0, tilt))
    brow = bpy.context.active_object
    brow.name = f"Brow_{side}"
    brow.scale = (1.2, 0.2, 0.3)
    bpy.ops.object.transform_apply(scale=True)
    brow.data.materials.append(mat_hair)
    tag_flat_shading(brow)

# ─── 4. GOLD HOOP EARRINGS ───
for side, x in [("L", -0.30), ("R", 0.30)]:
    bpy.ops.mesh.primitive_torus_add(major_radius=0.045, minor_radius=0.008, major_segments=14, minor_segments=6, location=(x, -0.02, 1.45), rotation=(0, math.pi / 2, 0))
    hoop = bpy.context.active_object
    hoop.name = f"Earring_{side}"
    hoop.data.materials.append(mat_gold)
    tag_flat_shading(hoop)

# ─── 5. NECK & CREAM/NAVY BLAZER ───
bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.09, depth=0.22, location=(0, 0, 1.25))
neck = bpy.context.active_object
neck.name = "Priya_Neck"
neck.data.materials.append(mat_skin)
tag_flat_shading(neck)

# Cream Blazer Torso
bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.31, depth=0.66, location=(0, 0, 0.88))
chest = bpy.context.active_object
chest.name = "Priya_Torso"
chest.scale = (1.02, 0.88, 1.0)
bpy.ops.object.transform_apply(scale=True)
chest.data.materials.append(mat_cream)
tag_flat_shading(chest)

# Navy Lapels
for side, x, tilt in [("L", -0.10, 0.15), ("R", 0.10, -0.15)]:
    bpy.ops.mesh.primitive_cube_add(size=0.06, location=(x, -0.28, 0.95), rotation=(0, 0, tilt))
    lapel = bpy.context.active_object
    lapel.name = f"Lapel_{side}"
    lapel.scale = (1.0, 0.2, 4.5)
    bpy.ops.object.transform_apply(scale=True)
    lapel.data.materials.append(mat_navy)
    tag_flat_shading(lapel)

# Left Chest AA Crest
bpy.ops.mesh.primitive_cube_add(size=0.10, location=(-0.14, -0.28, 1.00), rotation=(0, 0, -0.25))
badge = bpy.context.active_object
badge.name = "AABadgeCrest"
badge.scale = (1.0, 0.2, 1.2)
bpy.ops.object.transform_apply(scale=True)
badge.data.materials.append(mat_gold)
tag_flat_shading(badge)

# ─── 6. ARMS & STUDY TABLET PROP ───
# Left Arm (Cream sleeve, holding tablet)
bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.07, depth=0.30, location=(-0.32, 0, 0.96), rotation=(-0.3, -0.1, 0.25))
l_arm = bpy.context.active_object
l_arm.name = "LeftUpperArm"
l_arm.data.materials.append(mat_navy)
tag_flat_shading(l_arm)

bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.06, depth=0.28, location=(-0.24, -0.20, 0.78), rotation=(-0.6, 0, 0.4))
l_forearm = bpy.context.active_object
l_forearm.name = "LeftForearm"
l_forearm.data.materials.append(mat_cream)
tag_flat_shading(l_forearm)

# Study Tablet Device
bpy.ops.mesh.primitive_cube_add(size=0.22, location=(-0.16, -0.34, 0.84), rotation=(-0.6, 0.2, -0.1))
tablet = bpy.context.active_object
tablet.name = "StudyTablet"
tablet.scale = (1.2, 0.08, 1.6)
bpy.ops.object.transform_apply(scale=True)
tablet.data.materials.append(mat_dark)
tag_flat_shading(tablet)

# Glowing Tablet Screen
bpy.ops.mesh.primitive_cube_add(size=0.20, location=(-0.16, -0.35, 0.845), rotation=(-0.6, 0.2, -0.1))
tablet_screen = bpy.context.active_object
tablet_screen.name = "TabletScreen"
tablet_screen.scale = (1.15, 0.03, 1.5)
bpy.ops.object.transform_apply(scale=True)
tablet_screen.data.materials.append(mat_screen)
tag_flat_shading(tablet_screen)

# Right Arm (Navy sleeve, gesturing confidently)
bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.07, depth=0.30, location=(0.32, 0, 0.96), rotation=(0.2, 0.1, -0.25))
r_arm = bpy.context.active_object
r_arm.name = "RightUpperArm"
r_arm.data.materials.append(mat_navy)
tag_flat_shading(r_arm)

bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.06, depth=0.28, location=(0.28, -0.20, 0.78), rotation=(0.4, 0, -0.2))
r_forearm = bpy.context.active_object
r_forearm.name = "RightForearm"
r_forearm.data.materials.append(mat_cream)
tag_flat_shading(r_forearm)

# ─── 7. EXPORT TO .GLB & SAVE .BLEND ───
script_dir = os.path.dirname(os.path.abspath(__file__))
video_root = os.path.abspath(os.path.join(script_dir, "../.."))

out_glb = os.path.join(video_root, "public", "models", "priya.glb")
out_blend = os.path.join(video_root, "models", "priya.blend")

print(f"Exporting GLB to: {out_glb}")
bpy.ops.export_scene.gltf(
    filepath=out_glb,
    export_format='GLB',
    use_selection=False,
    export_apply=False,
    export_materials='EXPORT',
    export_morph=True,
)

print(f"Saving .blend file to: {out_blend}")
bpy.ops.wm.save_as_mainfile(filepath=out_blend)

print("SUCCESS: Priya 3D low-poly model generated and exported!")

