"""
Leftover Comparator & Exact Consumption Delta Engine.
Compares Pre-Meal plate detection against Post-Meal leftover plate detection to calculate exact grams, calories, and macros ingested.
"""

from typing import Dict, Any, List
from backend.nutrition_db import calculate_nutrients_for_portion


def compare_pre_and_post_plates(pre_plate: Dict[str, Any], post_plate: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes exact consumed food mass and net nutrients by taking the delta between Pre-Meal and Post-Meal plates.
    """
    pre_items = pre_plate.get("items", [])
    post_items = post_plate.get("items", [])
    
    # Map post items by food_id
    post_map: Dict[str, Dict[str, Any]] = {}
    for item in post_items:
        fid = item.get("id") or item.get("food_id")
        if fid:
            post_map[fid] = item

    item_deltas = []
    
    pre_total_cals = 0.0
    pre_total_protein = 0.0
    pre_total_carbs = 0.0
    pre_total_fat = 0.0
    pre_total_fiber = 0.0
    pre_total_sodium = 0.0
    pre_total_grams = 0.0

    consumed_total_cals = 0.0
    consumed_total_protein = 0.0
    consumed_total_carbs = 0.0
    consumed_total_fat = 0.0
    consumed_total_fiber = 0.0
    consumed_total_sodium = 0.0
    consumed_total_grams = 0.0

    leftover_total_cals = 0.0
    leftover_total_grams = 0.0

    for pre_item in pre_items:
        fid = pre_item.get("id") or pre_item.get("food_id")
        pre_grams = float(pre_item.get("grams", pre_item.get("estimated_grams", 100.0)))
        
        # Check if matched in post items
        post_match = post_map.get(fid)
        if post_match:
            leftover_ratio = post_match.get("leftover_ratio")
            if leftover_ratio is not None:
                post_grams = round(pre_grams * float(leftover_ratio), 1)
            else:
                post_grams = float(post_match.get("grams", post_match.get("estimated_grams", 0.0)))
        else:
            # Item was completely eaten (not detected in post-plate)
            post_grams = 0.0

        post_grams = min(post_grams, pre_grams)
        consumed_grams = max(0.0, pre_grams - post_grams)
        consumed_pct = round((consumed_grams / pre_grams) * 100.0, 1) if pre_grams > 0 else 100.0
        leftover_pct = round(100.0 - consumed_pct, 1)

        # Full nutrient breakdown for consumed portion
        consumed_nutrients = calculate_nutrients_for_portion(fid, consumed_grams)
        leftover_nutrients = calculate_nutrients_for_portion(fid, post_grams)

        item_deltas.append({
            "food_id": fid,
            "name": pre_item.get("name", fid.replace("_", " ").title()),
            "pre_grams": round(pre_grams, 1),
            "post_grams": round(post_grams, 1),
            "consumed_grams": round(consumed_grams, 1),
            "consumed_pct": consumed_pct,
            "leftover_pct": leftover_pct,
            "consumed_calories": consumed_nutrients["calories"],
            "consumed_protein_g": consumed_nutrients["protein"],
            "consumed_carbs_g": consumed_nutrients["carbs"],
            "consumed_fat_g": consumed_nutrients["fat"],
            "consumed_fiber_g": consumed_nutrients["fiber"],
            "consumed_sodium_mg": consumed_nutrients["sodium"],
            "leftover_calories": leftover_nutrients["calories"],
            "box_2d": pre_item.get("box_2d", [0, 0, 0, 0]),
            "food_group": pre_item.get("food_group", "composite")
        })

        pre_total_grams += pre_grams
        pre_total_cals += float(pre_item.get("calories", consumed_nutrients["calories"]))
        pre_total_protein += float(pre_item.get("protein", consumed_nutrients["protein"]))
        pre_total_carbs += float(pre_item.get("carbs", consumed_nutrients["carbs"]))
        pre_total_fat += float(pre_item.get("fat", consumed_nutrients["fat"]))
        pre_total_fiber += float(pre_item.get("fiber", consumed_nutrients["fiber"]))
        pre_total_sodium += float(pre_item.get("sodium", consumed_nutrients["sodium"]))

        consumed_total_grams += consumed_grams
        consumed_total_cals += consumed_nutrients["calories"]
        consumed_total_protein += consumed_nutrients["protein"]
        consumed_total_carbs += consumed_nutrients["carbs"]
        consumed_total_fat += consumed_nutrients["fat"]
        consumed_total_fiber += consumed_nutrients["fiber"]
        consumed_total_sodium += consumed_nutrients["sodium"]

        leftover_total_grams += post_grams
        leftover_total_cals += leftover_nutrients["calories"]

    overall_consumed_pct = round((consumed_total_grams / pre_total_grams * 100.0), 1) if pre_total_grams > 0 else 100.0

    return {
        "status": "success",
        "meal_name": pre_plate.get("meal_name", "Meal Plate"),
        "overall_consumed_pct": overall_consumed_pct,
        "overall_leftover_pct": round(100.0 - overall_consumed_pct, 1),
        "initial_totals": {
            "grams": round(pre_total_grams, 1),
            "calories": round(pre_total_cals, 1),
            "protein_g": round(pre_total_protein, 1),
            "carbs_g": round(pre_total_carbs, 1),
            "fat_g": round(pre_total_fat, 1),
            "fiber_g": round(pre_total_fiber, 1),
            "sodium_mg": round(pre_total_sodium, 1)
        },
        "consumed_totals": {
            "grams": round(consumed_total_grams, 1),
            "calories": round(consumed_total_cals, 1),
            "protein_g": round(consumed_total_protein, 1),
            "carbs_g": round(consumed_total_carbs, 1),
            "fat_g": round(consumed_total_fat, 1),
            "fiber_g": round(consumed_total_fiber, 1),
            "sodium_mg": round(consumed_total_sodium, 1)
        },
        "leftover_totals": {
            "grams": round(leftover_total_grams, 1),
            "calories": round(leftover_total_cals, 1),
            "calories_saved": round(leftover_total_cals, 1)
        },
        "item_breakdown": item_deltas
    }
