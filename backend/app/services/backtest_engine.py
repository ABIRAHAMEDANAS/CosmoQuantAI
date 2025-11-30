import inspect
import backtrader as bt
import pandas as pd
import quantstats as qs
import json
import numpy as np
from sqlalchemy.orm import Session
from app.services.market_service import MarketService
from app.strategies import STRATEGY_MAP
import random
import itertools
from deap import base, creator, tools, algorithms
import os
import importlib.util
import sys

# QuantStats setup
qs.extend_pandas()

market_service = MarketService()

class FractionalPercentSizer(bt.Sizer):
    params = (
        ('percents', 90),
    )
    def _getsizing(self, comminfo, cash, data, isbuy):
        if isbuy:
            size = self.broker.get_value() * (self.params.percents / 100) / data.close[0]
            return size
        position = self.broker.getposition(data)
        return position.size

class BacktestEngine:
    def run(self, db: Session, symbol: str, timeframe: str, strategy_name: str, initial_cash: float, params: dict, start_date: str = None, end_date: str = None, custom_data_file: str = None):
        resample_compression = 1
        base_timeframe = timeframe
        df = None
        strategy_class = None

        # 1. Load Data (CSV or DB)
        if custom_data_file:
            file_path = f"app/data_feeds/{custom_data_file}"
            if os.path.exists(file_path):
                try:
                    df = pd.read_csv(file_path)
                    df.columns = [c.lower().strip() for c in df.columns]
                    
                    if 'datetime' in df.columns:
                        df['datetime'] = pd.to_datetime(df['datetime'])
                        df.set_index('datetime', inplace=True)
                    elif 'date' in df.columns:
                        df['datetime'] = pd.to_datetime(df['date'])
                        df.set_index('datetime', inplace=True)
                        
                    required_cols = ['open', 'high', 'low', 'close', 'volume']
                    if not all(col in df.columns for col in required_cols):
                         return {"error": f"CSV file must contain columns: {required_cols}"}
                    
                    df = df[required_cols]
                except Exception as e:
                    return {"error": f"Error reading CSV file: {str(e)}"}
            else:
                return {"error": "Custom data file not found on server."}

        if df is None:
            candles = market_service.get_candles_from_db(db, symbol, timeframe, start_date, end_date)
            if not candles or len(candles) < 20:
                if timeframe == '45m':
                    base_timeframe = '15m'
                    resample_compression = 3
                    candles = market_service.get_candles_from_db(db, symbol, '15m', start_date, end_date)
                elif timeframe == '2h':
                    base_timeframe = '1h'
                    resample_compression = 2
                    candles = market_service.get_candles_from_db(db, symbol, '1h', start_date, end_date)

            if not candles or len(candles) < 20:
                 return {"error": "Insufficient Data in Database."}

            df = pd.DataFrame([{
                'datetime': c.timestamp,
                'open': c.open,
                'high': c.high,
                'low': c.low,
                'close': c.close,
                'volume': c.volume
            } for c in candles])
            df.set_index('datetime', inplace=True)

        # Clean params
        clean_params = {}
        for k, v in params.items():
            try: clean_params[k] = int(v)
            except:
                try: clean_params[k] = float(v)
                except: clean_params[k] = v

        # Backtrader setup
        cerebro = bt.Cerebro()
        data_feed = bt.feeds.PandasData(dataname=df)
        
        if resample_compression > 1:
            tf_mapping = {
                'm': bt.TimeFrame.Minutes,
                'h': bt.TimeFrame.Hours,
                'd': bt.TimeFrame.Days
            }
            unit_char = base_timeframe[-1] 
            bt_timeframe = tf_mapping.get(unit_char, bt.TimeFrame.Minutes)
            cerebro.resampledata(data_feed, timeframe=bt_timeframe, compression=resample_compression)
        else:
            cerebro.adddata(data_feed)

        # Strategy Loading (from STRATEGY_MAP or Custom File)
        strategy_class = STRATEGY_MAP.get(strategy_name)
        
        if not strategy_class:
            try:
                file_name = f"{strategy_name}.py" if not strategy_name.endswith(".py") else strategy_name
                file_path = f"app/strategies/custom/{file_name}"

                if os.path.exists(file_path):
                    spec = importlib.util.spec_from_file_location("custom_strategy", file_path)
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)
                    
                    sys.modules[file_name.replace('.py', '')] = module
                    sys.modules["custom_strategy"] = module

                    for name, obj in inspect.getmembers(module):
                        if inspect.isclass(obj) and issubclass(obj, bt.Strategy) and obj is not bt.Strategy:
                            strategy_class = obj
                            break
            except Exception as e:
                print(f"Error loading custom strategy: {e}")

        if not strategy_class:
            return {"error": f"Strategy '{strategy_name}' not found via Map or File."}
        
        # Valid Params Filtering
        valid_params = {}
        if hasattr(strategy_class, 'params') and hasattr(strategy_class.params, '_getkeys'):
            allowed_keys = strategy_class.params._getkeys()
            for k, v in clean_params.items():
                if k in allowed_keys:
                    valid_params[k] = v
        else:
            valid_params = clean_params

        cerebro.addstrategy(strategy_class, **valid_params)

        cerebro.broker.setcash(initial_cash)
        cerebro.broker.setcommission(commission=0.001) 
        cerebro.addsizer(FractionalPercentSizer, percents=90)
        
        # Add analyzers
        cerebro.addanalyzer(bt.analyzers.PyFolio, _name='pyfolio')
        cerebro.addanalyzer(bt.analyzers.TradeAnalyzer, _name="trades")
        cerebro.addanalyzer(bt.analyzers.DrawDown, _name="drawdown")

        # Run backtest
        start_value = cerebro.broker.getvalue()
        results = cerebro.run() 
        first_strat = results[0]
        end_value = cerebro.broker.getvalue()

        # Metrics Calculation
        qs_metrics = {
            "sharpe": 0, "sortino": 0, "calmar": 0, "max_drawdown": 0,
            "volatility": 0, "win_rate": 0, "profit_factor": 0, "expectancy": 0, "cagr": 0
        }
        heatmap_data = []
        underwater_data = []
        histogram_data = []

        try:
            portfolio_stats = first_strat.analyzers.getbyname('pyfolio')
            returns, positions, transactions, gross_lev = portfolio_stats.get_pf_items()
            
            returns.index = returns.index.tz_localize(None)

            qs_metrics = {
                "sharpe": qs.stats.sharpe(returns),
                "sortino": qs.stats.sortino(returns),
                "calmar": qs.stats.calmar(returns),
                "max_drawdown": qs.stats.max_drawdown(returns) * 100,
                "volatility": qs.stats.volatility(returns),
                "win_rate": qs.stats.win_rate(returns) * 100,
                "profit_factor": qs.stats.profit_factor(returns),
                "expectancy": qs.stats.expected_return(returns) * 100,
                "cagr": qs.stats.cagr(returns) * 100
            }

            # Heatmap Data
            if not returns.empty:
                monthly_ret_series = returns.resample('M').apply(lambda x: (1 + x).prod() - 1)
                for timestamp, value in monthly_ret_series.items():
                    if pd.notna(value):
                        heatmap_data.append({
                            "year": timestamp.year,
                            "month": timestamp.month,
                            "value": round(value * 100, 2)
                        })

            # Underwater Data
            drawdown_series = qs.stats.to_drawdown_series(returns)
            underwater_data = [{"time": int(t.timestamp()), "value": round(v * 100, 2)} for t, v in drawdown_series.items()]

            # Histogram Data
            clean_returns = returns.dropna()
            if not clean_returns.empty:
                hist_values, bin_edges = np.histogram(clean_returns * 100, bins=20)
                for i in range(len(hist_values)):
                    if hist_values[i] > 0:
                        range_label = f"{round(bin_edges[i], 1)}% to {round(bin_edges[i+1], 1)}%"
                        histogram_data.append({
                            "range": range_label,
                            "frequency": int(hist_values[i])
                        })

        except Exception as e:
            print(f"QuantStats Error: {e}")

        trade_analysis = first_strat.analyzers.trades.get_analysis()
        total_closed = trade_analysis.get('total', {}).get('closed', 0)
        
        # Chart Data
        df['time'] = df.index.astype('int64') // 10**9 
        chart_candles = df[['time', 'open', 'high', 'low', 'close', 'volume']].to_dict(orient='records')
        executed_trades = getattr(first_strat, 'trade_history', [])

        return {
            "status": "success",
            "symbol": symbol,
            "strategy": strategy_name,
            "initial_cash": initial_cash,
            "final_value": round(end_value, 2),
            "profit_percent": round((end_value - start_value) / start_value * 100, 2),
            "total_trades": total_closed,
            "advanced_metrics": {k: (round(v, 2) if isinstance(v, (int, float)) else 0) for k, v in qs_metrics.items()},
            "heatmap_data": heatmap_data,
            "underwater_data": underwater_data,
            "histogram_data": histogram_data,
            "trades_log": executed_trades, 
            "candle_data": chart_candles 
        }

    def optimize(self, db: Session, symbol: str, timeframe: str, strategy_name: str, initial_cash: float, params: dict, start_date: str = None, end_date: str = None, method="grid", population_size=50, generations=10, progress_callback=None, abort_callback=None):
        
        # 1. Fetch Data
        candles = market_service.get_candles_from_db(db, symbol, timeframe, start_date, end_date)
        if not candles or len(candles) < 20:
            return {"error": "Insufficient Data"}

        df = pd.DataFrame([{
            'datetime': c.timestamp,
            'open': c.open,
            'high': c.high,
            'low': c.low,
            'close': c.close,
            'volume': c.volume
        } for c in candles])
        df.set_index('datetime', inplace=True)
        
        # 2. Parse Params for Optimization
        param_names = []
        param_values = []
        fixed_params = {}
        
        for k, v in params.items():
            if isinstance(v, dict) and 'start' in v and 'end' in v:
                start = float(v['start'])
                end = float(v['end'])
                step = float(v.get('step', 1))
                if step == 0: step = 1
                
                # Generate range
                vals = []
                curr = start
                while curr <= end + (step/1000): # Epsilon for inclusive
                    vals.append(curr)
                    curr += step
                
                # If original inputs were likely ints, cast back
                if int(start) == start and int(step) == step:
                    vals = [int(x) for x in vals]
                else:
                    vals = [round(x, 4) for x in vals]
                    
                param_names.append(k)
                param_values.append(vals)
            else:
                fixed_params[k] = v

        results = []

        # Helper to run single instance
        def run_instance(instance_params):
            # Merge fixed and variable params
            full_params = {**fixed_params, **instance_params}
            
            # Clean params (int/float conversion)
            clean_params = {}
            for k, v in full_params.items():
                try: clean_params[k] = int(v)
                except: 
                    try: clean_params[k] = float(v)
                    except: clean_params[k] = v
            
            return self._run_backtest_core(df, strategy_name, initial_cash, clean_params)

        if method == "grid":
            combinations = list(itertools.product(*param_values))
            total = len(combinations)
            
            for i, combo in enumerate(combinations):
                if abort_callback and abort_callback():
                    break
                
                instance_params = dict(zip(param_names, combo))
                metrics = run_instance(instance_params)
                
                metrics['params'] = instance_params
                results.append(metrics)
                
                if progress_callback:
                    progress_callback(i + 1, total)
                    
        elif method == "genetic" or method == "geneticAlgorithm":
            # Simplified Random Search as placeholder for GA to ensure stability
            combinations = list(itertools.product(*param_values))
            import random
            random.shuffle(combinations)
            limit = min(len(combinations), population_size * generations)
            combinations = combinations[:limit]
            total = len(combinations)
            
            for i, combo in enumerate(combinations):
                if abort_callback and abort_callback(): break
                instance_params = dict(zip(param_names, combo))
                metrics = run_instance(instance_params)
                metrics['params'] = instance_params
                results.append(metrics)
                if progress_callback: progress_callback(i+1, total)

        return results

    def _run_backtest_core(self, df, strategy_name, initial_cash, params):
        cerebro = bt.Cerebro()
        data_feed = bt.feeds.PandasData(dataname=df)
        cerebro.adddata(data_feed)
        
        # Strategy Loading
        strategy_class = STRATEGY_MAP.get(strategy_name)
        if not strategy_class:
            try:
                file_name = f"{strategy_name}.py" if not strategy_name.endswith(".py") else strategy_name
                file_path = f"app/strategies/custom/{file_name}"
                if os.path.exists(file_path):
                    spec = importlib.util.spec_from_file_location("custom_strategy", file_path)
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)
                    for name, obj in inspect.getmembers(module):
                        if inspect.isclass(obj) and issubclass(obj, bt.Strategy) and obj is not bt.Strategy:
                            strategy_class = obj
                            break
            except: pass
            
        if not strategy_class:
            return {"profitPercent": 0, "maxDrawdown": 0, "sharpeRatio": 0}

        # Filter params
        valid_params = {}
        if hasattr(strategy_class, 'params') and hasattr(strategy_class.params, '_getkeys'):
            allowed = strategy_class.params._getkeys()
            for k, v in params.items():
                if k in allowed: valid_params[k] = v
        else:
            valid_params = params

        cerebro.addstrategy(strategy_class, **valid_params)
        cerebro.broker.setcash(initial_cash)
        cerebro.broker.setcommission(commission=0.001)
        cerebro.addsizer(bt.sizers.PercentSizer, percents=90)
        
        cerebro.addanalyzer(bt.analyzers.DrawDown, _name="drawdown")
        cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name="sharpe", riskfreerate=0.0)
        
        try:
            results = cerebro.run()
            strat = results[0]
            
            end_value = cerebro.broker.getvalue()
            profit_percent = ((end_value - initial_cash) / initial_cash) * 100
            
            dd = strat.analyzers.drawdown.get_analysis()
            max_drawdown = dd.get('max', {}).get('drawdown', 0)
            
            sharpe = strat.analyzers.sharpe.get_analysis()
            sharpe_ratio = sharpe.get('sharperatio', 0)
            if sharpe_ratio is None: sharpe_ratio = 0
            
            return {
                "profitPercent": round(profit_percent, 2),
                "maxDrawdown": round(max_drawdown, 2),
                "sharpeRatio": round(sharpe_ratio, 2)
            }
        except Exception as e:
            print(f"Backtest Core Error: {e}")
            return {"profitPercent": 0, "maxDrawdown": 0, "sharpeRatio": 0}