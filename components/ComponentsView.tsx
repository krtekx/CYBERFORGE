import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Part, PartCategory } from '../types';
import PartDetailPopup from './PartDetailPopup';
import { analyzeProductLink, generateCategoryIcon } from '../services/geminiService';
import { StorageService } from '../services/storageService';

interface ComponentsViewProps {
    parts: Part[];
    categories: PartCategory[];
    onAddPart: (part: Part) => void;
    onRemovePart: (id: string) => void;
    onUpdatePart: (part: Part) => void;
    onAddCategory: (category: string) => void;
    onRemoveCategory: (category: string) => void;
    onUpdateCategory: (oldCat: string, newCat: string) => void;
}

export const ComponentsView: React.FC<ComponentsViewProps> = ({
    parts, categories,
    onAddPart, onRemovePart, onUpdatePart,
    onAddCategory, onRemoveCategory, onUpdateCategory
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inspectedPart, setInspectedPart] = useState<Part | null>(null);
    const [filterCategory, setFilterCategory] = useState<PartCategory | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Edit mode
    const [editingPartId, setEditingPartId] = useState<string | null>(null);

    // Form State
    const [newItemName, setNewItemName] = useState('');
    const [newItemCategory, setNewItemCategory] = useState<string>('Passive');
    const [newItemLink, setNewItemLink] = useState('');
    const [newItemImage, setNewItemImage] = useState('');
    const [newItemDesc, setNewItemDesc] = useState('');
    const [isScanning, setIsScanning] = useState(false);

    // Category Management State
    const [isCatManOpen, setIsCatManOpen] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [isCatScanning, setIsCatScanning] = useState(false);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isModalOpen) {
            setEditingPartId(null);
            setNewItemName('');
            setNewItemLink('');
            setNewItemImage('');
            setNewItemDesc('');
            setNewItemCategory(categories[0] || 'Passive');
        }
    }, [isModalOpen, categories]);

    const handleScan = async () => {
        if (!newItemLink) return;
        setIsScanning(true);

        try {
            // Direct call to Gemini service
            const result = await analyzeProductLink(newItemLink);
            if (result) {
                setNewItemName(result.name);
                setNewItemCategory(categories.includes(result.category) ? result.category : categories[0]);
                setNewItemDesc(result.description);
                if (result.imageUrl) setNewItemImage(result.imageUrl);
            } else {
                alert("NEURAL SCAN FAILED: Could not infer data. Please fill manually.");
            }
        } catch (e: any) {
            console.error(e);
            alert(`CONNECTION ERROR during scan: ${e.message || 'Unknown Error'}`);
        } finally {
            setIsScanning(false);
        }
    };

    const handleAddCategoryWithIcon = async () => {
        if (newCatName && !categories.includes(newCatName)) {
            setIsCatScanning(true);
            try {
                // Generate icon
                const iconUrl = await generateCategoryIcon(newCatName);
                if (iconUrl) {
                    StorageService.saveCategoryIcon(newCatName, iconUrl);
                }
                onAddCategory(newCatName);
                setNewCatName('');
            } catch (e) {
                console.error("Cat gen failed", e);
                // Add anyway
                onAddCategory(newCatName);
                setNewCatName('');
            } finally {
                setIsCatScanning(false);
            }
        }
    };

    const handleSubmit = () => {
        if (!newItemName) return;

        const partData: Part = {
            id: editingPartId || `custom-${Date.now()}`,
            name: newItemName,
            category: newItemCategory,
            link: newItemLink,
            description: newItemDesc,
            details: {
                photoUrl: newItemImage
            }
        };

        if (editingPartId) {
            onUpdatePart(partData);
        } else {
            onAddPart(partData);
        }
        setIsModalOpen(false);
    };

    const handleEditPart = (part: Part) => {
        setEditingPartId(part.id);
        setNewItemName(part.name);
        setNewItemCategory(part.category);
        setNewItemLink(part.link || '');
        setNewItemImage(part.details?.photoUrl || '');
        setNewItemDesc(part.description || '');
        setIsModalOpen(true);
    };

    const handleDeletePart = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("DELETE COMPONENT PERMANENTLY?")) {
            onRemovePart(id);
        }
    };

    const filteredParts = parts.filter(p => {
        if (filterCategory !== 'ALL' && p.category !== filterCategory) return false;
        if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="w-full min-h-full flex flex-col gap-8 animate-reveal relative">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-[#0a0a0f] p-6 border border-[#00f3ff22]">
                <div className="space-y-2">
                    <div className="text-[10px] text-[#00f3ff] font-black uppercase tracking-[0.4em]">Inventory_Management</div>
                    <h2 className="text-3xl font-black text-white italic cyber-font uppercase">Component Database</h2>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="SEARCH_DB..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-black border border-gray-800 p-2 pl-4 text-xs font-mono text-[#00f3ff] w-48 focus:w-64 transition-all outline-none focus:border-[#00f3ff]"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value as any)}
                            className="bg-black border border-gray-800 p-2 text-xs font-mono text-gray-300 outline-none focus:border-[#00f3ff] uppercase"
                        >
                            <option value="ALL">All_Classes</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button
                            onClick={() => setIsCatManOpen(true)}
                            className="p-2 border border-gray-800 text-gray-500 hover:text-white hover:border-white transition-all"
                            title="Manage Categories"
                        >
                            ⚙
                        </button>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-2 bg-[#00f3ff] text-black text-[11px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_15px_#00f3ff44]"
                    >
                        + Add_Component
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredParts.map(part => (
                    <div
                        key={part.id}
                        onClick={() => setInspectedPart(part)}
                        className="group relative bg-[#0a0a0f] border border-white/5 hover:border-[#00f3ff] transition-all cursor-pointer overflow-hidden flex flex-col"
                    >
                        <div className="aspect-square bg-black relative overflow-hidden">
                            {part.details?.photoUrl ? (
                                <img src={part.details.photoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-800 overflow-hidden">
                                    <div className="text-[100px] leading-none opacity-20 font-black">?</div>
                                </div>
                            )}
                            <div className="absolute top-0 left-0 bg-black/60 px-2 py-1 text-[8px] font-mono text-[#00f3ff] backdrop-blur-sm border-r border-b border-[#00f3ff33]">
                                {part.category.toUpperCase()}
                            </div>

                            <div className="absolute top-0 right-0 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEditPart(part); }}
                                    className="p-2 bg-black/80 text-[#00f3ff] hover:bg-[#00f3ff] hover:text-black transition-colors"
                                >
                                    ✎
                                </button>
                                <button
                                    onClick={(e) => handleDeletePart(e, part.id)}
                                    className="p-2 bg-black/80 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="p-3 bg-gradient-to-t from-black to-transparent space-y-1">
                            <h3 className="text-[10px] font-black uppercase text-gray-200 group-hover:text-[#00f3ff] truncate">{part.name}</h3>
                            {part.link && (
                                <div className="text-[8px] text-[#ff00ff] font-mono truncate flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-[#ff00ff] rounded-full inline-block animate-pulse"></span>
                                    LINKED
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-start justify-center pt-24 p-4">
                    <div className="w-full max-w-lg bg-[#0a0a0f] border border-[#00f3ff] p-1 relative shadow-[0_0_50px_#00f3ff22] animate-in fade-in zoom-in duration-200 max-h-[85vh] overflow-y-auto custom-scrollbar">
                        {/* Corner decorations */}
                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#00f3ff]"></div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#00f3ff]"></div>

                        <div className="bg-black/50 p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-black text-white italic cyber-font tracking-widest">{editingPartId ? 'EDIT_COMPONENT' : 'NEW_COMPONENT'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">✕</button>
                            </div>

                            <div className="space-y-4 font-mono">
                                {/* Quick Link Add */}
                                <div className="bg-[#00f3ff0a] p-4 border border-[#00f3ff33]">
                                    <label className="text-[9px] text-[#00f3ff] uppercase font-bold tracking-widest block mb-2">✨ Quick Add via Link</label>
                                    <div className="flex gap-2">
                                        <input
                                            className="flex-1 bg-black border border-gray-800 p-2 text-xs text-white focus:border-[#00f3ff] outline-none"
                                            value={newItemLink}
                                            onChange={e => setNewItemLink(e.target.value)}
                                            placeholder="Paste product link here..."
                                        />
                                        <button
                                            onClick={handleScan}
                                            disabled={isScanning || !newItemLink}
                                            className="px-4 bg-[#ff00ff]/10 border border-[#ff00ff] text-[#ff00ff] font-bold text-[10px] uppercase hover:bg-[#ff00ff] hover:text-black transition-all disabled:opacity-50"
                                        >
                                            {isScanning ? 'SCANNING...' : 'AUTO-SCAN'}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Name</label>
                                    <input
                                        className="w-full bg-[#050505] border border-gray-800 p-3 text-sm text-white focus:border-[#00f3ff] outline-none"
                                        value={newItemName}
                                        onChange={e => setNewItemName(e.target.value)}
                                        placeholder="e.g. Arduino Nano V3"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Category</label>
                                    <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setNewItemCategory(cat)}
                                                className={`p-2 text-[9px] uppercase border transition-all truncate ${newItemCategory === cat ? 'bg-[#00f3ff] text-black border-[#00f3ff]' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Image URL</label>
                                    <input
                                        className="w-full bg-[#050505] border border-gray-800 p-3 text-sm text-white focus:border-[#00f3ff] outline-none"
                                        value={newItemImage}
                                        onChange={e => setNewItemImage(e.target.value)}
                                        placeholder="https://..."
                                    />
                                    {newItemImage && (
                                        <div className="h-24 w-full bg-black border border-gray-800 mt-2 flex items-center justify-center overflow-hidden relative group">
                                            <img src={newItemImage} className="h-full object-contain" onError={(e) => (e.currentTarget.src = 'https://placehold.co/400x400/000000/FFF?text=IMG+ERR')} />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Description</label>
                                    <textarea
                                        className="w-full bg-[#050505] border border-gray-800 p-3 text-sm text-white focus:border-[#00f3ff] outline-none h-20 resize-none"
                                        value={newItemDesc}
                                        onChange={e => setNewItemDesc(e.target.value)}
                                        placeholder="Technical specs..."
                                    />
                                </div>

                            </div>

                            <div className="pt-4 border-t border-white/10 flex justify-end gap-4">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 border border-gray-800 text-gray-500 text-[10px] font-black uppercase hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!newItemName}
                                    className="px-8 py-3 bg-[#00f3ff] text-black text-[10px] font-black uppercase tracking-widest hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editingPartId ? 'UPDATE_ENTRY' : 'ADD_ENTRY'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Category Manager Modal */}
            {isCatManOpen && createPortal(
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-start justify-center pt-24 p-4">
                    <div className="w-full max-w-md bg-[#0a0a0f] border border-gray-700 p-8 space-y-6 shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-black text-white uppercase tracking-widest">Category_Protocols</h3>
                            <button onClick={() => setIsCatManOpen(false)} className="text-gray-500 hover:text-white">✕</button>
                        </div>

                        <div className="bg-[#00f3ff05] p-2 border border-[#00f3ff33] text-[9px] text-[#00f3ff] font-mono mb-4 text-center">
                            AUTO-GENERATES ICON UPON CREATION
                        </div>

                        <div className="flex gap-2">
                            <input
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                                placeholder="NEW CLASS NAME..."
                                className="flex-1 bg-black border border-[#00f3ff] p-2 text-xs text-[#00f3ff] font-mono outline-none"
                            />
                            <button
                                onClick={handleAddCategoryWithIcon}
                                disabled={isCatScanning}
                                className="px-4 bg-[#00f3ff] text-black font-bold text-xs uppercase hover:bg-white disabled:opacity-50"
                            >
                                {isCatScanning ? 'GEN...' : 'ADD'}
                            </button>
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {categories.map(cat => (
                                <div key={cat} className="flex justify-between items-center bg-white/5 p-2 px-3 border border-transparent hover:border-gray-700 group">
                                    <div className="flex items-center gap-2">
                                        <img src={StorageService.getCategoryIcon(cat)} className="w-5 h-5 object-contain bg-black/50 p-0.5 rounded" />
                                        <span className="text-xs font-mono text-gray-300">{cat}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                const newName = prompt("Rename Category:", cat);
                                                if (newName && newName !== cat) onUpdateCategory(cat, newName);
                                            }}
                                            className="text-[10px] text-[#00f3ff] hover:underline uppercase"
                                        >
                                            RENAME
                                        </button>
                                        <button
                                            onClick={() => {
                                                const hasParts = parts.some(p => p.category === cat);
                                                if (hasParts) {
                                                    alert("ACCESS DENIED: Category contains active components. Purge or reassign components before deletion.");
                                                    return;
                                                }
                                                if (confirm(`Delete category "${cat}"?`)) onRemoveCategory(cat);
                                            }}
                                            disabled={parts.some(p => p.category === cat)}
                                            className={`text-[10px] uppercase hover:underline ${parts.some(p => p.category === cat) ? 'text-gray-600 cursor-not-allowed' : 'text-red-500'}`}
                                            title={parts.some(p => p.category === cat) ? "Category not empty" : "Delete Category"}
                                        >
                                            DELETE
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Part Detail Popover */}
            {inspectedPart && createPortal(
                <PartDetailPopup
                    part={inspectedPart}
                    onClose={() => setInspectedPart(null)}
                />,
                document.body
            )}
        </div>
    );
};
