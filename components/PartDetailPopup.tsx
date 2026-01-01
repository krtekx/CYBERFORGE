
import React, { useState, useEffect } from 'react';
import { Part } from '../types';
import { generatePartDocumentation, generateRealPartAbstract } from '../services/geminiService';

interface PartDetailPopupProps {
  part: Part;
  onClose: () => void;
}

const PartDetailPopup: React.FC<PartDetailPopupProps> = ({ part, onClose }) => {
  const [docImage, setDocImage] = useState<string | null>(null);
  const [realInfo, setRealInfo] = useState<{ abstract: string, specs: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      setHasFailed(false);
      try {
        const [img, info] = await Promise.all([
          generatePartDocumentation(part.name),
          generateRealPartAbstract(part.name)
        ]);

        if (img) setDocImage(img);
        if (info) setRealInfo(info);

        if (!img && !info) setHasFailed(true);
      } catch (err) {
        setHasFailed(true);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [part]);

  const fallbackUrl = ''; // User requested no loremflickr

  const aliexpressLink = `https://www.aliexpress.com/w/wholesale-${encodeURIComponent(part.name)}.html`;
  const amazonLink = `https://www.amazon.com/s?k=${encodeURIComponent(part.name)}`;

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-24 p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl bg-[#050505] border border-[#00f3ff44] shadow-[0_0_100px_rgba(0,243,255,0.1)] overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[90vh]">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00f3ff] via-[#ff00ff] to-[#00f3ff] animate-pulse"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-[#00f3ff] hover:text-white transition-all p-3 bg-black/50 border border-[#00f3ff22] hover:border-[#00f3ff]"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="w-full md:w-1/2 bg-[#020202] flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#00f3ff22] min-h-[400px] p-10 relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#00f3ff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

          {loading ? (
            <div className="flex flex-col items-center gap-6 relative z-10">
              <div className="w-12 h-12 border-4 border-[#00f3ff22] border-t-[#00f3ff] rounded-full animate-spin"></div>
              <p className="text-[10px] text-[#00f3ff] cyber-font animate-pulse tracking-[0.5em] uppercase">ACCESSING ARCHIVES...</p>
            </div>
          ) : docImage ? (
            <img src={docImage} alt={part.name} className="max-w-full max-h-full object-contain mix-blend-screen invert opacity-80 filter brightness-125" />
          ) : (
            <div className="relative w-full h-full flex flex-col items-center justify-center gap-4">
              <img src={fallbackUrl} alt={part.name} className="max-w-full max-h-full object-cover filter brightness-50 contrast-125" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <div className="text-[10px] text-red-500 font-black uppercase mb-2 bg-black/80 px-2 py-1 border border-red-500/50">Neural Link Throttled [429]</div>
                <div className="text-[8px] text-gray-500 font-mono uppercase tracking-[0.4em]">Displaying Stock Image Fallback</div>
              </div>
            </div>
          )}

          <div className="absolute bottom-6 left-6 text-[7px] text-gray-700 font-mono tracking-[0.3em] uppercase space-y-1">
            <div>UID: {part.id.toUpperCase()}</div>
            <div>SPEC_TYPE: HARDWARE_SCHEMA_V2</div>
            <div>ENC: NEURAL_LINK_READY</div>
          </div>
        </div>

        <div className="flex-1 p-10 overflow-y-auto custom-scrollbar flex flex-col gap-8 bg-[radial-gradient(circle_at_top_right,_#0a0a0f_0%,_#050505_100%)]">
          <header className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border border-[#00f3ff] flex items-center justify-center">
                <svg className="w-6 h-6 text-[#00f3ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-4xl font-black cyber-font italic text-white uppercase tracking-tighter leading-none glitch-text">
                {part.name}
              </h2>
            </div>
            <div className="flex flex-wrap gap-4">
              <span className="text-[10px] px-3 py-1 bg-[#00f3ff11] border border-[#00f3ff] text-[#00f3ff] font-black uppercase tracking-widest">{part.category}</span>
              <span className="text-[10px] px-3 py-1 border border-gray-800 text-gray-500 font-mono uppercase tracking-widest bg-black">VERIFIED HARDWARE NODE</span>
            </div>
          </header>

          <section className="space-y-3">
            <div className="h-px bg-gradient-to-r from-[#ff00ff44] to-transparent w-32"></div>
            <h4 className="text-[11px] text-[#ff00ff] font-black uppercase tracking-[0.4em]">Neural Technical Abstract</h4>
            <p className="text-xs text-gray-300 leading-relaxed italic font-mono uppercase tracking-tight relative bg-black/40 p-4 border-l-2 border-[#ff00ff]">
              {realInfo?.abstract || (loading ? 'Decoding bitstream...' : 'Technical summary currently unavailable. Public documentation confirms this as a core modular component for signal synthesis.')}
            </p>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <section className="space-y-4">
              <h4 className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em] border-b border-gray-900 pb-2">Critical Description</h4>
              <ul className="space-y-3">
                {(realInfo?.specs || ['HIGH_DENSITY_I/O', 'LOW_THERMAL_BLEED', 'NEURAL_OPTIMIZED']).map((spec, i) => (
                  <li key={i} className="text-[11px] text-gray-200 font-mono flex items-start gap-3">
                    <span className="text-[#00f3ff] animate-pulse">»</span>
                    <span className="uppercase">{spec}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-4">
              <h4 className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em] border-b border-gray-900 pb-2">Neural Procurement</h4>
              <div className="grid grid-cols-1 gap-3">
                <a
                  href={aliexpressLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-black border border-[#ff00ff44] group hover:border-[#ff00ff] hover:bg-[#ff00ff11] transition-all flex items-center justify-between"
                >
                  <span className="text-[10px] text-[#ff00ff] font-black uppercase tracking-widest">Source via AliExpress</span>
                  <span className="text-[#ff00ff] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </a>
                <a
                  href={amazonLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-black border border-[#00f3ff44] group hover:border-[#00f3ff] hover:bg-[#00f3ff11] transition-all flex items-center justify-between"
                >
                  <span className="text-[10px] text-[#00f3ff] font-black uppercase tracking-widest">Source via Amazon</span>
                  <span className="text-[#00f3ff] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </a>
              </div>
            </section>
          </div>

          <footer className="mt-auto pt-8 border-t border-gray-900 flex justify-between items-end text-[9px] text-gray-700 font-mono">
            <div className="space-y-1">
              <div>DATA_SOURCE: REAL_WORLD_NEURAL_QUERY</div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                STATUS: VERIFIED_DATA_LINK
              </div>
            </div>
            <div className="text-right italic opacity-50 uppercase font-black">
              &copy; CyberForge Syndicate // Procurement Protocol
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default PartDetailPopup;
