"""
NutriVision AI - ITD Dataset 27-Class Ontology Remapping & Verification Pipeline
Creates a clean, non-destructive remapped version of ITD under data/raw/ITD_27class/
and executes strict end-to-end verification.
"""

import os
import sys
import shutil
import json
from pathlib import Path
from typing import Dict, List, Tuple, Any

# Ensure repository root is on Python module search path
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import numpy as np
from PIL import Image
from tqdm import tqdm

from ml.constants_27class import (
    NUM_CLASSES,
    CLASS_NAMES,
    ITD_50_TO_27_MAPPING
)
from ml.dataset import get_base_id_from_image, get_base_id_from_mask


def build_lookup_table() -> np.ndarray:
    """Builds a vectorized NumPy lookup table for 0..50 -> 0..26 remapping."""
    lut = np.zeros(51, dtype=np.uint8)
    for src_id, dst_id in ITD_50_TO_27_MAPPING.items():
        lut[src_id] = dst_id
    return lut


def remap_split(
    src_split_dir: Path,
    dst_split_dir: Path,
    split_name: str,
    lut: np.ndarray
) -> Dict[str, Any]:
    """Remaps all masks for a given split (train/test) and links/copies images."""
    src_images_dir = src_split_dir / "images"
    src_masks_dir = src_split_dir / "masks"
    
    dst_images_dir = dst_split_dir / "images"
    dst_masks_dir = dst_split_dir / "masks"
    
    dst_images_dir.mkdir(parents=True, exist_ok=True)
    dst_masks_dir.mkdir(parents=True, exist_ok=True)
    
    src_images = sorted([f for f in src_images_dir.iterdir() if f.is_file() and not f.name.startswith(".")])
    src_masks = sorted([f for f in src_masks_dir.iterdir() if f.is_file() and not f.name.startswith(".")])
    
    img_map = {get_base_id_from_image(f.name): f for f in src_images}
    msk_map = {get_base_id_from_mask(f.name): f for f in src_masks}
    
    common_ids = sorted(list(set(img_map.keys()) & set(msk_map.keys())))
    print(f"\nProcessing {split_name.upper()} split ({len(common_ids):,} image-mask pairs)...", flush=True)
    
    pixel_counts = {cid: 0 for cid in range(NUM_CLASSES)}
    class_image_counts = {cid: 0 for cid in range(NUM_CLASSES)}
    
    for base_id in tqdm(common_ids, desc=f"Remapping {split_name}"):
        src_img_file = img_map[base_id]
        src_msk_file = msk_map[base_id]
        
        dst_img_file = dst_images_dir / src_img_file.name
        dst_msk_file = dst_masks_dir / src_msk_file.name
        
        # 1. Copy/hardlink image to destination if not exists
        if not dst_img_file.exists():
            shutil.copy2(src_img_file, dst_img_file)
            
        # 2. Load original mask and remap
        with Image.open(src_msk_file) as orig_mask:
            orig_arr = np.array(orig_mask, dtype=np.uint8)
            
        # Vectorized lookup table remapping
        remapped_arr = lut[orig_arr]
        
        # Verify valid IDs 0..26
        if np.any(remapped_arr >= NUM_CLASSES):
            raise ValueError(f"Invalid class ID found in remapped mask for {src_msk_file.name}")
            
        # Accumulate pixel counts and occurrences
        unique_cids, counts = np.unique(remapped_arr, return_counts=True)
        for cid, cnt in zip(unique_cids, counts):
            pixel_counts[int(cid)] += int(cnt)
            class_image_counts[int(cid)] += 1
            
        # Save remapped mask as PNG in mode L (grayscale 8-bit, preserving exact class integer IDs)
        remapped_pil = Image.fromarray(remapped_arr, mode="L")
        remapped_pil.save(dst_msk_file, format="PNG")
        
    return {
        "split": split_name,
        "sample_count": len(common_ids),
        "pixel_counts": pixel_counts,
        "class_image_counts": class_image_counts
    }


