"""
NutriVision AI - ITD Dataset Class Coverage & Visual Representation Analyzer
Analyzes the distribution, pixel volume, and occurrence frequency of all 50 food classes
in the ITD training set, extracts 3 representative visual examples per class, and builds
a master contact sheet.
"""

import os
import sys
import json
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional

# Ensure repository root is on Python module search path
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from tqdm import tqdm

from ml.constants import (
    NUM_CLASSES,
    CLASS_NAMES,
    ID2LABEL,
    PALETTE
)
from ml.dataset import get_base_id_from_image, get_base_id_from_mask


def create_highlighted_thumbnail(
    img: Image.Image,
    mask_arr: np.ndarray,
    target_cid: int,
    color: Tuple[int, int, int],
    size: Tuple[int, int] = (200, 200)
) -> Image.Image:
    """
    Creates a thumbnail of the image where the target food class is highlighted
    with an outline / tint so it's immediately recognizable.
    """
    img_rgb = img.convert("RGB")
    img_np = np.array(img_rgb, dtype=np.float32)
    
    mask_match = (mask_arr == target_cid)
    
    if np.any(mask_match):
        # Create a tinted overlay for the target class
        color_layer = np.zeros_like(img_np)
        color_layer[:] = color
        
        blended = img_np.copy()
        alpha = 0.40
        blended[mask_match] = (1.0 - alpha) * img_np[mask_match] + alpha * color_layer[mask_match]
        res_img = Image.fromarray(np.clip(blended, 0, 255).astype(np.uint8), mode="RGB")
    else:
        res_img = img_rgb
        
    return res_img.resize(size, Image.Resampling.BILINEAR)


def build_class_card(
    cid: int,
    cname: str,
    color: Tuple[int, int, int],
    img_count: int,
    total_imgs: int,
    total_pixels: int,
    sample_imgs: List[Tuple[Image.Image, np.ndarray]],
    card_w: int = 640,
    thumb_size: int = 180
) -> Image.Image:
    """
    Renders a clean visual card for a single food class containing:
    - Header banner with ID, class name, occurrence statistics
    - 3 representative thumbnails with target food highlighted
    """
    pct = (img_count / total_imgs) * 100.0
    header_h = 44
    content_h = thumb_size + 24
    card_h = header_h + content_h
    
    card = Image.new("RGB", (card_w, card_h), color=(255, 255, 255))
    draw = ImageDraw.Draw(card)
    
    # Outer border
    draw.rectangle([0, 0, card_w - 1, card_h - 1], outline=(226, 232, 240), width=1)
    
    # Header
    draw.rectangle([0, 0, card_w - 1, header_h], fill=(248, 250, 252))
    draw.line([(0, header_h), (card_w, header_h)], fill=(226, 232, 240), width=1)
    
    # Color swatch
    draw.rectangle([12, 12, 32, 32], fill=color, outline=(100, 116, 139), width=1)
    
    # Class title & stats
    draw.text((40, 10), f"Class {cid}: {cname}", fill=(15, 23, 42))
    draw.text((40, 26), f"Appears in: {img_count:,} / {total_imgs:,} train images ({pct:.1f}%) | {total_pixels:,} total px", fill=(100, 116, 139))
    
    # 3 Thumbnails
    spacing = 16
    start_x = (card_w - (3 * thumb_size + 2 * spacing)) // 2
    thumb_y = header_h + 12
    
    for i, (img, msk_arr) in enumerate(sample_imgs):
        thumb = create_highlighted_thumbnail(img, msk_arr, cid, color, size=(thumb_size, thumb_size))
        tx = start_x + i * (thumb_size + spacing)
        card.paste(thumb, (tx, thumb_y))
        draw.rectangle([tx, thumb_y, tx + thumb_size - 1, thumb_y + thumb_size - 1], outline=(203, 213, 225), width=1)
        
    return card


