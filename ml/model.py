"""
NutriVision AI - SegFormer MiT-B0 Model Wrapper
Configured for 51 semantic segmentation classes (Indian Thali food items).
"""

from typing import Dict, Optional, Tuple, Any
from pathlib import Path
import logging
import torch
import torch.nn as nn
import torch.nn.functional as F

from transformers import SegformerForSemanticSegmentation, SegformerConfig
from ml.constants import NUM_CLASSES, ID2LABEL, LABEL2ID

logger = logging.getLogger(__name__)


class SegFormerMiTB0(nn.Module):
    """
    SegFormer MiT-B0 model wrapper.
    Accepts input [B, 3, H, W] and returns upsampled logits [B, 51, H, W].
    """

    def __init__(
        self,
        num_classes: int = NUM_CLASSES,
        pretrained: bool = True,
        backbone: str = "nvidia/mit-b0"
    ):
        super().__init__()
        self.num_classes = num_classes
        self.backbone = backbone

        # Build model configuration
        self.config = SegformerConfig.from_pretrained(
            backbone,
            num_labels=num_classes,
            id2label=ID2LABEL,
            label2id=LABEL2ID
        ) if pretrained else SegformerConfig(
            num_labels=num_classes,
            id2label=ID2LABEL,
            label2id=LABEL2ID
        )

        try:
            if pretrained:
                self.model = SegformerForSemanticSegmentation.from_pretrained(
                    backbone,
                    num_labels=num_classes,
                    id2label=ID2LABEL,
                    label2id=LABEL2ID,
                    ignore_mismatched_sizes=True
                )
            else:
                self.model = SegformerForSemanticSegmentation(self.config)
        except Exception as e:
            logger.warning(f"Could not download weights for {backbone} ({e}). Initializing SegFormer from scratch.")
            self.model = SegformerForSemanticSegmentation(self.config)

    def forward(
        self,
        pixel_values: torch.Tensor,
        labels: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        """
        pixel_values: [B, 3, H, W] normalized float tensor
        labels: Optional [B, H, W] ground truth tensor

        Returns: [B, 51, H, W] upscaled logits
        """
        input_size = pixel_values.shape[2:]  # (H, W)

        outputs = self.model(pixel_values=pixel_values)
        logits = outputs.logits  # [B, 51, H/4, W/4]

        # Upsample logits to exact original input resolution (H, W)
        upscaled_logits = F.interpolate(
            logits,
            size=input_size,
            mode="bilinear",
            align_corners=False
        )

        return upscaled_logits


def build_model(
    num_classes: int = NUM_CLASSES,
    pretrained: bool = True,
    backbone: str = "nvidia/mit-b0"
) -> SegFormerMiTB0:
    """Builds and returns a SegFormer MiT-B0 model instance."""
    return SegFormerMiTB0(
        num_classes=num_classes,
        pretrained=pretrained,
        backbone=backbone
    )


def load_trained_model(
    checkpoint_path: Any,
    device: torch.device = torch.device("cpu"),
    num_classes: int = NUM_CLASSES,
    backbone: str = "nvidia/mit-b0"
) -> SegFormerMiTB0:
    """
    Instantiates the exact SegFormer MiT-B0 51-class architecture and strictly loads
    the saved checkpoint weights without downloading/initializing default ImageNet heads.
    Strict loading ensures 100% parameter match with zero missing or unexpected weights.
    """
    ckpt_path = Path(checkpoint_path)
    if not ckpt_path.exists():
        raise FileNotFoundError(f"Checkpoint not found at: {ckpt_path}")

    # Instantiate architecture cleanly from config
    model = SegFormerMiTB0(
        num_classes=num_classes,
        pretrained=False,
        backbone=backbone
    )

    ckpt = torch.load(ckpt_path, map_location=device)
    state_dict = ckpt["model_state_dict"] if isinstance(ckpt, dict) and "model_state_dict" in ckpt else ckpt

    # Strict loading: enforces 100% parameter match
    model.load_state_dict(state_dict, strict=True)
    model.to(device)
    model.eval()
    return model
