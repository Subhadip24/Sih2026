"""
Preset benchmark meal plates and ground truth annotations for ThaalTatva AI.
Provides rich bounding boxes, polygon coordinates, and reference gram weights for demo plates.
"""

from typing import Dict, Any, List

PRESET_PLATES: Dict[str, Dict[str, Any]] = {
    "indian_thali_pre": {
        "id": "indian_thali_pre",
        "title": "Traditional Indian Thali (Pre-Meal)",
        "type": "pre_meal",
        "image_file": "indian_thali_pre.jpg",
        "diet_type": "Vegetarian",
        "cuisine": "Indian",
        "description": "Wholesome Indian balanced platter with yellow dal, paneer gravy, basmati rice, 2 rotis, and fresh cucumber salad.",
        "detected_items": [
            {
                "food_id": "paneer_tikka",
                "name": "Paneer Tikka Gravy",
                "box_2d": [260, 160, 530, 430],
                "polygon": [[160, 260], [430, 260], [430, 530], [160, 530]],
                "confidence": 0.98,
                "estimated_grams": 150.0,
                "food_group": "protein",
                "density_g_cm3": 1.05
            },
            {
                "food_id": "yellow_dal",
                "name": "Yellow Moong Dal Tadka",
                "box_2d": [535, 220, 810, 490],
                "polygon": [[220, 535], [490, 535], [490, 810], [220, 810]],
                "confidence": 0.97,
                "estimated_grams": 180.0,
                "food_group": "composite",
                "density_g_cm3": 1.08
            },
            {
                "food_id": "steamed_basmati_rice",
                "name": "Steamed Basmati Rice",
                "box_2d": [365, 415, 650, 680],
                "polygon": [[415, 365], [680, 365], [680, 650], [415, 650]],
                "confidence": 0.99,
                "estimated_grams": 160.0,
                "food_group": "carbs",
                "density_g_cm3": 0.85
            },
            {
                "food_id": "whole_wheat_roti",
                "name": "Whole Wheat Roti (2 pcs)",
                "box_2d": [135, 375, 380, 775],
                "polygon": [[375, 135], [775, 135], [775, 380], [375, 380]],
                "confidence": 0.96,
                "estimated_grams": 75.0,
                "food_group": "carbs",
                "density_g_cm3": 0.70
            },
            {
                "food_id": "cucumber_salad",
                "name": "Cucumber Kachumber Salad",
                "box_2d": [300, 675, 530, 905],
                "polygon": [[675, 300], [905, 300], [905, 530], [675, 530]],
                "confidence": 0.95,
                "estimated_grams": 85.0,
                "food_group": "vegetables",
                "density_g_cm3": 0.65
            }
        ]
    },
    "indian_thali_post": {
        "id": "indian_thali_post",
        "title": "Traditional Indian Thali (Post-Meal Leftover)",
        "type": "post_meal",
        "matching_pre_id": "indian_thali_pre",
        "image_file": "indian_thali_post.jpg",
        "diet_type": "Vegetarian",
        "cuisine": "Indian",
        "description": "Post-meal plate showing all rotis and paneer consumed, 50% rice leftover, 39% dal remaining, and 47% salad remaining.",
        "detected_items": [
            {
                "food_id": "paneer_tikka",
                "name": "Paneer Tikka (Finished - Sauce Trace)",
                "box_2d": [260, 160, 530, 430],
                "confidence": 0.94,
                "estimated_grams": 5.0,
                "food_group": "protein",
                "leftover_ratio": 0.03
            },
            {
                "food_id": "yellow_dal",
                "name": "Yellow Dal (Remaining portion)",
                "box_2d": [535, 220, 810, 490],
                "confidence": 0.95,
                "estimated_grams": 70.0,
                "food_group": "composite",
                "leftover_ratio": 0.39
            },
            {
                "food_id": "steamed_basmati_rice",
                "name": "Steamed Rice (50% remaining)",
                "box_2d": [365, 415, 650, 680],
                "confidence": 0.97,
                "estimated_grams": 80.0,
                "food_group": "carbs",
                "leftover_ratio": 0.50
            },
            {
                "food_id": "whole_wheat_roti",
                "name": "Whole Wheat Roti (100% Consumed)",
                "box_2d": [135, 375, 380, 775],
                "confidence": 0.98,
                "estimated_grams": 0.0,
                "food_group": "carbs",
                "leftover_ratio": 0.0
            },
            {
                "food_id": "cucumber_salad",
                "name": "Cucumber Salad (Remaining)",
                "box_2d": [300, 675, 530, 905],
                "confidence": 0.93,
                "estimated_grams": 40.0,
                "food_group": "vegetables",
                "leftover_ratio": 0.47
            }
        ]
    },
    "chicken_rice_pre": {
        "id": "chicken_rice_pre",
        "title": "Lean Chicken, Brown Rice & Greens (Pre-Meal)",
        "type": "pre_meal",
        "image_file": "chicken_rice_pre.jpg",
        "diet_type": "High-Protein / Fitness",
        "cuisine": "Clean Fitness Prep",
        "description": "High-protein athlete meal prep with sliced grilled chicken breast, complex brown rice, steamed green asparagus, and glazed baby carrots.",
        "detected_items": [
            {
                "food_id": "grilled_chicken_breast",
                "name": "Grilled Chicken Breast Slices",
                "box_2d": [255, 185, 790, 475],
                "polygon": [[185, 255], [475, 255], [475, 790], [185, 790]],
                "confidence": 0.99,
                "estimated_grams": 180.0,
                "food_group": "protein",
                "density_g_cm3": 1.05
            },
            {
                "food_id": "brown_rice",
                "name": "Steamed Brown Rice",
                "box_2d": [200, 380, 765, 630],
                "polygon": [[380, 200], [630, 200], [630, 765], [380, 765]],
                "confidence": 0.98,
                "estimated_grams": 160.0,
                "food_group": "carbs",
                "density_g_cm3": 0.88
            },
            {
                "food_id": "steamed_asparagus",
                "name": "Steamed Green Asparagus",
                "box_2d": [215, 505, 790, 785],
                "polygon": [[505, 215], [785, 215], [785, 790], [505, 790]],
                "confidence": 0.97,
                "estimated_grams": 110.0,
                "food_group": "vegetables",
                "density_g_cm3": 0.60
            },
            {
                "food_id": "baby_carrots",
                "name": "Steamed Baby Carrots",
                "box_2d": [395, 645, 770, 835],
                "polygon": [[645, 395], [835, 395], [835, 770], [645, 770]],
                "confidence": 0.96,
                "estimated_grams": 90.0,
                "food_group": "vegetables",
                "density_g_cm3": 0.75
            }
        ]
    },
    "chicken_rice_post": {
        "id": "chicken_rice_post",
        "title": "Lean Chicken & Rice (Post-Meal Leftover)",
        "type": "post_meal",
        "matching_pre_id": "chicken_rice_pre",
        "image_file": "chicken_rice_post.jpg",
        "diet_type": "High-Protein / Fitness",
        "cuisine": "Clean Fitness Prep",
        "description": "Post-meal plate with 100% chicken consumed, 100% carrots consumed, 40g asparagus leftover, and 65g brown rice leftover.",
        "detected_items": [
            {
                "food_id": "grilled_chicken_breast",
                "name": "Grilled Chicken Breast (100% Consumed)",
                "box_2d": [255, 185, 790, 475],
                "confidence": 0.98,
                "estimated_grams": 0.0,
                "food_group": "protein",
                "leftover_ratio": 0.0
            },
            {
                "food_id": "brown_rice",
                "name": "Brown Rice (Leftover 41%)",
                "box_2d": [190, 365, 780, 655],
                "confidence": 0.96,
                "estimated_grams": 65.0,
                "food_group": "carbs",
                "leftover_ratio": 0.41
            },
            {
                "food_id": "steamed_asparagus",
                "name": "Steamed Asparagus (2 spears left)",
                "box_2d": [225, 625, 550, 775],
                "confidence": 0.95,
                "estimated_grams": 40.0,
                "food_group": "vegetables",
                "leftover_ratio": 0.36
            },
            {
                "food_id": "baby_carrots",
                "name": "Baby Carrots (100% Consumed)",
                "box_2d": [395, 645, 770, 835],
                "confidence": 0.97,
                "estimated_grams": 0.0,
                "food_group": "vegetables",
                "leftover_ratio": 0.0
            }
        ]
    },
    "salmon_bowl_pre": {
        "id": "salmon_bowl_pre",
        "title": "Salmon, Quinoa & Avocado Superfood Bowl",
        "type": "pre_meal",
        "image_file": "salmon_bowl_pre.jpg",
        "diet_type": "Omega-3 / Superfood",
        "cuisine": "Contemporary Healthy",
        "description": "Nutrient-dense superfood bowl with crispy pan-seared salmon fillet, tri-color quinoa, steamed broccoli florets, and sliced avocado.",
        "detected_items": [
            {
                "food_id": "grilled_salmon",
                "name": "Pan-Seared Salmon Fillet",
                "box_2d": [220, 205, 675, 580],
                "polygon": [[205, 220], [580, 220], [580, 675], [205, 675]],
                "confidence": 0.99,
                "estimated_grams": 170.0,
                "food_group": "protein",
                "density_g_cm3": 1.04
            },
            {
                "food_id": "cooked_quinoa",
                "name": "Tri-Color Quinoa",
                "box_2d": [510, 265, 835, 570],
                "polygon": [[265, 510], [570, 510], [570, 835], [265, 835]],
                "confidence": 0.98,
                "estimated_grams": 150.0,
                "food_group": "carbs",
                "density_g_cm3": 0.85
            },
            {
                "food_id": "steamed_broccoli",
                "name": "Steamed Broccoli Florets",
                "box_2d": [485, 485, 790, 805],
                "polygon": [[485, 485], [805, 485], [805, 790], [485, 790]],
                "confidence": 0.98,
                "estimated_grams": 120.0,
                "food_group": "vegetables",
                "density_g_cm3": 0.55
            },
            {
                "food_id": "avocado_slices",
                "name": "Hass Avocado Slices",
                "box_2d": [260, 535, 530, 795],
                "polygon": [[535, 260], [795, 260], [795, 530], [535, 530]],
                "confidence": 0.97,
                "estimated_grams": 75.0,
                "food_group": "fats",
                "density_g_cm3": 0.90
            }
        ]
    },
    "mediterranean_salad": {
        "id": "mediterranean_salad",
        "title": "Mediterranean Greek Chicken Salad",
        "type": "pre_meal",
        "image_file": "mediterranean_salad.jpg",
        "diet_type": "Keto / Low-Carb",
        "cuisine": "Mediterranean",
        "description": "Fresh vibrant Mediterranean bowl with grilled herb chicken strips, creamy feta cubes, crisp cucumbers, cherry tomatoes, and Kalamata olives.",
        "detected_items": [
            {
                "food_id": "grilled_chicken_breast",
                "name": "Herb Grilled Chicken Strips",
                "box_2d": [565, 385, 860, 805],
                "polygon": [[385, 565], [805, 565], [805, 860], [385, 860]],
                "confidence": 0.99,
                "estimated_grams": 140.0,
                "food_group": "protein",
                "density_g_cm3": 1.05
            },
            {
                "food_id": "feta_cheese",
                "name": "Greek Feta Cheese Cubes",
                "box_2d": [455, 380, 690, 610],
                "polygon": [[380, 455], [610, 455], [610, 690], [380, 690]],
                "confidence": 0.98,
                "estimated_grams": 55.0,
                "food_group": "dairy",
                "density_g_cm3": 1.02
            },
            {
                "food_id": "cucumber_salad",
                "name": "Cucumbers & Cherry Tomatoes",
                "box_2d": [255, 510, 485, 785],
                "polygon": [[510, 255], [785, 255], [785, 485], [510, 485]],
                "confidence": 0.97,
                "estimated_grams": 110.0,
                "food_group": "vegetables",
                "density_g_cm3": 0.65
            },
            {
                "food_id": "kalamata_olives",
                "name": "Kalamata Black Olives",
                "box_2d": [435, 595, 625, 830],
                "polygon": [[595, 435], [830, 435], [830, 625], [595, 625]],
                "confidence": 0.96,
                "estimated_grams": 40.0,
                "food_group": "fats",
                "density_g_cm3": 0.95
            }
        ]
    },
    "fitness_oatmeal": {
        "id": "fitness_oatmeal",
        "title": "High-Protein Oatmeal Super-Bowl",
        "type": "pre_meal",
        "image_file": "fitness_oatmeal.jpg",
        "diet_type": "High-Fiber / Energy",
        "cuisine": "Clean Breakfast",
        "description": "Energizing fitness breakfast with rolled oats, sliced bananas, antioxidant-rich blueberries, chia seeds, sliced almonds, and peanut butter drizzle.",
        "detected_items": [
            {
                "food_id": "rolled_oats_cooked",
                "name": "Rolled Oatmeal Base",
                "box_2d": [235, 255, 745, 745],
                "polygon": [[255, 235], [745, 235], [745, 745], [255, 745]],
                "confidence": 0.99,
                "estimated_grams": 220.0,
                "food_group": "carbs",
                "density_g_cm3": 0.95
            },
            {
                "food_id": "fresh_blueberries",
                "name": "Fresh Blueberries",
                "box_2d": [270, 395, 510, 605],
                "polygon": [[395, 270], [605, 270], [605, 510], [395, 510]],
                "confidence": 0.98,
                "estimated_grams": 60.0,
                "food_group": "fruits",
                "density_g_cm3": 0.65
            },
            {
                "food_id": "banana_slices",
                "name": "Fresh Banana Coins",
                "box_2d": [310, 305, 725, 520],
                "polygon": [[305, 310], [520, 310], [520, 725], [305, 725]],
                "confidence": 0.98,
                "estimated_grams": 85.0,
                "food_group": "fruits",
                "density_g_cm3": 0.70
            },
            {
                "food_id": "chia_seeds",
                "name": "Black Chia Seeds",
                "box_2d": [290, 505, 700, 715],
                "polygon": [[505, 290], [715, 290], [715, 700], [505, 700]],
                "confidence": 0.96,
                "estimated_grams": 15.0,
                "food_group": "fats",
                "density_g_cm3": 0.65
            },
            {
                "food_id": "peanut_butter",
                "name": "Natural Peanut Butter Drizzle",
                "box_2d": [300, 345, 690, 730],
                "polygon": [[345, 300], [730, 300], [730, 690], [345, 690]],
                "confidence": 0.95,
                "estimated_grams": 25.0,
                "food_group": "fats",
                "density_g_cm3": 1.10
            },
            {
                "food_id": "almonds_sliced",
                "name": "Raw Sliced Almonds",
                "box_2d": [370, 580, 680, 735],
                "polygon": [[580, 370], [735, 370], [735, 680], [580, 680]],
                "confidence": 0.97,
                "estimated_grams": 20.0,
                "food_group": "fats",
                "density_g_cm3": 0.60
            }
        ]
    }
}
