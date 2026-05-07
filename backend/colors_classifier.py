from colormath.color_objects import sRGBColor, LabColor
from colormath.color_conversions import convert_color
from colormath.color_diff import delta_e_cie2000
import json
import os

def load_reference_colors():
    base_path = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(base_path, 'rules.json'), 'r', encoding='utf-8') as f:
        data = json.load(f)
    ref = []
    for color in data['colors']:
        hex_code = color['hex'].lstrip('#')
        rgb = tuple(int(hex_code[i:i+2], 16) for i in (0, 2, 4))
        ref.append({
            'name': color['name'],
            'hex': color['hex'],
            'rgb': rgb,
            'rules': color['rules']
        })
    return ref

REFERENCE_COLORS = load_reference_colors()

def rgb_to_lab(rgb):
    r, g, b = [x / 255.0 for x in rgb]
    srgb = sRGBColor(r, g, b)
    lab = convert_color(srgb, LabColor)
    return lab

def find_closest_color(rgb):
    lab_target = rgb_to_lab(rgb)
    best = None
    best_distance = float('inf')
    for ref in REFERENCE_COLORS:
        lab_ref = rgb_to_lab(ref['rgb'])
        distance = delta_e_cie2000(lab_target, lab_ref)
        if distance < best_distance:
            best_distance = distance
            best = ref.copy()
    best['delta_e'] = best_distance
    return best