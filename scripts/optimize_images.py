# -*- coding: utf-8 -*-
"""
OPC AI PROFITLAB — High Performance Image Optimizer
Converts large PNG/JPEG assets to modern WebP with 80-95% compression ratio.
"""
import sys, io
from pathlib import Path
from PIL import Image

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = Path(__file__).resolve().parents[1]
ASSETS_DIR = ROOT / 'public' / 'assets'

def optimize_asset(img_path: Path):
    if img_path.suffix.lower() not in ['.png', '.jpg', '.jpeg']:
        return None
    
    stem = img_path.stem
    # Standardize safe filename for web
    safe_name = stem.replace(' ', '-').replace('$', 'usd')
    out_webp = ASSETS_DIR / f"{safe_name}.webp"
    
    try:
        with Image.open(img_path) as im:
            orig_size = img_path.stat().st_size / 1024
            width, height = im.size
            
            # Optional: resize if ridiculously huge (>1600px width)
            if width > 1600:
                new_w = 1600
                new_h = int(height * (1600 / width))
                im = im.resize((new_w, new_h), Image.Resampling.LANCZOS)
                width, height = new_w, new_h
            
            # Save WebP
            if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
                im.save(out_webp, 'WEBP', quality=84, method=6)
            else:
                rgb_im = im.convert('RGB')
                rgb_im.save(out_webp, 'WEBP', quality=84, method=6)
                
            new_size = out_webp.stat().st_size / 1024
            ratio = (1 - new_size / orig_size) * 100
            print(f"✔ Optimized {img_path.name} -> {out_webp.name}: {orig_size:.1f}KB -> {new_size:.1f}KB (-{ratio:.1f}%)")
            return out_webp
    except Exception as e:
        print(f"✘ Error optimizing {img_path.name}: {e}")
        return None

def create_og_image():
    """Create dedicated 1200x630 OpenGraph Banner for go.breaths.live"""
    og_png = ASSETS_DIR / 'og-preview.png'
    og_webp = ASSETS_DIR / 'og-preview.webp'
    
    # Use existing BANNER.webp or victor/lucky as base
    banner_path = ASSETS_DIR / 'BANNER.webp'
    if banner_path.is_file():
        try:
            with Image.open(banner_path) as im:
                # Crop or resize to 1200x630
                im_rgb = im.convert('RGB')
                # Resize keeping cover
                target_ratio = 1200 / 630
                w, h = im_rgb.size
                current_ratio = w / h
                if current_ratio > target_ratio:
                    new_w = int(h * target_ratio)
                    left = (w - new_w) // 2
                    im_cropped = im_rgb.crop((left, 0, left + new_w, h))
                else:
                    new_h = int(w / target_ratio)
                    top = (h - new_h) // 2
                    im_cropped = im_rgb.crop((0, top, w, top + new_h))
                
                final_og = im_cropped.resize((1200, 630), Image.Resampling.LANCZOS)
                final_og.save(og_webp, 'WEBP', quality=88)
                final_og.save(og_png, 'PNG', optimize=True)
                print(f"✔ Generated OpenGraph Social Banners (1200x630): {og_webp.name}, {og_png.name}")
        except Exception as e:
            print(f"✘ Error creating OG banner: {e}")

if __name__ == '__main__':
    print("🚀 Starting WebP conversion in", ASSETS_DIR)
    for f in list(ASSETS_DIR.glob('*')):
        if f.suffix.lower() in ['.png', '.jpg', '.jpeg']:
            optimize_asset(f)
    create_og_image()
    print("✨ Image optimization finished!")
