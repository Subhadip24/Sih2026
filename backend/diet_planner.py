"""
AI Dietitian & Adaptive Meal Planning Engine for ThaalTatva AI.
Generates tailored 7-day meal plans and real-time next meal recommendations to close macro deficits.
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
    Generates a personalized, structured 7-day meal plan dynamically tailored to
    dietary preference (balanced, vegetarian, vegan, keto, diabetic, athlete_bulk)
    and target calories/protein.
    """
    if "daily_targets" in client_targets:
        dt = client_targets["daily_targets"]
        target_cals = float(dt.get("calories_kcal", dt.get("calories", 2000)))
        target_p = float(dt.get("protein_g", dt.get("protein", 130)))
    else:
        target_cals = float(client_targets.get("calories_kcal", client_targets.get("calories", 2000)))
        target_p = float(client_targets.get("protein_g", client_targets.get("protein", 130)))

    target_cals = max(1200, min(int(target_cals), 4500))
    target_p = max(50, min(int(target_p), 300))

    # 4 meals per day distribution: Breakfast 25%, Lunch 35%, Snack 15%, Dinner 25%
    b_cals = int(target_cals * 0.25)
    l_cals = int(target_cals * 0.35)
    s_cals = int(target_cals * 0.15)
    d_cals = int(target_cals * 0.25)

    days_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    diet_type_key = diet_type.lower().strip() if diet_type else "balanced"

    if "veg" in diet_type_key and "vegan" not in diet_type_key:
        # Indian Vegetarian
        breakfast_options = [
            {"name": "Moong Dal Cheela with Mint Paneer Stuffing", "cals": b_cals, "p": round(target_p * 0.25, 1)},
            {"name": "Paneer Bhurji with 2 Multigrain Rotis & Tomato Kachumber", "cals": b_cals, "p": round(target_p * 0.28, 1)},
            {"name": "Greek Dahi Berry Parfait with Crushed Walnuts & Chia", "cals": b_cals, "p": round(target_p * 0.24, 1)},
            {"name": "High-Protein Sprouted Besan Chilla with Green Chutney", "cals": b_cals, "p": round(target_p * 0.26, 1)}
        ]
        lunch_options = [
            {"name": "Yellow Dal Tadka with Grilled Paneer Tikka & Brown Rice", "cals": l_cals, "p": round(target_p * 0.36, 1)},
            {"name": "Spiced Rajma Masala with Steamed Quinoa & Cucumber Raita", "cals": l_cals, "p": round(target_p * 0.35, 1)},
            {"name": "Palak Paneer with Jowar Roti & Sautéed Mixed Veggies", "cals": l_cals, "p": round(target_p * 0.34, 1)},
            {"name": "Chole Chickpea Curry with Spiced Millet Pilaf", "cals": l_cals, "p": round(target_p * 0.33, 1)}
        ]
        snack_options = [
            {"name": "Sprouted Black Chana Chaat with Fresh Lemon & Herbs", "cals": s_cals, "p": round(target_p * 0.14, 1)},
            {"name": "Roasted Makhana (Foxnuts) with 12 Almonds", "cals": s_cals, "p": round(target_p * 0.10, 1)},
            {"name": "Low-Fat Masala Paneer Cubes with Mint Sprinkle", "cals": s_cals, "p": round(target_p * 0.16, 1)},
            {"name": "Whey Protein / Sattu Shake with Chia Seeds", "cals": s_cals, "p": round(target_p * 0.18, 1)}
        ]
        dinner_options = [
            {"name": "Lentil Soup (Moong Dal) with 1 Multigrain Roti & Paneer Salad", "cals": d_cals, "p": round(target_p * 0.26, 1)},
            {"name": "Soya Chunks Curry with Steamed Broccoli & Quinoa", "cals": d_cals, "p": round(target_p * 0.32, 1)},
            {"name": "Grilled Herbed Paneer Skewers with Roasted Asparagus & Bell Peppers", "cals": d_cals, "p": round(target_p * 0.28, 1)},
            {"name": "Warm Sprouted Lentil Broth with Multigrain Toast", "cals": d_cals, "p": round(target_p * 0.24, 1)}
        ]
        shopping_list = [
            {"category": "Vegetarian Proteins", "items": ["Fresh Low-Fat Paneer (1kg)", "Organic Soya Chunks (500g)", "Greek Dahi / Curd (1kg)", "Whey Protein / Sattu", "Sprouted Moong & Black Chana"]},
            {"category": "Complex Grains & Dal", "items": ["Yellow Moong Dal & Toor Dal", "Rajma & Chana", "Organic Quinoa & Brown Basmati", "Jowar / Multigrain Flour", "Rolled Oats"]},
            {"category": "Fresh Vegetables & Greens", "items": ["Baby Spinach (Palak)", "Fresh Broccoli Florets", "Cucumbers, Tomatoes & Mint", "Asparagus & Bell Peppers", "Lemons & Ginger"]},
            {"category": "Healthy Fats & Seasoning", "items": ["Raw Almonds & Walnuts", "Black Chia & Flax Seeds", "Pure Cold-Pressed Mustard / Olive Oil", "Roasted Foxnuts (Makhana)", "Himalayan Pink Salt & Turmeric"]}
        ]

    elif "vegan" in diet_type_key:
        # 100% Plant-Based
        breakfast_options = [
            {"name": "Turmeric Tofu Scramble with Whole Grain Toast & Avocado", "cals": b_cals, "p": round(target_p * 0.26, 1)},
            {"name": "Rolled Oatmeal with Pea Protein, Blueberries & Chia Seeds", "cals": b_cals, "p": round(target_p * 0.25, 1)},
            {"name": "Almond Milk Chia Pudding with Hemp Hearts & Banana Slices", "cals": b_cals, "p": round(target_p * 0.22, 1)},
            {"name": "Sprouted Moong & Chickpea Cheela with Coconut-Mint Chutney", "cals": b_cals, "p": round(target_p * 0.24, 1)}
        ]
        lunch_options = [
            {"name": "Air-Fried Crispy Tofu & Edamame Quinoa Bowl with Tahini", "cals": l_cals, "p": round(target_p * 0.36, 1)},
            {"name": "Spiced Lentil Dal Tadka with Brown Basmati & Steamed Kale", "cals": l_cals, "p": round(target_p * 0.32, 1)},
            {"name": "Tempeh Vegetable Curry with Tri-Color Quinoa & Asparagus", "cals": l_cals, "p": round(target_p * 0.38, 1)},
            {"name": "Mediterranean Chickpea & Roast Veggie Platter with Hummus", "cals": l_cals, "p": round(target_p * 0.33, 1)}
        ]
        snack_options = [
            {"name": "Steamed Sea-Salt Edamame Pods", "cals": s_cals, "p": round(target_p * 0.16, 1)},
            {"name": "Sprouted Chana Chaat with Lime & Coriander", "cals": s_cals, "p": round(target_p * 0.14, 1)},
            {"name": "Plant Protein Isolate Shake with Unsweetened Almond Milk", "cals": s_cals, "p": round(target_p * 0.18, 1)},
            {"name": "Roasted Pumpkin Seeds & Brazil Nuts", "cals": s_cals, "p": round(target_p * 0.11, 1)}
        ]
        dinner_options = [
            {"name": "Grilled Tofu Vegetable Skewers with Sautéed Spinach & Garlic", "cals": d_cals, "p": round(target_p * 0.28, 1)},
            {"name": "Hearty Green Lentil & Vegetable Broth with Multigrain Toast", "cals": d_cals, "p": round(target_p * 0.26, 1)},
            {"name": "Szechuan Pepper Tofu & Broccoli with Steamed Wild Rice", "cals": d_cals, "p": round(target_p * 0.30, 1)},
            {"name": "Sprouted Moong Bowl with Sliced Avocado & Cherry Tomatoes", "cals": d_cals, "p": round(target_p * 0.25, 1)}
        ]
        shopping_list = [
            {"category": "Plant Proteins", "items": ["Organic Firm Tofu (1kg)", "Organic Tempeh (500g)", "Shelled Edamame (500g)", "Pea/Rice Protein Powder", "Sprouted Lentils & Chickpeas"]},
            {"category": "Whole Grains & Pulses", "items": ["Tri-Color Quinoa", "Brown Basmati Rice", "Yellow Moong & Green Lentils", "Rolled Oats", "Hemp Hearts"]},
            {"category": "Greens & Produce", "items": ["Broccoli & Kale", "Baby Spinach & Asparagus", "Avocados (4 pcs)", "Cherry Tomatoes & Bell Peppers", "Limes, Garlic & Ginger"]},
            {"category": "Healthy Fats & Extras", "items": ["Tahini & Pumpkin Seeds", "Raw Walnuts & Chia Seeds", "Extra Virgin Olive Oil", "Unsweetened Almond Milk", "Nutritional Yeast"]}
        ]

    elif "keto" in diet_type_key:
        # Ketogenic Low-Carb High-Fat
        breakfast_options = [
            {"name": "Spinach & Mushroom Omelette with Sliced Avocado & Olive Oil", "cals": b_cals, "p": round(target_p * 0.28, 1)},
            {"name": "Grilled Herbed Paneer Steak with Sautéed Asparagus", "cals": b_cals, "p": round(target_p * 0.26, 1)},
            {"name": "Scrambled Eggs in Butter with Smoked Salmon & Chives", "cals": b_cals, "p": round(target_p * 0.30, 1)},
            {"name": "Chia & Coconut Milk Cream Bowl with Crushed Pecans", "cals": b_cals, "p": round(target_p * 0.20, 1)}
        ]
        lunch_options = [
            {"name": "Pan-Seared Salmon Fillet with Garlic Butter Cauliflower Rice", "cals": l_cals, "p": round(target_p * 0.36, 1)},
            {"name": "Grilled Chicken Thighs with Roasted Zucchini & Feta Salad", "cals": l_cals, "p": round(target_p * 0.38, 1)},
            {"name": "Paneer Tikka in Rich Cream Tomato Gravy (Zero Naan)", "cals": l_cals, "p": round(target_p * 0.32, 1)},
            {"name": "Mediterranean Greek Salad with Herb Chicken & Extra Olives", "cals": l_cals, "p": round(target_p * 0.35, 1)}
        ]
        snack_options = [
            {"name": "Whole Hass Avocado with Sea Salt & Lemon", "cals": s_cals, "p": round(target_p * 0.08, 1)},
            {"name": "Roasted Almonds & Macadamia Nuts", "cals": s_cals, "p": round(target_p * 0.12, 1)},
            {"name": "Keto Whey Protein Shake with MCT Oil", "cals": s_cals, "p": round(target_p * 0.18, 1)},
            {"name": "Full-Fat Cottage Cheese / Paneer with Herb Olive Oil", "cals": s_cals, "p": round(target_p * 0.16, 1)}
        ]
        dinner_options = [
            {"name": "Grilled Herb Chicken Breast with Broccoli in Cheddar Sauce", "cals": d_cals, "p": round(target_p * 0.32, 1)},
            {"name": "Pan-Roasted Lemon Paneer with Sautéed Spinach & Garlic", "cals": d_cals, "p": round(target_p * 0.28, 1)},
            {"name": "Baked Herb Salmon Fillet with Asparagus Spears & Butter", "cals": d_cals, "p": round(target_p * 0.30, 1)},
            {"name": "Spiced Ground Chicken / Soya Bowl with Avocado Crema", "cals": d_cals, "p": round(target_p * 0.34, 1)}
        ]
        shopping_list = [
            {"category": "Keto Proteins", "items": ["Wild Salmon Fillets / Chicken Thighs", "Full-Fat Fresh Paneer", "Free-Range Pastured Eggs", "Greek Feta Cheese", "Zero-Carb Whey Isolate"]},
            {"category": "Low-Carb Veggies", "items": ["Cauliflower (for rice)", "Fresh Zucchini & Broccoli", "Asparagus Spears", "Baby Spinach & Salad Greens", "Hass Avocados (6 pcs)"]},
            {"category": "Healthy Fats & Oils", "items": ["Extra Virgin Olive Oil", "Pure Grass-Fed Ghee / Butter", "MCT Oil", "Kalamata Olives", "Full-Fat Coconut Milk"]},
            {"category": "Keto Crunch & Extras", "items": ["Macadamia Nuts & Pecans", "Raw Almonds", "Hemp Seeds & Chia Seeds", "Pink Himalayan Rock Salt", "Herbes de Provence"]}
        ]

    elif "diabetic" in diet_type_key:
        # Low Glycemic Index & High Soluble Fiber
        breakfast_options = [
            {"name": "Sprouted Moong & Methi Cheela with Flaxseed Chutney", "cals": b_cals, "p": round(target_p * 0.26, 1)},
            {"name": "Steel-Cut Cinnamon Oats with Chia Seeds & Sliced Almonds", "cals": b_cals, "p": round(target_p * 0.24, 1)},
            {"name": "Egg White & Spinach Omelette with 1 Multigrain Roti", "cals": b_cals, "p": round(target_p * 0.28, 1)},
            {"name": "Low-Fat Dahi Berry Bowl with Ceylon Cinnamon Sprinkle", "cals": b_cals, "p": round(target_p * 0.22, 1)}
        ]
        lunch_options = [
            {"name": "Bitter Gourd (Karela) & Paneer Bhurji with 2 Jowar Bhakris", "cals": l_cals, "p": round(target_p * 0.34, 1)},
            {"name": "Yellow Dal with Methi Leaves, Brown Basmati & Sprouted Salad", "cals": l_cals, "p": round(target_p * 0.32, 1)},
            {"name": "Grilled Lemon Chicken / Tofu with Steamed Asparagus & Quinoa", "cals": l_cals, "p": round(target_p * 0.36, 1)},
            {"name": "High-Fiber Chana Dal with Cucumber Raita & Multigrain Roti", "cals": l_cals, "p": round(target_p * 0.33, 1)}
        ]
        snack_options = [
            {"name": "Roasted Sprouted Chana with Lemon & Chaat Masala", "cals": s_cals, "p": round(target_p * 0.14, 1)},
            {"name": "Roasted Makhana with 10 Walnuts (Zero Sugar)", "cals": s_cals, "p": round(target_p * 0.10, 1)},
            {"name": "Fenugreek-Infused Green Tea with Steamed Edamame", "cals": s_cals, "p": round(target_p * 0.12, 1)},
            {"name": "Whey Isolate / Sattu Drink with Cinnamon", "cals": s_cals, "p": round(target_p * 0.18, 1)}
        ]
        dinner_options = [
            {"name": "Moong Dal Soup with Sautéed Palak & 1 Multigrain Roti", "cals": d_cals, "p": round(target_p * 0.26, 1)},
            {"name": "Pan-Seared Salmon Fillet with Steamed Broccoli & Zucchini", "cals": d_cals, "p": round(target_p * 0.30, 1)},
            {"name": "Grilled Herbed Paneer Skewers with Big Green Salad", "cals": d_cals, "p": round(target_p * 0.28, 1)},
            {"name": "Clear Vegetable & Tofu Broth with Millet Crackers", "cals": d_cals, "p": round(target_p * 0.25, 1)}
        ]
        shopping_list = [
            {"category": "Low-GI Proteins", "items": ["Low-Fat Paneer & Greek Yogurt", "Egg Whites / Lean Chicken", "Organic Firm Tofu", "Sprouted Moong & Black Chana", "Chana Dal & Yellow Dal"]},
            {"category": "Low-GI Complex Carbs", "items": ["Jowar & Ragi Flour", "Steel-Cut Oats", "Organic Quinoa", "Brown Basmati Rice", "Flaxseed Meal"]},
            {"category": "Glycemic-Regulating Produce", "items": ["Bitter Gourd (Karela)", "Fresh Fenugreek (Methi) Leaves", "Baby Spinach (Palak)", "Broccoli & Asparagus", "Cucumbers & Limes"]},
            {"category": "Healthy Lipids & Spices", "items": ["Ceylon Cinnamon Powder", "Raw Walnuts & Almonds", "Extra Virgin Olive Oil", "Chia Seeds", "Roasted Makhana"]}
        ]

    else:
        # Default: Balanced High-Protein
        breakfast_options = [
            {"name": "Protein Oatmeal with Blueberries, Chia & Whey", "cals": b_cals, "p": round(target_p * 0.25, 1)},
            {"name": "Egg White & Spinach Omelette with Whole Wheat Toast", "cals": b_cals, "p": round(target_p * 0.28, 1)},
            {"name": "Greek Yogurt Berry Bowl with Crushed Almonds & Honey", "cals": b_cals, "p": round(target_p * 0.26, 1)},
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
        shopping_list = [
            {"category": "Proteins", "items": ["Chicken Breast / Organic Firm Tofu", "Fresh Low-Fat Paneer", "Greek Yogurt (Non-Fat)", "Eggs / Egg Whites", "Whey Protein Isolate"]},
            {"category": "Complex Carbs & Grains", "items": ["Rolled Oats", "Organic Quinoa", "Brown Basmati Rice", "Whole Wheat / Multigrain Flour", "Sprouted Moong & Black Chickpeas"]},
            {"category": "Vegetables & Fruits", "items": ["Fresh Broccoli Florets", "Baby Spinach / Palak", "Cucumbers & Cherry Tomatoes", "Fresh Blueberries & Bananas", "Asparagus Spears"]},
            {"category": "Healthy Fats & Extras", "items": ["Raw Almonds & Walnuts", "Black Chia Seeds", "Extra Virgin Olive Oil", "Natural Peanut Butter", "Turmeric, Cumin, Herbs & Spices"]}
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

    return {
        "client_target_calories": target_cals,
        "client_target_protein_g": target_p,
        "diet_type": diet_type,
        "weekly_schedule": weekly_plan,
        "grocery_checklist": shopping_list,
        "smart_swaps": SMART_SWAPS_DB
    }
