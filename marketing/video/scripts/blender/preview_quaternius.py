import os
import math
import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)

script_dir = os.path.dirname(os.path.abspath(__file__))
video_root = os.path.abspath(os.path.join(script_dir, "../.."))
glb_file = os.path.join(video_root, "public", "models", "quaternius", "Casual_Male.glb")
out_img = os.path.join(video_root, "output", "quaternius_male_render.jpg")

bpy.ops.import_scene.gltf(filepath=glb_file)

# Set resolution
bpy.context.scene.render.resolution_x = 1080
bpy.context.scene.render.resolution_y = 1920
bpy.context.scene.render.image_settings.file_format = 'JPEG'
bpy.context.scene.render.filepath = out_img
bpy.context.scene.render.engine = 'BLENDER_EEVEE'

# Camera
cam_data = bpy.data.cameras.new("RenderCam")
cam_data.lens = 45
cam_obj = bpy.data.objects.new("RenderCam", cam_data)
cam_obj.location = (0.5, -2.6, 1.2)
cam_obj.rotation_euler = (math.radians(82), 0, math.radians(12))
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

# Lights
light_key_data = bpy.data.lights.new("KeyLight", type='POINT')
light_key_data.energy = 400
light_key_data.color = (1.0, 0.95, 0.88)
light_key = bpy.data.objects.new("KeyLight", light_key_data)
light_key.location = (1.5, -1.8, 2.2)
bpy.context.scene.collection.objects.link(light_key)

light_fill_data = bpy.data.lights.new("FillLight", type='POINT')
light_fill_data.energy = 150
light_fill_data.color = (0.3, 0.7, 1.0)
light_fill = bpy.data.objects.new("FillLight", light_fill_data)
light_fill.location = (-1.5, -1.2, 1.4)
bpy.context.scene.collection.objects.link(light_fill)

light_rim_data = bpy.data.lights.new("RimLight", type='POINT')
light_rim_data.energy = 450
light_rim_data.color = (0.1, 0.85, 1.0)
light_rim = bpy.data.objects.new("RimLight", light_rim_data)
light_rim.location = (0, 1.5, 2.0)
bpy.context.scene.collection.objects.link(light_rim)

# Render
bpy.ops.render.render(write_still=True)
print(f"Quaternius render saved to: {out_img}")