def build_master_contact_sheet(
    class_cards: List[Image.Image],
    total_train_images: int,
    output_path: Path
):
    """Combines all 50 class cards into a structured multi-column master contact sheet."""
    cols = 2
    rows = (len(class_cards) + cols - 1) // cols
    
    card_w, card_h = class_cards[0].size
    pad = 16
    banner_h = 80
    margin = 24
    
    sheet_w = margin * 2 + cols * card_w + (cols - 1) * pad
    sheet_h = margin * 2 + banner_h + rows * card_h + (rows - 1) * pad
    
    sheet = Image.new("RGB", (sheet_w, sheet_h), color=(241, 245, 249))
    draw = ImageDraw.Draw(sheet)
    
    # Top banner
    draw.rectangle([margin, margin, sheet_w - margin, margin + banner_h - 12], fill=(15, 23, 42))
    draw.text((margin + 24, margin + 16), "NutriVision AI - Indian Thali Dataset (ITD) 50-Class Visual Coverage", fill=(255, 255, 255))
    draw.text((margin + 24, margin + 42), f"Comprehensive Visual Reference & Frequency Distribution Across {total_train_images:,} Training Images", fill=(148, 163, 184))
    
    start_y = margin + banner_h
    for idx, card in enumerate(class_cards):
        r = idx // cols
        c = idx % cols
        x = margin + c * (card_w + pad)
        y = start_y + r * (card_h + pad)
        sheet.paste(card, (x, y))
        
    sheet.save(output_path, quality=95)
    print(f"Master contact sheet saved to: {output_path} ({sheet_w}x{sheet_h} px)")


