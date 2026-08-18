"""
NutriVision AI - Segmentation Losses
Implements combined Cross-Entropy and Multiclass Dice Loss for multi-class food segmentation.
"""

from typing import Optional
import torch
import torch.nn as nn
import torch.nn.functional as F

from ml.constants import NUM_CLASSES


class MulticlassDiceLoss(nn.Module):
    """
    Computes Multiclass Soft-Dice Loss over C channels.
    """

    def __init__(self, num_classes: int = NUM_CLASSES, eps: float = 1e-6, ignore_index: Optional[int] = None):
        super().__init__()
        self.num_classes = num_classes
        self.eps = eps
        self.ignore_index = ignore_index

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        """
        logits: [B, C, H, W] raw model output (before softmax)
        targets: [B, H, W] ground truth class IDs (0..C-1)
        """
        # Softmax probabilities over classes
        probs = F.softmax(logits, dim=1)  # [B, C, H, W]

        # One-hot encode targets: [B, C, H, W]
        targets_clamped = targets.clone()
        if self.ignore_index is not None:
            mask = targets != self.ignore_index
            targets_clamped[~mask] = 0
        else:
            mask = torch.ones_like(targets, dtype=torch.bool)

        targets_one_hot = F.one_hot(targets_clamped, num_classes=self.num_classes)  # [B, H, W, C]
        targets_one_hot = targets_one_hot.permute(0, 3, 1, 2).float()  # [B, C, H, W]

        if self.ignore_index is not None:
            mask = mask.unsqueeze(1).float()  # [B, 1, H, W]
            probs = probs * mask
            targets_one_hot = targets_one_hot * mask

        # Sum over spatial dimensions (H, W)
        intersection = torch.sum(probs * targets_one_hot, dim=(2, 3))  # [B, C]
        cardinality = torch.sum(probs + targets_one_hot, dim=(2, 3))    # [B, C]

        dice_score = (2.0 * intersection + self.eps) / (cardinality + self.eps)
        dice_loss = 1.0 - torch.mean(dice_score)

        return dice_loss


class CombinedLoss(nn.Module):
    """
    Combined Cross-Entropy + Dice Loss.
    """

    def __init__(
        self,
        num_classes: int = NUM_CLASSES,
        ce_weight: float = 1.0,
        dice_weight: float = 1.0,
        class_weights: Optional[torch.Tensor] = None,
        ignore_index: int = -100
    ):
        super().__init__()
        self.ce_weight = ce_weight
        self.dice_weight = dice_weight
        self.ce_loss = nn.CrossEntropyLoss(weight=class_weights, ignore_index=ignore_index)
        self.dice_loss = MulticlassDiceLoss(num_classes=num_classes, ignore_index=None if ignore_index == -100 else ignore_index)

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        """
        logits: [B, C, H, W]
        targets: [B, H, W]
        """
        ce = self.ce_loss(logits, targets)
        dice = self.dice_loss(logits, targets)
        return self.ce_weight * ce + self.dice_weight * dice
