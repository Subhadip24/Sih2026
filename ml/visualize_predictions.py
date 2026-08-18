"""
NutriVision AI - Prediction Visualization Pipeline
Generates 4-panel visual comparison figures (Original RGB, Ground Truth, Model Prediction, Overlay)
for representative test set samples, emphasizing weak and strong food classes.
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Set, Optional

# Ensure repository root is on Python module search path
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import numpy as np
from PIL import Image, ImageDraw, ImageFont
import torch
import torchvision.transforms.functional as TF

from ml.constants import (
    NUM_CLASSES,
    CLASS_NAMES,
    ID2LABEL,
    PALETTE,
    DEFAULT_BEST_MODEL_PATH
)
from ml.dataset import get_thali_splits, IMAGENET_MEAN, IMAGENET_STD
from ml.model import build_model


def colorize_mask(mask_arr: np.ndarray, palette: List[Tuple[int, int, int]]) -> Image.Image:
    """Converts a 2D integer class mask (H, W) into an RGB PIL Image using PALETTE."""
    h, w = mask_arr.shape
    rgb_arr = np.zeros((h, w, 3), dtype=np.uint8)
    for class_id, color in enumerate(palette):
        if class_id >= NUM_CLASSES:
            break
        match = (mask_arr == class_id)
        if np.any(match):
            rgb_arr[match] = color
    return Image.fromarray(rgb_arr, mode="RGB")


def create_overlay(
    image: Image.Image,
    colorized_mask: Image.Image,
    mask_arr: np.ndarray,
    alpha: float = 0.45
) -> Image.Image:
    """Blends the colorized prediction over the original image for non-background pixels."""
    img_rgb = image.convert("RGB")
    mask_rgb = colorized_mask.convert("RGB")
    
    img_np = np.array(img_rgb, dtype=np.float32)
    mask_np = np.array(mask_rgb, dtype=np.float32)
    
    foreground = (mask_arr > 0)[..., None]
    blended = img_np.copy()
    blended[foreground.squeeze(-1)] = (
        (1.0 - alpha) * img_np[foreground.squeeze(-1)] + alpha * mask_np[foreground.squeeze(-1)]
    )
    return Image.fromarray(np.clip(blended, 0, 255).astype(np.uint8), mode="RGB")


def draw_panel(image: Image.Image, title: str, width: int = 380, height: int = 380) -> Image.Image:
    """Resizes an image and attaches a top banner title."""
    resized = image.resize((width, height), Image.Resampling.BILINEAR)
    header_h = 32
    panel = Image.new("RGB", (width, height + header_h), color=(240, 242, 245))
    draw = ImageDraw.Draw(panel)
    
    # Header bar
    draw.rectangle([0, 0, width, header_h], fill=(30, 41, 59))
    draw.text((width // 2, header_h // 2), title, fill=(255, 255, 255), anchor="mm")
    
    # Border around image
    panel.paste(resized, (0, header_h))
    draw.rectangle([0, header_h, width - 1, height + header_h - 1], outline=(203, 213, 225), width=1)
    return panel


def create_composite_figure(
    orig_img: Image.Image,
    gt_mask_arr: np.ndarray,
    pred_mask_arr: np.ndarray,
    sample_id: str,
    target_dish: Optional[str] = None
) -> Image.Image:
    """
    Creates a publication-quality 4-panel comparison:
    [1. Original Image] [2. Ground Truth Mask] [3. Model Prediction] [4. Prediction Overlay]
    with top metadata banner and bottom color legend.
    """
    # 1. Generate panels
    gt_colorized = colorize_mask(gt_mask_arr, PALETTE)
    pred_colorized = colorize_mask(pred_mask_arr, PALETTE)
    pred_overlay = create_overlay(orig_img, pred_colorized, pred_mask_arr, alpha=0.50)
    
    p1 = draw_panel(orig_img, "1. Original RGB Image")
    p2 = draw_panel(gt_colorized, "2. Ground Truth Mask")
    p3 = draw_panel(pred_colorized, "3. Model Prediction (MiT-B0)")
    p4 = draw_panel(pred_overlay, "4. Prediction Overlay")
    
    panel_w, panel_h = p1.size
    spacing = 16
    margin = 20
    
    total_w = margin * 2 + 4 * panel_w + 3 * spacing
    
    # 2. Collect unique classes present in GT or Prediction for legend
    unique_gt = set(np.unique(gt_mask_arr).tolist())
    unique_pred = set(np.unique(pred_mask_arr).tolist())
    all_classes = sorted(list((unique_gt | unique_pred) - {0}))  # Exclude background in legend
    
    # Calculate legend rows (e.g., 4 items per row)
    items_per_row = 4
    legend_row_h = 24
    num_legend_rows = (len(all_classes) + items_per_row - 1) // items_per_row if all_classes else 1
    legend_h = 40 + num_legend_rows * legend_row_h
    
    banner_h = 60
    total_h = margin + banner_h + panel_h + spacing + legend_h + margin
    
    # 3. Create canvas
    canvas = Image.new("RGB", (total_w, total_h), color=(255, 255, 255))
    draw = ImageDraw.Draw(canvas)
    
    # Top banner background
    draw.rectangle([margin, margin, total_w - margin, margin + banner_h], fill=(248, 250, 252), outline=(226, 232, 240), width=1)
    
    target_info = f" | Target Class: {target_dish}" if target_dish else ""
    draw.text((margin + 16, margin + 18), f"NutriVision AI - SegFormer MiT-B0 Prediction Analysis", fill=(15, 23, 42))
    draw.text((margin + 16, margin + 38), f"Sample: {sample_id}{target_info} | GT Classes: {len(unique_gt - {0})} | Pred Classes: {len(unique_pred - {0})}", fill=(71, 85, 105))
    
    # Paste panels
    x_offset = margin
    y_offset = margin + banner_h + 12
    for p in [p1, p2, p3, p4]:
        canvas.paste(p, (x_offset, y_offset))
        x_offset += panel_w + spacing
        
    # Legend area
    legend_y = y_offset + panel_h + 16
    draw.rectangle([margin, legend_y, total_w - margin, legend_y + legend_h], fill=(248, 250, 252), outline=(226, 232, 240), width=1)
    draw.text((margin + 16, legend_y + 10), "Detected / Ground-Truth Semantic Classes & Palette Mapping:", fill=(30, 41, 59))
    
    col_w = (total_w - margin * 2 - 32) // items_per_row
    for idx, cid in enumerate(all_classes):
        row = idx // items_per_row
        col = idx % items_per_row
        item_x = margin + 20 + col * col_w
        item_y = legend_y + 34 + row * legend_row_h
        
        color = PALETTE[cid]
        # Draw color swatch
        draw.rectangle([item_x, item_y + 2, item_x + 16, item_y + 16], fill=color, outline=(100, 116, 139), width=1)
        
        # Dish name + presence indicator
        in_gt = cid in unique_gt
        in_pred = cid in unique_pred
        tag = ""
        if in_gt and in_pred:
            tag = " [GT+Pred]"
        elif in_gt:
            tag = " [GT only]"
        else:
            tag = " [Pred only]"
            
        cname = CLASS_NAMES.get(cid, f"Class {cid}")
        draw.text((item_x + 22, item_y + 2), f"{cid}: {cname}{tag}", fill=(51, 65, 85))
        
    return canvas


def find_samples_by_classes(
    test_pairs: List[Tuple[Path, Path]],
    target_class_ids: List[int]
) -> List[Tuple[Path, Path, int]]:
    """
    In a single pass over the test set, finds a distinct representative sample for each target class.
    """
    target_set = set(target_class_ids)
    matched: Dict[int, Tuple[Path, Path]] = {}
    used_stems: Set[str] = set()

    print(f"Scanning test set masks to locate target food classes: {target_class_ids}...", flush=True)
    
    for idx, (img_path, mask_path) in enumerate(test_pairs):
        if len(matched) == len(target_set):
            break
            
        with Image.open(mask_path) as mask:
            mask_arr = np.array(mask, dtype=np.int64)
            classes_in_mask = set(np.unique(mask_arr).tolist())
            
        for cid in target_set:
            if cid not in matched and cid in classes_in_mask:
                if img_path.stem not in used_stems or len(matched) >= len(target_set) - 2:
                    matched[cid] = (img_path, mask_path)
                    used_stems.add(img_path.stem)
                    target_name = CLASS_NAMES.get(cid, f"Class {cid}")
                    print(f"  [Found {len(matched)}/{len(target_set)}] Target ID {cid} ({target_name}) -> {img_path.stem}", flush=True)
                    
    selected_items: List[Tuple[Path, Path, int]] = []
    for cid in target_class_ids:
        if cid in matched:
            img_p, mask_p = matched[cid]
            selected_items.append((img_p, mask_p, cid))
            
    return selected_items


def main():
    print("=" * 70)
    print("NutriVision AI - SegFormer MiT-B0 Prediction Visualizer")
    print("=" * 70)
    
    checkpoint_path = Path(DEFAULT_BEST_MODEL_PATH)
    output_dir = REPO_ROOT / "ml" / "checkpoints" / "segformer_mit_b0" / "prediction_visualizations"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    data_dir = REPO_ROOT / "data" / "raw" / "ITD"
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device               : {device}")
    print(f"Loading Checkpoint   : {checkpoint_path}")
    print(f"Visualizations Output: {output_dir}")
    
    # 1. Load Model
    if not checkpoint_path.exists():
        raise FileNotFoundError(f"Checkpoint not found at: {checkpoint_path}")
        
    model = build_model(backbone="nvidia/mit-b0", num_classes=NUM_CLASSES)
    ckpt = torch.load(checkpoint_path, map_location=device)
    state_dict = ckpt["model_state_dict"] if "model_state_dict" in ckpt else ckpt
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()
    print("Model successfully loaded and set to eval mode.")
    
    # 2. Get Test Split
    _, _, test_dataset = get_thali_splits(dataset_dir=data_dir, val_ratio=0.10, seed=42)
    test_pairs = list(zip(test_dataset.image_paths, test_dataset.mask_paths))
    print(f"Test split size: {len(test_pairs)} image-mask pairs.")
    
    # Target classes requested:
    # Poorly performing: 10 (Cucumber-Raitha), 39 (Sweet), 41 (fried-papad-rings), 20 (Vankaya-Ali-Karam), 46 (pepper-rasam), 48 (corn-fry)
    # Strong classes   : 33 (plain-rice), 30 (live-roti-with-ghee), 29 (lemon-rice), 24 (dal)
    target_classes = [10, 39, 41, 20, 46, 48, 33, 30, 29, 24]
    
    selected_items = find_samples_by_classes(test_pairs, target_classes)
    print(f"\nTotal representative test samples selected: {len(selected_items)}.")
    
    # 3. Generate Visualizations
    image_size = (512, 512)
    generated_files: List[Path] = []
    
    for idx, (img_path, mask_path, target_cid) in enumerate(selected_items, 1):
        target_name = CLASS_NAMES.get(target_cid, f"Class {target_cid}")
        sample_stem = img_path.stem.replace("_leftImg8bit", "")
        print(f"[{idx}/{len(selected_items)}] Visualizing {sample_stem} (Target: {target_name})...", flush=True)
        
        # Load raw image and mask
        raw_img = Image.open(img_path).convert("RGB")
        raw_mask = Image.open(mask_path)
        
        # Resize to model input size (bilinear for image, nearest for mask)
        resized_img = TF.resize(raw_img, image_size, interpolation=TF.InterpolationMode.BILINEAR)
        resized_mask = TF.resize(raw_mask, image_size, interpolation=TF.InterpolationMode.NEAREST)
        
        gt_mask_arr = np.array(resized_mask, dtype=np.int64)
        
        # Transform for model tensor
        img_tensor = TF.to_tensor(resized_img)
        img_tensor = TF.normalize(img_tensor, mean=IMAGENET_MEAN, std=IMAGENET_STD)
        img_tensor = img_tensor.unsqueeze(0).to(device)
        
        with torch.no_grad():
            logits = model(img_tensor)  # (1, 51, 512, 512)
            preds = torch.argmax(logits, dim=1).squeeze(0).cpu().numpy()
            
        # Create composite figure
        fig = create_composite_figure(
            orig_img=resized_img,
            gt_mask_arr=gt_mask_arr,
            pred_mask_arr=preds,
            sample_id=sample_stem,
            target_dish=f"{target_name} (ID {target_cid})"
        )
        
        save_path = output_dir / f"pred_{idx:02d}_{sample_stem}_id{target_cid}.png"
        fig.save(save_path, quality=95)
        generated_files.append(save_path)
        
    print("\n" + "=" * 70)
    print(f"Visualization generation complete!")
    print(f"Total Visualizations Created: {len(generated_files)}")
    print(f"Output Directory            : {output_dir}")
    print("=" * 70)


if __name__ == "__main__":
    main()
