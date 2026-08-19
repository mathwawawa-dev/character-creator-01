import os
from PIL import Image

output_dir = r"C:\Users\user\Documents\안티그래비티_list\이미지생성01\creatures"
os.makedirs(output_dir, exist_ok=True)

mockup_img_path = r"C:\Users\user\.gemini\antigravity\brain\f76770a2-c6ba-4494-a003-6bf988a38ab5\pixel_character_creator_mockup_1786907763043.jpg"
mockup_img = Image.open(mockup_img_path)
MW, MH = mockup_img.size

# Extract mockup top-right heads:
# 1) Spiky Grass Blob
# 2) Antenna Alien Blob
# 3) Fluffy Cloud Green Blob
# and left mini blob (16x16)

def extract_clean_png(box, out_name):
    cropped = mockup_img.crop(box).convert("RGBA")
    w, h = cropped.size
    pixels = cropped.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            # UI background colors (dark slate, orange borders, brown)
            if (r < 60 and g < 65 and b < 80 and max(r,g,b)-min(r,g,b) <= 25) or (r > 180 and g < 120 and b < 50):
                pixels[x, y] = (0, 0, 0, 0)
    bbox = cropped.getbbox()
    if bbox:
        cropped = cropped.crop(bbox)
    out_path = os.path.join(output_dir, f"{out_name}.png")
    cropped.save(out_path, "PNG")
    print(f"Saved: {out_name}.png ({cropped.size[0]}x{cropped.size[1]})")

# Head 2: Spiky
extract_clean_png((int(MW*0.748), int(MH*0.215), int(MW*0.81), int(MH*0.30)), "11_spiky_blob")
# Head 3: Antenna
extract_clean_png((int(MW*0.812), int(MH*0.215), int(MW*0.875), int(MH*0.30)), "12_antenna_blob")
# Head 4: Fluffy
extract_clean_png((int(MW*0.878), int(MH*0.215), int(MW*0.94), int(MH*0.30)), "13_fluffy_blob")
# Mini full blob
extract_clean_png((int(MW*0.155), int(MH*0.55), int(MW*0.23), int(MH*0.68)), "10_mini_blob")

print("Mockup sub-creatures extracted!")
