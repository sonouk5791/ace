import os
from PIL import Image, ImageOps
import numpy as np

out_dir = 'assets/images/kongi-parts/rig'
os.makedirs(out_dir, exist_ok=True)

orig = Image.open('assets/images/friend-kongi.png').convert('RGBA')
w, h = orig.size
arr = np.array(orig)

# 1. Symmetric natural left arm (mirrored from the natural hanging right arm)
right_arm = Image.open(f'{out_dir}/kongi_arm_right.png')
# Flip horizontally
arm_mirrored = ImageOps.mirror(right_arm)
# When flipped horizontally across width 1254:
# Right arm bbox: (760, 660, 909, 1020)
# Mirrored bbox: (1254-909=345, 660, 1254-760=494, 1020)
# That lands exactly on the viewer's left shoulder (X ~ 420..440)!
arm_mirrored.save(f'{out_dir}/kongi_arm_left_straight.png')
print("Mirrored straight left arm saved, bbox:", arm_mirrored.getbbox())

# 2. Eye blink overlay (authentic 반달 smiling closed eyes behind glasses)
# Eyes center: Left eye center (510, 435), Right eye center (745, 435)
blink_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
blink_draw = Image.new('RGBA', (w, h), (0, 0, 0, 0))
# Create clean closed eyelids / smile arc for eyes
import math
for eye_cx, eye_cy in [(512, 438), (742, 438)]:
    # Cover pupil area with soft cream fur color from surrounding cheek (512, 480)
    # Fur color: (253, 246, 238)
    for y in range(eye_cy - 48, eye_cy + 48):
        for x in range(eye_cx - 52, eye_cx + 52):
            dx = (x - eye_cx) / 50.0
            dy = (y - eye_cy) / 46.0
            if dx*dx + dy*dy <= 1.0:
                # keep glasses frame intact (glasses frame is dark grey: R<70, G<70, B<70)
                orig_r, orig_g, orig_b, orig_a = arr[y, x]
                if not (orig_r < 80 and orig_g < 80 and orig_b < 80 and orig_a > 200):
                    # soft cream fur
                    blink_img.putpixel((x, y), (252, 245, 238, 255))
    
    # Draw dark brown curved smile line for the closed eyelid
    for angle_deg in range(25, 155):
        rad = math.radians(angle_deg)
        arc_x = int(eye_cx + 42 * math.cos(rad))
        arc_y = int(eye_cy + 10 - 24 * math.sin(rad))
        for ox in (-1, 0, 1):
            for oy in (-1, 0, 1):
                if 0 <= arc_x+ox < w and 0 <= arc_y+oy < h:
                    blink_img.putpixel((arc_x+ox, arc_y+oy), (68, 48, 38, 255))

blink_img.save(f'{out_dir}/kongi_eyes_blink.png')
print("Blink overlay saved, bbox:", blink_img.getbbox())

# 3. Mouth overlays: Exhale ('후~') and vowels ('아', '어', '오', '우', '이')
# Original mouth is at X: 609..654, Y: 539..592, center: (632, 565)
mcx, mcy = 632, 566

# Exhale mouth: soft round '후~' mouth with gentle opening
exhale_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
for y in range(mcy - 28, mcy + 28):
    for x in range(mcx - 30, mcx + 30):
        dx = (x - mcx) / 22.0
        dy = (y - mcy) / 20.0
        dist = dx*dx + dy*dy
        if dist <= 1.0:
            # outer fur blend
            exhale_img.putpixel((x, y), (253, 246, 238, 255))
        if dist <= 0.65:
            # dark inner mouth
            exhale_img.putpixel((x, y), (90, 32, 28, 255))
        if dist <= 0.35:
            # pink tongue / soft highlight
            exhale_img.putpixel((x, y), (255, 120, 140, 255))

exhale_img.save(f'{out_dir}/kongi_mouth_exhale.png')
print("Exhale mouth saved, bbox:", exhale_img.getbbox())

# Talk '아' (Open mouth)
mouth_a = Image.new('RGBA', (w, h), (0, 0, 0, 0))
for y in range(mcy - 30, mcy + 30):
    for x in range(mcx - 32, mcx + 32):
        dx = (x - mcx) / 26.0
        dy = (y - mcy) / 24.0
        dist = dx*dx + dy*dy
        if dist <= 1.0:
            mouth_a.putpixel((x, y), (253, 246, 238, 255))
        if dist <= 0.75:
            mouth_a.putpixel((x, y), (85, 28, 24, 255))
        if dist <= 0.45 and dy > -0.1:
            mouth_a.putpixel((x, y), (255, 115, 135, 255))
mouth_a.save(f'{out_dir}/kongi_mouth_a.png')

# Talk '오' / '우' (Narrow round mouth)
mouth_o = Image.new('RGBA', (w, h), (0, 0, 0, 0))
for y in range(mcy - 24, mcy + 24):
    for x in range(mcx - 22, mcx + 22):
        dx = (x - mcx) / 18.0
        dy = (y - mcy) / 19.0
        dist = dx*dx + dy*dy
        if dist <= 1.0:
            mouth_o.putpixel((x, y), (253, 246, 238, 255))
        if dist <= 0.65:
            mouth_o.putpixel((x, y), (85, 28, 24, 255))
        if dist <= 0.30:
            mouth_o.putpixel((x, y), (255, 115, 135, 255))
mouth_o.save(f'{out_dir}/kongi_mouth_o.png')

# Talk '이' (Wide grin mouth)
mouth_i = Image.new('RGBA', (w, h), (0, 0, 0, 0))
for y in range(mcy - 20, mcy + 20):
    for x in range(mcx - 34, mcx + 34):
        dx = (x - mcx) / 30.0
        dy = (y - mcy) / 14.0
        dist = dx*dx + dy*dy
        if dist <= 1.0:
            mouth_i.putpixel((x, y), (253, 246, 238, 255))
        if dist <= 0.6:
            mouth_i.putpixel((x, y), (95, 35, 30, 255))
        if dist <= 0.35 and abs(dy) < 0.3:
            # white teeth line
            mouth_i.putpixel((x, y), (255, 255, 255, 255))
mouth_i.save(f'{out_dir}/kongi_mouth_i.png')

print("All mouth visemes saved successfully.")
