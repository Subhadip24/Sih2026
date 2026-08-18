"""
NutriVision AI - Pipeline Sanity Check
Tests:
1. Sample loading from train and val splits.
2. Verification of image tensor dimensions and mask tensor dimensions.
3. Verification that mask values strictly remain within [0, 50] integers.
4. SegFormer MiT-B0 model instantiation with 51 classes.
5. Forward pass execution with a mini-batch of 2 samples.
6. Verification that output logits shape is strictly (2, 51, H, W).
7. Combined Loss calculation & backward gradient verification.
8. Metrics calculation validation.
"""

import sys
from pathlib import Path

# Ensure repository root is on Python module search path
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import torch

from ml.constants import NUM_CLASSES, CLASS_NAMES
from ml.dataset import get_thali_splits, ThaliDataset
from ml.model import build_model
from ml.losses import CombinedLoss
from ml.metrics import SegmentationMetrics


def run_sanity_check() -> bool:
    print("=" * 70)
    print("Running NutriVision AI - SegFormer Pipeline Sanity Check")
    print("=" * 70)

    dataset_path = Path("data/raw/ITD")
    if not dataset_path.exists():
        print(f"FAIL: Dataset directory not found at {dataset_path}")
        return False

    # 1. Test Dataset Splits
    print("\n[Step 1] Initializing train, validation, and test dataset splits...")
    try:
        train_ds, val_ds, test_ds = get_thali_splits(
            dataset_dir=str(dataset_path),
            image_size=(512, 512),
            val_ratio=0.10,
            seed=42
        )
        print(f"  --> Train samples : {len(train_ds)} (90% of train)")
        print(f"  --> Val samples   : {len(val_ds)} (10% of train)")
        print(f"  --> Test samples  : {len(test_ds)} (untouched test set)")
        assert len(train_ds) > 0 and len(val_ds) > 0 and len(test_ds) > 0
    except Exception as e:
        print(f"FAIL in Step 1: {e}")
        return False

    # 2. Test Sample Loading & Mask Values
    print("\n[Step 2] Loading samples and validating tensor shapes & mask range [0..50]...")
    try:
        for i in range(min(5, len(train_ds))):
            sample = train_ds[i]
            img = sample["pixel_values"]
            mask = sample["labels"]

            assert img.shape == (3, 512, 512), f"Expected img shape (3, 512, 512), got {img.shape}"
            assert mask.shape == (512, 512), f"Expected mask shape (512, 512), got {mask.shape}"
            assert mask.dtype == torch.int64, f"Expected mask dtype torch.int64, got {mask.dtype}"

            min_val = mask.min().item()
            max_val = mask.max().item()
            unique_vals = torch.unique(mask).tolist()

            assert min_val >= 0 and max_val < NUM_CLASSES, (
                f"Mask values out of bounds! Min: {min_val}, Max: {max_val}, Allowed: [0, {NUM_CLASSES - 1}]"
            )
            print(f"  --> Sample {i+1}: Image Shape={img.shape}, Mask Shape={mask.shape}, Unique Class IDs present={unique_vals}")

        print("  --> ALL sample dimensions and mask integer values verified successfully.")
    except Exception as e:
        print(f"FAIL in Step 2: {e}")
        return False

    # 3. Test Model Instantiation & Forward Pass
    print(f"\n[Step 3] Initializing SegFormer MiT-B0 model for {NUM_CLASSES} classes...")
    try:
        model = build_model(num_classes=NUM_CLASSES, pretrained=False)
        model.eval()
        print(f"  --> Model initialized successfully.")
    except Exception as e:
        print(f"FAIL in Step 3 (Model build): {e}")
        return False

    print("\n[Step 4] Running forward pass on mini-batch of 2 samples...")
    try:
        batch_images = torch.stack([train_ds[0]["pixel_values"], train_ds[1]["pixel_values"]], dim=0)  # [2, 3, 512, 512]
        batch_masks = torch.stack([train_ds[0]["labels"], train_ds[1]["labels"]], dim=0)               # [2, 512, 512]

        print(f"  --> Input batch shape: {batch_images.shape}")
        with torch.no_grad():
            logits = model(batch_images)

        print(f"  --> Model output logits shape: {logits.shape}")
        expected_shape = (2, NUM_CLASSES, 512, 512)
        assert logits.shape == expected_shape, f"Expected logits shape {expected_shape}, got {logits.shape}"
        print(f"  --> Output shape verified: exactly (batch_size=2, num_classes={NUM_CLASSES}, H=512, W=512)")
    except Exception as e:
        print(f"FAIL in Step 4 (Forward pass): {e}")
        return False

    # 4. Test Loss Calculation
    print("\n[Step 5] Testing Combined Loss (Cross-Entropy + Multiclass Dice)...")
    try:
        model.train()
        criterion = CombinedLoss(num_classes=NUM_CLASSES, ce_weight=1.0, dice_weight=1.0)
        train_logits = model(batch_images)
        loss = criterion(train_logits, batch_masks)
        loss.backward()

        assert torch.isfinite(loss), f"Loss is not finite: {loss.item()}"
        print(f"  --> Loss computed: {loss.item():.4f} (Gradients propagated successfully)")
    except Exception as e:
        print(f"FAIL in Step 5 (Loss & Backward): {e}")
        return False

    # 5. Test Metrics Calculation
    print("\n[Step 6] Testing Segmentation Metrics (Pixel Accuracy, Mean IoU)...")
    try:
        metrics_calc = SegmentationMetrics(num_classes=NUM_CLASSES)
        metrics_calc.update(preds=logits, targets=batch_masks)
        summary = metrics_calc.compute()

        print(f"  --> Sanity Pixel Accuracy : {summary['pixel_accuracy'] * 100:.2f}%")
        print(f"  --> Sanity Mean IoU        : {summary['mean_iou'] * 100:.2f}%")
        print(f"  --> Evaluated classes     : {summary['evaluated_classes_count']}")
    except Exception as e:
        print(f"FAIL in Step 6 (Metrics): {e}")
        return False

    print("\n" + "=" * 70)
    print("SANITY CHECK RESULT: ALL CHECKS PASSED (100% SUCCESS)")
    print("=" * 70)
    return True


if __name__ == "__main__":
    success = run_sanity_check()
    sys.exit(0 if success else 1)
