"""
NutriVision AI - Segmentation Metrics
Computes Confusion Matrix, Mean Intersection-over-Union (mIoU), Pixel Accuracy, and Per-Class IoU.
"""

from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import torch

from ml.constants import NUM_CLASSES, CLASS_NAMES


class SegmentationMetrics:
    """
    Accumulates predictions across validation batches and calculates:
    - Pixel Accuracy
    - Class-wise IoU
    - Mean IoU (mIoU)
    - Mean Dice (F1-score)
    """

    def __init__(self, num_classes: int = NUM_CLASSES, ignore_index: Optional[int] = None):
        self.num_classes = num_classes
        self.ignore_index = ignore_index
        self.reset()

    def reset(self) -> None:
        self.confusion_matrix = np.zeros((self.num_classes, self.num_classes), dtype=np.int64)

    def update(self, preds: torch.Tensor, targets: torch.Tensor) -> None:
        """
        preds: [B, H, W] integer class predictions (or [B, C, H, W] logits)
        targets: [B, H, W] ground truth class IDs
        """
        if preds.ndim == 4:
            preds = torch.argmax(preds, dim=1)

        preds_np = preds.detach().cpu().numpy().flatten()
        targets_np = targets.detach().cpu().numpy().flatten()

        if self.ignore_index is not None:
            valid_mask = targets_np != self.ignore_index
            preds_np = preds_np[valid_mask]
            targets_np = targets_np[valid_mask]

        # Valid class bounds [0, num_classes-1]
        valid_indices = (targets_np >= 0) & (targets_np < self.num_classes) & (preds_np >= 0) & (preds_np < self.num_classes)
        preds_np = preds_np[valid_indices]
        targets_np = targets_np[valid_indices]

        # Accumulate 2D confusion matrix: row = target, col = pred
        counts = np.bincount(
            self.num_classes * targets_np.astype(np.int64) + preds_np.astype(np.int64),
            minlength=self.num_classes ** 2
        )
        self.confusion_matrix += counts.reshape((self.num_classes, self.num_classes))

    def compute(self) -> Dict[str, Any]:
        """
        Computes summary metrics from the accumulated confusion matrix.
        """
        cm = self.confusion_matrix
        tp = np.diag(cm)
        fp = cm.sum(axis=0) - tp
        fn = cm.sum(axis=1) - tp

        total_pixels = cm.sum()
        correct_pixels = tp.sum()
        pixel_accuracy = float(correct_pixels / max(total_pixels, 1))

        # Per-class IoU: TP / (TP + FP + FN)
        denominator = tp + fp + fn
        class_iou: Dict[int, float] = {}
        valid_ious = []

        for i in range(self.num_classes):
            if denominator[i] > 0:
                iou = float(tp[i] / denominator[i])
                class_iou[i] = iou
                valid_ious.append(iou)
            else:
                class_iou[i] = float("nan")

        mean_iou = float(np.nanmean(valid_ious)) if len(valid_ious) > 0 else 0.0

        # Detailed per-class breakdown with human-readable names
        per_class_report = []
        for i in range(self.num_classes):
            per_class_report.append({
                "class_id": i,
                "class_name": CLASS_NAMES.get(i, f"Class_{i}"),
                "iou": round(class_iou[i], 4) if not np.isnan(class_iou[i]) else None,
                "total_ground_truth_pixels": int(cm.sum(axis=1)[i])
            })

        return {
            "pixel_accuracy": round(pixel_accuracy, 4),
            "mean_iou": round(mean_iou, 4),
            "evaluated_classes_count": len(valid_ious),
            "per_class": per_class_report
        }
