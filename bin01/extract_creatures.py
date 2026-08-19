import os
from PIL import Image

output_dir = r"C:\Users\user\Documents\안티그래비티_list\이미지생성01\creatures"
os.makedirs(output_dir, exist_ok=True)

types_img_path = r"C:\Users\user\.gemini\antigravity\brain\f76770a2-c6ba-4494-a003-6bf988a38ab5\pixel_creature_type_examples_1786907783113.jpg"
mockup_img_path = r"C:\Users\user\.gemini\antigravity\brain\f76770a2-c6ba-4494-a003-6bf988a38ab5\pixel_character_creator_mockup_1786907763043.jpg"

def is_background(r, g, b):
    # Dark card background, dark borders, dark background canvas
    # Check neutral/dark tones
    max_c = max(r, g, b)
    min_c = min(r, g, b)
    diff = max_c - min_c
    if max_c < 100 and diff <= 28:
        return True
    return False

def make_transparent_creature(img, box, out_name):
    cropped = img.crop(box).convert("RGBA")
    w, h = cropped.size
    pixels = cropped.load()
    
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if is_background(r, g, b):
                pixels[x, y] = (0, 0, 0, 0)
            
    bbox = cropped.getbbox()
    if bbox:
        cropped = cropped.crop(bbox)
        
    out_path = os.path.join(output_dir, f"{out_name}.png")
    cropped.save(out_path, "PNG")
    print(f"Saved: {out_name}.png ({cropped.size[0]}x{cropped.size[1]})")

types_img = Image.open(types_img_path)

# Precise inner creature boxes inside cards:
# Col 0: 345 to 535
# Col 1: 600 to 790
# Col 2: 855 to 1045
# Row 0: 35 to 205
# Row 1: 280 to 450
# Row 2: 530 to 700

card_boxes = [
    # Fire
    ((345, 35, 535, 205), "01_fire_spirit"),
    # Water
    ((600, 35, 790, 205), "02_water_slime"),
    # Grass
    ((855, 35, 1045, 205), "03_grass_sprout"),
    
    # Electric
    ((345, 280, 535, 450), "04_electric_bolt"),
    # Rock
    ((600, 280, 790, 450), "05_rock_golem"),
    # Ice
    ((855, 280, 1045, 450), "06_ice_crystal"),
    
    # Dark
    ((345, 530, 535, 700), "07_dark_ghost"),
    # Light
    ((600, 530, 790, 700), "08_light_fairy"),
    # Wind
    ((855, 530, 1045, 700), "09_wind_bird"),
]

for box, cid in card_boxes:
    make_transparent_creature(types_img, box, cid)

# Cute Blob from mockup
mockup_img = Image.open(mockup_img_path)
MW, MH = mockup_img.size
blob_box = (int(MW * 0.44), int(MH * 0.35), int(MW * 0.56), int(MH * 0.59))

def make_blob_transparent():
    cropped = mockup_img.crop(blob_box).convert("RGBA")
    w, h = cropped.size
    pixels = cropped.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            # Slate blue background of mockup center box
            if (abs(r - 27) <= 24 and abs(g - 33) <= 24 and abs(b - 56) <= 24) or (r < 60 and g < 65 and b < 85 and max(r,g,b)-min(r,g,b) <= 26):
                pixels[x, y] = (0, 0, 0, 0)
    bbox = cropped.getbbox()
    if bbox:
        cropped = cropped.crop(bbox)
    out_path = os.path.join(output_dir, "00_cute_blob.png")
    cropped.save(out_path, "PNG")
    print(f"Saved: 00_cute_blob.png ({cropped.size[0]}x{cropped.size[1]})")

make_blob_transparent()
print("Crystal clean transparent PNGs created!")
