"""
NutriVision AI - SegFormer MiT-B0 Evaluation Pipeline
Evaluates a trained model checkpoint on the untouched test split (1,587 samples) of ITD.
Computes Test Loss, Test Pixel Accuracy, Test Mean IoU, and Per-Class IoU Breakdown.
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, List

# Ensure repository root is on Python module search path
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import torch
import torch.nn as nn
from tqdm import tqdm

from ml.constants import NUM_CLASSES, CLASS_NAMES
from ml.dataset import create_dataloaders
from ml.model import build_model, load_trained_model
from ml.losses import CombinedLoss
from ml.metrics import SegmentationMetrics


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate SegFormer on untouched ITD test split")
    parser.add_argument("--checkpoint", type=str, default="ml/checkpoints/segformer_mit_b0/best_model.pth", help="Path to model checkpoint (.pth)")
    parser.add_argument("--data-dir", type=str, default="data/raw/ITD", help="Path to ITD dataset root")
    parser.add_argument("--batch-size", type=int, default=8, help="Batch size for evaluation")
    parser.add_argument("--image-size", type=int, default=512, help="Image resolution (size x size)")
    parser.add_argument("--device", type=str, default="cuda" if torch.cuda.is_available() else "cpu", help="Device (cuda/cpu)")
    parser.add_argument("--output-json", type=str, default="ml/checkpoints/segformer_mit_b0/test_evaluation_report.json", help="Path to save evaluation JSON results")
    return parser.parse_args()


@torch.no_grad()
def evaluate_model(
    model: nn.Module,
    test_loader: torch.utils.data.DataLoader,
    criterion: nn.Module,
    device: torch.device
) -> Dict[str, Any]:
    """Runs evaluation across all test samples and calculates metrics."""
    model.eval()
    total_loss = 0.0
    metrics_calc = SegmentationMetrics(num_classes=NUM_CLASSES)

    pbar = tqdm(test_loader, desc="Evaluating Test Set", leave=False)
    for batch in pbar:
        pixel_values = batch["pixel_values"].to(device)
        labels = batch["labels"].to(device)

        logits = model(pixel_values)
        loss = criterion(logits, labels)

        total_loss += loss.item()
        metrics_calc.update(preds=logits, targets=labels)

    avg_loss = total_loss / max(len(test_loader), 1)
    results = metrics_calc.compute()
    results["test_loss"] = round(avg_loss, 4)
    results["total_test_samples"] = len(test_loader.dataset)

    return results


def print_evaluation_summary(results: Dict[str, Any]) -> None:
    """Prints a clean CLI summary table of test metrics and per-class IoU."""
    print("\n" + "=" * 75)
    print("NutriVision AI - Test Evaluation Results (Untouched ITD Test Set)")
    print("=" * 75)
    print(f"Total Test Samples Evaluated : {results.get('total_test_samples')}")
    print(f"Test Loss (CE + Dice)        : {results['test_loss']:.4f}")
    print(f"Test Pixel Accuracy          : {results['pixel_accuracy'] * 100:.2f}%")
    print(f"Test Mean IoU (mIoU)         : {results['mean_iou'] * 100:.2f}%")
    print("=" * 75)

    print("\nPer-Class IoU Breakdown (Top Evaluated Dishes):")
    print(f"{'ID':<4} | {'Class Name':<38} | {'IoU':<8} | {'Ground Truth Pixels':<20}")
    print("-" * 75)

    per_class = results.get("per_class", [])
    # Sort by IoU descending (placing evaluated dishes at the top)
    valid_classes = [c for c in per_class if c["iou"] is not None]
    unseen_classes = [c for c in per_class if c["iou"] is None]
    valid_classes.sort(key=lambda x: x["iou"], reverse=True)

    for item in valid_classes:
        iou_str = f"{item['iou'] * 100:.1f}%"
        print(f"{item['class_id']:<4} | {item['class_name']:<38} | {iou_str:<8} | {item['total_ground_truth_pixels']:<20,}")

    if unseen_classes:
        print("-" * 75)
        print(f"Classes with 0 test instances present: {len(unseen_classes)}")

    print("=" * 75 + "\n")


def main():
    args = parse_args()
    device = torch.device(args.device)

    print(f"Loading checkpoint from: {args.checkpoint}")
    if not os.path.exists(args.checkpoint):
        print(f"ERROR: Checkpoint file not found at {args.checkpoint}. Please train the model first with `python ml/train.py`.")
        sys.exit(1)

    # Prepare untouched test dataset
    _, _, test_loader = create_dataloaders(
        dataset_dir=args.data_dir,
        batch_size=args.batch_size,
        image_size=(args.image_size, args.image_size),
        num_workers=0
    )

    # Build model and strictly load weights
    model = load_trained_model(args.checkpoint, device=device, num_classes=NUM_CLASSES)
    criterion = CombinedLoss(num_classes=NUM_CLASSES)

    results = evaluate_model(model, test_loader, criterion, device)
    print_evaluation_summary(results)

    # Save output json
    with open(args.output_json, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"Evaluation report saved to: {args.output_json}")


if __name__ == "__main__":
    main()
