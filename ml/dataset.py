"""
NutriVision AI - PyTorch Dataset and DataLoaders for Indian Thali Dataset (ITD).
Implements deterministic train/validation splitting (90/10), thali-specific data augmentations,
and strict nearest-neighbor resizing on masks to preserve discrete integer class IDs (0..50).
"""

import os
import random
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional

import numpy as np
from PIL import Image
import torch
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms.functional as TF
from torchvision.transforms import InterpolationMode

from ml.constants import NUM_CLASSES

# ImageNet normalization statistics
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def get_base_id_from_image(filename: str) -> str:
    """Extracts base sample ID from image filename (e.g. '..._leftImg8bit.jpg' -> '...')."""
    stem = Path(filename).stem
    if "_leftImg8bit" in stem:
        return stem.replace("_leftImg8bit", "")
    return stem


def get_base_id_from_mask(filename: str) -> str:
    """Extracts base sample ID from mask filename (e.g. '..._gtFine_labelIds.png' -> '...')."""
    stem = Path(filename).stem
    if "_gtFine_labelIds" in stem:
        return stem.replace("_gtFine_labelIds", "")
    elif "_mask" in stem:
        return stem.replace("_mask", "")
    return stem


class ThaliDataset(Dataset):
    """
    PyTorch Dataset for Indian Thali semantic segmentation.
    Loads paired RGB images and 8-bit single-channel integer masks.
    """

    def __init__(
        self,
        image_paths: List[Path],
        mask_paths: List[Path],
        image_size: Tuple[int, int] = (512, 512),
        is_train: bool = False,
        augment_p: float = 0.5
    ):
        assert len(image_paths) == len(mask_paths), (
            f"Image count ({len(image_paths)}) must match mask count ({len(mask_paths)})"
        )
        self.image_paths = image_paths
        self.mask_paths = mask_paths
        self.image_size = image_size
        self.is_train = is_train
        self.augment_p = augment_p

    def __len__(self) -> int:
        return len(self.image_paths)

    def _apply_augmentations(
        self, image: Image.Image, mask: Image.Image
    ) -> Tuple[Image.Image, Image.Image]:
        """
        Applies coordinated spatial augmentations to both image and mask,
        and photometric augmentations ONLY to the image.
        """
        # 1. Random Horizontal Flip
        if random.random() < self.augment_p:
            image = TF.hflip(image)
            mask = TF.hflip(mask)

        # 2. Random Vertical Flip (circular/top-down thali plates are rotationally symmetric)
        if random.random() < self.augment_p:
            image = TF.vflip(image)
            mask = TF.vflip(mask)

        # 3. Random Orthogonal Rotation (90, 180, 270 degrees)
        if random.random() < self.augment_p:
            angle = random.choice([90, 180, 270])
            image = TF.rotate(image, angle, interpolation=InterpolationMode.BILINEAR)
            mask = TF.rotate(mask, angle, interpolation=InterpolationMode.NEAREST)

        # 4. Photometric augmentations (image ONLY, never mask)
        if random.random() < self.augment_p:
            # Random brightness and contrast adjustment
            brightness_factor = random.uniform(0.85, 1.15)
            contrast_factor = random.uniform(0.85, 1.15)
            image = TF.adjust_brightness(image, brightness_factor)
            image = TF.adjust_contrast(image, contrast_factor)

        return image, mask

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        img_path = self.image_paths[idx]
        mask_path = self.mask_paths[idx]

        # Load image (RGB) and mask (8-bit integer grayscale 'L')
        with Image.open(img_path) as img:
            image = img.convert("RGB")
        with Image.open(mask_path) as msk:
            mask = msk.convert("L")

        # Apply training augmentations if in train mode
        if self.is_train:
            image, mask = self._apply_augmentations(image, mask)

        # Coordinated Resize:
        # Image resized with BILINEAR; Mask resized strictly with NEAREST to preserve discrete labels 0..50
        image = TF.resize(image, self.image_size, interpolation=InterpolationMode.BILINEAR)
        mask = TF.resize(mask, self.image_size, interpolation=InterpolationMode.NEAREST)

        # Convert Image to normalized Tensor [3, H, W]
        img_tensor = TF.to_tensor(image)  # Converts to float in [0.0, 1.0]
        img_tensor = TF.normalize(img_tensor, mean=IMAGENET_MEAN, std=IMAGENET_STD)

        # Convert Mask to LongTensor [H, W] with integer values exactly 0..50
        mask_np = np.array(mask, dtype=np.int64)
        mask_tensor = torch.from_numpy(mask_np)

        return {
            "pixel_values": img_tensor,
            "labels": mask_tensor,
            "image_path": str(img_path),
            "mask_path": str(mask_path)
        }


