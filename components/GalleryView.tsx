import React, { useState, useEffect, useMemo } from 'react';
import { analyzeImageWithAI, BlueprintMetadata } from '../services/metadataService';

interface GalleryImage {
    name: string;
    path: string;
    timestamp: number;
    type: 'forged' | 'manual';
    material?: 'brass' | 'acrylic' | 'plywood' | 'mixed';
}

interface GalleryViewProps {
    onClone?: (metadata: BlueprintMetadata) => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({ onClone }) => {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [analyzingImage, setAnalyzingImage] = useState<string | null>(null);

    // Filters & Sorting state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'forged' | 'manual'>('all');
    const [filterMaterial, setFilterMaterial] = useState<'all' | 'brass' | 'acrylic' | 'plywood'>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');

    useEffect(() => {
        const loadImages = async () => {
            try {
                const imageModules = import.meta.glob('/public/gallery/*.webp', { eager: true, as: 'url' });

                const loadedImages: GalleryImage[] = Object.entries(imageModules).map(([path, url]) => {
                    const fileName = path.split('/').pop() || '';
                    const match = fileName.match(/(\d{13,})/);
                    const timestamp = match ? parseInt(match[1]) : 0;

                    // Infer material from filename
                    const lowerName = fileName.toLowerCase();
                    let material: GalleryImage['material'] = 'mixed';
                    if (lowerName.includes('brass') || lowerName.includes('gold') || lowerName.includes('copper')) material = 'brass';
                    else if (lowerName.includes('acrylic') || lowerName.includes('glass') || lowerName.includes('crystal')) material = 'acrylic';
                    else if (lowerName.includes('plywood') || lowerName.includes('wood') || lowerName.includes('timber')) material = 'plywood';

                    return {
                        name: fileName.replace('.webp', '').replace(/_/g, ' '),
                        path: (url as string).replace('/public', ''),
                        timestamp,
                        type: timestamp > 0 ? 'forged' : 'manual',
                        material
                    };
                });

                setImages(loadedImages);
                setLoading(false);
            } catch (error) {
                console.error('Error loading gallery images:', error);
                setLoading(false);
            }
        };

        loadImages();
    }, []);

    const filteredImages = useMemo(() => {
        let result = [...images];

        // 1. Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(img => img.name.toLowerCase().includes(q));
        }

        // 2. Filter Type
        if (filterType !== 'all') {
            result = result.filter(img => img.type === filterType);
        }

        // 3. Filter Material
        if (filterMaterial !== 'all') {
            result = result.filter(img => img.material === filterMaterial);
        }

        // 4. Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'az':
                    return a.name.localeCompare(b.name, undefined, { numeric: true });
                case 'za':
                    return b.name.localeCompare(a.name, undefined, { numeric: true });
                case 'oldest':
                    // Oldest first: Manual files (ts=0) should be at the end, then forged by oldest timestamp.
                    if (a.timestamp === 0 && b.timestamp !== 0) return 1; // Manual last
                    if (a.timestamp !== 0 && b.timestamp === 0) return -1; // Manual last
                    return a.timestamp - b.timestamp;
                case 'newest': // Default
                default:
                    // Manual on top (timestamp 0), sorted by name DESC (assuming sequential downloads)
                    const aIsManual = a.timestamp === 0;
                    const bIsManual = b.timestamp === 0;

                    if (aIsManual && !bIsManual) return -1; // A (Manual) First
                    if (!aIsManual && bIsManual) return 1;  // B (Manual) First

                    if (aIsManual && bIsManual) {
                        // Sort manuals smart descending
                        return b.name.localeCompare(a.name, undefined, { numeric: true });
                    }
                    // Forged sorted by timestamp DESC
                    return b.timestamp - a.timestamp;
            }
        });
        return result;
    }, [images, searchQuery, filterType, filterMaterial, sortBy]);

    const handleClone = async (img: GalleryImage, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!onClone) {
            alert('Clone functionality not available in this view');
            return;
        }

        setAnalyzing(true);
        setAnalyzingImage(img.path);

        try {
            const response = await fetch(img.path);
            const blob = await response.blob();
            const reader = new FileReader();

            reader.onloadend = async () => {
                const base64 = reader.result as string;
                const metadata = await analyzeImageWithAI(base64);

                if (metadata) {
                    onClone(metadata);
                    alert(`✅ CLONE INITIATED\n\nDesign: ${metadata.name}\nDifficulty: ${metadata.difficulty}\nComponents: ${metadata.bom.length}\n\nReturning to FORGE...`);
                } else {
                    alert('❌ CLONE FAILED\n\nCould not analyze blueprint. Please try again or check API key.');
                }
                setAnalyzing(false);
                setAnalyzingImage(null);
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Clone failed:', error);
            alert('❌ CLONE ERROR\n\nFailed to process image. Check console for details.');
            setAnalyzing(false);
            setAnalyzingImage(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-[#ff00ff11] border-t-[#ff00ff] rounded-full animate-spin"></div>
                    <div className="text-[#ff00ff] animate-pulse font-mono tracking-[0.6em] uppercase text-xs">
                        LOADING_GALLERY...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <section className="animate-reveal space-y-8 pb-40">
                <div className="flex flex-col gap-8 border-b border-[#ff00ff33] pb-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <h2 className="text-7xl font-black text-white cyber-font italic uppercase tracking-tighter leading-none">
                                GALLERY
                            </h2>
                            <p className="text-[#ff00ff] text-sm font-mono mt-4 uppercase tracking-wider">
                                {filteredImages.length} BLUEPRINTS (TOTAL: {images.length})
                            </p>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-col lg:flex-row gap-4 p-4 bg-[#0a0a0f] border border-white/5 rounded-sm">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="SEARCH_BLUEPRINTS..."
                                className="w-full h-10 bg-black border border-gray-800 focus:border-[#00f3ff] px-4 pl-10 text-xs font-mono text-white placeholder-gray-600 focus:outline-none transition-colors"
                            />
                            <svg className="w-4 h-4 absolute left-3 top-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2 shrink-0">
                            {/* Source Filter */}
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as any)}
                                className="h-10 bg-black border border-gray-800 text-gray-400 text-[10px] font-black uppercase tracking-wider px-3 focus:outline-none focus:border-[#00f3ff] hover:border-gray-600 transition-colors"
                            >
                                <option value="all">ALL SOURCES</option>
                                <option value="forged">FORGED (AI)</option>
                                <option value="manual">MANUAL UPLOAD</option>
                            </select>

                            {/* Material Filter */}
                            <select
                                value={filterMaterial}
                                onChange={(e) => setFilterMaterial(e.target.value as any)}
                                className="h-10 bg-black border border-gray-800 text-gray-400 text-[10px] font-black uppercase tracking-wider px-3 focus:outline-none focus:border-[#00f3ff] hover:border-gray-600 transition-colors"
                            >
                                <option value="all">ALL MATERIALS</option>
                                <option value="brass">BRASS</option>
                                <option value="acrylic">ACRYLIC</option>
                                <option value="plywood">PLYWOOD</option>
                            </select>
                        </div>

                        {/* Sort */}
                        <div className="relative group shrink-0">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="h-10 bg-black border border-gray-800 text-[#00f3ff] text-[10px] font-black uppercase tracking-wider px-4 pr-8 focus:outline-none focus:border-[#ff00ff] appearance-none cursor-pointer hover:border-gray-600 transition-colors w-40"
                            >
                                <option value="newest">NEWEST (DEFAULT)</option>
                                <option value="oldest">OLDEST FIRST</option>
                                <option value="az">NAME (A-Z)</option>
                                <option value="za">NAME (Z-A)</option>
                            </select>
                            <svg className="w-4 h-4 absolute right-3 top-3 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                {filteredImages.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-sm">
                        <p className="text-gray-600 font-mono uppercase tracking-widest">
                            NO MATCHING BLUEPRINTS FOUND
                        </p>
                        {(searchQuery || filterType !== 'all' || filterMaterial !== 'all') && (
                            <button onClick={() => { setSearchQuery(''); setFilterType('all'); setFilterMaterial('all'); }} className="mt-4 text-[#00f3ff] text-xs font-black uppercase hover:underline">
                                CLEAR FILTERS
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {filteredImages.map((img, index) => (
                            <div
                                key={`${img.name}-${index}`}
                                className="group relative bg-[#0a0a0f] border border-white/5 p-2 hover:border-[#ff00ff] transition-all flex flex-col hover:shadow-[0_0_20px_#ff00ff22]"
                            >
                                <div
                                    className="aspect-square bg-black overflow-hidden relative shadow-inner cursor-pointer"
                                    onClick={() => setSelectedImage(img)}
                                >
                                    <img
                                        src={img.path}
                                        alt={img.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        loading="lazy"
                                    />

                                    {/* Type/Material Badge */}
                                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                                        <div className={`px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider border bg-black/50 ${img.type === 'forged' ? 'text-[#00f3ff] border-[#00f3ff]/30' : 'text-white border-white/30'}`}>
                                            {img.type}
                                        </div>
                                        {img.material !== 'mixed' && (
                                            <div className="px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider border bg-black/50 text-[#ff00ff] border-[#ff00ff]/30">
                                                {img.material}
                                            </div>
                                        )}
                                    </div>

                                    {/* Clone button overlay */}
                                    <button
                                        onClick={(e) => handleClone(img, e)}
                                        disabled={analyzing}
                                        className="absolute bottom-2 right-2 px-3 py-1.5 bg-[#00f3ff] text-black text-[9px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shadow-lg translate-y-2 group-hover:translate-y-0 duration-200"
                                        title="Clone this design"
                                    >
                                        {analyzingImage === img.path ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                                SCANNING
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                CLONE
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="mt-3 px-1 pb-1">
                                    <h4 className="text-[10px] font-black uppercase truncate text-gray-400 group-hover:text-[#ff00ff] transition-colors" title={img.name}>
                                        {img.name}
                                    </h4>
                                    {img.timestamp > 0 && (
                                        <div className="text-[8px] text-gray-600 font-mono mt-0.5">
                                            {new Date(img.timestamp).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-8 animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-8 right-8 text-white hover:text-[#ff00ff] transition-colors"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="max-w-6xl w-full flex flex-col gap-8" onClick={(e) => e.stopPropagation()}>
                        <div className="relative flex justify-center">
                            <img
                                src={selectedImage.path}
                                alt={selectedImage.name}
                                className="w-auto h-auto max-h-[75vh] object-contain border border-[#ff00ff]/30 shadow-[0_0_50px_#ff00ff22]"
                            />
                        </div>
                        <div className="text-center flex flex-col gap-6 items-center">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-wider cyber-font">
                                    {selectedImage.name}
                                </h3>
                                <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                                    <span className="text-[#00f3ff]">TYPE: {selectedImage.type}</span>
                                    {selectedImage.material !== 'mixed' && <span className="text-[#ff00ff]">MAT: {selectedImage.material}</span>}
                                    {selectedImage.timestamp > 0 && (
                                        <span className="text-gray-500">DATE: {new Date(selectedImage.timestamp).toLocaleDateString()}</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 justify-center">
                                <a
                                    href={selectedImage.path}
                                    download={`${selectedImage.name}.webp`}
                                    className="px-8 py-3 bg-[#ff00ff] text-white text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center gap-2"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    DOWNLOAD_FILE
                                </a>
                                <button
                                    onClick={(e) => {
                                        setSelectedImage(null);
                                        handleClone(selectedImage, e);
                                    }}
                                    disabled={analyzing}
                                    className="px-8 py-3 bg-[#00f3ff] text-black text-[11px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    CLONE_DESIGN
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
