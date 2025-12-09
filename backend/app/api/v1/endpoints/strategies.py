from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from typing import List
import shutil
import os
import backtrader as bt

from app import models, schemas
from app.api import deps
from app.constants import STANDARD_STRATEGY_PARAMS
from app.services import ai_service
from app.strategy_parser import parse_strategy_params
from app.strategies import STRATEGY_MAP

router = APIRouter()

UPLOAD_DIR = "app/strategies/custom"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ✅ হেল্পার ফাংশন: প্যারামিটার কনফিগারেশন জেনারেট করার জন্য
def generate_param_config(key, default_val):
    if not isinstance(default_val, (int, float)) or isinstance(default_val, bool):
        # যদি নাম্বার না হয়, তবে সাধারণ টেক্সট বা বুলিয়ান হিসেবে রিটার্ন
        return {
            "type": "text" if not isinstance(default_val, bool) else "boolean",
            "label": key.replace('_', ' ').title(),
            "default": default_val
        }

    # নাম্বার হলে স্মার্ট রেঞ্জ জেনারেশন
    is_int = isinstance(default_val, int)
    min_val = 0 if default_val >= 0 else default_val * 2
    
    if default_val > 0:
        min_val = 1 if is_int else 0.1
    
    max_val = default_val * 5 if default_val > 0 else 100
    if max_val == 0: max_val = 100
    
    step = 1 if is_int else round(default_val / 10, 3) or 0.01

    return {
        "type": "number",
        "label": key.replace('_', ' ').title(),
        "default": default_val,
        "min": min_val,
        "max": max_val,
        "step": step
    }

@router.post("/upload")
async def upload_strategy(file: UploadFile = File(...), current_user: models.User = Depends(deps.get_current_user)):
    if not file.filename.endswith(".py"):
        raise HTTPException(status_code=400, detail="Only .py files are allowed")

    file_location = f"{UPLOAD_DIR}/{file.filename}"
    
    try:
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
    
    return {
        "filename": file.filename, 
        "message": "Strategy uploaded successfully. It will be available for backtesting."
    }

@router.get("/standard-params")
def get_standard_strategy_params():
    return STANDARD_STRATEGY_PARAMS

@router.get("/list")
def get_all_strategies(current_user: models.User = Depends(deps.get_current_user)):
    """
    Returns a clean combined list of Standard Strategies and Custom Uploaded Strategies without duplicates.
    """
    try:
        # Standard strategies (Hardcoded names to keep list clean)
        standard_strategies = [
            "SMA Crossover", 
            "RSI Crossover", 
            "MACD Crossover", 
            "EMA Crossover", 
            "Bollinger Bands"
        ]

        # Custom strategies from folder
        custom_strategies = []
        if os.path.exists(UPLOAD_DIR):
            files = os.listdir(UPLOAD_DIR)
            custom_strategies = [f[:-3] for f in files if f.endswith(".py")]

        # Merge and remove duplicates
        combined_strategies = sorted(list(set(standard_strategies + custom_strategies)))
        return combined_strategies

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/source/{strategy_name}")
def get_strategy_source(strategy_name: str, current_user: models.User = Depends(deps.get_current_user)):
    try:
        filename = f"{strategy_name}.py" if not strategy_name.endswith(".py") else strategy_name
        file_path = f"{UPLOAD_DIR}/{filename}"
        
        # ১. যদি কাস্টম ফোল্ডারে ফাইল না থাকে, তবে চেক করি এটি স্ট্যান্ডার্ড স্ট্র্যাটেজি কি না
        if not os.path.exists(file_path):
             if strategy_name in STRATEGY_MAP:
                 # ✅ ফিক্স: স্ট্যান্ডার্ড স্ট্র্যাটেজি থেকে প্যারামিটার বের করা
                 strategy_class = STRATEGY_MAP[strategy_name]
                 standard_params = {}

                 # Backtrader এর params স্ট্রাকচার রিড করা
                 if hasattr(strategy_class, 'params'):
                     # _getpairs() বা সরাসরি ডিকশনারি থেকে ভ্যালু নেওয়া
                     params_dict = {}
                     if hasattr(strategy_class.params, '_getpairs'):
                         params_dict = strategy_class.params._getpairs()
                     elif isinstance(strategy_class.params, dict):
                         params_dict = strategy_class.params
                     elif isinstance(strategy_class.params, tuple):
                         # Tuples convert to dict (e.g. (('period', 20),))
                         params_dict = dict(strategy_class.params)
                     
                     for key, val in params_dict.items():
                         # Alias বা অপ্রয়োজনীয় প্যারামিটার ফিল্টার করা (যেগুলোর ভ্যালু None)
                         if val is not None:
                             standard_params[key] = generate_param_config(key, val)

                 return {
                     "code": f"# Standard Strategy: {strategy_name}\n# This is a built-in strategy.",
                     "inferred_params": standard_params
                 }
             
             raise HTTPException(status_code=404, detail="Strategy file not found")
            
        # ২. কাস্টম স্ট্র্যাটেজি ফাইল রিড করা
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            code = f.read()

        extracted_params = {}
        try:
            raw_params_dict = parse_strategy_params(file_path)
            for key, default_val in raw_params_dict.items():
                extracted_params[key] = generate_param_config(key, default_val)
        except Exception as e:
            print(f"Auto-param detection failed: {e}")
            pass
            
        return {
            "code": code,
            "inferred_params": extracted_params
        }
        
    except Exception as e:
        print(f"Critical error in get_strategy_source: {e}")
        raise HTTPException(status_code=500, detail=f"File read error: {str(e)}")

@router.post("/generate")
async def generate_strategy(request: schemas.GenerateStrategyRequest, current_user: models.User = Depends(deps.get_current_user)):
    generated_code = ai_service.generate_strategy_code(request.prompt)
    
    if not generated_code:
        raise HTTPException(status_code=500, detail="Failed to generate strategy code.")

    filename = f"AI_Strategy_{len(os.listdir(UPLOAD_DIR)) + 1}.py"
    file_location = f"{UPLOAD_DIR}/{filename}"
    
    try:
        with open(file_location, "w") as f:
            f.write(generated_code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save generated file: {str(e)}")
    
    return {
        "filename": filename,
        "code": generated_code,
        "message": "Strategy generated successfully!"
    }