def get_thali_splits(
    dataset_dir: str = "data/raw/ITD",
    image_size: Tuple[int, int] = (512, 512),
    val_ratio: float = 0.1,
    seed: int = 42
) -> Tuple[ThaliDataset, ThaliDataset, ThaliDataset]:
    """
    Constructs train, validation, and test datasets.
    - Uses 90% of existing `train` set for training and 10% for validation (deterministic seed).
    - Preserves existing `test` set untouched for final evaluation.
    """
    root_path = Path(dataset_dir)
    train_dir = root_path / "train"
    test_dir = root_path / "test"

    if not train_dir.exists():
        raise FileNotFoundError(f"Training directory not found at {train_dir}")
    if not test_dir.exists():
        raise FileNotFoundError(f"Test directory not found at {test_dir}")

    # Pair training files
    train_images = sorted([f for f in (train_dir / "images").iterdir() if f.is_file() and not f.name.startswith(".")])
    train_masks = sorted([f for f in (train_dir / "masks").iterdir() if f.is_file() and not f.name.startswith(".")])

    train_img_map = {get_base_id_from_image(f.name): f for f in train_images}
    train_msk_map = {get_base_id_from_mask(f.name): f for f in train_masks}

    common_train_ids = sorted(list(set(train_img_map.keys()) & set(train_msk_map.keys())))
    assert len(common_train_ids) > 0, "No paired training image-mask samples found!"

    # Deterministic train/validation split
    rng = random.Random(seed)
    shuffled_ids = list(common_train_ids)
    rng.shuffle(shuffled_ids)

    val_count = int(len(shuffled_ids) * val_ratio)
    val_ids = set(shuffled_ids[:val_count])
    train_ids = set(shuffled_ids[val_count:])

    train_img_paths = [train_img_map[sid] for sid in common_train_ids if sid in train_ids]
    train_msk_paths = [train_msk_map[sid] for sid in common_train_ids if sid in train_ids]

    val_img_paths = [train_img_map[sid] for sid in common_train_ids if sid in val_ids]
    val_msk_paths = [train_msk_map[sid] for sid in common_train_ids if sid in val_ids]

    # Pair test files (untouched)
    test_images = sorted([f for f in (test_dir / "images").iterdir() if f.is_file() and not f.name.startswith(".")])
    test_masks = sorted([f for f in (test_dir / "masks").iterdir() if f.is_file() and not f.name.startswith(".")])

    test_img_map = {get_base_id_from_image(f.name): f for f in test_images}
    test_msk_map = {get_base_id_from_mask(f.name): f for f in test_masks}

    common_test_ids = sorted(list(set(test_img_map.keys()) & set(test_msk_map.keys())))
    assert len(common_test_ids) > 0, "No paired test image-mask samples found!"

    test_img_paths = [test_img_map[sid] for sid in common_test_ids]
    test_msk_paths = [test_msk_map[sid] for sid in common_test_ids]

    train_dataset = ThaliDataset(
        image_paths=train_img_paths,
        mask_paths=train_msk_paths,
        image_size=image_size,
        is_train=True
    )

    val_dataset = ThaliDataset(
        image_paths=val_img_paths,
        mask_paths=val_msk_paths,
        image_size=image_size,
        is_train=False
    )

    test_dataset = ThaliDataset(
        image_paths=test_img_paths,
        mask_paths=test_msk_paths,
        image_size=image_size,
        is_train=False
    )

    return train_dataset, val_dataset, test_dataset


def create_dataloaders(
    dataset_dir: str = "data/raw/ITD",
    batch_size: int = 8,
    image_size: Tuple[int, int] = (512, 512),
    val_ratio: float = 0.1,
    num_workers: int = 0,
    seed: int = 42
) -> Tuple[DataLoader, DataLoader, DataLoader]:
    """Creates PyTorch DataLoaders for train, validation, and test sets."""
    train_ds, val_ds, test_ds = get_thali_splits(
        dataset_dir=dataset_dir,
        image_size=image_size,
        val_ratio=val_ratio,
        seed=seed
    )

    train_loader = DataLoader(
        train_ds,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=torch.cuda.is_available(),
        drop_last=True
    )

    val_loader = DataLoader(
        val_ds,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=torch.cuda.is_available(),
        drop_last=False
    )

    test_loader = DataLoader(
        test_ds,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=torch.cuda.is_available(),
        drop_last=False
    )

    return train_loader, val_loader, test_loader
