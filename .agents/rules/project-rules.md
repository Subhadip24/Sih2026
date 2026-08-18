# Project Rules: NutriVision AI (Indian Thali Nutritional Analysis System)

## 1. Project Overview & Domain Context
NutriVision AI is an intelligent nutritional analysis and metabolic tracking platform specialized in Indian thali and meal analysis. The system provides real-time food detection, plate-leftover delta calculation, metabolic target calculations (BMR/TDEE/macro distribution), adaptive dietitian meal recommendations, and interactive visual overlays.

---

## 2. Architectural Boundaries & Separation of Concerns
Strict separation of concerns must be maintained across all modules:

- **Computer Vision & Model Inference (`backend/vision_engine.py`)**:
  - Handles multimodal image processing (Gemini Vision API) and offline heuristic CV fallback.
  - Responsible strictly for detecting food classes/IDs, 2D bounding boxes (`box_2d`), segmentation polygons (`polygon`), confidence scores, and estimated portion masses (`estimated_grams`).
  - Vision logic must not compute or invent arbitrary nutritional values directly.

- **Nutrition Database & Calculations (`backend/nutrition_db.py`)**:
  - Authoritative source for all macronutrient and micronutrient data per 100g (USDA + Indian IFCT / NIN / FSSAI standards).
  - Handles portion scaling (`calculate_nutrients_for_portion`), nutrient lookups, and food classification.
  - **Rule**: All nutritional values (calories, protein, carbs, fats, saturated fat, fiber, sugar, sodium, potassium, calcium, iron, glycemic index, etc.) MUST be derived directly from this database. Never hardcode model predictions as ground truth nutrients.

- **Leftover Consumption Delta Comparator (`backend/leftover_comparator.py`)**:
  - Compares Pre-Meal plate state against Post-Meal leftover state to determine consumed mass, leftover percentage, and net ingested nutrition.
  - Uses `nutrition_db.py` to calculate exact consumed and wasted nutrients based on calculated delta portions.

- **Metabolic Target & Recommendation Engines (`backend/fitness_engine.py`, `backend/diet_planner.py`)**:
  - `fitness_engine.py`: Computes BMR (Mifflin-St Jeor), TDEE, goal-adjusted calorie deficits/surpluses, macro splits, and remaining daily budgets.
  - `diet_planner.py`: Recommends real-time next meals to bridge daily deficits, generates 7-day diet plans, and manages the smart food swaps database.

- **API Routing & Orchestration Layer (`backend/app.py`)**:
  - FastAPI endpoints orchestrating requests between vision, nutrition, comparison, fitness, and diet modules.
  - Defines strict Pydantic schemas for request validation and response serializations.
  - Preserves existing API routes, signatures, and contracts (`/api/analyze-plate`, `/api/compare-plates`, `/api/calculate-targets`, `/api/recommend-next-meal`, `/api/generate-diet-plan`, `/api/smart-swaps`, `/api/recalculate-portion`).

- **Frontend Presentation Layer (`static/`)**:
  - Vanilla HTML5, CSS3 Glassmorphism, and modular JavaScript (`static/js/`).
  - Renders camera feeds, preset meal selectors, interactive canvas overlays (bounding boxes/polygons), portion sliders, SVG circular metric gauges, and dietitian plans.

---

## 3. Core Development Principles & Constraints

### A. Ground Truth & Database Rule
- **Never hardcode model predictions as if they were ground truth nutrients.**
- Model output provides identifiers (`food_id`) and portion estimates (`estimated_grams`). All macro and micro nutrient breakdowns must always be resolved through `backend/nutrition_db.py`.

### B. Module Integrity & API Contracts
- **Do not rewrite working modules unnecessarily.** Refactor or extend only when directly solving a requested feature or bug.
- **Preserve existing API contracts** (endpoint paths, query/body payload structures, and response schemas) unless explicitly instructed otherwise by the user.

### C. Code Quality & Type Safety
- Write modular, readable Python code adhering to PEP 8 standards.
- Use explicit Python type hints (`typing.Dict`, `typing.List`, `typing.Optional`, `typing.Any`, `typing.Tuple`, etc.) for all function signatures and data structures.
- Include informative docstrings describing function roles, parameters, and return structures.

### D. Dependency Governance
- **Never install or add a new dependency** to `requirements.txt` or the environment without explicitly explaining the necessity and purpose of the library.

### E. Verification & Testing
- Before and after modifying code, inspect existing architecture, interfaces, and test suites.
- Run relevant unit and integration tests after any changes using:
  ```bash
  python -m unittest tests/test_engine.py
  ```
- Ensure all tests pass with zero regressions before finalizing changes.
