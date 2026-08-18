"""
AI Dietitian & Adaptive Meal Planning Engine for NutriVision AI.
Generates real-time next-meal suggestions matching remaining macro deficits, 7-day personalized diet plans, and smart swaps.
"""

from typing import Dict, Any, List, Optional
import random

SMART_SWAPS_DB = [
    {
        "original": "White Polished Rice (150g)",
        "swap_to": "Steamed Quinoa or Brown Rice (150g)",
        "benefit": "+3g Protein, +2.5g Fiber, -20 Glycemic Index",
        "calories_saved": 20,
        "category": "Grains"
    },
    {
        "original": "Refined Flour Naan / Butter Roti (80g)",
        "swap_to": "Multigrain / Ragi / Whole Wheat Roti (50g)",
        "benefit": "+4g Fiber, Lowers insulin spike, -120 kcal",
        "calories_saved": 120,
        "category": "Breads"
    },
    {
        "original": "Deep-Fried French Fries (120g)",
        "swap_to": "Air-Fried Paprika Sweet Potato Wedges (120g)",
        "benefit": "-14g Saturated Fat, +Vitamin A & C, -160 kcal",
        "calories_saved": 160,
        "category": "Sides"
    },
    {
        "original": "Heavy Cream Paneer Curry (200g)",
        "swap_to": "Greek Yogurt & Tomato-Base Paneer Tikka (200g)",
        "benefit": "+8g Protein, -12g Fat, -140 kcal",
        "calories_saved": 140,
        "category": "Curries"
    },
    {
        "original": "Mayonnaise / Ranch Dressing (30g)",
        "swap_to": "Herbed Greek Yogurt & Lemon Dressing (30g)",
        "benefit": "-18g Fat, +4g Protein, -150 kcal",
        "calories_saved": 150,
        "category": "Dressings"
    },
    {
        "original": "Sugary Milk Chocolate Bar (50g)",
        "swap_to": "85% Dark Chocolate (20g) + 10 Almonds",
        "benefit": "-18g Refined Sugar, Rich in Magnesium & Polyphenols",
        "calories_saved": 90,
        "category": "Snacks"
    }
]


NEXT_MEAL_TEMPLATES = [
    {
        "id": "nm_paneer_quinoa",
        "name": "Grilled Spiced Paneer & Herb Quinoa Bowl",
        "suitable_for": ["vegetarian", "all", "high_protein"],
        "calories": 410,
        "protein_g": 26,
        "carbs_g": 38,
        "fat_g": 16,
        "fiber_g": 6.5,
        "prep_time": "15 mins",
        "description": "150g grilled paneer cubes seasoned with turmeric and cumin, served over 120g cooked fluffy quinoa and steamed broccoli.",
        "rationale": "High bioavailability protein that fulfills immediate muscle synthesis needs while maintaining a low glycemic response."
    },
    {
        "id": "nm_salmon_greens",
        "name": "Pan-Seared Lemon Salmon with Steamed Asparagus",
        "suitable_for": ["all", "keto_friendly", "high_protein"],
        "calories": 380,
        "protein_g": 34,
        "carbs_g": 6,
        "fat_g": 22,
        "fiber_g": 4.0,
        "prep_time": "18 mins",
        "description": "160g wild-caught salmon fillet pan-seared in 1 tsp olive oil with lemon zest, paired with 150g tender asparagus spears.",
        "rationale": "Rich in EPA/DHA Omega-3 fatty acids to reduce exercise-induced inflammation and deliver pure lean protein."
    },
    {
        "id": "nm_tofu_stirfry",
        "name": "Crispy Tofu & Edamame Veggie Stir-Fry",
        "suitable_for": ["vegan", "vegetarian", "all", "high_protein"],
        "calories": 340,
        "protein_g": 28,
        "carbs_g": 22,
        "fat_g": 14,
        "fiber_g": 8.0,
        "prep_time": "12 mins",
        "description": "180g pressed firm tofu cubes air-fried with 60g shelled edamame, bell peppers, baby spinach, and sesame-ginger sauce.",
        "rationale": "100% plant-based complete amino acid profile loaded with gut-healthy prebiotic fiber."
    },
    {
        "id": "nm_whey_berry_bowl",
        "name": "Greek Yogurt & Whey Protein Berry Parfait",
        "suitable_for": ["vegetarian", "all", "high_protein"],
        "calories": 270,
        "protein_g": 32,
        "carbs_g": 24,
        "fat_g": 3,
        "fiber_g": 5.0,
        "prep_time": "5 mins",
        "description": "200g non-fat Greek yogurt stirred with 1 scoop vanilla whey isolate, topped with 80g fresh blueberries and 1 tsp chia seeds.",
        "rationale": "Ultra-fast digestion protein delivery with zero refined fats, ideal for closing an evening protein gap."
    },
    {
        "id": "nm_egg_avocado_toast",
        "name": "Poached Eggs & Smashed Avocado Multigrain Toast",
        "suitable_for": ["all", "vegetarian"],
        "calories": 360,
        "protein_g": 20,
        "carbs_g": 28,
        "fat_g": 18,
        "fiber_g": 7.0,
        "prep_time": "10 mins",
        "description": "2 whole poached eggs on 1 slice toasted artisan sourdough, topped with 50g mashed avocado and microgreens.",
        "rationale": "Balanced source of whole-food choline, monounsaturated healthy fats, and sustained-release energy."
    },
    {
        "id": "nm_chana_sprout_salad",
        "name": "High-Fiber Sprouted Moong & Chana Sundal Bowl",
        "suitable_for": ["vegan", "vegetarian", "all", "diabetic_friendly"],
        "calories": 290,
        "protein_g": 18,
        "carbs_g": 42,
        "fat_g": 5,
        "fiber_g": 12.0,
        "prep_time": "8 mins",
        "description": "150g sprouted green moong and black chickpeas tossed with chopped cucumber, tomatoes, lemon juice, chaat masala, and fresh coriander.",
        "rationale": "Low glycemic index, rich in digestive enzymes, and excellent for natural blood glucose regulation."
    }
]


