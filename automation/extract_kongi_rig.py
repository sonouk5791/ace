import os
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

os.makedirs('assets/images/kongi-parts/rig', exist_ok=True)

# Load original authentic Kongi
orig = Image.open('assets/images/friend-kongi.png').convert('RGBA')
w, h = orig.size
arr = np.array(orig)

# 1. HEAD (Y: 0 to 685)
# Neck boundary is around Y=680 where collar starts
head_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
head_mask = np.zeros((h, w), dtype=np.uint8)

# Head mask includes hair, ears, face, glasses down to collar
# Create smooth mask down to Y=685
for y in range(h):
    for x in range(w):
        if arr[y, x, 3] > 10:
            if y < 670:
                head_mask[y, x] = arr[y, x, 3]
            elif y <= 690:
                # Smooth curve along chin/collar
                dist_from_center = abs(x - 627)
                chin_y = 670 + int(15 * (1.0 - (dist_from_center / 300.0) ** 2)) if dist_from_center < 300 else 665
                if y <= chin_y:
                    head_mask[y, x] = arr[y, x, 3]

head_arr = arr.copy()
head_arr[:, :, 3] = head_mask
head_img = Image.fromarray(head_arr)
head_img.save('assets/images/kongi-parts/rig/kongi_head.png')
print("Head saved, bbox:", head_img.getbbox())

# 2. TORSO (Y: 660 to 980)
# Torso body with collar, zipper, heart, jacket
torso_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
torso_mask = np.zeros((h, w), dtype=np.uint8)

# Center body area (excluding outer arms)
for y in range(650, 1000):
    for x in range(w):
        if arr[y, x, 3] > 10:
            # Exclude viewer's right arm (x > 790) and viewer's left arm (x < 460)
            if 460 <= x <= 790:
                torso_mask[y, x] = arr[y, x, 3]

# Inpainting under the front right paw (which sits at x: 420..560, y: 680..800)
# Replace paw with jacket texture/color so when arm moves away, jacket underneath is clean
torso_arr = arr.copy()
torso_arr[:, :, 3] = torso_mask

# Fill behind left fist (X: 470..560, Y: 680..780)
# The jacket here is white/cream on inner panel (x > 530) and yellow on outer (x < 530)
for y in range(680, 780):
    for x in range(470, 560):
        if torso_mask[y, x] > 0:
            # check if it was paw color (light cream/fur)
            r, g, b, a = arr[y, x]
            if r > 230 and g > 220 and b > 210: # paw fur color
                if x < 530:
                    # yellow jacket color sample from (500, 820)
                    torso_arr[y, x, :3] = [240, 195, 25] # warm yellow
                else:
                    # white panel sample from (560, 800)
                    torso_arr[y, x, :3] = [248, 248, 246]

torso_img = Image.fromarray(torso_arr)
torso_img.save('assets/images/kongi-parts/rig/kongi_torso.png')
print("Torso saved, bbox:", torso_img.getbbox())

# 3. LEFT ARM (Viewer's left, Kongi's right arm: X 260..560, Y 660..860)
arm_left_mask = np.zeros((h, w), dtype=np.uint8)
for y in range(660, 860):
    for x in range(250, 560):
        if arr[y, x, 3] > 10:
            # Only include arm and paw
            if x < 470 or (x < 560 and y < 800 and not (x > 530 and y > 760)):
                arm_left_mask[y, x] = arr[y, x, 3]

arm_left_arr = arr.copy()
arm_left_arr[:, :, 3] = arm_left_mask
arm_left_img = Image.fromarray(arm_left_arr)
arm_left_img.save('assets/images/kongi-parts/rig/kongi_arm_left.png')
print("Left Arm saved, bbox:", arm_left_img.getbbox())

# 4. RIGHT ARM (Viewer's right, Kongi's left arm: X 760..950, Y 660..1020)
arm_right_mask = np.zeros((h, w), dtype=np.uint8)
for y in range(660, 1020):
    for x in range(760, 950):
        if arr[y, x, 3] > 10:
            arm_right_mask[y, x] = arr[y, x, 3]

arm_right_arr = arr.copy()
arm_right_arr[:, :, 3] = arm_right_mask
arm_right_img = Image.fromarray(arm_right_arr)
arm_right_img.save('assets/images/kongi-parts/rig/kongi_arm_right.png')
print("Right Arm saved, bbox:", arm_right_img.getbbox())

# 5. HIPS & SEAT (Yellow pants base, Y: 950..1060, X: 450..800)
hips_mask = np.zeros((h, w), dtype=np.uint8)
for y in range(950, 1060):
    for x in range(450, 800):
        if arr[y, x, 3] > 10:
            hips_mask[y, x] = arr[y, x, 3]

hips_arr = arr.copy()
hips_arr[:, :, 3] = hips_mask
hips_img = Image.fromarray(hips_arr)
hips_img.save('assets/images/kongi-parts/rig/kongi_hips.png')
print("Hips saved, bbox:", hips_img.getbbox())

# 6. LEFT LEG (Viewer's left: X 440..620, Y 1040..1200)
leg_left_mask = np.zeros((h, w), dtype=np.uint8)
for y in range(1040, 1205):
    for x in range(440, 620):
        if arr[y, x, 3] > 10:
            leg_left_mask[y, x] = arr[y, x, 3]

leg_left_arr = arr.copy()
leg_left_arr[:, :, 3] = leg_left_mask
leg_left_img = Image.fromarray(leg_left_arr)
leg_left_img.save('assets/images/kongi-parts/rig/kongi_leg_left.png')
print("Left Leg saved, bbox:", leg_left_img.getbbox())

# 7. RIGHT LEG (Viewer's right: X 620..800, Y 1040..1200)
leg_right_mask = np.zeros((h, w), dtype=np.uint8)
for y in range(1040, 1205):
    for x in range(620, 800):
        if arr[y, x, 3] > 10:
            leg_right_mask[y, x] = arr[y, x, 3]

leg_right_arr = arr.copy()
leg_right_arr[:, :, 3] = leg_right_mask
leg_right_img = Image.fromarray(leg_right_arr)
leg_right_img.save('assets/images/kongi-parts/rig/kongi_leg_right.png')
print("Right Leg saved, bbox:", leg_right_img.getbbox())
