import React, { useState, useEffect } from 'react';
import { analyzeImageWithAI, BlueprintMetadata } from '../services/metadataService';

interface GalleryImage {
    name: string;
    path: string;
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

    useEffect(() => {
        // Load all WebP images from the gallery folder
        const loadImages = async () => {
            try {
                // Use Vite's import.meta.glob to load all webp files
                const imageModules = import.meta.glob('/gallery/*.webp', { eager: true, as: 'url' });

                const loadedImages: GalleryImage[] = Object.entries(imageModules).map(([path, url]) => {
                    const fileName = path.split('/').pop() || '';
                    return {
                        name: fileName.replace('.webp', '').replace(/_/g, ' '),
                        path: url as string
                    };
                });

                // Sort by timestamp in filename (newest first)
                // Files with format: cyberforge_name_timestamp.webp or name_timestamp.webp
                loadedImages.sort((a, b) => {
                    // Extract timestamp from filename (last number sequence before .webp)
                    const getTimestamp = (name: string): number => {
                        const match = name.match(/(\d{13,})/); // Match 13+ digit timestamps
                        return match ? parseInt(match[1]) : 0;
                    };

                    const timestampA = getTimestamp(a.name);
                    const timestampB = getTimestamp(b.name);

                    // If both have timestamps, sort by timestamp (newest first)
                    if (timestampA && timestampB) {
                        return timestampB - timestampA;
                    }

                    // Files without timestamps (likely manual uploads) go to the TOP
                    if (timestampA && !timestampB) return 1; // A(ts) should be after B(no-ts)
                    if (!timestampA && timestampB) return -1; // A(no-ts) should be before B(ts)

                    // If neither has timestamp, sort alphabetically DESCENDING (Smart Numeric)
                    // e.g. "download (48)" comes before "download (1)"
                    return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
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

    const handleClone = async (img: GalleryImage, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!onClone) {
            alert('Clone functionality not available in this view');
            return;
        }

        setAnalyzing(true);
        setAnalyzingImage(img.path);

        try {
            // Convert image to base64
            const response = await fetch(img.path);
            const blob = await response.blob();
            const reader = new FileReader();

            reader.onloadend = async () => {
                const base64 = reader.result as string;

                // Analyze image with AI
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
            <section className="animate-reveal space-y-12 pb-40">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[#ff00ff33] pb-12">
                    <div>
                        <h2 className="text-7xl font-black text-white cyber-font italic uppercase tracking-tighter leading-none">
                            GALLERY
                        </h2>
                        <p className="text-[#ff00ff] text-sm font-mono mt-4 uppercase tracking-wider">
                            {images.length} BLUEPRINTS ARCHIVED
                        </p>
                    </div>
                </div>

                {images.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-600 font-mono uppercase tracking-widest">
                            NO IMAGES FOUND IN GALLERY
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
                        {images.map((img, index) => (
                            <div
                                key={index}
                                className="group relative bg-[#0a0a0f] border border-white/5 p-3 hover:border-[#ff00ff] transition-all flex flex-col"
                            >
                                <div
                                    className="aspect-square bg-black overflow-hidden relative shadow-inner cursor-pointer"
                                    onClick={() => setSelectedImage(img)}
                                >
                                    <img
                                        src={img.path}
                                        alt={img.name}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                        loading="lazy"
                                    />

                                    {/* Clone button overlay */}
                                    <button
                                        onClick={(e) => handleClone(img, e)}
                                        disabled={analyzing}
                                        className="absolute top-2 right-2 px-3 py-1.5 bg-[#00f3ff] text-black text-[9px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                        title="Clone this design"
                                    >
                                        {analyzingImage === img.path ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                                ANALYZING
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
                                <div className="mt-4 text-[11px] font-black uppercase truncate text-gray-400 group-hover:text-[#ff00ff]">
                                    {img.name}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-8"
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

                    <div className="max-w-6xl w-full flex flex-col gap-6">
                        <div className="relative">
                            <img
                                src={selectedImage.path}
                                alt={selectedImage.name}
                                className="w-full h-auto max-h-[80vh] object-contain border-2 border-[#ff00ff]"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        <div className="text-center flex flex-col gap-4">
                            <h3 className="text-2xl font-black text-white uppercase tracking-wider">
                                {selectedImage.name}
                            </h3>
                            <div className="flex gap-4 justify-center">
                                <a
                                    href={selectedImage.path}
                                    download={`${selectedImage.name}.webp`}
                                    className="inline-block px-6 py-3 bg-[#ff00ff] text-white text-xs font-black uppercase tracking-wider hover:bg-white hover:text-black transition-all"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    DOWNLOAD
                                </a>
                                <button
                                    onClick={(e) => {
                                        setSelectedImage(null);
                                        handleClone(selectedImage, e);
                                    }}
                                    disabled={analyzing}
                                    className="px-6 py-3 bg-[#00f3ff] text-black text-xs font-black uppercase tracking-wider hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    CLONE DESIGN
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
