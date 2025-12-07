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

router = APIRouter()

UPLOAD_DIR = "app/strategies/custom"
os.makedirs(UPLOAD_DIR, exist_ok=True)

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
def get_custom_strategies(current_user: models.User = Depends(deps.get_current_user)):
    try:
        if not os.path.exists(UPLOAD_DIR):
            return []
        files = os.listdir(UPLOAD_DIR)
        strategies = [f[:-3] for f in files if f.endswith(".py")]
        return strategies
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/source/{strategy_name}")
def get_strategy_source(strategy_name: str, current_user: models.User = Depends(deps.get_current_user)):
    try:
        filename = f"{strategy_name}.py" if not strategy_name.endswith(".py") else strategy_name
        file_path = f"{UPLOAD_DIR}/{filename}"
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Strategy file not found")
            
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            code = f.read()

        extracted_params = {}
        try:
            raw_params_dict = parse_strategy_params(file_path)
            for key, default_val in raw_params_dict.items():
                if isinstance(default_val, (int, float)) and not isinstance(default_val, bool):
                     is_int = isinstance(default_val, int)
                     min_val = 0 if default_val >= 0 else default_val * 2
                     if default_val > 0:
                         min_val = 1 if is_int else 0.1
                     
                     max_val = default_val * 5 if default_val > 0 else 0
                     if max_val == 0: max_val = 100
                     
                     step = 1 if is_int else round(default_val / 10, 3) or 0.01

                     extracted_params[key] = {
                         "type": "number",
                         "label": key.replace('_', ' ').title(),
                         "default": default_val,
                         "min": min_val,
                         "max": max_val,
                         "step": step
                     }
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
