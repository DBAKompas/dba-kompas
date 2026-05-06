from PIL import Image

# Doelafmeting voor og:image (Facebook, WhatsApp, LinkedIn standaard)
TARGET_W, TARGET_H = 1200, 630
BG = (26, 35, 50)  # #1a2332 huisstijl-donker

# Open bron-logo
src = Image.open("public/logo-white-v3-full.png").convert("RGBA")

# Schaal logo naar maximaal 70 procent van breedte en 70 procent van hoogte
max_w, max_h = int(TARGET_W * 0.70), int(TARGET_H * 0.70)
ratio = min(max_w / src.width, max_h / src.height)
new_w, new_h = int(src.width * ratio), int(src.height * ratio)
src_resized = src.resize((new_w, new_h), Image.LANCZOS)

# Maak achtergrond
canvas = Image.new("RGB", (TARGET_W, TARGET_H), BG)

# Plak logo gecentreerd
pos_x = (TARGET_W - new_w) // 2
pos_y = (TARGET_H - new_h) // 2
canvas.paste(src_resized, (pos_x, pos_y), src_resized)

# Opslaan
canvas.save("app/opengraph-image.png", "PNG", optimize=True)
canvas.save("app/twitter-image.png", "PNG", optimize=True)

print("OK: app/opengraph-image.png en app/twitter-image.png zijn 1200x630")
