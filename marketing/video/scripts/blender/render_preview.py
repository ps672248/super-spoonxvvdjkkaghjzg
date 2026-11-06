import os
import math
import bpy

# Open arjun.blend
script_dir = os.path.dirname(os.path.abspath(__file__))
video_root = os.path.abspath(os.path.join(script_dir, "../.."))
blend_file = os.path.join(video_root, "models", "arjun.blend")
out_img = os.path.join(video_root, "output", "blender_arjun_render.jpg")

bpy.ops.wm.open_mainfile(filepath=blend_file)

# Add Camera (Portrait 9:16)
bpy.context.scene.render.resolution_x = 1080
bpy.context.scene.render.resolution_y = 1920
bpy.context.scene.render.image_settings.file_format = 'JPEG'
bpy.context.scene.render.filepath = out_img

# Set render engine to EEVEE
bpy.context.scene.render.engine = 'BLENDER_EEVEE'

# Camera setup (3/4 cinematic portrait)
cam_data = bpy.data.cameras.new("RenderCam")
cam_data.lens = 50
cam_obj = bpy.data.objects.new("RenderCam", cam_data)
cam_obj.location = (0.75, -2.1, 1.45)
cam_obj.rotation_euler = (math.radians(82), 0, math.radians(20))
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

# 3-Point Studio Lighting
# Key light (warm)
light_key_data = bpy.data.lights.new("KeyLight", type='POINT')
light_key_data.energy = 350
light_key_data.color = (1.0, 0.95, 0.85)
light_key = bpy.data.objects.new("KeyLight", light_key_data)
light_key.location = (1.8, -1.5, 2.4)
bpy.context.scene.collection.objects.link(light_key)

# Fill light (cool blue)
light_fill_data = bpy.data.lights.new("FillLight", type='POINT')
light_fill_data.energy = 120
light_fill_data.color = (0.2, 0.6, 1.0)
light_fill = bpy.data.objects.new("FillLight", light_fill_data)
light_fill.location = (-1.8, -1.2, 1.6)
bpy.context.scene.collection.objects.link(light_fill)

# Rim light (cyan edge backlight)
light_rim_data = bpy.data.lights.new("RimLight", type='POINT')
light_rim_data.energy = 500
light_rim_data.color = (0.1, 0.8, 1.0)
light_rim = bpy.data.objects.new("RimLight", light_rim_data)
light_rim.location = (0, 1.8, 2.2)
bpy.context.scene.collection.objects.link(light_rim)

# Render frame
print("Rendering Arjun directly in Blender EEVEE...")
bpy.ops.render.render(write_still=True)
print(f"Rendered Blender frame saved to: {out_img}")
