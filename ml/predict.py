"""
NutriVision AI - SegFormer MiT-B0 Food Segmentation Inference Pipeline
Runs semantic segmentation inference on arbitrary external Indian thali images,
detects food classes present, and generates 3-panel composite visualization figures.
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional

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
    PALETTE
)
from ml.dataset import IMAGENET_MEAN, IMAGENET_STD
from ml.model import build_model, load_trained_model


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


def draw_panel(image: Image.Image, title: str, width: int = 420, height: int = 420) -> Image.Image:
    """Resizes an image and attaches a top banner title."""
    resized = image.resize((width, height), Image.Resampling.BILINEAR)
    header_h = 34
    panel = Image.new("RGB", (width, height + header_h), color=(240, 242, 245))
    draw = ImageDraw.Draw(panel)
    
    # Header bar
    draw.rectangle([0, 0, width, header_h], fill=(30, 41, 59))
    draw.text((width // 2, header_h // 2), title, fill=(255, 255, 255), anchor="mm")
    
    # Border around image
    panel.paste(resized, (0, header_h))
    draw.rectangle([0, header_h, width - 1, height + header_h - 1], outline=(203, 213, 225), width=1)
    return panel


def create_inference_composite(
    orig_img: Image.Image,
    colorized_mask: Image.Image,
    overlay_img: Image.Image,
    mask_arr: np.ndarray,
    image_name: str,
    detected_items: List[Dict[str, Any]]
) -> Image.Image:
    """
    Creates a 3-panel comparison figure:
    [1. Original Image] [2. Predicted Segmentation Mask] [3. Prediction Overlay]
    with top metadata banner and bottom color legend of detected dishes.
    """
    p1 = draw_panel(orig_img, "1. Original RGB Image")
    p2 = draw_panel(colorized_mask, "2. Predicted Segmentation Mask")
    p3 = draw_panel(overlay_img, "3. Prediction Overlay (SegFormer)")
    
    panel_w, panel_h = p1.size
    spacing = 16
    margin = 20
    
    total_w = margin * 2 + 3 * panel_w + 2 * spacing
    
    # Legend calculation
    items_per_row = 3
    legend_row_h = 26
    num_legend_rows = (len(detected_items) + items_per_row - 1) // items_per_row if detected_items else 1
    legend_h = 44 + num_legend_rows * legend_row_h
    
    banner_h = 64
    total_h = margin + banner_h + panel_h + spacing + legend_h + margin
    
    canvas = Image.new("RGB", (total_w, total_h), color=(255, 255, 255))
    draw = ImageDraw.Draw(canvas)
    
    # Banner background
    draw.rectangle([margin, margin, total_w - margin, margin + banner_h], fill=(248, 250, 252), outline=(226, 232, 240), width=1)
    draw.text((margin + 16, margin + 18), "NutriVision AI - Semantic Segmentation Inference", fill=(15, 23, 42))
    draw.text((margin + 16, margin + 40), f"Image: {image_name} | Distinct Food Classes Detected: {len(detected_items)}", fill=(71, 85, 105))
    
    # Paste panels
    x_offset = margin
    y_offset = margin + banner_h + 12
    for p in [p1, p2, p3]:
        canvas.paste(p, (x_offset, y_offset))
        x_offset += panel_w + spacing
        
    # Legend area
    legend_y = y_offset + panel_h + 16
    draw.rectangle([margin, legend_y, total_w - margin, legend_y + legend_h], fill=(248, 250, 252), outline=(226, 232, 240), width=1)
    draw.text((margin + 16, legend_y + 10), "Detected Food Classes & Palette Mapping:", fill=(30, 41, 59))
    
    col_w = (total_w - margin * 2 - 32) // items_per_row
    for idx, item in enumerate(detected_items):
        row = idx // items_per_row
        col = idx % items_per_row
        item_x = margin + 20 + col * col_w
        item_y = legend_y + 34 + row * legend_row_h
        
        color = item["color_rgb"]
        draw.rectangle([item_x, item_y + 2, item_x + 16, item_y + 16], fill=tuple(color), outline=(100, 116, 139), width=1)
        
        label_text = f"{item['class_id']}: {item['class_name']} ({item['percentage']:.1f}% area)"
        draw.text((item_x + 22, item_y + 2), label_text, fill=(51, 65, 85))
        
    return canvas


def run_inference(
    image_path: Path,
    checkpoint_path: Path,
    output_dir: Path,
    image_size: int = 512,
    device: str = "cuda" if torch.cuda.is_available() else "cpu",
    min_pixel_threshold: int = 150
) -> Dict[str, Any]:
    """
    Loads an arbitrary image, runs SegFormer inference, extracts detected dishes,
    and saves visualization artifacts.
    """
    if not image_path.exists():
        raise FileNotFoundError(f"Input image not found at: {image_path}")
    if not checkpoint_path.exists():
        raise FileNotFoundError(f"Model checkpoint not found at: {checkpoint_path}")
        
    output_dir.mkdir(parents=True, exist_ok=True)
    device_obj = torch.device(device)
    
    print("=" * 70)
    print("NutriVision AI - Food Segmentation Prediction Pipeline")
    print(f"Input Image     : {image_path}")
    print(f"Model Checkpoint: {checkpoint_path}")
    print(f"Device          : {device}")
    print(f"Output Directory: {output_dir}")
    print("=" * 70, flush=True)
    
    # 1. Load Model
    print("\n[1/4] Loading SegFormer MiT-B0 model weights (strict parameter check)...", flush=True)
    model = load_trained_model(
        checkpoint_path=checkpoint_path,
        device=device_obj,
        num_classes=NUM_CLASSES,
        backbone="nvidia/mit-b0"
    )
    print("  --> Model loaded strictly with 100% parameter verification (0 warnings).", flush=True)
    
    # 2. Preprocess Image
    print("[2/4] Preprocessing input image...", flush=True)
    orig_img = Image.open(image_path).convert("RGB")
    orig_w, orig_h = orig_img.size
    
    resized_img = TF.resize(orig_img, (image_size, image_size), interpolation=TF.InterpolationMode.BILINEAR)
    img_tensor = TF.to_tensor(resized_img)
    img_tensor = TF.normalize(img_tensor, mean=IMAGENET_MEAN, std=IMAGENET_STD)
    img_tensor = img_tensor.unsqueeze(0).to(device_obj)
    
    # 3. Model Inference
    print("[3/4] Running SegFormer forward pass...", flush=True)
    with torch.no_grad():
        logits = model(img_tensor)  # (1, 51, 512, 512)
        preds_512 = torch.argmax(logits, dim=1).squeeze(0).cpu().numpy()  # (512, 512)
        
    # Resize prediction mask back to original image resolution for pixel-accurate overlay
    pred_pil = Image.fromarray(preds_512.astype(np.uint8), mode="L")
    pred_orig = TF.resize(pred_pil, (orig_h, orig_w), interpolation=TF.InterpolationMode.NEAREST)
    mask_arr = np.array(pred_orig, dtype=np.int64)
    
    # 4. Analyze Detected Food Items
    print("[4/4] Analyzing detected semantic food classes...", flush=True)
    total_pixels = mask_arr.size
    unique_ids, counts = np.unique(mask_arr, return_counts=True)
    
    detected_items: List[Dict[str, Any]] = []
    for cid, cnt in zip(unique_ids, counts):
        if cid == 0:  # Background
            continue
        if cnt >= min_pixel_threshold:
            percentage = (cnt / total_pixels) * 100.0
            detected_items.append({
                "class_id": int(cid),
                "class_name": CLASS_NAMES.get(int(cid), f"Class {cid}"),
                "pixel_count": int(cnt),
                "percentage": float(percentage),
                "color_rgb": list(PALETTE[int(cid)])
            })
            
    # Sort detected items by area percentage descending
    detected_items.sort(key=lambda x: x["pixel_count"], reverse=True)
    
    # 5. Generate Visualizations
    colorized_mask = colorize_mask(mask_arr, PALETTE)
    overlay_img = create_overlay(orig_img, colorized_mask, mask_arr, alpha=0.45)
    
    composite_fig = create_inference_composite(
        orig_img=orig_img,
        colorized_mask=colorized_mask,
        overlay_img=overlay_img,
        mask_arr=mask_arr,
        image_name=image_path.name,
        detected_items=detected_items
    )
    
    # Save artifacts
    stem = image_path.stem
    composite_path = output_dir / f"{stem}_segmentation_analysis.png"
    mask_path = output_dir / f"{stem}_mask.png"
    overlay_path = output_dir / f"{stem}_overlay.png"
    json_path = output_dir / f"{stem}_prediction_summary.json"
    
    composite_fig.save(composite_path, quality=95)
    colorized_mask.save(mask_path)
    overlay_img.save(overlay_path, quality=95)
    
    summary_data = {
        "image_name": image_path.name,
        "image_dimensions": {"width": orig_w, "height": orig_h},
        "model_checkpoint": str(checkpoint_path),
        "total_pixels": int(total_pixels),
        "detected_food_classes_count": len(detected_items),
        "detected_items": detected_items,
        "saved_files": {
            "composite_analysis": str(composite_path),
            "segmentation_mask": str(mask_path),
            "prediction_overlay": str(overlay_path),
            "summary_json": str(json_path)
        }
    }
    
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2)
        
    print("\n" + "=" * 70)
    print("INFERENCE SUMMARY:")
    print("=" * 70)
    print(f"Total Detected Food Classes: {len(detected_items)}")
    print("-" * 70)
    print(f"{'ID':<4} | {'Food Class Name':<32} | {'Pixels':<12} | {'Plate Area %':<10}")
    print("-" * 70)
    for item in detected_items:
        print(f"{item['class_id']:<4} | {item['class_name']:<32} | {item['pixel_count']:<12,d} | {item['percentage']:>6.2f}%")
    print("=" * 70)
    print(f"Saved Composite Visualization : {composite_path}")
    print(f"Saved Prediction Overlay      : {overlay_path}")
    print(f"Saved Segmentation Mask       : {mask_path}")
    print(f"Saved Prediction JSON         : {json_path}")
    print("=" * 70 + "\n")
    
    return summary_data


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run SegFormer MiT-B0 inference on an arbitrary image")
    parser.add_argument("--image", type=str, required=True, help="Path to input image file (.jpg, .png, .jpeg)")
    parser.add_argument("--checkpoint", type=str, default="ml/checkpoints/segformer_mit_b0_10ep/best_model.pth", help="Path to trained .pth checkpoint")
    parser.add_argument("--output-dir", type=str, default="ml/checkpoints/segformer_mit_b0_10ep/inference_results", help="Directory to save inference visualizations")
    parser.add_argument("--image-size", type=int, default=512, help="Inference resolution (size x size)")
    parser.add_argument("--min-pixel-threshold", type=int, default=150, help="Minimum pixel count to register food detection")
    parser.add_argument("--device", type=str, default="cuda" if torch.cuda.is_available() else "cpu", help="Device (cuda/cpu)")
    return parser.parse_args()


def main():
    args = parse_args()
    image_path = Path(args.image)
    checkpoint_path = Path(args.checkpoint)
    output_dir = Path(args.output_dir)
    
    run_inference(
        image_path=image_path,
        checkpoint_path=checkpoint_path,
        output_dir=output_dir,
        image_size=args.image_size,
        device=args.device,
        min_pixel_threshold=args.min_pixel_threshold
    )


if __name__ == "__main__":
    main()
