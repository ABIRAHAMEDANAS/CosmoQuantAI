
import React, { useState, useMemo, FormEvent, useEffect } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Enhanced Task Interface
interface Task {
  id: number;
  text: string;
  completed: boolean;
  priority: 'High' | 'Medium' | 'Low';
  category: 'Analysis' | 'Execution' | 'Research' | 'General';
  timestamp: string;
  isNew?: boolean;
  isDeleting?: boolean;
}

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const CreateTaskModal: React.FC<{ onClose: () => void; onAddTask: (task: Omit<Task, 'id' | 'completed' | 'isNew' | 'isDeleting' | 'timestamp'>) => void; }> = ({ onClose, onAddTask }) => {
    const [inputText, setInputText] = useState('');
    const [priority, setPriority] = useState<Task['priority']>('Medium');
    const [category, setCategory] = useState<Task['category']>('General');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (inputText.trim()) {
            onAddTask({ text: inputText.trim(), priority, category });
            onClose();
        }
    };

    const inputClasses = "w-full bg-slate-50 dark:bg-brand-dark/50 border border-brand-border-light dark:border-brand-border-dark rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all";

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-brand-dark w-full max-w-lg rounded-2xl shadow-2xl border border-brand-border-light dark:border-brand-border-dark overflow-hidden animate-modal-content-slide-down" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-brand-border-light dark:border-brand-border-dark bg-gray-50 dark:bg-brand-darkest/50">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-6 bg-brand-primary rounded-full"></span>
                        Initialize Protocol
                    </h2>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mission Objective</label>
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="e.g., Execute arbitrage strategy..."
                            className={inputClasses}
                            autoFocus
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Priority Level</label>
                            <div className="flex gap-2">
                                {(['High', 'Medium', 'Low'] as const).map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                                            priority === p 
                                                ? p === 'High' ? 'bg-red-500 text-white border-red-500' : p === 'Medium' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-brand-success text-white border-brand-success'
                                                : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                            <select 
                                value={category} 
                                onChange={(e) => setCategory(e.target.value as Task['category'])}
                                className={inputClasses}
                            >
                                <option>Analysis</option>
                                <option>Execution</option>
                                <option>Research</option>
                                <option>General</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={onClose}>Abort</Button>
                        <Button type="submit" variant="primary" className="shadow-lg shadow-brand-primary/20">Confirm Mission</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TaskItem: React.FC<{ task: Task; onToggle: (id: number) => void; onDelete: (id: number) => void; index: number }> = ({ task, onToggle, onDelete, index }) => {
    
    const animationClass = task.isNew ? 'animate-slide-in-top' : task.isDeleting ? 'animate-fade-out-shrink' : '';
    
    const priorityColor = {
        'High': 'bg-red-500',
        'Medium': 'bg-yellow-500',
        'Low': 'bg-brand-success'
    }[task.priority];

    return (
        <div 
            className={`group relative flex items-center p-4 mb-3 bg-white dark:bg-brand-dark border border-gray-100 dark:border-brand-border-dark rounded-xl hover:shadow-lg hover:border-brand-primary/30 transition-all duration-300 ${animationClass} ${task.completed ? 'opacity-60' : ''}`}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            {/* Priority Indicator */}
            <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${priorityColor} ${task.completed ? 'opacity-50' : ''}`}></div>

            <button
                onClick={() => onToggle(task.id)}
                className={`relative flex-shrink-0 w-6 h-6 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ml-3
                    ${task.completed 
                        ? 'bg-brand-primary border-brand-primary shadow-[0_0_10px_rgba(99,102,241,0.5)]' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-brand-primary dark:hover:border-brand-primary'
                    }`}
            >
                {task.completed && <CheckIcon className="w-4 h-4 text-white" />}
            </button>

            <div className="flex-1 ml-4 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-bold uppercase tracking-wider ${task.completed ? 'text-gray-400' : 'text-brand-primary'}`}>
                        {task.category}
                    </span>
                    <span className="text-[10px] text-gray-400">• {task.timestamp}</span>
                </div>
                <p className={`text-sm font-medium truncate transition-all duration-300 ${task.completed ? 'text-gray-400 line-through decoration-gray-400' : 'text-slate-900 dark:text-white'}`}>
                    {task.text}
                </p>
            </div>
            
            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                 <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 uppercase`}>
                    {task.priority}
                </span>
                <button 
                    onClick={() => onDelete(task.id)} 
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    <TrashIcon className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

const ProductivityHUD: React.FC<{ pending: number; completed: number }> = ({ pending, completed }) => {
    const total = pending + completed;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    const data = [
        { name: 'Completed', value: completed, color: '#10B981' }, // emerald-500
        { name: 'Pending', value: pending, color: '#334155' }, // slate-700
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="relative overflow-hidden flex items-center justify-between !p-6 bg-gradient-to-br from-brand-primary to-purple-600 text-white border-none shadow-xl">
                <div className="relative z-10">
                    <p className="text-xs font-bold uppercase tracking-wider opacity-80">Protocol Status</p>
                    <h3 className="text-3xl font-extrabold mt-1">{percentage}% <span className="text-sm font-normal opacity-80">Complete</span></h3>
                </div>
                <div className="w-16 h-16 relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data} innerRadius={22} outerRadius={32} dataKey="value" startAngle={90} endAngle={-270} stroke="none">
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.name === 'Completed' ? '#FFFFFF' : 'rgba(255,255,255,0.2)'} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                        {total}
                    </div>
                </div>
                {/* Background decorative circles */}
                <div className="absolute -right-4 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            </Card>

            <Card className="flex flex-col justify-center !p-6 border-l-4 border-l-brand-warning">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Missions</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">{pending}</h3>
                    <span className="text-xs text-brand-warning font-semibold">Pending</span>
                </div>
            </Card>

            <Card className="flex flex-col justify-center !p-6 border-l-4 border-l-brand-success">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Successful Ops</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">{completed}</h3>
                    <span className="text-xs text-brand-success font-semibold">Done</span>
                </div>
            </Card>
        </div>
    );
}


const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: 'Analyze BTC on-chain data for whale activity', completed: false, priority: 'High', category: 'Analysis', timestamp: '09:00 AM' },
    { id: 2, text: 'Backtest new RSI strategy for ETH/USDT', completed: true, priority: 'Medium', category: 'Research', timestamp: 'Yesterday' },
    { id: 3, text: 'Set up price alert for SOL above $180', completed: false, priority: 'Low', category: 'General', timestamp: '10:30 AM' },
    { id: 4, text: 'Review weekly performance report', completed: false, priority: 'Medium', category: 'Analysis', timestamp: '11:45 AM' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Completed'>('All');

  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'completed' | 'isNew' | 'isDeleting' | 'timestamp'>) => {
    const newTask: Task = { 
        id: Date.now(), 
        ...newTaskData, 
        completed: false, 
        isNew: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
    
    setTimeout(() => {
        setTasks(currentTasks => currentTasks.map(t => t.id === newTask.id ? { ...t, isNew: false } : t));
    }, 500);
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };
  
  const handleDeleteTask = (id: number) => {
    setTasks(currentTasks => 
        currentTasks.map(task => 
            task.id === id ? { ...task, isDeleting: true } : task
        )
    );
    setTimeout(() => {
        setTasks(currentTasks => currentTasks.filter(task => task.id !== id));
    }, 400);
  };

  const pendingTasks = useMemo(() => tasks.filter(t => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);
  
  const displayedTasks = useMemo(() => {
      if (filter === 'Pending') return pendingTasks;
      if (filter === 'Completed') return completedTasks;
      return [...pendingTasks, ...completedTasks]; // Show pending first
  }, [tasks, filter, pendingTasks, completedTasks]);

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
        {isModalOpen && <CreateTaskModal onClose={() => setIsModalOpen(false)} onAddTask={handleAddTask} />}
        
        <div className="flex justify-between items-end mb-8 staggered-fade-in" style={{ animationDelay: '50ms' }}>
            <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Task Command</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Orchestrate your trading operations and research workflow.</p>
            </div>
            <Button variant="primary" onClick={() => setIsModalOpen(true)} className="shadow-xl shadow-brand-primary/25 flex items-center gap-2">
                <PlusIcon className="w-5 h-5" /> New Mission
            </Button>
        </div>

        <div className="staggered-fade-in" style={{ animationDelay: '150ms' }}>
            <ProductivityHUD pending={pendingTasks.length} completed={completedTasks.length} />
        </div>

        <Card className="flex-1 flex flex-col staggered-fade-in" style={{ animationDelay: '250ms' }}>
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-brand-border-dark">
                {(['All', 'Pending', 'Completed'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                            filter === f 
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' 
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                {displayedTasks.length > 0 ? (
                    <div className="space-y-1">
                        {displayedTasks.map((task, index) => (
                            <TaskItem 
                                key={task.id} 
                                task={task} 
                                onToggle={toggleTask} 
                                onDelete={handleDeleteTask} 
                                index={index}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-center opacity-50">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-brand-darkest rounded-full flex items-center justify-center mb-4">
                            <CheckIcon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">All systems nominal. No tasks found.</p>
                    </div>
                )}
            </div>
        </Card>
    </div>
  );
};

export default TaskManager;

