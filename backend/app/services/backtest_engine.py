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
            
            # Auto-resampling logic
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

        # Strategy Loading
        strategy_class = self._load_strategy_class(strategy_name)
        if not strategy_class:
            return {"error": f"Strategy '{strategy_name}' not found via Map or File."}
        
        # Valid Params Filtering
        valid_params = self._filter_params(strategy_class, clean_params)
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

        # Metrics Calculation (Same as before)
        qs_metrics = self._calculate_metrics(first_strat, start_value, end_value)
        
        # Trade Log & Chart Data
        executed_trades = getattr(first_strat, 'trade_history', [])
        
        df['time'] = df.index.astype('int64') // 10**9 
        chart_candles = df[['time', 'open', 'high', 'low', 'close', 'volume']].to_dict(orient='records')
        
        trade_analysis = first_strat.analyzers.trades.get_analysis()
        total_closed = trade_analysis.get('total', {}).get('closed', 0)

        return {
            "status": "success",
            "symbol": symbol,
            "strategy": strategy_name,
            "initial_cash": initial_cash,
            "final_value": round(end_value, 2),
            "profit_percent": round((end_value - start_value) / start_value * 100, 2),
            "total_trades": total_closed,
            "advanced_metrics": qs_metrics["metrics"],
            "heatmap_data": qs_metrics["heatmap"],
            "underwater_data": qs_metrics["underwater"],
            "histogram_data": qs_metrics["histogram"],
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
        
        # 2. Parse Params Ranges
        param_ranges = {} # { 'rsi_period': [10, 11, ... 30] }
        fixed_params = {}
        
        for k, v in params.items():
            if isinstance(v, dict) and 'start' in v and 'end' in v:
                start = float(v['start'])
                end = float(v['end'])
                step = float(v.get('step', 1))
                if step == 0: step = 1
                
                vals = []
                curr = start
                while curr <= end + (step/1000): 
                    vals.append(curr)
                    curr += step
                
                if int(start) == start and int(step) == step:
                    vals = [int(x) for x in vals]
                else:
                    vals = [round(x, 4) for x in vals]
                    
                param_ranges[k] = vals
            else:
                fixed_params[k] = v

        results = []

        if method == "grid":
            # --- GRID SEARCH ---
            param_names = list(param_ranges.keys())
            param_values = list(param_ranges.values())
            combinations = list(itertools.product(*param_values))
            total = len(combinations)
            
            for i, combo in enumerate(combinations):
                if abort_callback and abort_callback(): break
                
                instance_params = dict(zip(param_names, combo))
                metrics = self._run_single_backtest(df, strategy_name, initial_cash, instance_params, fixed_params)
                
                metrics['params'] = instance_params
                results.append(metrics)
                
                if progress_callback: progress_callback(i + 1, total)

        elif method == "genetic" or method == "geneticAlgorithm":
            # --- GENETIC ALGORITHM ---
            results = self._run_genetic_algorithm(
                df, strategy_name, initial_cash, param_ranges, fixed_params, 
                pop_size=population_size, generations=generations, 
                progress_callback=progress_callback, abort_callback=abort_callback
            )

        # Sort results by Profit (descending)
        results.sort(key=lambda x: x['profitPercent'], reverse=True)
        return results

    # --- Genetic Algorithm Implementation ---
    def _run_genetic_algorithm(self, df, strategy_name, initial_cash, param_ranges, fixed_params, pop_size=50, generations=10, progress_callback=None, abort_callback=None):
        
        param_keys = list(param_ranges.keys())
        
        # ১. ইনিশিয়াল পপুলেশন তৈরি
        population = []
        for _ in range(pop_size):
            individual = {k: random.choice(v) for k, v in param_ranges.items()}
            population.append(individual)

        best_results = []
        history_cache = {} # একই প্যারামিটার যাতে বারবার টেস্ট না হয়

        for gen in range(generations):
            if abort_callback and abort_callback(): break
            
            evaluated_pop = []
            
            # ২. ফিটনেস ইভালুয়েশন (ব্যাকটেস্ট রান করা)
            for i, individual in enumerate(population):
                # ক্যাশ চেক করা
                param_signature = json.dumps(individual, sort_keys=True)
                
                if param_signature in history_cache:
                    metrics = history_cache[param_signature]
                else:
                    metrics = self._run_single_backtest(df, strategy_name, initial_cash, individual, fixed_params)
                    metrics['params'] = individual
                    history_cache[param_signature] = metrics
                
                evaluated_pop.append(metrics)
                
                # প্রগ্রেস আপডেট
                current_step = (gen * pop_size) + (i + 1)
                total_steps = generations * pop_size
                if progress_callback: progress_callback(current_step, total_steps)

            # ৩. সর্টিং (Sharpe Ratio বা Profit এর ভিত্তিতে)
            # এখানে আমরা Profit Percent কে প্রাধান্য দিচ্ছি, আপনি চাইলে Sharpe Ratio দিতে পারেন
            evaluated_pop.sort(key=lambda x: x['profitPercent'], reverse=True)
            
            # সেরা ১০টি রেজাল্ট গ্লোবাল লিস্টে সেভ রাখা
            best_results.extend(evaluated_pop[:5]) 
            
            # ৪. সিলেকশন (Elitism): সেরা ২০% পরের জেনারেশনে সরাসরি যাবে
            elite_count = int(pop_size * 0.2)
            next_generation = [item['params'] for item in evaluated_pop[:elite_count]]
            
            # ৫. Crossover এবং Mutation
            while len(next_generation) < pop_size:
                parent1 = random.choice(evaluated_pop[:int(pop_size/2)])['params']
                parent2 = random.choice(evaluated_pop[:int(pop_size/2)])['params']
                
                child = parent1.copy()
                
                # Crossover (Mix genes)
                for k in param_keys:
                    if random.random() > 0.5:
                        child[k] = parent2[k]
                
                # Mutation (Small chance to change a value)
                if random.random() < 0.2: # ২০% মিউটেশন রেট
                    mutate_key = random.choice(param_keys)
                    child[mutate_key] = random.choice(param_ranges[mutate_key])
                
                next_generation.append(child)
            
            population = next_generation

        # ডুপ্লিকেট রিমুভ করে সেরা রেজাল্ট রিটার্ন করা
        unique_results = {json.dumps(r['params'], sort_keys=True): r for r in best_results}
        return list(unique_results.values())

    def _run_single_backtest(self, df, strategy_name, initial_cash, variable_params, fixed_params):
        # Merge params
        full_params = {**fixed_params, **variable_params}
        
        # Clean params
        clean_params = {}
        for k, v in full_params.items():
            try: clean_params[k] = int(v)
            except: 
                try: clean_params[k] = float(v)
                except: clean_params[k] = v

        cerebro = bt.Cerebro()
        data_feed = bt.feeds.PandasData(dataname=df)
        cerebro.adddata(data_feed)
        
        strategy_class = self._load_strategy_class(strategy_name)
        if not strategy_class:
            return {"profitPercent": 0, "maxDrawdown": 0, "sharpeRatio": 0}

        valid_params = self._filter_params(strategy_class, clean_params)

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
            # print(f"Backtest Core Error: {e}")
            return {"profitPercent": 0, "maxDrawdown": 0, "sharpeRatio": 0}

    # --- Helper Functions ---
    def _load_strategy_class(self, strategy_name):
        strategy_class = STRATEGY_MAP.get(strategy_name)
        if not strategy_class:
            try:
                file_name = f"{strategy_name}.py" if not strategy_name.endswith(".py") else strategy_name
                file_path = f"app/strategies/custom/{file_name}"

                if os.path.exists(file_path):
                    spec = importlib.util.spec_from_file_location("custom_strategy", file_path)
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)
                    
                    # Register module to sys
                    sys.modules[file_name.replace('.py', '')] = module

                    for name, obj in inspect.getmembers(module):
                        if inspect.isclass(obj) and issubclass(obj, bt.Strategy) and obj is not bt.Strategy:
                            return obj
            except Exception as e:
                print(f"Error loading custom strategy: {e}")
        return strategy_class

    def _filter_params(self, strategy_class, params):
        valid_params = {}
        if hasattr(strategy_class, 'params') and hasattr(strategy_class.params, '_getkeys'):
            allowed_keys = strategy_class.params._getkeys()
            for k, v in params.items():
                if k in allowed_keys:
                    valid_params[k] = v
        else:
            valid_params = params
        return valid_params

    def _calculate_metrics(self, first_strat, start_value, end_value):
        qs_metrics = {
            "sharpe": 0, "sortino": 0, "max_drawdown": 0,
            "win_rate": 0, "profit_factor": 0, "cagr": 0
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
                "max_drawdown": qs.stats.max_drawdown(returns) * 100,
                "win_rate": qs.stats.win_rate(returns) * 100,
                "profit_factor": qs.stats.profit_factor(returns),
                "cagr": qs.stats.cagr(returns) * 100
            }

            # Heatmap
            if not returns.empty:
                monthly_ret_series = returns.resample('M').apply(lambda x: (1 + x).prod() - 1)
                for timestamp, value in monthly_ret_series.items():
                    if pd.notna(value):
                        heatmap_data.append({
                            "year": timestamp.year,
                            "month": timestamp.month,
                            "value": round(value * 100, 2)
                        })

            # Underwater
            drawdown_series = qs.stats.to_drawdown_series(returns)
            underwater_data = [{"time": int(t.timestamp()), "value": round(v * 100, 2)} for t, v in drawdown_series.items()]

            # Histogram
            clean_returns = returns.dropna()
            if not clean_returns.empty:
                hist_values, bin_edges = np.histogram(clean_returns * 100, bins=20)
                for i in range(len(hist_values)):
                    if hist_values[i] > 0:
                        histogram_data.append({
                            "range": f"{round(bin_edges[i], 1)}% to {round(bin_edges[i+1], 1)}%",
                            "frequency": int(hist_values[i])
                        })
        except:
            pass
            
        return {
            "metrics": {k: (round(v, 2) if isinstance(v, (int, float)) else 0) for k, v in qs_metrics.items()},
            "heatmap": heatmap_data,
            "underwater": underwater_data,
            "histogram": histogram_data
        }