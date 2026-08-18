"""
NutriVision AI - ML Constants & Indian Thali Dataset Metadata
Contains class mappings (0..50), label dictionaries, and color palettes for segmentation visualization.
"""

from typing import Dict, List, Tuple

NUM_CLASSES = 51

# 51 classes: 0 = background, 1..50 = Indian dishes from ITD benchmark
CLASS_NAMES: Dict[int, str] = {
    0: "background",
    1: "Aloo Dry fry",
    2: "Avakaya Muddha Papu Rice",
    3: "Baby-Corn & Capsicum-Dry",
    4: "Cabbage Pakodi",
    5: "Cabbage fry",
    6: "Capsicum Paneer Curry",
    7: "Chakar-Pongal",
    8: "Chole-Masala",
    9: "Cluster Beans Curry",
    10: "Cucumber-Raitha",
    11: "Gobi Masala Curry",
    12: "Gutti Vankaya Curry",
    13: "Jeera Rice",
    14: "Mixed Curry",
    15: "Muskmelon",
    16: "Rajma",
    17: "Rasgulla",
    18: "Sambar",
    19: "Tomato Rasam",
    20: "Vankaya-Ali-Karam",
    21: "Veg-Biriyani",
    22: "aloo-curry",
    23: "curd",
    24: "dal",
    25: "fresh-chutney",
    26: "green-salad",
    27: "Moong-Beans-Curry",
    28: "khichdi",
    29: "lemon-rice",
    30: "live-roti-with-ghee",
    31: "non-spicy-curry-bottle-gourd",
    32: "papad",
    33: "plain-rice",
    34: "watermelon",
    35: "Aloo-Fry",
    36: "Banana",
    37: "Mix-Fruit",
    38: "Non-Spicy-Baby-Corn & Capsicum-Dry",
    39: "Sweet",
    40: "Tomato-Rice",
    41: "fried-papad-rings",
    42: "gravy",
    43: "ivy-gourd-fry",
    44: "mango-pickle",
    45: "papad-chat",
    46: "pepper-rasam",
    47: "pineapple",
    48: "corn-fry",
    49: "paneer-curry",
    50: "semiya"
}

ID2LABEL: Dict[int, str] = {i: name for i, name in CLASS_NAMES.items()}
LABEL2ID: Dict[str, int] = {name: i for i, name in CLASS_NAMES.items()}

# Distinct RGB color palette for all 51 classes (for visualization & rendering)
PALETTE: List[Tuple[int, int, int]] = [
    (0, 0, 0),        # 0: background
    (255, 99, 71),    # 1: Aloo Dry fry
    (255, 140, 0),    # 2: Avakaya Muddha Papu Rice
    (255, 215, 0),    # 3: Baby-Corn & Capsicum-Dry
    (154, 205, 50),   # 4: Cabbage Pakodi
    (85, 107, 47),    # 5: Cabbage fry
    (50, 205, 50),    # 6: Capsicum Paneer Curry
    (0, 128, 0),      # 7: Chakar-Pongal
    (46, 139, 87),    # 8: Chole-Masala
    (102, 205, 170),  # 9: Cluster Beans Curry
    (64, 224, 208),   # 10: Cucumber-Raitha
    (70, 130, 180),   # 11: Gobi Masala Curry
    (30, 144, 255),   # 12: Gutti Vankaya Curry
    (65, 105, 225),   # 13: Jeera Rice
    (138, 43, 226),   # 14: Mixed Curry
    (186, 85, 211),   # 15: Muskmelon
    (218, 112, 214),  # 16: Rajma
    (255, 20, 147),   # 17: Rasgulla
    (255, 105, 180),  # 18: Sambar
    (219, 112, 147),  # 19: Tomato Rasam
    (255, 0, 128),    # 20: Vankaya-Ali-Karam
    (220, 20, 60),    # 21: Veg-Biriyani
    (178, 34, 34),    # 22: aloo-curry
    (240, 248, 255),  # 23: curd
    (255, 218, 185),  # 24: dal
    (210, 180, 140),  # 25: fresh-chutney
    (144, 238, 144),  # 26: green-salad
    (124, 252, 0),    # 27: Moong-Beans-Curry
    (238, 232, 170),  # 28: khichdi
    (255, 255, 0),    # 29: lemon-rice
    (205, 133, 63),   # 30: live-roti-with-ghee
    (152, 251, 152),  # 31: non-spicy-curry-bottle-gourd
    (245, 222, 179),  # 32: papad
    (255, 250, 240),  # 33: plain-rice
    (255, 69, 0),     # 34: watermelon
    (255, 165, 0),    # 35: Aloo-Fry
    (255, 235, 59),   # 36: Banana
    (255, 110, 180),  # 37: Mix-Fruit
    (205, 220, 57),   # 38: Non-Spicy-Baby-Corn & Capsicum-Dry
    (233, 30, 99),    # 39: Sweet
    (244, 67, 54),    # 40: Tomato-Rice
    (255, 193, 7),    # 41: fried-papad-rings
    (121, 85, 72),    # 42: gravy
    (0, 150, 136),    # 43: ivy-gourd-fry
    (255, 152, 0),    # 44: mango-pickle
    (255, 87, 34),    # 45: papad-chat
    (156, 39, 176),   # 46: pepper-rasam
    (255, 241, 118),  # 47: pineapple
    (255, 202, 40),   # 48: corn-fry
    (255, 171, 64),   # 49: paneer-curry
    (225, 190, 231),  # 50: semiya
]

# Dedicated Checkpoint Paths for SegFormer MiT-B0
DEFAULT_CHECKPOINT_DIR = "ml/checkpoints/segformer_mit_b0"
DEFAULT_BEST_MODEL_PATH = "ml/checkpoints/segformer_mit_b0/best_model.pth"
DEFAULT_LATEST_MODEL_PATH = "ml/checkpoints/segformer_mit_b0/latest_model.pth"

