"""
Fitness Target, BMR, TDEE, and Dynamic Macro Engine.
Calculates metabolic expenditure, target calorie deficit/surplus, custom macro splits, and real-time remaining budgets.
"""

from typing import Dict, Any, Optional

ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,          # Little to no exercise, desk job
    "light": 1.375,            # Light exercise 1-3 days/week
    "moderate": 1.55,          # Moderate exercise 3-5 days/week
    "very_active": 1.725,      # Hard exercise 6-7 days/week
    "athlete": 1.9             # Very hard daily training / physical job
}

GOAL_ADJUSTMENTS = {
    "aggressive_fat_loss": {"cal_delta": -500, "protein_g_per_kg": 2.2, "fat_pct": 0.25},
    "moderate_fat_loss": {"cal_delta": -300, "protein_g_per_kg": 2.0, "fat_pct": 0.25},
    "maintenance": {"cal_delta": 0, "protein_g_per_kg": 1.6, "fat_pct": 0.28},
    "lean_hypertrophy": {"cal_delta": 250, "protein_g_per_kg": 2.0, "fat_pct": 0.25},
    "aggressive_bulk": {"cal_delta": 500, "protein_g_per_kg": 2.2, "fat_pct": 0.25},
    "diabetic_glycemic_control": {"cal_delta": -200, "protein_g_per_kg": 1.8, "fat_pct": 0.35, "carb_limit_pct": 0.35},
    "ketogenic": {"cal_delta": -300, "protein_pct": 0.25, "fat_pct": 0.70, "carb_pct": 0.05},
    "dash_hypertension": {"cal_delta": 0, "protein_g_per_kg": 1.6, "fat_pct": 0.25, "sodium_limit_mg": 1500},
    "vegan_muscle": {"cal_delta": 200, "protein_g_per_kg": 2.1, "fat_pct": 0.25}
}


def calculate_bmr_mifflin(weight_kg: float, height_cm: float, age_years: int, gender: str) -> float:
    """
    Calculates Basal Metabolic Rate using Mifflin-St Jeor equation.
    Men: BMR = 10W + 6.25H - 5A + 5
    Women: BMR = 10W + 6.25H - 5A - 161
    """
    base = 10.0 * weight_kg + 6.25 * height_cm - 5.0 * age_years
    if gender.lower() == "female":
        return base - 161.0
    return base + 5.0


def calculate_bmi(weight_kg: float, height_cm: float) -> Dict[str, Any]:
    """
    Calculates Body Mass Index and category.
    """
    h_m = height_cm / 100.0
    bmi = round(weight_kg / (h_m * h_m), 1)
    
    if bmi < 18.5:
        category = "Underweight"
    elif bmi < 24.9:
        category = "Normal Weight (Optimal)"
    elif bmi < 29.9:
        category = "Overweight"
    else:
        category = "Obese"

    return {"bmi": bmi, "category": category}