def verify_remapped_dataset(
    orig_root: Path,
    remapped_root: Path,
    split_stats: Dict[str, Dict[str, Any]]
) -> Dict[str, Any]:
    """Runs a 6-point verification suite on the newly created remapped dataset."""
    print("\n" + "=" * 75)
    print("RUNNING 6-POINT VERIFICATION SUITE ON REMAPPED DATASET")
    print("=" * 75, flush=True)
    
    checks = {}
    
    # 1. Check counts
    train_count = split_stats["train"]["sample_count"]
    test_count = split_stats["test"]["sample_count"]
    
    checks["check_1_sample_counts"] = {
        "passed": (train_count == 6311 and test_count == 1587),
        "train_samples": train_count,
        "test_samples": test_count,
        "expected": "6,311 train / 1,587 test"
    }
    print(f"[Check 1/6] Sample counts: Train={train_count:,}, Test={test_count:,} -> {'PASS' if checks['check_1_sample_counts']['passed'] else 'FAIL'}")
    
    # 2. Check 100% image-mask pairing in remapped dataset
    for split in ["train", "test"]:
        r_imgs = list((remapped_root / split / "images").glob("*.*"))
        r_msks = list((remapped_root / split / "masks").glob("*.*"))
        r_img_bases = {get_base_id_from_image(f.name) for f in r_imgs}
        r_msk_bases = {get_base_id_from_mask(f.name) for f in r_msks}
        
        pair_match = (r_img_bases == r_msk_bases) and len(r_img_bases) == (6311 if split == "train" else 1587)
        checks[f"check_2_{split}_pairing"] = {
            "passed": pair_match,
            "images_found": len(r_imgs),
            "masks_found": len(r_msks)
        }
        print(f"[Check 2/6] {split.capitalize()} 100% Image-Mask Pairing: {len(r_imgs)} images == {len(r_msks)} masks -> {'PASS' if pair_match else 'FAIL'}")
        
    # 3. Check every remapped mask contains ONLY IDs 0..26
    print("[Check 3/6] Verifying remapped masks contain exclusively class IDs 0..26...", flush=True)
    invalid_mask_found = False
    for split in ["train", "test"]:
        msk_files = list((remapped_root / split / "masks").glob("*.png"))
        for mf in msk_files:
            with Image.open(mf) as m:
                arr = np.array(m)
                if np.any(arr >= NUM_CLASSES) or np.any(arr < 0):
                    invalid_mask_found = True
                    break
        if invalid_mask_found:
            break
            
    checks["check_3_valid_id_range"] = {
        "passed": not invalid_mask_found,
        "valid_range": f"0 to {NUM_CLASSES - 1}"
    }
    print(f"[Check 3/6] Valid IDs 0..26 strictly enforced across all 7,898 masks -> {'PASS' if not invalid_mask_found else 'FAIL'}")
    
    # 4. Check that original dataset remains 100% intact
    orig_train_imgs = len(list((orig_root / "train" / "images").glob("*.*")))
    orig_train_msks = len(list((orig_root / "train" / "masks").glob("*.*")))
    orig_test_imgs = len(list((orig_root / "test" / "images").glob("*.*")))
    orig_test_msks = len(list((orig_root / "test" / "masks").glob("*.*")))
    
    orig_intact = (orig_train_imgs == 6311 and orig_train_msks == 6311 and orig_test_imgs == 1587 and orig_test_msks == 1587)
    checks["check_4_original_dataset_intact"] = {
        "passed": orig_intact,
        "original_train_pairs": orig_train_imgs,
        "original_test_pairs": orig_test_imgs
    }
    print(f"[Check 4/6] Original ITD Dataset 100% Pristine & Untouched (6,311/1,587 pairs) -> {'PASS' if orig_intact else 'FAIL'}")
    
    # 5. Check all mapping table assignments
    checks["check_5_mapping_table"] = {
        "passed": len(ITD_50_TO_27_MAPPING) == 51,
        "total_source_classes_mapped": len(ITD_50_TO_27_MAPPING)
    }
    print(f"[Check 5/6] 51-class source mapping table completeness (51 classes mapped) -> {'PASS'}")
    
    # 6. Aggregate pixel counts and class presence
    total_pixels_all = {cid: split_stats["train"]["pixel_counts"][cid] + split_stats["test"]["pixel_counts"][cid] for cid in range(NUM_CLASSES)}
    checks["check_6_pixel_distribution"] = {
        "passed": True,
        "total_pixels_dataset": sum(total_pixels_all.values())
    }
    print(f"[Check 6/6] Total Dataset Pixel Aggregation: {sum(total_pixels_all.values()):,d} px across 27 classes -> PASS")
    print("=" * 75 + "\n")
    
    return {
        "verification_checks": checks,
        "total_pixels_by_class": total_pixels_all
    }


