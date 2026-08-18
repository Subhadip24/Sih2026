"""
NutriVision AI - FastAPI Main Backend Application.
Provides RESTful APIs for AI Multimodal Plate Detection, Leftover Consumption Delta, Fitness Metrics, and Diet Planning.
"""

import os
from typing import Dict, Any, List, Optional
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

from backend.config import BASE_DIR, STATIC_DIR, PRESET_DIR, UPLOAD_DIR, GEMINI_API_KEY
from backend.vision_engine import analyze_plate_image
from backend.leftover_comparator import compare_pre_and_post_plates
from backend.fitness_engine import calculate_client_targets, compute_remaining_budget
from backend.diet_planner import recommend_next_meals, generate_7day_diet_plan, SMART_SWAPS_DB
from backend.mock_plates import PRESET_PLATES
from backend.nutrition_db import calculate_nutrients_for_portion, FOOD_DATABASE

app = FastAPI(
    title="NutriVision AI API",
    description="Intelligent AI Plate Detection, Leftover Consumption Tracker, and Adaptive Diet Engine for SIH 2026",
    version="1.0.0"
)

# Enable CORS for local development and web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


# ------------------ PYDANTIC SCHEMAS ------------------

class PlateAnalysisRequest(BaseModel):
    image: str = Field(..., description="Base64 data URL, preset filename, or image URL")
    api_key: Optional[str] = Field(None, description="Optional Gemini API key")


class PlateCompareRequest(BaseModel):
    pre_image: Optional[str] = None
    post_image: Optional[str] = None
    pre_plate_data: Optional[Dict[str, Any]] = None
    post_plate_data: Optional[Dict[str, Any]] = None
    api_key: Optional[str] = None


class ClientProfileRequest(BaseModel):
    age: int = 25
    gender: str = "male"
    height_cm: float = 175.0
    current_weight_kg: float = 75.0
    target_weight_kg: float = 72.0
    activity_level: str = "moderate"
    goal: str = "lean_hypertrophy"
    dietary_preference: str = "all"


class NextMealRequest(BaseModel):
    daily_targets: Dict[str, Any]
    consumed_today: Dict[str, Any]
    dietary_preference: str = "all"


class DietPlanRequest(BaseModel):
    client_targets: Dict[str, Any]
    diet_type: str = "balanced"


class PortionRecalculateRequest(BaseModel):
    food_id: str
    grams: float


# ------------------ API ENDPOINTS ------------------

@app.get("/")
async def serve_index():
    """Serves the main application SPA."""
    index_path = STATIC_DIR / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="index.html not found")
    return FileResponse(str(index_path))


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "NutriVision AI",
        "version": "1.0.0",
        "gemini_api_configured": bool(os.environ.get("GEMINI_API_KEY") or GEMINI_API_KEY)
    }


@app.get("/api/presets")
async def get_presets():
    """Returns available benchmark food plates with pre-annotated data and images."""
    presets_summary = []
    for pid, pdata in PRESET_PLATES.items():
        presets_summary.append({
            "id": pid,
            "title": pdata["title"],
            "type": pdata["type"],
            "matching_pre_id": pdata.get("matching_pre_id"),
            "image_url": f"/static/images/presets/{pdata['image_file']}",
            "diet_type": pdata["diet_type"],
            "cuisine": pdata["cuisine"],
            "description": pdata["description"],
            "items_count": len(pdata.get("detected_items", []))
        })
    return {"presets": presets_summary}


@app.post("/api/analyze-plate")
async def analyze_plate(req: PlateAnalysisRequest):
    """
    Analyzes an uploaded image, camera snapshot, or preset.
    Returns detected food items, bounding boxes, segmentation polygons, portion weights, and full nutritional profile.
    """
    try:
        # Check if the image input is a preset identifier or relative path
        img_input = req.image
        if img_input.startswith("/static/images/presets/"):
            img_input = img_input.replace("/static/images/presets/", "")

        # Check if file exists in presets directory
        preset_file = PRESET_DIR / img_input
        if preset_file.exists():
            img_input = str(preset_file)

        analysis = analyze_plate_image(img_input, api_key=req.api_key)
        return {"status": "success", "data": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plate analysis failed: {str(e)}")


@app.post("/api/compare-plates")
async def compare_plates(req: PlateCompareRequest):
    """
    Compares Pre-Meal plate vs Post-Meal leftover plate.
    Computes exact consumed mass (g), net calories, net macros, and leftover waste.
    """
    try:
        pre_data = req.pre_plate_data
        if not pre_data and req.pre_image:
            img = req.pre_image.replace("/static/images/presets/", "")
            pf = PRESET_DIR / img
            target_img = str(pf) if pf.exists() else req.pre_image
            pre_data = analyze_plate_image(target_img, api_key=req.api_key)

        post_data = req.post_plate_data
        if not post_data and req.post_image:
            img = req.post_image.replace("/static/images/presets/", "")
            pf = PRESET_DIR / img
            target_img = str(pf) if pf.exists() else req.post_image
            post_data = analyze_plate_image(target_img, api_key=req.api_key)

        if not pre_data or not post_data:
            raise HTTPException(status_code=400, detail="Both pre-meal and post-meal data/images are required")

        result = compare_pre_and_post_plates(pre_data, post_data)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plate comparison failed: {str(e)}")


@app.post("/api/calculate-targets")
async def calculate_targets(req: ClientProfileRequest):
    """
    Computes personalized BMR, TDEE, Calorie targets, and Macro distribution.
    """
    try:
        metrics = calculate_client_targets(
            age=req.age,
            gender=req.gender,
            height_cm=req.height_cm,
            current_weight_kg=req.current_weight_kg,
            target_weight_kg=req.target_weight_kg,
            activity_level=req.activity_level,
            goal=req.goal,
            dietary_preference=req.dietary_preference
        )
        return {"status": "success", "data": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Target calculation failed: {str(e)}")


@app.post("/api/recommend-next-meal")
async def recommend_meal(req: NextMealRequest):
    """
    Recommends smart meals or snacks to bridge remaining daily calorie and macro deficits.
    """
    try:
        budget = compute_remaining_budget(req.daily_targets, req.consumed_today)
        recommendations = recommend_next_meals(budget, req.dietary_preference)
        return {
            "status": "success",
            "remaining_budget": budget,
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Next meal recommendation failed: {str(e)}")


@app.post("/api/generate-diet-plan")
async def generate_diet(req: DietPlanRequest):
    """
    Generates a full 7-day personalized diet plan with shopping checklist.
    """
    try:
        plan = generate_7day_diet_plan(req.client_targets, req.diet_type)
        return {"status": "success", "data": plan}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diet plan generation failed: {str(e)}")


@app.get("/api/smart-swaps")
async def get_smart_swaps():
    """Returns evidence-based healthy food swaps with calorie and nutrient benefits."""
    return {"status": "success", "swaps": SMART_SWAPS_DB}


@app.post("/api/recalculate-portion")
async def recalculate_portion(req: PortionRecalculateRequest):
    """Recalculates macros for an item when the user drags the portion weight slider."""
    try:
        nutrients = calculate_nutrients_for_portion(req.food_id, req.grams)
        return {"status": "success", "data": nutrients}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portion recalculation failed: {str(e)}")
