from google import genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

# API Key লোড করা
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def generate_ai_strategy_templates(user_prompt: str = None):
    
    # বেস ইনস্ট্রাকশন
    system_instruction = """
    You are a professional quantitative trading architect. Generate 3 unique algorithmic trading strategies in JSON format.
    
    Strict Output Format (Array of Objects):
    [
        {
            "name": "Creative Name",
            "description": "Technical explanation...",
            "strategy_type": "Choose one from [SMA Crossover, RSI Crossover, MACD Crossover, Bollinger Bands, EMA Crossover, Grid Trading]",
            "tags": ["Tag1", "Tag2"],
            "params": { ...valid params matching standard indicators... }
        }
    ]
    Return ONLY raw JSON. No markdown.
    """

    # যদি ইউজার প্রম্পট দেয়, তবে সেটি যুক্ত করবো
    if user_prompt:
        content = f"{system_instruction}\n\nUser Specific Requirement: Create strategies based on this idea -> '{user_prompt}'"
    else:
        content = f"{system_instruction}\n\nGenerate 3 diverse strategies (e.g. one trend, one reversal, one volatility based)."

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=content
        )
        
        json_text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(json_text)
    except Exception as e:
        print(f"AI Generation Error: {e}")
        return []

def generate_strategy_code(user_prompt: str) -> str:
    system_instruction = """
    You are an expert algorithmic trading developer using 'backtrader'. 
    Your task: Convert natural language ideas into a Python Backtrader Strategy.

    CRITICAL RULES FOR PARAMETERS:
    1. You MUST define a class variable 'params' tuple with default values.
    2. You MUST include a special comment block at the VERY TOP of the code describing these parameters in JSON format so the UI can generate input fields.
    
    Format for the comment block (STRICTLY FOLLOW THIS):
    # @params
    # {
    #   "period": { "type": "number", "label": "Period", "default": 14, "min": 2, "max": 100, "step": 1 },
    #   "threshold": { "type": "number", "label": "Threshold", "default": 30, "min": 10, "max": 90, "step": 1 }
    # }
    # @params_end

    MANDATORY CODE STRUCTURE:
    1. Import backtrader as bt.
    2. Class MUST inherit from 'bt.Strategy'.
    3. Inside '__init__', verify you initialize 'self.trade_history = []'.
    4. You MUST implement the 'notify_order' method exactly as shown below to record trades for the UI:
    
    def notify_order(self, order):
        if order.status in [order.Completed]:
            is_buy = order.isbuy()
            self.trade_history.append({
                "type": "buy" if is_buy else "sell",
                "price": order.executed.price,
                "size": order.executed.size,
                "time": int(bt.num2date(order.executed.dt).timestamp())
            })
    
    5. Implement 'next' method for your trading logic using 'self.buy()' and 'self.sell()'.
    6. Output ONLY raw Python code. No markdown blocks.
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"{system_instruction}\n\nUser Strategy Idea: {user_prompt}"
        )
        
        # ক্লিনআপ: যদি AI ভুল করে মার্কডাউন দেয়, তা রিমুভ করা হবে
        clean_code = response.text.replace("```python", "").replace("```", "").strip()
        return clean_code
    
    except Exception as e:
        print(f"AI Code Gen Error: {e}")
        return ""