def main():
    print("=" * 75)
    print("NutriVision AI - ITD Training Set Class Coverage Analyzer")
    print("=" * 75, flush=True)
    
    train_dir = REPO_ROOT / "data" / "raw" / "ITD" / "train"
    images_dir = train_dir / "images"
    masks_dir = train_dir / "masks"
    
    output_dir = REPO_ROOT / "ml" / "dataset_inspection" / "itd_class_coverage"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    rep_samples_dir = output_dir / "representative_samples"
    rep_samples_dir.mkdir(parents=True, exist_ok=True)
    
    if not images_dir.exists() or not masks_dir.exists():
        raise FileNotFoundError(f"Training dataset not found in {train_dir}")
        
    train_images = sorted([f for f in images_dir.iterdir() if f.is_file() and not f.name.startswith(".")])
    train_masks = sorted([f for f in masks_dir.iterdir() if f.is_file() and not f.name.startswith(".")])
    
    img_map = {get_base_id_from_image(f.name): f for f in train_images}
    msk_map = {get_base_id_from_mask(f.name): f for f in train_masks}
    
    common_ids = sorted(list(set(img_map.keys()) & set(msk_map.keys())))
    total_train_images = len(common_ids)
    print(f"Total training image-mask pairs found: {total_train_images:,}\n", flush=True)
    
    # Data structures for aggregation
    class_stats: Dict[int, Dict[str, Any]] = {
        cid: {
            "class_id": cid,
            "class_name": CLASS_NAMES.get(cid, f"Class {cid}"),
            "image_count": 0,
            "total_pixels": 0,
            "percentage_of_images": 0.0,
            "candidate_samples": []  # (img_path, mask_path, px_count)
        }
        for cid in range(1, NUM_CLASSES)
    }
    
    print("Scanning all training masks to compute precise class occurrences & pixel volumes...", flush=True)
    for base_id in tqdm(common_ids, desc="Analyzing training set"):
        img_path = img_map[base_id]
        mask_path = msk_map[base_id]
        
        with Image.open(mask_path) as mask:
            mask_arr = np.array(mask, dtype=np.int64)
            unique_ids, counts = np.unique(mask_arr, return_counts=True)
            
        for cid, cnt in zip(unique_ids, counts):
            if cid in class_stats and cnt > 0:
                class_stats[cid]["image_count"] += 1
                class_stats[cid]["total_pixels"] += int(cnt)
                class_stats[cid]["candidate_samples"].append((img_path, mask_path, int(cnt)))
                
    # Calculate percentage
    for cid in range(1, NUM_CLASSES):
        img_cnt = class_stats[cid]["image_count"]
        class_stats[cid]["percentage_of_images"] = (img_cnt / total_train_images) * 100.0
        # Sort candidate samples by pixel volume descending to select best representative examples
        class_stats[cid]["candidate_samples"].sort(key=lambda x: x[2], reverse=True)
        
    # Save 3 representative images per class and build class cards
    print("\nExtracting representative images & generating contact sheet cards for all 50 food classes...", flush=True)
    class_cards: List[Image.Image] = []
    
    for cid in range(1, NUM_CLASSES):
        cname = CLASS_NAMES.get(cid, f"Class {cid}")
        slug = cname.lower().replace(" ", "_").replace("&", "and").replace("-", "_")
        c_dir = rep_samples_dir / f"class_{cid:02d}_{slug}"
        c_dir.mkdir(parents=True, exist_ok=True)
        
        candidates = class_stats[cid]["candidate_samples"]
        selected_3 = candidates[:3]
        
        loaded_samples: List[Tuple[Image.Image, np.ndarray]] = []
        
        for idx, (img_p, mask_p, px_cnt) in enumerate(selected_3, 1):
            raw_img = Image.open(img_p).convert("RGB")
            raw_mask = Image.open(mask_p)
            msk_arr = np.array(raw_mask, dtype=np.int64)
            loaded_samples.append((raw_img, msk_arr))
            
            # Save standalone highlighted representative sample
            thumb = create_highlighted_thumbnail(raw_img, msk_arr, cid, PALETTE[cid], size=(512, 512))
            thumb_path = c_dir / f"example_{idx}_{img_p.stem}_px{px_cnt}.png"
            thumb.save(thumb_path)
            
        color = PALETTE[cid]
        card = build_class_card(
            cid=cid,
            cname=cname,
            color=color,
            img_count=class_stats[cid]["image_count"],
            total_imgs=total_train_images,
            total_pixels=class_stats[cid]["total_pixels"],
            sample_imgs=loaded_samples
        )
        class_cards.append(card)
        
    # Build master contact sheet
    contact_sheet_path = output_dir / "itd_50_classes_contact_sheet.png"
    build_master_contact_sheet(
        class_cards=class_cards,
        total_train_images=total_train_images,
        output_path=contact_sheet_path
    )
    
    # Build clean JSON report (without bulky Path objects)
    json_report = {
        "dataset_name": "Indian Thali Dataset (ITD)",
        "split": "train",
        "total_training_images": total_train_images,
        "total_food_classes": 50,
        "class_coverage": [
            {
                "class_id": cid,
                "class_name": class_stats[cid]["class_name"],
                "image_count": class_stats[cid]["image_count"],
                "percentage_of_training_images": round(class_stats[cid]["percentage_of_images"], 2),
                "total_pixels": class_stats[cid]["total_pixels"],
                "representative_images_saved": len(class_stats[cid]["candidate_samples"][:3])
            }
            for cid in range(1, NUM_CLASSES)
        ],
        "contact_sheet_path": str(contact_sheet_path)
    }
    
    json_path = output_dir / "class_coverage_report.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_report, f, indent=2)
        
    # Print formatted coverage summary table
    print("\n" + "=" * 80)
    print("ITD TRAINING SET - 50 FOOD CLASSES COVERAGE & FREQUENCY REPORT")
    print("=" * 80)
    print(f"{'ID':<4} | {'Food Class Name':<34} | {'Train Imgs':<10} | {'% of Train':<11} | {'Total Pixels':<14}")
    print("-" * 80)
    
    # Sort by percentage descending for console summary
    sorted_stats = sorted(class_stats.values(), key=lambda x: x["image_count"], reverse=True)
    for item in sorted_stats:
        print(f"{item['class_id']:<4} | {item['class_name']:<34} | {item['image_count']:<10,d} | {item['percentage_of_images']:>8.2f}% | {item['total_pixels']:<14,d}")
        
    print("=" * 80)
    print(f"Report JSON Saved       : {json_path}")
    print(f"Master Contact Sheet    : {contact_sheet_path}")
    print(f"Representative Samples  : {rep_samples_dir}")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
