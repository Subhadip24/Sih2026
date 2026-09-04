"""
Automated unit and integration test suite for ThaalTatva AI.
Tests nutrition database lookups, vision parser, leftover comparator, and fitness/diet engines.
"""

import unittest
from backend.nutrition_db import calculate_nutrients_for_portion, find_food_in_db
from backend.fitness_engine import calculate_client_targets, compute_remaining_budget, calculate_bmr_mifflin
from backend.leftover_comparator import compare_pre_and_post_plates
from backend.diet_planner import recommend_next_meals, generate_7day_diet_plan
from backend.vision_engine import compile_plate_nutrition, heuristic_cv_analyze


class TestThaalTatva(unittest.TestCase):

    def test_nutrition_db_lookup(self):
        item = find_food_in_db("paneer_tikka")
        self.assertIsNotNone(item)
        self.assertEqual(item["id"], "paneer_tikka")
        self.assertGreater(item["protein"], 10.0)

        # Portion calculation
        portion = calculate_nutrients_for_portion("paneer_tikka", 200.0)
        self.assertEqual(portion["grams"], 200.0)
        self.assertAlmostEqual(portion["calories"], 530.0, delta=1.0)
        self.assertAlmostEqual(portion["protein"], 36.4, delta=0.5)

    def test_bmr_and_tdee_calculation(self):
        # 25yo male, 75kg, 175cm
        bmr = calculate_bmr_mifflin(75.0, 175.0, 25, "male")
        # 10*75 + 6.25*175 - 5*25 + 5 = 750 + 1093.75 - 125 + 5 = 1723.75
        self.assertAlmostEqual(bmr, 1723.75, places=1)

        targets = calculate_client_targets(
            age=25,
            gender="male",
            height_cm=175.0,
            current_weight_kg=75.0,
            target_weight_kg=72.0,
            activity_level="moderate",
            goal="lean_hypertrophy"
        )
        self.assertIn("daily_targets", targets)
        self.assertGreater(targets["daily_targets"]["calories_kcal"], 2000)
        self.assertGreater(targets["daily_targets"]["protein_g"], 100)

    def test_remaining_budget(self):
        targets = {
            "calories_kcal": 2400,
            "protein_g": 150,
            "carbs_g": 250,
            "fat_g": 70,
            "fiber_g": 32,
            "water_liters": 3.0
        }
        consumed = {
            "calories": 1400,
            "protein_g": 90,
            "carbs_g": 160,
            "fat_g": 40,
            "fiber_g": 18,
            "water_liters": 2.0
        }
        budget = compute_remaining_budget(targets, consumed)
        self.assertEqual(budget["remaining"]["calories"], 1000.0)
        self.assertEqual(budget["remaining"]["protein_g"], 60.0)
        self.assertEqual(budget["percentages"]["calories_pct"], 58.3)

    def test_leftover_consumption_delta(self):
        pre_plate = {
            "meal_name": "Test Plate",
            "items": [
                {"food_id": "grilled_chicken_breast", "name": "Chicken", "grams": 200.0, "calories": 330.0, "protein": 62.0, "carbs": 0.0, "fat": 7.2, "fiber": 0.0, "sodium": 148.0},
                {"food_id": "steamed_basmati_rice", "name": "Rice", "grams": 150.0, "calories": 195.0, "protein": 4.0, "carbs": 42.3, "fat": 0.5, "fiber": 0.6, "sodium": 3.0}
            ]
        }
        post_plate = {
            "items": [
                {"food_id": "grilled_chicken_breast", "leftover_ratio": 0.0}, # 100% eaten
                {"food_id": "steamed_basmati_rice", "leftover_ratio": 0.4}   # 40% leftover (60g remaining, 90g eaten)
            ]
        }
        res = compare_pre_and_post_plates(pre_plate, post_plate)
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["consumed_totals"]["grams"], 290.0) # 200g chicken + 90g rice
        self.assertAlmostEqual(res["overall_consumed_pct"], 82.9, delta=0.5)

    def test_diet_recommendations_and_planner(self):
        budget = {
            "remaining": {"calories": 600, "protein_g": 45, "carbs_g": 50, "fat_g": 20}
        }
        recs = recommend_next_meals(budget, "all")
        self.assertGreaterEqual(len(recs), 1)
        self.assertIn("protein_g", recs[0])

        plan = generate_7day_diet_plan({"daily_targets": {"calories_kcal": 2200, "protein_g": 140}}, "balanced")
        self.assertEqual(len(plan["weekly_schedule"]), 7)
        self.assertIn("grocery_checklist", plan)

        # Test Vegetarian Plan (Must NOT contain chicken or fish)
        veg_plan = generate_7day_diet_plan({"daily_targets": {"calories_kcal": 1900, "protein_g": 120}}, "vegetarian")
        self.assertEqual(len(veg_plan["weekly_schedule"]), 7)
        self.assertEqual(veg_plan["client_target_calories"], 1900)
        self.assertEqual(veg_plan["diet_type"], "vegetarian")
        mon_meals = veg_plan["weekly_schedule"][0]["meals"]
        self.assertIn("Paneer", mon_meals["breakfast"]["title"])
        self.assertIn("Dal", mon_meals["lunch"]["title"])

        # Test Vegan Plan (Must NOT contain dairy or eggs)
        vegan_plan = generate_7day_diet_plan({"calories_kcal": 1800, "protein_g": 110}, "vegan")
        self.assertEqual(len(vegan_plan["weekly_schedule"]), 7)
        self.assertEqual(vegan_plan["client_target_calories"], 1800)
        self.assertEqual(vegan_plan["diet_type"], "vegan")
        self.assertIn("Tofu", vegan_plan["weekly_schedule"][0]["meals"]["breakfast"]["title"])

        # Test Keto Plan
        keto_plan = generate_7day_diet_plan({"calories_kcal": 2100, "protein_g": 140}, "keto")
        self.assertEqual(len(keto_plan["weekly_schedule"]), 7)
        self.assertEqual(keto_plan["diet_type"], "keto")

        # Test Diabetic Plan
        diabetic_plan = generate_7day_diet_plan({"calories_kcal": 1850, "protein_g": 115}, "diabetic")
        self.assertEqual(len(diabetic_plan["weekly_schedule"]), 7)
        self.assertEqual(diabetic_plan["diet_type"], "diabetic")


if __name__ == "__main__":
    unittest.main()

