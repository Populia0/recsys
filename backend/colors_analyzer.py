from sklearn.cluster import KMeans
from PIL import Image
import numpy as np

def extract_dominant_colors(image_path, n_colors=5):
    with Image.open(image_path) as img:
        if img.mode != 'RGB':
            img = img.convert('RGB')
        pixels = np.array(img).reshape(-1, 3).astype(np.float32)
    kmeans = KMeans(n_clusters=n_colors, random_state=42, n_init=10)
    kmeans.fit(pixels)
    colors = kmeans.cluster_centers_.astype(int)
    labels = kmeans.labels_
    counts = np.bincount(labels)
    sorted_indices = np.argsort(counts)[::-1]
    colors = colors[sorted_indices]
    return [tuple(c) for c in colors]