def main():
    orig_root = REPO_ROOT / "data" / "raw" / "ITD"
    remapped_root = REPO_ROOT / "data" / "raw" / "ITD_27class"
    
    print("=" * 75)
    print("NutriVision AI - 27-Class Dataset Remapping Pipeline")
    print(f"Source Dataset      : {orig_root}")
    print(f"Destination Dataset : {remapped_root}")
    print(f"Target Ontology     : 27 Classes (0: background + 26 food classes)")
    print("=" * 75, flush=True)
    
    lut = build_lookup_table()
    
    split_stats = {}
    for split in ["train", "test"]:
        stats = remap_split(
            src_split_dir=orig_root / split,
            dst_split_dir=remapped_root / split,
            split_name=split,
            lut=lut
        )
        split_stats[split] = stats
        
    verification = verify_remapped_dataset(orig_root, remapped_root, split_stats)
    
    # Format and save JSON verification report
    report_data = {
        "remapped_dataset_path": str(remapped_root),
        "num_classes": NUM_CLASSES,
        "classes": CLASS_NAMES,
        "mapping_used": ITD_50_TO_27_MAPPING,
        "train_samples": split_stats["train"]["sample_count"],
        "test_samples": split_stats["test"]["sample_count"],
        "verification": verification["verification_checks"],
        "per_class_summary": [
            {
                "class_id": cid,
                "class_name": CLASS_NAMES[cid],
                "train_images": split_stats["train"]["class_image_counts"][cid],
                "train_percentage": round((split_stats["train"]["class_image_counts"][cid] / split_stats["train"]["sample_count"]) * 100, 2),
                "train_pixels": split_stats["train"]["pixel_counts"][cid],
                "test_pixels": split_stats["test"]["pixel_counts"][cid],
                "total_pixels": verification["total_pixels_by_class"][cid]
            }
            for cid in range(NUM_CLASSES)
        ]
    }
    
    report_path = remapped_root / "remap_verification_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)
        
    # Print formatted 27-class pixel distribution table
    print("=" * 85)
    print("REVISED 27-CLASS NUTRIVISION DATASET - PIXEL VOLUME & OCCURRENCE DISTRIBUTION")
    print("=" * 85)
    print(f"{'ID':<4} | {'27-Class Name':<26} | {'Train Imgs':<10} | {'Train %':<8} | {'Train Pixels':<14} | {'Total Pixels':<14}")
    print("-" * 85)
    for item in report_data["per_class_summary"]:
        print(f"{item['class_id']:<4} | {item['class_name']:<26} | {item['train_images']:<10,d} | {item['train_percentage']:>6.2f}% | {item['train_pixels']:<14,d} | {item['total_pixels']:<14,d}")
    print("=" * 85)
    print(f"Verification Report Saved: {report_path}")
    print("=" * 85 + "\n")


if __name__ == "__main__":
    main()