def recommend_next_meals(remaining_budget: Dict[str, Any], diet_preference: str = "all") -> List[Dict[str, Any]]:
    """
    Selects and scales next meal recommendations to fit the remaining daily macro window.
    """
    rem_cals = max(remaining_budget.get("remaining", {}).get("calories", 500), 200)
    rem_p = max(remaining_budget.get("remaining", {}).get("protein_g", 30), 10)

    suitable = []
    for tpl in NEXT_MEAL_TEMPLATES:
        if diet_preference != "all":
            if diet_preference not in tpl["suitable_for"] and "all" not in tpl["suitable_for"]:
                continue
        suitable.append(tpl)

    if not suitable:
        suitable = NEXT_MEAL_TEMPLATES

    # Select top 3 distinct options
    selected = suitable[:3] if len(suitable) >= 3 else suitable
    recommendations = []

    for item in selected:
        # Scale to match ~50-80% of remaining calorie deficit
        scale = min(max(rem_cals / item["calories"] * 0.75, 0.7), 1.4)
        scaled_cals = round(item["calories"] * scale, 0)
        scaled_p = round(item["protein_g"] * scale, 1)
        scaled_c = round(item["carbs_g"] * scale, 1)
        scaled_f = round(item["fat_g"] * scale, 1)
        scaled_fib = round(item["fiber_g"] * scale, 1)

        recommendations.append({
            "id": item["id"],
            "name": item["name"],
            "calories": int(scaled_cals),
            "protein_g": scaled_p,
            "carbs_g": scaled_c,
            "fat_g": scaled_f,
            "fiber_g": scaled_fib,
            "prep_time": item["prep_time"],
            "description": item["description"],
            "rationale": f"{item['rationale']} Covers {round(scaled_p/rem_p*100)}% of your remaining protein target."
        })

    return recommendations


