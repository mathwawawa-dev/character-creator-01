import os
from PIL import Image, ImageDraw

def create_dummy_part(path, color, text):
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Draw a simple shape to represent the part
    if "body" in path:
        draw.rectangle([24, 32, 40, 60], fill=color, outline="black")
    elif "head" in path:
        draw.ellipse([20, 10, 44, 34], fill=color, outline="black")
    elif "weapon" in path:
        draw.rectangle([40, 20, 44, 50], fill=color, outline="black")
    
    img.save(path)
    print(f"Created dummy part: {path}")

base = r"C:\Users\user\Documents\안티그래비티_list\이미지생성01\인간형캐릭터생성02\assets"
create_dummy_part(os.path.join(base, "body", "body_01.png"), "#e1b899", "Body 1")
create_dummy_part(os.path.join(base, "head", "head_01.png"), "#ff9999", "Head 1")
create_dummy_part(os.path.join(base, "head", "head_02.png"), "#9999ff", "Head 2")
create_dummy_part(os.path.join(base, "weapon", "weapon_01.png"), "#cccccc", "Sword")
