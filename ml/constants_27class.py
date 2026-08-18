"""
NutriVision AI - 27-Class Food Ontology Constants & Palette
Maps Indian Thali items into 26 distinct nutritional categories + 1 background class.
"""

from typing import Dict, List, Tuple

NUM_CLASSES = 27

# ID to human-readable dish category name
CLASS_NAMES: Dict[int, str] = {
    0: "background",
    1: "plain-rice",
    2: "flavored-rice-pulao",
    3: "biryani",
    4: "khichdi",
    5: "roti-chapati",
    6: "puri-bhatura",
    7: "paratha-naan",
    8: "dal",
    9: "sambar",
    10: "rasam",
    11: "chole-chana",
    12: "rajma",
    13: "paneer-curry",
    14: "chicken-curry",
    15: "fish-curry",
    16: "egg-curry-boiled",
    17: "dry-veg-sabzi",
    18: "gravy-veg-curry",
    19: "curd-raita",
    20: "green-salad",
    21: "fresh-chutney",
    22: "pickle-achar",
    23: "papad-crisps",
    24: "fried-snacks-pakoda",
    25: "indian-sweets-dessert",
    26: "fresh-fruits",
}

ID2LABEL: Dict[int, str] = {k: v for k, v in CLASS_NAMES.items()}
LABEL2ID: Dict[str, int] = {v: k for k, v in CLASS_NAMES.items()}

# Exact mapping from 51-class ITD (0..50) to 27-class NutriVision ontology (0..26)
ITD_50_TO_27_MAPPING: Dict[int, int] = {
    0: 0,    # background -> background
    1: 17,   # Aloo Dry fry -> dry-veg-sabzi
    2: 2,    # Avakaya Muddha Papu Rice -> flavored-rice-pulao
    3: 17,   # Baby-Corn & Capsicum-Dry -> dry-veg-sabzi
    4: 24,   # Cabbage Pakodi -> fried-snacks-pakoda
    5: 17,   # Cabbage fry -> dry-veg-sabzi
    6: 13,   # Capsicum Paneer Curry -> paneer-curry
    7: 25,   # Chakar-Pongal -> indian-sweets-dessert
    8: 11,   # Chole-Masala -> chole-chana
    9: 17,   # Cluster Beans Curry -> dry-veg-sabzi
    10: 19,  # Cucumber-Raitha -> curd-raita
    11: 17,  # Gobi Masala Curry -> dry-veg-sabzi
    12: 18,  # Gutti Vankaya Curry -> gravy-veg-curry
    13: 2,   # Jeera Rice -> flavored-rice-pulao
    14: 18,  # Mixed Curry -> gravy-veg-curry
    15: 26,  # Muskmelon -> fresh-fruits
    16: 12,  # Rajma -> rajma
    17: 25,  # Rasgulla -> indian-sweets-dessert
    18: 9,   # Sambar -> sambar
    19: 10,  # Tomato Rasam -> rasam
    20: 17,  # Vankaya-Ali-Karam -> dry-veg-sabzi
    21: 3,   # Veg-Biriyani -> biryani
    22: 18,  # aloo-curry -> gravy-veg-curry
    23: 19,  # curd -> curd-raita
    24: 8,   # dal -> dal
    25: 21,  # fresh-chutney -> fresh-chutney
    26: 20,  # green-salad -> green-salad
    27: 8,   # Moong-Beans-Curry -> dal
    28: 4,   # khichdi -> khichdi
    29: 2,   # lemon-rice -> flavored-rice-pulao
    30: 5,   # live-roti-with-ghee -> roti-chapati
    31: 18,  # non-spicy-curry-bottle-gourd -> gravy-veg-curry
    32: 23,  # papad -> papad-crisps
    33: 1,   # plain-rice -> plain-rice
    34: 26,  # watermelon -> fresh-fruits
    35: 17,  # Aloo-Fry -> dry-veg-sabzi
    36: 26,  # Banana -> fresh-fruits
    37: 26,  # Mix-Fruit -> fresh-fruits
    38: 17,  # Non-Spicy-Baby-Corn & Capsicum-Dry -> dry-veg-sabzi
    39: 25,  # Sweet -> indian-sweets-dessert
    40: 2,   # Tomato-Rice -> flavored-rice-pulao
    41: 23,  # fried-papad-rings -> papad-crisps
    42: 18,  # gravy -> gravy-veg-curry
    43: 17,  # ivy-gourd-fry -> dry-veg-sabzi
    44: 22,  # mango-pickle -> pickle-achar
    45: 23,  # papad-chat -> papad-crisps
    46: 10,  # pepper-rasam -> rasam
    47: 26,  # pineapple -> fresh-fruits
    48: 17,  # corn-fry -> dry-veg-sabzi
    49: 13,  # paneer-curry -> paneer-curry
    50: 25,  # semiya -> indian-sweets-dessert
}

# 27 Distinct RGB Colors for Segmentation Palette
PALETTE: List[Tuple[int, int, int]] = [
    (0, 0, 0),         # 0:  background (black)
    (245, 245, 240),   # 1:  plain-rice (pearl white)
    (255, 204, 0),     # 2:  flavored-rice-pulao (saffron yellow)
    (218, 112, 214),   # 3:  biryani (orchid purple)
    (238, 232, 170),   # 4:  khichdi (pale goldenrod)
    (184, 115, 51),    # 5:  roti-chapati (wheat brown)
    (210, 105, 30),    # 6:  puri-bhatura (golden fried brown)
    (160, 82, 45),     # 7:  paratha-naan (sienna brown)
    (255, 165, 0),     # 8:  dal (orange-yellow)
    (178, 34, 34),     # 9:  sambar (firebrick red)
    (220, 20, 60),     # 10: rasam (crimson)
    (189, 140, 60),    # 11: chole-chana (chickpea tan)
    (139, 0, 0),       # 12: rajma (dark red / maroon)
    (255, 140, 0),     # 13: paneer-curry (deep orange)
    (205, 92, 92),     # 14: chicken-curry (indian red)
    (70, 130, 180),    # 15: fish-curry (steel blue)
    (255, 215, 0),     # 16: egg-curry-boiled (gold)
    (34, 139, 34),     # 17: dry-veg-sabzi (forest green)
    (154, 205, 50),    # 18: gravy-veg-curry (yellow green)
    (240, 255, 255),   # 19: curd-raita (azure white)
    (50, 205, 50),     # 20: green-salad (lime green)
    (0, 250, 154),     # 21: fresh-chutney (medium spring green)
    (255, 69, 0),      # 22: pickle-achar (red orange)
    (244, 164, 96),    # 23: papad-crisps (sandy brown)
    (175, 100, 30),    # 24: fried-snacks-pakoda (crispy brown)
    (255, 105, 180),   # 25: indian-sweets-dessert (hot pink)
    (0, 191, 255),     # 26: fresh-fruits (deep sky blue)
]
