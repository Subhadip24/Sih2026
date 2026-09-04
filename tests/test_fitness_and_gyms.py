"""
Unit tests for exercise fuel burn calculation, avatar recomposition, and nearby gym locator.
"""

import unittest
from backend.fitness_engine import (
    calculate_exercise_burn,
    calculate_body_recomposition_avatar,
    find_nearby_gyms,
    haversine_distance
)


class TestFitnessAndGymEngine(unittest.TestCase):

    def test_exercise_burn_weightlifting(self):
        result = calculate_exercise_burn(
            activity="hypertrophy_weightlifting",
            duration_min=60.0,
            weight_kg=75.0,
            intensity="moderate"
        )
        self.assertGreater(result["total_calories_kcal"], 350)
        self.assertGreater(result["fat_oxidized_grams"], 10)
        self.assertGreater(result["carbs_burned_grams"], 40)
        self.assertGreater(result["epoc_afterburn_kcal"], 40)

    def test_exercise_burn_zone2_fat_burn_priority(self):
        result = calculate_exercise_burn(
            activity="zone2_cardio",
            duration_min=45.0,
            weight_kg=80.0,
            intensity="moderate"
        )
        # Zone 2 should oxidize more fat than carbs proportionally
        self.assertGreater(result["fat_ratio_pct"], result["carb_ratio_pct"])
        self.assertGreater(result["fat_oxidized_grams"], 15)

    def test_avatar_recomposition_math(self):
        # 75kg male with 25% body fat targeting 70kg at 12% body fat
        recomp = calculate_body_recomposition_avatar(
            current_weight_kg=75.0,
            target_weight_kg=70.0,
            height_cm=175.0,
            gender="male",
            current_body_fat_pct=25.0,
            goal="lean_hypertrophy",
            timeline_weeks=12
        )
        self.assertIn("transformation_delta", recomp)
        delta = recomp["transformation_delta"]
        self.assertGreater(delta["fat_loss_kg"], 5.0)
        self.assertGreater(delta["total_kcal_burn_needed"], 40000)
        self.assertGreater(delta["recommended_daily_deficit_kcal"], 300)
        self.assertIn("morph_profile", recomp)

    def test_nearby_gyms_locator(self):
        # Mumbai Bandra coords
        gyms = find_nearby_gyms(lat=19.0760, lng=72.8777)
        self.assertGreater(len(gyms), 0)
        # Closest should be Gold's Gym
        self.assertEqual(gyms[0]["city"], "Mumbai")
        self.assertLess(gyms[0]["distance_km"], 2.0)
        self.assertTrue(gyms[0]["google_maps_url"].startswith("https://www.google.com/maps"))

    def test_haversine_distance(self):
        # Same location should be 0.0
        dist = haversine_distance(19.0760, 72.8777, 19.0760, 72.8777)
        self.assertEqual(dist, 0.0)


if __name__ == "__main__":
    unittest.main()