def generate_7day_diet_plan(client_targets: Dict[str, Any], diet_type: str = "balanced") -> Dict[str, Any]:
    """
    Generates a personalized, structured 7-day meal plan.
    """
    target_cals = client_targets.get("daily_targets", {}).get("calories_kcal", 2000)
    target_p = client_targets.get("daily_targets", {}).get("protein_g", 130)

    # 4 meals per day distribution: Breakfast 25%, Lunch 35%, Snack 15%, Dinner 25%
    b_cals = int(target_cals * 0.25)
    l_cals = int(target_cals * 0.35)
    s_cals = int(target_cals * 0.15)
    d_cals = int(target_cals * 0.25)

    days_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    breakfast_options = [
        {"name": "Protein Oatmeal with Blueberries & Chia", "cals": b_cals, "p": round(target_p * 0.25, 1)},
        {"name": "Egg White & Spinach Omelette with Whole Wheat Toast", "cals": b_cals, "p": round(target_p * 0.28, 1)},
        {"name": "Greek Yogurt Berry Bowl with Crushed Almonds", "cals": b_cals, "p": round(target_p * 0.26, 1)},
        {"name": "Moong Dal Cheela with Mint Paneer Stuffing", "cals": b_cals, "p": round(target_p * 0.24, 1)}
    ]

    lunch_options = [
        {"name": "Grilled Chicken Breast / Tofu with Brown Rice & Steamed Asparagus", "cals": l_cals, "p": round(target_p * 0.38, 1)},
        {"name": "Traditional Indian Thali (Yellow Dal, Paneer Tikka, 2 Rotis, Kachumber)", "cals": l_cals, "p": round(target_p * 0.35, 1)},
        {"name": "Mediterranean Quinoa Bowl with Feta & Olive Greens", "cals": l_cals, "p": round(target_p * 0.34, 1)},
        {"name": "Chana Masala with Spiced Millet Pilaf and Sautéed Spinach", "cals": l_cals, "p": round(target_p * 0.32, 1)}
    ]

    snack_options = [
        {"name": "Sprouted Chana Chaat with Lemon & Herbs", "cals": s_cals, "p": round(target_p * 0.12, 1)},
        {"name": "Whey Isolate Shake with 1 Apple", "cals": s_cals, "p": round(target_p * 0.20, 1)},
        {"name": "Roasted Makhana (Foxnuts) with 10 Walnuts", "cals": s_cals, "p": round(target_p * 0.10, 1)},
        {"name": "Edamame Pods with Sea Salt", "cals": s_cals, "p": round(target_p * 0.14, 1)}
    ]

    dinner_options = [
        {"name": "Pan-Seared Salmon Fillet / Paneer Skewers with Roasted Broccoli", "cals": d_cals, "p": round(target_p * 0.28, 1)},
        {"name": "Lentil Soup (Dal Tadka) with 1 Multigrain Roti and Cucumber Salad", "cals": d_cals, "p": round(target_p * 0.24, 1)},
        {"name": "Grilled Herb Chicken Breast with Zucchini & Cauliflower Mash", "cals": d_cals, "p": round(target_p * 0.30, 1)},
        {"name": "Tofu Vegetable Curry with Steamed Quinoa", "cals": d_cals, "p": round(target_p * 0.26, 1)}
    ]

    weekly_plan = []
    for i, day in enumerate(days_names):
        b = breakfast_options[i % len(breakfast_options)]
        l = lunch_options[i % len(lunch_options)]
        s = snack_options[i % len(snack_options)]
        d = dinner_options[i % len(dinner_options)]
        
        day_cals = b["cals"] + l["cals"] + s["cals"] + d["cals"]
        day_p = round(b["p"] + l["p"] + s["p"] + d["p"], 1)

        weekly_plan.append({
            "day": day,
            "total_calories": day_cals,
            "total_protein_g": day_p,
            "meals": {
                "breakfast": {"title": b["name"], "calories": b["cals"], "protein_g": b["p"]},
                "lunch": {"title": l["name"], "calories": l["cals"], "protein_g": l["p"]},
                "snack": {"title": s["name"], "calories": s["cals"], "protein_g": s["p"]},
                "dinner": {"title": d["name"], "calories": d["cals"], "protein_g": d["p"]}
            }
        })

    shopping_list = [
        {"category": "Proteins", "items": ["Chicken Breast / Organic Firm Tofu", "Fresh Low-Fat Paneer", "Greek Yogurt (Non-Fat)", "Eggs / Egg Whites", "Whey Protein Isolate"]},
        {"category": "Complex Carbs & Grains", "items": ["Rolled Oats", "Organic Quinoa", "Brown Basmati Rice", "Whole Wheat / Multigrain Flour", "Sprouted Moong & Black Chickpeas"]},
        {"category": "Vegetables & Fruits", "items": ["Fresh Broccoli Florets", "Baby Spinach / Palak", "Cucumbers & Cherry Tomatoes", "Fresh Blueberries & Bananas", "Asparagus Spears"]},
        {"category": "Healthy Fats & Extras", "items": ["Raw Almonds & Walnuts", "Black Chia Seeds", "Extra Virgin Olive Oil", "Natural Peanut Butter", "Turmeric, Cumin, Herbs & Spices"]}
    ]

    return {
        "client_target_calories": target_cals,
        "client_target_protein_g": target_p,
        "diet_type": diet_type,
        "weekly_schedule": weekly_plan,
        "grocery_checklist": shopping_list,
        "smart_swaps": SMART_SWAPS_DB
    }
