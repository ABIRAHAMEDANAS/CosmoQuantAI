import inspect
import math
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
import importlib
import importlib.util
import sys
import asyncio
import time

# QuantStats setup
qs.extend_pandas()

market_service = MarketService()

import logging

# ✅ SAFE LOGGING CONFIGURATION
# শুধুমাত্র Warning বা Error লেভেলের লগ দেখাবে, ইনফো লগ হাইড করবে।
logging.getLogger('matplotlib').setLevel(logging.WARNING)
logging.getLogger('backtrader').setLevel(logging.WARNING)


# ✅ 2. Smart Terminal Progress Bar (সরাসরি টার্মিনালে প্রিন্ট করার জন্য)
class SmartProgressBar:
    def __init__(self, total, prefix='', suffix='', decimals=1, length=40, fill='█'):
        self.total = total
        self.prefix = prefix
        self.suffix = suffix
        self.decimals = decimals
        self.length = length
        self.fill = fill
        self.start_time = time.time()
        self.best_profit = -float('inf')

    def update(self, iteration, current_profit=None):
        # Calculate Percentage
        percent = ("{0:." + str(self.decimals) + "f}").format(100 * (iteration / float(self.total)))
        filledLength = int(self.length * iteration // self.total)
        bar = self.fill * filledLength + '-' * (self.length - filledLength)
        
        # Calculate ETA
        elapsed_time = time.time() - self.start_time
        avg_time_per_step = elapsed_time / iteration if iteration > 0 else 0
        remaining_steps = self.total - iteration
        eta_seconds = remaining_steps * avg_time_per_step
        eta_str = time.strftime("%M:%S", time.gmtime(eta_seconds))
        
        # Track Best Profit
        if current_profit is not None and current_profit > self.best_profit:
            self.best_profit = current_profit

        # Status String
        status = f"\033[94mETA: {eta_str}\033[0m | \033[93mBest: {self.best_profit:.2f}%\033[0m"
        
        # Force print to original stdout (Bypassing Suppression)
        sys.__stdout__.write(f'\r\033[92m{self.prefix}\033[0m |{bar}| {percent}% {self.suffix} [{status}]')
        sys.__stdout__.flush()
        
        if iteration == self.total: 
            sys.__stdout__.write('\n')

# ✅ 1. Progress Observer (Backtrader internal)
class ProgressObserver(bt.Observer):
    lines = ('progress',)
    params = (
        ('total_len', 0),
        ('callback', None),
    )

    def next(self):
        current_idx = len(self)
        total = self.params.total_len

        if total > 0 and self.params.callback:
            percent = int((current_idx / total) * 100)
            if percent % 1 == 0: 
                self.params.callback(percent)

class FractionalPercentSizer(bt.Sizer):
    params = (
        ('percents', 90),
    )
    def _getsizing(self, comminfo, cash, data, isbuy):
        position = self.broker.getposition(data)
        if position.size == 0:
            size = self.broker.get_value() * (self.params.percents / 100) / data.close[0]
            return size
        return position.size

class BacktestEngine:
    
    def run(self, db: Session, symbol: str, timeframe: str, strategy_name: str, initial_cash: float, params: dict, 
            start_date: str = None, end_date: str = None, custom_data_file: str = None, progress_callback=None, 
            commission: float = 0.001, slippage: float = 0.0, 
            secondary_timeframe: str = None,  # ✅ Secondary Timeframe (Trend)
            stop_loss: float = 0.0, take_profit: float = 0.0, trailing_stop: float = 0.0): # ✅ Risk Management
        
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
                        df['datetime'] = pd.to_datetime(df['datetime'], errors='coerce') 
                        if df['datetime'].isnull().all():
                            return {"error": "CSV Date format invalid. Use YYYY-MM-DD HH:MM:SS format."}
                        df.dropna(subset=['datetime'], inplace=True)
                        df.set_index('datetime', inplace=True)
                    elif 'date' in df.columns:
                        df['datetime'] = pd.to_datetime(df['date'], errors='coerce')
                        if df['datetime'].isnull().all():
                            return {"error": "CSV Date format invalid."}
                        df.dropna(subset=['datetime'], inplace=True)
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
                print(f"📉 Data missing for {symbol} {timeframe}. Auto-syncing from Exchange...")
                if progress_callback: progress_callback(5)
                try:
                    asyncio.run(market_service.fetch_and_store_candles(
                        db=db, symbol=symbol, timeframe=timeframe, start_date=start_date, end_date=end_date, limit=1000
                    ))
                    candles = market_service.get_candles_from_db(db, symbol, timeframe, start_date, end_date)
                except Exception as e:
                    print(f"❌ Auto-sync failed: {e}")
            
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

            df = pd.DataFrame(candles, columns=['datetime', 'open', 'high', 'low', 'close', 'volume'])
            df.set_index('datetime', inplace=True)

        clean_params = {}
        for k, v in params.items():
            try: clean_params[k] = int(v)
            except:
                try: clean_params[k] = float(v)
                except: clean_params[k] = v

        # ✅ Risk Management Params Injection
        if stop_loss > 0: clean_params['stop_loss'] = stop_loss
        if take_profit > 0: clean_params['take_profit'] = take_profit
        if trailing_stop > 0: clean_params['trailing_stop'] = trailing_stop

        cerebro = bt.Cerebro()
        data_feed = bt.feeds.PandasData(dataname=df)
        
        # Add Primary Data
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

        # ✅ Secondary Timeframe Logic
        if secondary_timeframe:
            tf_map = {
                "1m": (bt.TimeFrame.Minutes, 1), "5m": (bt.TimeFrame.Minutes, 5),
                "15m": (bt.TimeFrame.Minutes, 15), "30m": (bt.TimeFrame.Minutes, 30),
                "1h": (bt.TimeFrame.Minutes, 60), "4h": (bt.TimeFrame.Minutes, 240),
                "1d": (bt.TimeFrame.Days, 1), "1w": (bt.TimeFrame.Weeks, 1)
            }
            if secondary_timeframe in tf_map:
                bt_tf, compression = tf_map[secondary_timeframe]
                cerebro.resampledata(data_feed, timeframe=bt_tf, compression=compression, name=f"TF_{secondary_timeframe}")
            else:
                print(f"⚠️ Warning: Unsupported secondary timeframe {secondary_timeframe}")

        if progress_callback:
            total_candles = len(df)
            if resample_compression > 1:
                total_candles = total_candles // resample_compression
            cerebro.addobserver(ProgressObserver, total_len=total_candles, callback=progress_callback)

        strategy_class = self._load_strategy_class(strategy_name)
        if not strategy_class:
            return {"error": f"Strategy '{strategy_name}' not found via Map or File."}
        
        valid_params = self._filter_params(strategy_class, clean_params)
        cerebro.addstrategy(strategy_class, **valid_params)

        cerebro.broker.setcash(initial_cash)
        cerebro.broker.setcommission(
            commission=commission, 
            commtype=bt.CommInfoBase.COMM_PERC, 
            margin=None, 
            mult=1.0, 
            stocklike=True 
        )
        if slippage > 0:
            cerebro.broker.set_slippage_perc(perc=slippage)
        
        cerebro.addsizer(FractionalPercentSizer, percents=90)
        
        cerebro.addanalyzer(bt.analyzers.PyFolio, _name='pyfolio')
        cerebro.addanalyzer(bt.analyzers.TradeAnalyzer, _name="trades")
        cerebro.addanalyzer(bt.analyzers.DrawDown, _name="drawdown")
        cerebro.addanalyzer(bt.analyzers.Transactions, _name="transactions")

        start_value = cerebro.broker.getvalue()
        try:
            results = cerebro.run() 
            first_strat = results[0]
        except Exception as e:
            print(f"❌ Backtest Runtime Error: {e}")
            return {"error": f"Backtest execution failed: {str(e)}"}

        end_value = cerebro.broker.getvalue()

        qs_metrics = self._calculate_metrics(first_strat, start_value, end_value)
        executed_trades = getattr(first_strat, 'trade_history', [])
        
        detailed_trade_analysis = self._format_trade_analysis(first_strat)

        if not executed_trades:
            trans_anal = first_strat.analyzers.transactions.get_analysis()
            for dt, trans_list in trans_anal.items():
                for trans in trans_list:
                    size = trans[0]
                    price = trans[1]
                    executed_trades.append({
                        "type": "buy" if size > 0 else "sell",
                        "price": price,
                        "size": abs(size),
                        "time": int(dt.timestamp())
                    })
            executed_trades.sort(key=lambda x: x['time'])
        
        df['time'] = df.index.astype('int64') // 10**9 
        # ✅ NEW Code (Optimized Array):
        # Format: [time, open, high, low, close, volume]
        chart_candles = df[['time', 'open', 'high', 'low', 'close', 'volume']].values.tolist()
        
        # Extract Equity Curve
        equity_curve = []
        try:
            if hasattr(first_strat, 'observers') and len(first_strat.observers) > 0:
                observer_values = first_strat.observers[0].lines.value.array
                data_len = len(df)
                obs_len = len(observer_values)
                limit = min(data_len, obs_len)
                timestamps = df.index.astype('int64') // 10**9 
                vals = observer_values[:limit]
                times = timestamps[-limit:]
                for t, v in zip(times, vals):
                    if not np.isnan(v):
                        equity_curve.append({"time": int(t), "value": round(v, 2)})
        except Exception as e:
            print(f"⚠️ Error extracting equity curve: {e}")
            equity_curve = []

        return {
            "status": "success",
            "symbol": symbol,
            "strategy": strategy_name,
            "initial_cash": initial_cash,
            "final_value": round(end_value, 2),
            "profit_percent": round((end_value - start_value) / start_value * 100, 2),
            "total_trades": detailed_trade_analysis.get('total_closed', 0),
            "advanced_metrics": qs_metrics["metrics"],
            "heatmap_data": qs_metrics["heatmap"],
            "underwater_data": qs_metrics["underwater"],
            "histogram_data": qs_metrics["histogram"],
            "trades_log": executed_trades, 
            "candle_data": chart_candles,
            "trade_analysis": detailed_trade_analysis,
            "equity_curve": equity_curve
        }

    def _format_trade_analysis(self, strategy):
        try:
            analysis = strategy.analyzers.trades.get_analysis()
            def get(d, keys, default=0):
                for k in keys:
                    if isinstance(d, dict): d = d.get(k, default)
                    else: return default
                return d

            total = analysis.get('total', {})
            won = analysis.get('won', {})
            lost = analysis.get('lost', {})
            pnl = analysis.get('pnl', {})
            long_t = analysis.get('long', {})
            short_t = analysis.get('short', {})

            total_closed = total.get('closed', 0)
            total_open = total.get('open', 0)
            total_won = won.get('total', 0)
            total_lost = lost.get('total', 0)
            win_rate = (total_won / total_closed * 100) if total_closed > 0 else 0
            
            gross_pnl = get(pnl, ['gross', 'total'])
            net_pnl = get(pnl, ['net', 'total'])
            avg_pnl = get(pnl, ['net', 'average'])
            avg_win_trade = get(won, ['pnl', 'average'])
            avg_loss_trade = get(lost, ['pnl', 'average'])
            ratio_avg_win_loss = abs(avg_win_trade / avg_loss_trade) if avg_loss_trade != 0 else 0
            largest_win_value = get(won, ['pnl', 'max'])
            largest_loss_value = get(lost, ['pnl', 'max'])

            largest_win_percent = 0
            largest_loss_percent = 0
            if hasattr(strategy, '_trades'):
                all_trades = []
                for feed in strategy._trades:
                    all_trades.extend(strategy._trades[feed][0]) 
                for t in all_trades:
                    investment = t.price * t.size
                    if investment != 0:
                        roi = (t.pnl / abs(investment)) * 100
                        if roi > largest_win_percent: largest_win_percent = roi
                        if roi < largest_loss_percent: largest_loss_percent = roi

            return {
                "total_closed": total_closed,
                "total_open": total_open,
                "total_won": total_won,
                "total_lost": total_lost,
                "win_rate": round(win_rate, 2),
                "long_trades_total": long_t.get('total', 0),
                "long_trades_won": get(long_t, ['won', 'total']),
                "short_trades_total": short_t.get('total', 0),
                "short_trades_won": get(short_t, ['won', 'total']),
                "gross_profit": round(gross_pnl, 2),
                "net_profit": round(net_pnl, 2),
                "avg_pnl": round(avg_pnl, 2),
                "avg_win": round(avg_win_trade, 2),
                "avg_loss": round(avg_loss_trade, 2),
                "ratio_avg_win_loss": round(ratio_avg_win_loss, 2),
                "largest_win_value": round(largest_win_value, 2),
                "largest_loss_value": round(largest_loss_value, 2),
                "largest_win_percent": round(largest_win_percent, 2),
                "largest_loss_percent": round(largest_loss_percent, 2),
            }
        except Exception as e:
            return {}

    def optimize(self, db: Session, symbol: str, timeframe: str, strategy_name: str, initial_cash: float, params: dict, start_date: str = None, end_date: str = None, method="grid", population_size=50, generations=10, progress_callback=None, abort_callback=None,
                 commission: float = 0.001, slippage: float = 0.0):
        
        candles = market_service.get_candles_from_db(db, symbol, timeframe, start_date, end_date)
        if not candles or len(candles) < 20:
            print(f"Data missing for {symbol} {timeframe}. Auto-syncing...")
            if progress_callback: progress_callback(0, 100)
            try:
                asyncio.run(market_service.fetch_and_store_candles(
                    db=db, symbol=symbol, timeframe=timeframe, start_date=start_date, end_date=end_date, limit=1000
                ))
                candles = market_service.get_candles_from_db(db, symbol, timeframe, start_date, end_date)
            except Exception as e:
                print(f"Auto-sync failed: {e}")

        if not candles or len(candles) < 20:
            return {"error": f"Insufficient Data for {symbol}."}

        df = pd.DataFrame(candles, columns=['datetime', 'open', 'high', 'low', 'close', 'volume'])
        df.set_index('datetime', inplace=True)
        
        param_ranges = {} 
        fixed_params = {}
        for k, v in params.items():
            if isinstance(v, dict) and 'start' in v and 'end' in v:
                start, end = float(v['start']), float(v['end'])
                step = float(v.get('step', 1)) if float(v.get('step', 1)) != 0 else 1
                vals = []
                curr = start
                while curr <= end + (step/1000): 
                    vals.append(curr)
                    curr += step
                vals = [int(x) if int(start)==start and int(step)==step else round(x, 4) for x in vals]
                param_ranges[k] = vals
            else:
                fixed_params[k] = v

        results = []

        if method == "grid":
            param_names = list(param_ranges.keys())
            param_values = list(param_ranges.values())
            combinations = list(itertools.product(*param_values))
            total = len(combinations)
            
            # ✅ Use original stdout for progress bar initialization
            sys.__stdout__.write(f"\n🚀 Starting GRID Optimization: {total} Combinations\n")
            pbar = SmartProgressBar(total, prefix='Optimization:', suffix='Complete', length=40)
            
            for i, combo in enumerate(combinations):
                if abort_callback and abort_callback(): 
                    sys.__stdout__.write("\n⚠️ Optimization Aborted by User.\n")
                    break
                instance_params = dict(zip(param_names, combo))
                
                # ✅ NEW: সরাসরি কল করুন (কারণ আমরা Cerebro তে stdstats=False দিয়েছি)
                metrics = self._run_single_backtest(df, strategy_name, initial_cash, instance_params, fixed_params, commission, slippage)
                
                metrics['params'] = instance_params
                results.append(metrics)
                
                if progress_callback: progress_callback(i + 1, total)
                
                # ✅ Update Smart Bar (সরাসরি টার্মিনালে দেখাবে)
                pbar.update(i + 1, current_profit=metrics['profitPercent'])

        elif method == "genetic" or method == "geneticAlgorithm":
            results = self._run_genetic_algorithm(
                df, strategy_name, initial_cash, param_ranges, fixed_params, 
                pop_size=population_size, generations=generations, 
                progress_callback=progress_callback, abort_callback=abort_callback,
                commission=commission, slippage=slippage
            )

        results.sort(key=lambda x: x['profitPercent'], reverse=True)
        return results

    def _run_genetic_algorithm(self, df, strategy_name, initial_cash, param_ranges, fixed_params, pop_size=50, generations=10, progress_callback=None, abort_callback=None, commission=0.001, slippage=0.0):
        # ... (শুরুর ভেরিয়েবল ডিক্লারেশন আগের মতোই থাকবে) ...
        param_keys = list(param_ranges.keys())
        population = []
        for _ in range(pop_size):
            population.append({k: random.choice(v) for k, v in param_ranges.items()})

        best_results = []
        history_cache = {} 
        total_steps = generations * pop_size

        # ✅ Initialize Smart Bar
        sys.__stdout__.write(f"\n🧬 Starting GENETIC Optimization: {generations} Gens x {pop_size} Pop\n")
        pbar = SmartProgressBar(total_steps, prefix='Evolution:', suffix='Done', length=40)

        for gen in range(generations):
            if abort_callback and abort_callback(): 
                sys.__stdout__.write("\n⚠️ Optimization Aborted.\n")
                break
            evaluated_pop = []
            
            for i, individual in enumerate(population):
                param_signature = json.dumps(individual, sort_keys=True)
                
                # ✅ NEW: সরাসরি লজিক ব্যবহার করুন
                if param_signature in history_cache:
                    metrics = history_cache[param_signature]
                else:
                    metrics = self._run_single_backtest(df, strategy_name, initial_cash, individual, fixed_params, commission, slippage)
                    metrics['params'] = individual
                    history_cache[param_signature] = metrics
                
                evaluated_pop.append(metrics)
                current_step = (gen * pop_size) + (i + 1)
                
                if progress_callback: progress_callback(current_step, total_steps)
                
                # ✅ Update Smart Bar
                pbar.update(current_step, current_profit=metrics['profitPercent'])

            # ... (বাকি Evolution লজিক আগের মতোই থাকবে) ...
            evaluated_pop.sort(key=lambda x: x['profitPercent'], reverse=True)
            best_results.extend(evaluated_pop[:5]) 
            
            elite_count = int(pop_size * 0.2)
            next_generation = [item['params'] for item in evaluated_pop[:elite_count]]
            
            while len(next_generation) < pop_size:
                parent1 = random.choice(evaluated_pop[:int(pop_size/2)])['params']
                parent2 = random.choice(evaluated_pop[:int(pop_size/2)])['params']
                child = parent1.copy()
                for k in param_keys:
                    if random.random() > 0.5: child[k] = parent2[k]
                if random.random() < 0.2: 
                    mutate_key = random.choice(param_keys)
                    child[mutate_key] = random.choice(param_ranges[mutate_key])
                next_generation.append(child)
            
            population = next_generation

        unique_results = {json.dumps(r['params'], sort_keys=True): r for r in best_results}
        return list(unique_results.values())

    def _run_single_backtest(self, df, strategy_name, initial_cash, variable_params, fixed_params, commission=0.001, slippage=0.0):
        # ... (আগের কোডই থাকবে, কোনো পরিবর্তন নেই) ...
        full_params = {**fixed_params, **variable_params}
        clean_params = {}
        for k, v in full_params.items():
            try: clean_params[k] = int(v)
            except: 
                try: clean_params[k] = float(v)
                except: clean_params[k] = v

        # ✅ FIX: stdstats=False ব্যবহার করুন (Stdout হাইজ্যাক করার বদলে)
        # এটি ডিফল্ট প্রিন্ট বা observer আউটপুট বন্ধ রাখবে, কিন্তু এরর দেখাবে।
        cerebro = bt.Cerebro(stdstats=False) 
        
        data_feed = bt.feeds.PandasData(dataname=df)
        cerebro.adddata(data_feed)
        
        strategy_class = self._load_strategy_class(strategy_name)
        if not strategy_class:
            return {"profitPercent": 0, "maxDrawdown": 0, "sharpeRatio": 0, "total_trades": 0, "winRate": 0}

        valid_params = self._filter_params(strategy_class, clean_params)
        cerebro.addstrategy(strategy_class, **valid_params)
        
        cerebro.broker.setcash(initial_cash)
        cerebro.broker.setcommission(commission=commission, commtype=bt.CommInfoBase.COMM_PERC, margin=None, mult=1.0, stocklike=True)
        if slippage > 0: cerebro.broker.set_slippage_perc(perc=slippage)
            
        cerebro.addsizer(bt.sizers.PercentSizer, percents=90)
        cerebro.addanalyzer(bt.analyzers.TradeAnalyzer, _name="trades")
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
            sharpe_ratio = sharpe.get('sharperatio', 0) or 0

            trade_analysis = strat.analyzers.trades.get_analysis()
            total_closed = trade_analysis.get('total', {}).get('closed', 0)
            won_trades = trade_analysis.get('won', {}).get('total', 0)
            win_rate = (won_trades / total_closed * 100) if total_closed > 0 else 0
            
            return {
                "profitPercent": round(profit_percent, 2),
                "maxDrawdown": round(max_drawdown, 2),
                "sharpeRatio": round(sharpe_ratio, 2),
                "total_trades": total_closed,
                "winRate": round(win_rate, 2),
                "final_value": round(end_value, 2),
                "initial_cash": initial_cash
            }
        except Exception:
            return {"profitPercent": 0, "maxDrawdown": 0, "sharpeRatio": 0, "total_trades": 0, "winRate": 0, "final_value": initial_cash, "initial_cash": initial_cash}

    # ... (বাকি মেথডগুলো অপরিবর্তিত রাখুন) ...
    def _load_strategy_class(self, strategy_name):
        # ১. ম্যাপ থেকে চেক করা (স্ট্যান্ডার্ড স্ট্র্যাটেজি)
        strategy_class = STRATEGY_MAP.get(strategy_name)
        
        # ২. ফাইল থেকে লোড করা (কাস্টম স্ট্র্যাটেজি)
        if not strategy_class:
            try:
                current_file_dir = os.path.dirname(os.path.abspath(__file__))
                custom_strategies_dir = os.path.join(current_file_dir, '..', 'strategies', 'custom')
                custom_strategies_dir = os.path.normpath(custom_strategies_dir)
                
                file_name = f"{strategy_name}.py" if not strategy_name.endswith(".py") else strategy_name
                file_path = os.path.join(custom_strategies_dir, file_name)
                
                if os.path.exists(file_path):
                    module_name = file_name.replace('.py', '')
                    
                    # পুরোনো মডিউল ক্যাশ থেকে সরানো (রিলোড নিশ্চিত করতে)
                    if module_name in sys.modules: 
                        del sys.modules[module_name]
                        
                    spec = importlib.util.spec_from_file_location(module_name, file_path)
                    if spec and spec.loader:
                        module = importlib.util.module_from_spec(spec)
                        sys.modules[module_name] = module
                        spec.loader.exec_module(module)
                    else: 
                        return None
                    
                    # ✅ ফিক্স: শুধু এই মডিউলে ডিফাইন করা ক্লাসটিই রিটার্ন করবে
                    # এটি ইম্পোর্ট করা অন্য ক্লাস (যেমন BaseStrategy) ইগনোর করবে
                    for name, obj in inspect.getmembers(module):
                        if inspect.isclass(obj) and issubclass(obj, bt.Strategy) and obj is not bt.Strategy:
                            # 🔴 গুরুত্বপূর্ণ চেক: ক্লাসটি কি এই ফাইলেই ডিফাইন করা হয়েছে?
                            if obj.__module__ == module_name:
                                return obj
                                
            except Exception as e: 
                print(f"❌ Exception loading custom strategy '{strategy_name}': {e}")
                
        return strategy_class

    def _filter_params(self, strategy_class, params):
        valid_params = {}
        if hasattr(strategy_class, 'params') and hasattr(strategy_class.params, '_getkeys'):
            allowed_keys = strategy_class.params._getkeys()
            normalized_allowed = {k.lower().replace('_', ''): k for k in allowed_keys}
            for k, v in params.items():
                if k in allowed_keys: valid_params[k] = v
                else:
                    norm_k = k.lower().replace('_', '')
                    if norm_k in normalized_allowed: valid_params[normalized_allowed[norm_k]] = v
                    else: print(f"⚠️ Warning: Parameter '{k}' ignored.")
        else: valid_params = params
        return valid_params

    def _calculate_metrics(self, first_strat, start_value, end_value):
        qs_metrics = {
            "sharpe": 0, "sortino": 0, "max_drawdown": 0, "win_rate": 0, 
            "profit_factor": 0, "cagr": 0, "volatility": 0, "calmar": 0, 
            "recovery_factor": 0, "expected_return": 0
        }
        heatmap_data = []
        underwater_data = []
        histogram_data = []
        
        try:
            portfolio_stats = first_strat.analyzers.getbyname('pyfolio')
            returns, positions, transactions, gross_lev = portfolio_stats.get_pf_items()
            returns.index = returns.index.tz_localize(None)
            
            sharpe_val = 0
            if not returns.empty and len(returns) > 5:
                try: sharpe_val = qs.stats.sharpe(returns)
                except: sharpe_val = 0
            
            # --- মেট্রিক্স ক্যালকুলেশন ---
            qs_metrics = {
                "sharpe": sharpe_val,
                "sortino": qs.stats.sortino(returns) if not returns.empty else 0,
                "max_drawdown": qs.stats.max_drawdown(returns) * 100 if not returns.empty else 0,
                "win_rate": qs.stats.win_rate(returns) * 100 if not returns.empty else 0,
                "profit_factor": qs.stats.profit_factor(returns) if not returns.empty else 0,
                "cagr": qs.stats.cagr(returns) * 100 if not returns.empty else 0,
                "volatility": qs.stats.volatility(returns) * 100 if not returns.empty else 0,
                "calmar": qs.stats.calmar(returns) if not returns.empty else 0,
                "recovery_factor": qs.stats.recovery_factor(returns) if not returns.empty else 0,
                "expected_return": qs.stats.expected_return(returns) * 100 if not returns.empty else 0
            }

            # --- Heatmap Data ---
            if not returns.empty:
                monthly_ret_series = returns.resample('ME').apply(lambda x: (1 + x).prod() - 1)
                for timestamp, value in monthly_ret_series.items():
                    val = value * 100
                    # NaN বা Inf চেক
                    if isinstance(val, (int, float)) and not (math.isnan(val) or math.isinf(val)):
                        heatmap_data.append({"year": timestamp.year, "month": timestamp.month, "value": round(val, 2)})
            
            # --- Underwater Data ---
            drawdown_series = qs.stats.to_drawdown_series(returns)
            for t, v in drawdown_series.items():
                val = v * 100
                if isinstance(val, (int, float)) and not (math.isnan(val) or math.isinf(val)):
                    underwater_data.append({"time": int(t.timestamp()), "value": round(val, 2)})
            
            # --- Histogram Data ---
            clean_returns = returns.dropna()
            if not clean_returns.empty:
                hist_values, bin_edges = np.histogram(clean_returns * 100, bins=20)
                for i in range(len(hist_values)):
                    if hist_values[i] > 0: 
                        histogram_data.append({"range": f"{round(bin_edges[i], 1)}% to {round(bin_edges[i+1], 1)}%", "frequency": int(hist_values[i])})
                        
        except Exception as e: 
            print(f"⚠️ Metrics Calculation Error: {e}")
            pass

        # ✅ ফাইনাল স্যানিটাইজেশন (NaN/Inf কে 0 তে কনভার্ট করা)
        sanitized_metrics = {}
        for k, v in qs_metrics.items():
            if isinstance(v, (int, float)):
                if math.isnan(v) or math.isinf(v):
                    sanitized_metrics[k] = 0.0
                else:
                    sanitized_metrics[k] = round(v, 2)
            else:
                sanitized_metrics[k] = 0.0

        return {
            "metrics": sanitized_metrics, 
            "heatmap": heatmap_data, 
            "underwater": underwater_data, 
            "histogram": histogram_data
        }

    # Helper method already added in previous step
    def _format_trade_analysis(self, strategy):
        # ... (keep this method as provided in previous response) ...
        try:
            analysis = strategy.analyzers.trades.get_analysis()
            def get(d, keys, default=0):
                for k in keys:
                    if isinstance(d, dict): d = d.get(k, default)
                    else: return default
                return d
            total = analysis.get('total', {})
            won = analysis.get('won', {})
            lost = analysis.get('lost', {})
            pnl = analysis.get('pnl', {})
            long_t = analysis.get('long', {})
            short_t = analysis.get('short', {})
            total_closed = total.get('closed', 0)
            total_open = total.get('open', 0)
            total_won = won.get('total', 0)
            total_lost = lost.get('total', 0)
            win_rate = (total_won / total_closed * 100) if total_closed > 0 else 0
            gross_pnl = get(pnl, ['gross', 'total'])
            net_pnl = get(pnl, ['net', 'total'])
            avg_pnl = get(pnl, ['net', 'average'])
            avg_win_trade = get(won, ['pnl', 'average'])
            avg_loss_trade = get(lost, ['pnl', 'average'])
            ratio_avg_win_loss = abs(avg_win_trade / avg_loss_trade) if avg_loss_trade != 0 else 0
            largest_win_value = get(won, ['pnl', 'max'])
            largest_loss_value = get(lost, ['pnl', 'max'])
            largest_win_percent = 0
            largest_loss_percent = 0
            if hasattr(strategy, '_trades'):
                all_trades = []
                for feed in strategy._trades:
                    all_trades.extend(strategy._trades[feed][0]) 
                for t in all_trades:
                    investment = t.price * t.size
                    if investment != 0:
                        roi = (t.pnl / abs(investment)) * 100
                        if roi > largest_win_percent: largest_win_percent = roi
                        if roi < largest_loss_percent: largest_loss_percent = roi
            return {
                "total_closed": total_closed,
                "total_open": total_open,
                "total_won": total_won,
                "total_lost": total_lost,
                "win_rate": round(win_rate, 2),
                "long_trades_total": long_t.get('total', 0),
                "long_trades_won": get(long_t, ['won', 'total']),
                "short_trades_total": short_t.get('total', 0),
                "short_trades_won": get(short_t, ['won', 'total']),
                "gross_profit": round(gross_pnl, 2),
                "net_profit": round(net_pnl, 2),
                "avg_pnl": round(avg_pnl, 2),
                "avg_win": round(avg_win_trade, 2),
                "avg_loss": round(avg_loss_trade, 2),
                "ratio_avg_win_loss": round(ratio_avg_win_loss, 2),
                "largest_win_value": round(largest_win_value, 2),
                "largest_loss_value": round(largest_loss_value, 2),
                "largest_win_percent": round(largest_win_percent, 2),
                "largest_loss_percent": round(largest_loss_percent, 2),
            }
        except Exception as e:
            return {}