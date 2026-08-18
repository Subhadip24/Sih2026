"""
NutriVision AI - SegFormer MiT-B0 Training Pipeline
Trains SegFormer on Indian Thali Dataset with 51 food classes.
Saves best checkpoint based on validation mean IoU (mIoU).
"""

import os
import sys
import time
import json
import argparse
import random
from pathlib import Path
from typing import Dict, Any, List, Optional

# Ensure repository root is on Python module search path
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import numpy as np
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import PolynomialLR, CosineAnnealingLR
from tqdm import tqdm

from ml.constants import NUM_CLASSES, ID2LABEL, LABEL2ID
from ml.dataset import create_dataloaders
from ml.model import build_model
from ml.losses import CombinedLoss
from ml.metrics import SegmentationMetrics


def set_seed(seed: int = 42) -> None:
    """Sets deterministic seeds for Python, NumPy, and PyTorch."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False


def train_one_epoch(
    model: nn.Module,
    loader: torch.utils.data.DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer,
    device: torch.device,
    epoch: int,
    total_epochs: int
) -> float:
    """Runs a single training epoch."""
    model.train()
    total_loss = 0.0
    num_batches = len(loader)

    pbar = tqdm(loader, desc=f"Epoch [{epoch}/{total_epochs}] Train", leave=False)
    for batch in pbar:
        pixel_values = batch["pixel_values"].to(device)
        labels = batch["labels"].to(device)

        optimizer.zero_grad()
        logits = model(pixel_values)
        loss = criterion(logits, labels)

        loss.backward()
        optimizer.step()

        loss_val = loss.item()
        total_loss += loss_val
        pbar.set_postfix({"loss": f"{loss_val:.4f}"})

    return total_loss / max(num_batches, 1)


@torch.no_grad()
def validate(
    model: nn.Module,
    loader: torch.utils.data.DataLoader,
    criterion: nn.Module,
    device: torch.device,
    epoch: int,
    total_epochs: int
) -> Dict[str, Any]:
    """Evaluates the model on validation set and computes metrics."""
    model.eval()
    total_loss = 0.0
    metrics_calc = SegmentationMetrics(num_classes=NUM_CLASSES)

    pbar = tqdm(loader, desc=f"Epoch [{epoch}/{total_epochs}] Val", leave=False)
    for batch in pbar:
        pixel_values = batch["pixel_values"].to(device)
        labels = batch["labels"].to(device)

        logits = model(pixel_values)
        loss = criterion(logits, labels)

        total_loss += loss.item()
        metrics_calc.update(preds=logits, targets=labels)

    avg_loss = total_loss / max(len(loader), 1)
    metrics = metrics_calc.compute()
    metrics["val_loss"] = round(avg_loss, 4)

    return metrics


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train SegFormer MiT-B0 on Indian Thali Dataset")
    parser.add_argument("--data-dir", type=str, default="data/raw/ITD", help="Path to ITD dataset directory")
    parser.add_argument("--batch-size", type=int, default=8, help="Mini-batch size for training and validation")
    parser.add_argument("--learning-rate", type=float, default=6e-5, help="Peak learning rate for AdamW")
    parser.add_argument("--weight-decay", type=float, default=0.01, help="Weight decay for AdamW optimizer")
    parser.add_argument("--epochs", type=int, default=20, help="Number of training epochs")
    parser.add_argument("--image-size", type=int, default=512, help="Image resolution (size x size)")
    parser.add_argument("--val-ratio", type=float, default=0.10, help="Validation split proportion from train set (default: 0.10)")
    parser.add_argument("--model-name", type=str, default="nvidia/mit-b0", help="Pretrained backbone identifier")
    parser.add_argument("--checkpoint-dir", type=str, default="ml/checkpoints/segformer_mit_b0", help="Directory to save model checkpoints")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument("--num-workers", type=int, default=0, help="DataLoader workers (default: 0 for safe multiprocessing)")
    parser.add_argument("--device", type=str, default="cuda" if torch.cuda.is_available() else "cpu", help="Computation device (cuda/cpu)")
    return parser.parse_args()


def main():
    args = parse_args()
    set_seed(args.seed)

    print("=" * 70)
    print("NutriVision AI - SegFormer MiT-B0 Training Pipeline")
    print(f"Dataset Path     : {args.data_dir}")
    print(f"Device           : {args.device}")
    print(f"Image Resolution : {args.image_size}x{args.image_size}")
    print(f"Batch Size       : {args.batch_size}")
    print(f"Learning Rate    : {args.learning_rate}")
    print(f"Epochs           : {args.epochs}")
    print(f"Classes Count    : {NUM_CLASSES}")
    print("=" * 70, flush=True)

    checkpoint_path = Path(args.checkpoint_dir)
    checkpoint_path.mkdir(parents=True, exist_ok=True)

    # 1. Construct DataLoaders
    print("\n[1/4] Preparing dataset loaders (90% Train / 10% Val)...", flush=True)
    train_loader, val_loader, _ = create_dataloaders(
        dataset_dir=args.data_dir,
        batch_size=args.batch_size,
        image_size=(args.image_size, args.image_size),
        val_ratio=args.val_ratio,
        num_workers=args.num_workers,
        seed=args.seed
    )
    print(f"Train Batches: {len(train_loader)} | Val Batches: {len(val_loader)}", flush=True)

    # 2. Build Model
    print(f"\n[2/4] Initializing SegFormer model ({args.model_name}) with {NUM_CLASSES} classes...", flush=True)
    device = torch.device(args.device)
    model = build_model(num_classes=NUM_CLASSES, pretrained=True, backbone=args.model_name)
    model.to(device)

    # 3. Setup Loss, Optimizer, and LR Scheduler
    print("\n[3/4] Initializing Loss (Cross-Entropy + Dice) & AdamW Optimizer...", flush=True)
    criterion = CombinedLoss(num_classes=NUM_CLASSES, ce_weight=1.0, dice_weight=1.0)
    optimizer = AdamW(model.parameters(), lr=args.learning_rate, weight_decay=args.weight_decay)
    scheduler = CosineAnnealingLR(optimizer, T_max=args.epochs, eta_min=1e-6)

    # 4. Training & Validation Loop
    print(f"\n[4/4] Starting training for {args.epochs} epochs...\n", flush=True)
    best_miou = 0.0
    history: List[Dict[str, Any]] = []

    for epoch in range(1, args.epochs + 1):
        start_time = time.time()
        train_loss = train_one_epoch(
            model=model,
            loader=train_loader,
            criterion=criterion,
            optimizer=optimizer,
            device=device,
            epoch=epoch,
            total_epochs=args.epochs
        )

        val_metrics = validate(
            model=model,
            loader=val_loader,
            criterion=criterion,
            device=device,
            epoch=epoch,
            total_epochs=args.epochs
        )

        scheduler.step()
        elapsed = time.time() - start_time

        val_loss = val_metrics["val_loss"]
        val_miou = val_metrics["mean_iou"]
        val_acc = val_metrics["pixel_accuracy"]

        print(
            f"Epoch [{epoch:02d}/{args.epochs:02d}] "
            f"Train Loss: {train_loss:.4f} | "
            f"Val Loss: {val_loss:.4f} | "
            f"Val mIoU: {val_miou:.4f} | "
            f"Val PixAcc: {val_acc:.4f} | "
            f"Time: {elapsed:.1f}s",
            flush=True
        )

        epoch_record = {
            "epoch": epoch,
            "train_loss": round(train_loss, 4),
            "val_loss": val_loss,
            "val_mean_iou": val_miou,
            "val_pixel_accuracy": val_acc,
            "lr": optimizer.param_groups[0]["lr"],
            "time_seconds": round(elapsed, 1)
        }
        history.append(epoch_record)

        # Save latest checkpoint
        torch.save({
            "epoch": epoch,
            "model_state_dict": model.state_dict(),
            "optimizer_state_dict": optimizer.state_dict(),
            "val_metrics": val_metrics,
            "args": vars(args)
        }, checkpoint_path / "latest_model.pth")

        # Save best model based on validation mIoU
        if val_miou > best_miou:
            best_miou = val_miou
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "val_metrics": val_metrics,
                "args": vars(args)
            }, checkpoint_path / "best_model.pth")
            print(f"  --> Saved new best model checkpoint (mIoU: {best_miou:.4f}) to {checkpoint_path / 'best_model.pth'}", flush=True)

    # Save training history json
    with open(checkpoint_path / "train_history.json", "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    print(f"\nTraining completed! Best Validation mIoU: {best_miou:.4f}")
    print(f"Checkpoints saved in: {checkpoint_path}")


if __name__ == "__main__":
    main()