def calculate_client_targets(
    age: int = 25,
    gender: str = "male",
    height_cm: float = 175.0,
    current_weight_kg: float = 75.0,
    target_weight_kg: float = 72.0,
    activity_level: str = "moderate",
    goal: str = "lean_hypertrophy",
    dietary_preference: str = "all"
) -> Dict[str, Any]:
    """
    Computes complete fitness & nutritional requirements for a client.
    """
    bmr = round(calculate_bmr_mifflin(current_weight_kg, height_cm, age, gender), 1)
    act_mult = ACTIVITY_MULTIPLIERS.get(activity_level, 1.55)
    tdee = round(bmr * act_mult, 1)

    goal_config = GOAL_ADJUSTMENTS.get(goal, GOAL_ADJUSTMENTS["lean_hypertrophy"])
    cal_delta = goal_config.get("cal_delta", 0)
    target_calories = round(max(tdee + cal_delta, 1200.0), 0)

    # Compute Macro Splits
    if goal == "ketogenic":
        protein_cals = target_calories * goal_config["protein_pct"]
        fat_cals = target_calories * goal_config["fat_pct"]
        carb_cals = target_calories * goal_config["carb_pct"]
        protein_g = round(protein_cals / 4.0, 1)
        fat_g = round(fat_cals / 9.0, 1)
        carbs_g = round(carb_cals / 4.0, 1)
    elif goal == "diabetic_glycemic_control":
        protein_g = round(current_weight_kg * goal_config["protein_g_per_kg"], 1)
        protein_cals = protein_g * 4.0
        fat_cals = target_calories * goal_config["fat_pct"]
        fat_g = round(fat_cals / 9.0, 1)
        carb_cals = max(0.0, target_calories - protein_cals - fat_cals)
        carbs_g = round(carb_cals / 4.0, 1)
    else:
        protein_g = round(current_weight_kg * goal_config.get("protein_g_per_kg", 1.8), 1)
        protein_cals = protein_g * 4.0
        fat_cals = target_calories * goal_config.get("fat_pct", 0.25)
        fat_g = round(fat_cals / 9.0, 1)
        carb_cals = max(0.0, target_calories - protein_cals - fat_cals)
        carbs_g = round(carb_cals / 4.0, 1)

    # Fiber requirement (14g per 1000 kcal)
    fiber_g = round(max((target_calories / 1000.0) * 14.0, 28.0), 1)
    water_liters = round((current_weight_kg * 0.035), 1)
    sodium_limit_mg = goal_config.get("sodium_limit_mg", 2300)

    bmi_info = calculate_bmi(current_weight_kg, height_cm)

    return {
        "client_profile": {
            "age": age,
            "gender": gender,
            "height_cm": height_cm,
            "current_weight_kg": current_weight_kg,
            "target_weight_kg": target_weight_kg,
            "activity_level": activity_level,
            "goal": goal,
            "dietary_preference": dietary_preference,
            "bmi": bmi_info["bmi"],
            "bmi_category": bmi_info["category"]
        },
        "metabolic_metrics": {
            "bmr_kcal": bmr,
            "tdee_kcal": tdee,
            "caloric_delta_kcal": cal_delta
        },
        "daily_targets": {
            "calories_kcal": int(target_calories),
            "protein_g": protein_g,
            "carbs_g": carbs_g,
            "fat_g": fat_g,
            "fiber_g": fiber_g,
            "water_liters": water_liters,
            "sodium_max_mg": sodium_limit_mg
        },
        "macro_ratio_pct": {
            "protein_pct": round((protein_g * 4 / target_calories) * 100, 1),
            "carbs_pct": round((carbs_g * 4 / target_calories) * 100, 1),
            "fat_pct": round((fat_g * 9 / target_calories) * 100, 1)
        }
    }


def compute_remaining_budget(daily_targets: Dict[str, Any], consumed_today: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes remaining daily calories and macros.
    """
    target_cals = float(daily_targets.get("calories_kcal", 2200))
    target_p = float(daily_targets.get("protein_g", 140))
    target_c = float(daily_targets.get("carbs_g", 240))
    target_f = float(daily_targets.get("fat_g", 65))
    target_fib = float(daily_targets.get("fiber_g", 30))
    target_w = float(daily_targets.get("water_liters", 3.0))

    cons_cals = float(consumed_today.get("calories", 0))
    cons_p = float(consumed_today.get("protein_g", 0))
    cons_c = float(consumed_today.get("carbs_g", 0))
    cons_f = float(consumed_today.get("fat_g", 0))
    cons_fib = float(consumed_today.get("fiber_g", 0))
    cons_w = float(consumed_today.get("water_liters", 0))

    rem_cals = round(target_cals - cons_cals, 1)
    rem_p = round(target_p - cons_p, 1)
    rem_c = round(target_c - cons_c, 1)
    rem_f = round(target_f - cons_f, 1)
    rem_fib = round(target_fib - cons_fib, 1)
    rem_w = round(target_w - cons_w, 1)

    pct_cals = min(round((cons_cals / target_cals) * 100.0, 1) if target_cals > 0 else 0, 100.0)
    pct_p = min(round((cons_p / target_p) * 100.0, 1) if target_p > 0 else 0, 100.0)
    pct_c = min(round((cons_c / target_c) * 100.0, 1) if target_c > 0 else 0, 100.0)
    pct_f = min(round((cons_f / target_f) * 100.0, 1) if target_f > 0 else 0, 100.0)

    return {
        "target": {
            "calories": target_cals,
            "protein_g": target_p,
            "carbs_g": target_c,
            "fat_g": target_f,
            "fiber_g": target_fib,
            "water_liters": target_w
        },
        "consumed": {
            "calories": cons_cals,
            "protein_g": cons_p,
            "carbs_g": cons_c,
            "fat_g": cons_f,
            "fiber_g": cons_fib,
            "water_liters": cons_w
        },
        "remaining": {
            "calories": rem_cals,
            "protein_g": rem_p,
            "carbs_g": rem_c,
            "fat_g": rem_f,
            "fiber_g": rem_fib,
            "water_liters": rem_w
        },
        "percentages": {
            "calories_pct": pct_cals,
            "protein_pct": pct_p,
            "carbs_pct": pct_c,
            "fat_pct": pct_f
        }
    }
