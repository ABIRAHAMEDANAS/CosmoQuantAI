import ast
import logging

logger = logging.getLogger(__name__)

def parse_strategy_params(file_path: str) -> dict:
    """
    Safely extracts parameters from a Backtrader strategy file using AST.
    Returns a dictionary of params: {param_name: default_value}
    """
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            tree = ast.parse(f.read(), filename=file_path)

        for node in tree.body:
            # Look for class definitions
            if isinstance(node, ast.ClassDef):
                # Check for 'params' assignment inside the class
                for item in node.body:
                    if isinstance(item, ast.Assign):
                        # check if targets contains 'params'
                        is_params = False
                        for target in item.targets:
                            if isinstance(target, ast.Name) and target.id == 'params':
                                is_params = True
                                break
                        
                        if is_params:
                            return _extract_params_from_node(item.value)
                            
        return {}

    except Exception as e:
        logger.error(f"Error parsing strategy params for {file_path}: {e}")
        return {}

def _extract_params_from_node(value_node) -> dict:
    """
    Helper to extract values from AST nodes (Dict, Tuple, Call).
    """
    params = {}

    # Case 1: params = (('period', 20), ('rsi_upper', 70), )
    if isinstance(value_node, ast.Tuple):
        for elt in value_node.elts:
            if isinstance(elt, ast.Tuple) and len(elt.elts) == 2:
                key_node = elt.elts[0]
                val_node = elt.elts[1]
                
                key = _get_literal_value(key_node)
                val = _get_literal_value(val_node)
                
                if key is not None:
                    params[key] = val

    # Case 2: params = dict(period=20, rsi_upper=70)
    elif isinstance(value_node, ast.Call) and isinstance(value_node.func, ast.Name) and value_node.func.id == 'dict':
        for keyword in value_node.keywords:
            key = keyword.arg
            val = _get_literal_value(keyword.value)
            if key is not None:
                 params[key] = val
                 
    # Case 3: params = {'period': 20, 'rsi_upper': 70}
    elif isinstance(value_node, ast.Dict):
        for k, v in zip(value_node.keys, value_node.values):
            key = _get_literal_value(k)
            val = _get_literal_value(v)
            if key is not None:
                params[key] = val

    return params

def _get_literal_value(node):
    """
    Safely extracts literal values from AST nodes.
    Supports: Constant (Python 3.8+), Num, Str, NameConstant, UnaryOp (for negative numbers)
    """
    if isinstance(node, ast.Constant):  # Python 3.8+ for Num, Str, Bytes, NameConstant
        return node.value
    
    # Handle negative numbers (e.g. -1)
    elif isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
        operand = _get_literal_value(node.operand)
        if isinstance(operand, (int, float)):
            return -operand

    # Fallbacks for older python versions if needed (though 3.8+ is standard now)
    elif isinstance(node, ast.Num):
        return node.n
    elif isinstance(node, ast.Str):
        return node.s
    elif isinstance(node, ast.NameConstant): # True, False, None
        return node.value
        
    return None
