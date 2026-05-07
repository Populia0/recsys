from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware 
import tempfile
import os
import uvicorn
from utils import convert_numpy_types
from colors_analyzer import extract_dominant_colors
from colors_classifier import find_closest_color
from recommendation_engine import build_recommendations

app = FastAPI(title='ColorTarget API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def analyze_image_colors(image_path):
    dominant_rgb = extract_dominant_colors(image_path, n_colors=5)
    
    candidates = []
    for rgb in dominant_rgb:
        closest = find_closest_color(rgb)
        candidates.append({
            'rgb': rgb,
            'hex': f'#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}',
            'name': closest['name'],
            'hex_ref': closest['hex'],
            'rules': closest['rules'],
            'delta_e': closest['delta_e']
        })
    
    unique_colors = {}
    for cand in candidates:
        name = cand['name']
        if name not in unique_colors:
            unique_colors[name] = cand

    result = list(unique_colors.values())[:3]
    
    return result

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(400, 'File must be an image')
    
    with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        colors_info = analyze_image_colors(tmp_path)
        colors_info = convert_numpy_types(colors_info)
        for color in colors_info:
            color['recommendations'] = build_recommendations(color.get('rules', []))
        return {"colors": colors_info}
    except Exception as e:
        raise HTTPException(500, f'Analysis error: {str(e)}')
    finally:
        os.unlink(tmp_path)

if __name__ == '__main__':
    uvicorn.run('main:app', host='0.0.0.0', port=8000, reload=True)