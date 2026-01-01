import { useState, useEffect } from 'react';

interface GalleryImage {
    name: string;
    path: string;
}

export const GalleryView = () => {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
    const [loading, setLoading] = useState(true);

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

                // Sort by name
                loadedImages.sort((a, b) => a.name.localeCompare(b.name));

                setImages(loadedImages);
                setLoading(false);
            } catch (error) {
                console.error('Error loading gallery images:', error);
                setLoading(false);
            }
        };

        loadImages();
    }, []);

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
                                className="group relative bg-[#0a0a0f] border border-white/5 p-3 hover:border-[#ff00ff] transition-all cursor-pointer flex flex-col"
                                onClick={() => setSelectedImage(img)}
                            >
                                <div className="aspect-square bg-black overflow-hidden relative shadow-inner">
                                    <img
                                        src={img.path}
                                        alt={img.name}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                        loading="lazy"
                                    />
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
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-white uppercase tracking-wider">
                                {selectedImage.name}
                            </h3>
                            <a
                                href={selectedImage.path}
                                download={`${selectedImage.name}.webp`}
                                className="inline-block mt-4 px-6 py-3 bg-[#ff00ff] text-white text-xs font-black uppercase tracking-wider hover:bg-white hover:text-black transition-all"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                DOWNLOAD
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
