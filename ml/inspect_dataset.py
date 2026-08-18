"""
NutriVision AI - Machine Learning Dataset Inspector
Inspects the Indian Thali Dataset (ITD) located at data/raw/ITD.
Checks file counts, pairings, formats, dimensions, unique label IDs, class counts, and file integrity.
"""

import os
import sys
import json
from pathlib import Path
from typing import Dict, Any, List, Set, Tuple
from collections import Counter
from PIL import Image

def get_base_id_from_image(filename: str) -> str:
    """Extracts base ID from image filename (e.g. '20250616_130811_leftImg8bit.jpg' -> '20250616_130811')."""
    stem = Path(filename).stem
    if "_leftImg8bit" in stem:
        return stem.replace("_leftImg8bit", "")
    return stem

def get_base_id_from_mask(filename: str) -> str:
    """Extracts base ID from mask filename (e.g. '20250616_130811_gtFine_labelIds.png' -> '20250616_130811')."""
    stem = Path(filename).stem
    if "_gtFine_labelIds" in stem:
        return stem.replace("_gtFine_labelIds", "")
    elif "_mask" in stem:
        return stem.replace("_mask", "")
    return stem

def inspect_split(split_name: str, split_dir: Path) -> Dict[str, Any]:
    images_dir = split_dir / "images"
    masks_dir = split_dir / "masks"

    if not images_dir.exists():
        return {"error": f"Images directory not found at {images_dir}"}
    if not masks_dir.exists():
        return {"error": f"Masks directory not found at {masks_dir}"}

    image_files = sorted([f for f in images_dir.iterdir() if f.is_file() and not f.name.startswith(".")])
    mask_files = sorted([f for f in masks_dir.iterdir() if f.is_file() and not f.name.startswith(".")])

    image_map = {get_base_id_from_image(f.name): f for f in image_files}
    mask_map = {get_base_id_from_mask(f.name): f for f in mask_files}

    missing_masks = [f.name for base_id, f in image_map.items() if base_id not in mask_map]
    orphaned_masks = [f.name for base_id, f in mask_map.items() if base_id not in image_map]

    image_formats = Counter()
    image_modes = Counter()
    image_sizes = Counter()
    corrupted_images = []

    for img_path in image_files:
        try:
            with Image.open(img_path) as img:
                image_formats[img.format] += 1
                image_modes[img.mode] += 1
                image_sizes[img.size] += 1
        except Exception as e:
            corrupted_images.append({"file": img_path.name, "error": str(e)})

    mask_formats = Counter()
    mask_modes = Counter()
    mask_sizes = Counter()
    unique_label_ids: Set[int] = set()
    label_id_pixel_counts = Counter()
    corrupted_masks = []
    dimension_mismatches = []

    for base_id, img_path in image_map.items():
        if base_id in mask_map:
            mask_path = mask_map[base_id]
            try:
                with Image.open(img_path) as img:
                    img_size = img.size
                with Image.open(mask_path) as msk:
                    mask_formats[msk.format] += 1
                    mask_modes[msk.mode] += 1
                    mask_sizes[msk.size] += 1
                    if img_size != msk.size:
                        dimension_mismatches.append({
                            "base_id": base_id,
                            "image_size": img_size,
                            "mask_size": msk.size
                        })
                    
                    colors = msk.getcolors(maxcolors=1000)
                    if colors:
                        for count, val in colors:
                            if isinstance(val, tuple):
                                val = val[0]
                            unique_label_ids.add(int(val))
                            label_id_pixel_counts[int(val)] += count
                    else:
                        extrema = msk.getextrema()
                        if isinstance(extrema[0], tuple):
                            for v in extrema:
                                unique_label_ids.add(int(v[0]))
                        else:
                            unique_label_ids.add(int(extrema[0]))
                            unique_label_ids.add(int(extrema[1]))
            except Exception as e:
                corrupted_masks.append({"file": mask_path.name, "error": str(e)})

    return {
        "split": split_name,
        "total_images": len(image_files),
        "total_masks": len(mask_files),
        "paired_samples": len(image_files) - len(missing_masks),
        "missing_masks_count": len(missing_masks),
        "missing_masks_samples": missing_masks[:5],
        "orphaned_masks_count": len(orphaned_masks),
        "orphaned_masks_samples": orphaned_masks[:5],
        "image_formats": dict(image_formats),
        "image_modes": dict(image_modes),
        "image_sizes": {f"{w}x{h}": c for (w, h), c in image_sizes.items()},
        "mask_formats": dict(mask_formats),
        "mask_modes": dict(mask_modes),
        "mask_sizes": {f"{w}x{h}": c for (w, h), c in mask_sizes.items()},
        "unique_label_ids": sorted(list(unique_label_ids)),
        "num_unique_label_ids": len(unique_label_ids),
        "label_pixel_distribution_summary": {k: label_id_pixel_counts[k] for k in sorted(label_id_pixel_counts.keys())},
        "corrupted_images": corrupted_images,
        "corrupted_masks": corrupted_masks,
        "dimension_mismatches": dimension_mismatches
    }

def main():
    repo_root = Path(__file__).resolve().parent.parent
    itd_dir = repo_root / "data" / "raw" / "ITD"
    
    print(f"="*70)
    print(f"NutriVision AI - Indian Thali Dataset (ITD) Inspector")
    print(f"Dataset Path: {itd_dir}")
    print(f"="*70, flush=True)

    if not itd_dir.exists():
        print(f"ERROR: ITD directory not found at {itd_dir}", flush=True)
        sys.exit(1)

    splits = ["train", "test"]
    overall_report = {}
    all_unique_labels = set()

    for split in splits:
        split_path = itd_dir / split
        if not split_path.exists():
            print(f"WARNING: Split '{split}' not found at {split_path}", flush=True)
            continue
        print(f"\n--- Inspecting '{split}' split ---", flush=True)
        report = inspect_split(split, split_path)
        overall_report[split] = report
        
        print(f"Images: {report['total_images']}, Masks: {report['total_masks']}", flush=True)
        print(f"Paired: {report['paired_samples']}, Missing masks: {report['missing_masks_count']}, Orphaned masks: {report['orphaned_masks_count']}", flush=True)
        print(f"Image Formats: {report['image_formats']}, Modes: {report['image_modes']}", flush=True)
        print(f"Image Sizes (WxH): {report['image_sizes']}", flush=True)
        print(f"Mask Formats: {report['mask_formats']}, Modes: {report['mask_modes']}", flush=True)
        print(f"Mask Sizes (WxH): {report['mask_sizes']}", flush=True)
        print(f"Unique Label IDs ({report['num_unique_label_ids']}): {report['unique_label_ids']}", flush=True)
        print(f"Corrupted Images: {len(report['corrupted_images'])}, Corrupted Masks: {len(report['corrupted_masks'])}", flush=True)
        print(f"Dimension Mismatches: {len(report['dimension_mismatches'])}", flush=True)

        for lbl in report.get("unique_label_ids", []):
            all_unique_labels.add(lbl)

    output_json = repo_root / "ml" / "dataset_inspection_report.json"
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(overall_report, f, indent=2)
    print(f"\nInspection report saved to: {output_json}", flush=True)
    sorted_labels = sorted(list(all_unique_labels))
    print(f"Total distinct label IDs across full dataset: {sorted_labels} (Count: {len(sorted_labels)})", flush=True)

if __name__ == "__main__":
    main()
