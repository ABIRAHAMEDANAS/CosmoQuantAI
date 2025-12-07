
import React, { useState, useMemo } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { MOCK_CUSTOM_MODELS, LstmIcon, RandomForestIcon, ArimaIcon, OtherModelIcon, CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from '@/constants';
import type { CustomMLModel, ModelVersion } from '@/types';

// --- Visual Components ---

const NeuralMeshBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 dark:opacity-20"
            style={{
                backgroundImage: 'radial-gradient(#6366F1 1px, transparent 1px)',
                backgroundSize: '30px 30px'
            }}>
        </div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
    </div>
);

const MetricBadge: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
    <div className="flex flex-col items-center justify-center p-2 bg-white/5 border border-white/10 rounded-lg min-w-[80px]">
        <span className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{label}</span>
        <span className={`text-sm font-bold font-mono ${color}`}>{value}</span>
    </div>
);

const StatusPill: React.FC<{ status: ModelVersion['status'] }> = ({ status }) => {
    let color = 'bg-gray-500';
    let textColor = 'text-gray-200';
    let icon = <ClockIcon className="w-3 h-3" />;
    let animate = '';

    if (status === 'Ready') {
        color = 'bg-emerald-500';
        textColor = 'text-emerald-400';
        icon = <CheckCircleIcon className="w-3 h-3" />;
    } else if (status === 'Processing') {
        color = 'bg-amber-500';
        textColor = 'text-amber-400';
        icon = <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeLinecap="round" strokeLinejoin="round" /></svg>;
        animate = 'animate-pulse';
    } else if (status === 'Error') {
        color = 'bg-rose-500';
        textColor = 'text-rose-400';
        icon = <ExclamationCircleIcon className="w-3 h-3" />;
    }

    return (
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-opacity-10 border border-opacity-20 ${color.replace('bg-', 'border-')} ${color.replace('bg-', 'bg-')}`}>
            <span className={`${textColor}`}>{icon}</span>
            <span className={`text-xs font-bold uppercase tracking-wider ${textColor} ${animate}`}>{status}</span>
        </div>
    );
};

// --- Modals ---

const UploadModelModal: React.FC<{
    onClose: () => void;
    onUpload: (data: { modelName?: string; modelType?: CustomMLModel['modelType']; fileName: string; description: string; version: number }, existingModelId?: string) => void;
    existingModel?: CustomMLModel;
}> = ({ onClose, onUpload, existingModel }) => {
    const isNewVersionMode = !!existingModel;
    const [modelName, setModelName] = useState(existingModel?.name || '');
    const [modelType, setModelType] = useState<CustomMLModel['modelType']>(existingModel?.modelType || 'LSTM');
    const [fileName, setFileName] = useState('');
    const [description, setDescription] = useState('');

    const nextVersion = isNewVersionMode ? (Math.max(...existingModel.versions.map(v => v.version)) + 0.1).toFixed(1) : '1.0';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (fileName && description && (modelName || isNewVersionMode)) {
            onUpload({
                modelName: isNewVersionMode ? undefined : modelName,
                modelType: isNewVersionMode ? undefined : modelType,
                fileName,
                description,
                version: parseFloat(nextVersion),
            }, existingModel?.id);
            onClose();
        }
    };

    const inputBaseClasses = "w-full bg-slate-900/50 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all placeholder-gray-500";

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-backdrop-fade-in" onClick={onClose}>
            <div className="bg-[#0B1120] w-full max-w-lg rounded-3xl shadow-2xl border border-gray-800 flex flex-col overflow-hidden animate-modal-content-slide-down relative" onClick={e => e.stopPropagation()}>
                {/* Decoration */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary via-purple-500 to-brand-primary"></div>

                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
                        {isNewVersionMode ? `New Version: ${existingModel.name}` : 'Initialize New Model'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    {!isNewVersionMode && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Model Identifier</label>
                                <input type="text" value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="e.g. AlphaSeeker" className={inputBaseClasses} required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Architecture</label>
                                <select value={modelType} onChange={(e) => setModelType(e.target.value as any)} className={inputBaseClasses}>
                                    <option>LSTM</option> <option>ARIMA</option> <option>Random Forest</option> <option>Other</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="bg-brand-primary/5 p-4 rounded-xl border border-brand-primary/10 border-dashed">
                        <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2 text-center">Upload Binary / Weights</label>
                        <div className="flex flex-col items-center justify-center gap-3">
                            <label htmlFor="file-upload" className="cursor-pointer px-6 py-3 bg-brand-primary text-white rounded-full text-sm font-bold hover:bg-brand-primary-hover transition-all shadow-lg shadow-brand-primary/20">
                                Choose File
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setFileName(e.target.files?.[0].name || '')} required />
                            </label>
                            <span className="text-xs font-mono text-gray-400">{fileName || "Supports .pkl, .h5, .onnx, .pt"}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Version Notes (v{nextVersion})</label>
                        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe changes, e.g. 'Increased epoch count'" className={inputBaseClasses} required />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                        <Button type="button" variant="secondary" onClick={onClose}>Abort</Button>
                        <Button type="submit" variant="primary" className="shadow-lg shadow-brand-primary/20">Deploy to Registry</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Model Card ---

const ModelCard: React.FC<{
    model: CustomMLModel;
    onDelete: (id: string) => void;
    onUploadVersion: (model: CustomMLModel) => void;
    onSetActiveVersion: (modelId: string, versionId: string) => void;
    animationDelay: number;
}> = ({ model, onDelete, onUploadVersion, onSetActiveVersion, animationDelay }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const modelIcons: Record<CustomMLModel['modelType'], React.ReactNode> = {
        'LSTM': <LstmIcon className="w-8 h-8" />,
        'Random Forest': <RandomForestIcon className="w-8 h-8" />,
        'ARIMA': <ArimaIcon className="w-8 h-8" />,
        'Other': <OtherModelIcon className="w-8 h-8" />,
    };

    const activeVersion = model.versions.find(v => v.id === model.activeVersionId);

    // Mock Metrics Generator based on model type/name hash (for visual consistency)
    const accuracy = activeVersion?.status === 'Ready' ? (85 + (model.name.length % 10) + Math.random() * 3).toFixed(1) : '--';
    const latency = activeVersion?.status === 'Ready' ? (12 + (model.name.length % 5)).toFixed(0) : '--';

    return (
        <div
            className="relative group bg-white dark:bg-[#0F172A]/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden hover:border-brand-primary/50 transition-all duration-500 animate-fade-in-slide-up shadow-lg hover:shadow-2xl hover:shadow-brand-primary/10"
            style={{ animationDelay: `${animationDelay}ms` }}
        >
            {/* Top Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="p-6 relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-brand-primary shadow-inner">
                            {modelIcons[model.modelType]}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors">{model.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 rounded text-[10px] font-bold uppercase text-gray-500 border border-gray-200 dark:border-white/10">{model.modelType}</span>
                                <span className="text-xs text-gray-400 font-mono">v{activeVersion?.version.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); onDelete(model.id); }} className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>

                {/* Performance HUD */}
                <div className="bg-gray-50 dark:bg-[#0B1120] rounded-xl p-4 border border-gray-200 dark:border-gray-800 mb-6 relative overflow-hidden">
                    {/* Scanline */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_2px,3px_100%] opacity-30"></div>

                    <div className="flex justify-between items-center relative z-10">
                        <MetricBadge label="Accuracy" value={`${accuracy}%`} color="text-emerald-400" />
                        <MetricBadge label="F1 Score" value={(Number(accuracy) / 105).toFixed(2)} color="text-blue-400" />
                        <MetricBadge label="Latency" value={`${latency}ms`} color="text-purple-400" />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <StatusPill status={activeVersion?.status || 'Error'} />
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-brand-primary transition-colors uppercase tracking-wider"
                    >
                        {isExpanded ? 'Hide History' : 'View History'}
                        <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                </div>
            </div>

            {/* Expandable History Panel */}
            <div className={`bg-gray-50 dark:bg-black/20 border-t border-gray-200 dark:border-gray-800 transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 space-y-2 overflow-y-auto max-h-80 custom-scrollbar">
                    {model.versions.map(version => (
                        <div key={version.id} className="group/row flex items-center justify-between p-3 rounded-lg hover:bg-white dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/10">
                            <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-8 rounded-full ${version.id === model.activeVersionId ? 'bg-brand-primary' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">v{version.version.toFixed(1)}</span>
                                        {version.id === model.activeVersionId && <span className="text-[10px] bg-brand-primary/20 text-brand-primary px-1.5 rounded">ACTIVE</span>}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate w-32">{version.description}</p>
                                </div>
                            </div>

                            {version.status === 'Ready' && version.id !== model.activeVersionId ? (
                                <Button size="sm" variant="secondary" className="text-[10px] h-7 px-2" onClick={() => onSetActiveVersion(model.id, version.id)}>Activate</Button>
                            ) : (
                                <span className="text-[10px] text-gray-400 font-mono">{version.uploadDate}</span>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={() => onUploadVersion(model)}
                        className="w-full py-2 mt-2 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-500 hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all"
                    >
                        + Upload New Version
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Main Page ---

const CustomMLModels: React.FC = () => {
    const [models, setModels] = useState<CustomMLModel[]>(MOCK_CUSTOM_MODELS);
    const [modalState, setModalState] = useState<{ isOpen: boolean; modelToUpdate?: CustomMLModel }>({ isOpen: false });

    const handleUpload = (data: { modelName?: string; modelType?: CustomMLModel['modelType']; fileName: string; description: string; version: number }, existingModelId?: string) => {
        if (existingModelId) { // Uploading a new version
            setModels(currentModels => currentModels.map(m => {
                if (m.id === existingModelId) {
                    const newVersion: ModelVersion = {
                        id: `v${data.version}-${new Date().getTime()}`,
                        version: data.version,
                        fileName: data.fileName,
                        uploadDate: new Date().toISOString().split('T')[0],
                        status: 'Processing',
                        description: data.description,
                    };
                    const updatedModel = { ...m, versions: [newVersion, ...m.versions] };
                    // Mock processing completion
                    setTimeout(() => setModels(prev => prev.map(model => model.id === m.id ? { ...model, versions: model.versions.map(v => v.id === newVersion.id ? { ...v, status: 'Ready' } : v) } : model)), 3000);
                    return updatedModel;
                }
                return m;
            }));
        } else { // Uploading a new model
            const newVersion: ModelVersion = {
                id: `v${data.version}-${new Date().getTime()}`,
                version: data.version,
                fileName: data.fileName,
                uploadDate: new Date().toISOString().split('T')[0],
                status: 'Processing',
                description: data.description,
            };
            const newModel: CustomMLModel = {
                id: `model_${new Date().getTime()}`,
                name: data.modelName!,
                modelType: data.modelType!,
                versions: [newVersion],
                activeVersionId: newVersion.id,
            };
            setModels(prev => [newModel, ...prev]);
            setTimeout(() => setModels(prev => prev.map(m => m.id === newModel.id ? { ...m, versions: m.versions.map(v => v.id === newVersion.id ? { ...v, status: 'Ready' } : v), activeVersionId: newVersion.id } : m)), 3000);
        }
    };

    const handleDelete = (modelId: string) => {
        setModels(models.filter(m => m.id !== modelId));
    };

    const handleSetActiveVersion = (modelId: string, versionId: string) => {
        setModels(models.map(m => m.id === modelId ? { ...m, activeVersionId: versionId } : m));
    };

    return (
        <div className="relative min-h-[calc(100vh-140px)]">
            <NeuralMeshBackground />

            {modalState.isOpen && <UploadModelModal onClose={() => setModalState({ isOpen: false })} onUpload={handleUpload} existingModel={modalState.modelToUpdate} />}

            <div className="relative z-10 flex flex-col gap-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/80 dark:bg-[#0F172A]/60 backdrop-blur-lg border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-brand-primary to-purple-600 rounded-xl shadow-lg shadow-brand-primary/20 text-white">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Quant Model Registry</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage predictive models, track version efficacy, and deploy to Bot Lab.</p>
                        </div>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setModalState({ isOpen: true })}
                        className="shadow-xl shadow-brand-primary/30 hover:scale-105 transition-transform px-6 py-3 rounded-xl font-bold flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                        Initialize New Model
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    {models.map((model, index) => (
                        <ModelCard
                            key={model.id}
                            model={model}
                            onDelete={handleDelete}
                            onUploadVersion={(m) => setModalState({ isOpen: true, modelToUpdate: m })}
                            onSetActiveVersion={handleSetActiveVersion}
                            animationDelay={index * 100}
                        />
                    ))}

                    {/* Add New Placeholder */}
                    <button
                        onClick={() => setModalState({ isOpen: true })}
                        className="group relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center p-10 text-center hover:border-brand-primary hover:bg-brand-primary/5 transition-all duration-300 min-h-[300px]"
                    >
                        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                            <svg className="w-8 h-8 text-gray-400 group-hover:text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400 group-hover:text-brand-primary transition-colors">Deploy New Model</h3>
                        <p className="text-xs text-gray-400 mt-2 max-w-[200px]">Upload .h5, .pkl or .onnx files to integrate custom logic.</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomMLModels;

