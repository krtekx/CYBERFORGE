import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Part, MachineDesign, AppStatus, MachineConfig, StructureMaterial, BOMItem, Difficulty, BatteryType, PartCategory } from './types';
import PartSelector from './components/PartSelector';
import PartDetailPopup from './components/PartDetailPopup';
import SynthesisProgress from './components/SynthesisProgress';
import ApiKeyManagerComponent from './components/ApiKeyManager';
import { LoginScreen } from './components/LoginScreen';
import { GalleryView } from './components/GalleryView';
import { ComponentsView } from './components/ComponentsView';
import { generateDesigns, generateImageForDesign, CURRENT_IMAGE_MODEL } from './services/geminiService';
import { ApiKeyManager } from './services/apiKeyManager';
import { saveMetadataFile } from './services/metadataService';
import { StorageService } from './services/storageService';
import { COMMON_PARTS } from './constants';

const VERSION = "v13.6.0";

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

/**
 * Encapsulates the logic to render a technical datasheet onto a canvas and export as WebP.
 * Includes visual design, BOM manifest, and project descriptions.
 */
const convertToWebPBlobWithMetadata = (base64: string, design: MachineDesign): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const padding = 50;
      const headerSpace = 120;
      const footerHeight = 550;
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height + footerHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error("Canvas context error"));

      // Background - Deep Carbon
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Decorative Grid Overlay
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Draw the AI Generated Visual
      ctx.drawImage(img, 0, 0);

      const drawY = img.height + padding;

      // Cyberpunk Header Line
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(padding, drawY - 15);
      ctx.lineTo(canvas.width - padding, drawY - 15);
      ctx.stroke();

      // Technical Project Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px "Orbitron", sans-serif';
      ctx.fillText(design.name.toUpperCase(), padding, drawY + 50);

      // Design Abstract / Description
      ctx.fillStyle = '#999999';
      ctx.font = 'italic 22px "JetBrains Mono", monospace';
      const descWords = design.description.split(' ');
      let line = '';
      let descY = drawY + 110;
      const maxTextWidth = canvas.width - padding * 2;

      for (let n = 0; n < descWords.length; n++) {
        const testLine = line + descWords[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxTextWidth && n > 0) {
          ctx.fillText(line, padding, descY);
          line = descWords[n] + ' ';
          descY += 32;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, padding, descY);

      // BOM Manifest Label
      ctx.fillStyle = '#ff00ff';
      ctx.font = 'bold 20px "JetBrains Mono", monospace';
      ctx.fillText('TECHNICAL_BOM_MANIFEST // NODES_INTEGRATED', padding, descY + 65);

      // Detailed Component List
      ctx.fillStyle = '#00f3ff';
      ctx.font = '16px "JetBrains Mono", monospace';
      let bomY = descY + 105;
      design.bom.forEach((item, index) => {
        if (bomY < canvas.height - 80) {
          const count = item.quantity.toString().padStart(2, '0');
          const partName = item.part.toUpperCase();
          const purpose = item.purpose.toUpperCase();

          // Draw Row
          ctx.globalAlpha = 0.1;
          ctx.fillStyle = index % 2 === 0 ? '#00f3ff' : 'transparent';
          ctx.fillRect(padding - 10, bomY - 20, canvas.width - (padding * 2) + 20, 26);
          ctx.globalAlpha = 1.0;

          ctx.fillStyle = '#00f3ff';
          ctx.fillText(`[${count}]`, padding, bomY);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`${partName.padEnd(30, ' ')}`, padding + 60, bomY);
          ctx.fillStyle = '#666666';
          ctx.fillText(`:: ${purpose}`, padding + 400, bomY);

          bomY += 30;
        }
      });

      // Terminal Metadata Footer
      ctx.fillStyle = '#222222';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`CYBERFORGE_SYNTHESIZER_ENGINE_v${VERSION}`, canvas.width - padding, canvas.height - 30);
      ctx.textAlign = 'left';
      ctx.fillText(`SESSION_NODE_UUID: ${design.id}`, padding, canvas.height - 30);
      ctx.fillText(`TIMESTAMP: ${new Date().toISOString()}`, padding, canvas.height - 15);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("WebP Export Failure"));
      }, 'image/webp', 0.95);
    };
    img.onerror = () => reject(new Error("Source Image Load Error"));
    img.src = base64;
  });
};

const downloadFile = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const BOMRow: React.FC<{ item: BOMItem, onInspect: (n: string) => void }> = ({ item, onInspect }) => (
  <div
    onClick={() => onInspect(item.part)}
    className="p-4 border-b border-white/5 flex items-center gap-4 hover:bg-white/5 transition-all cursor-pointer group"
  >
    <div className="w-10 h-10 flex items-center justify-center border border-white/5 bg-black shrink-0">
      <div className="w-5 h-5 border border-[#00f3ff44] text-[#00f3ff] flex items-center justify-center text-[10px] font-bold">#</div>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-start">
        <h5 className="text-[10px] font-black uppercase truncate text-gray-300 group-hover:text-[#00f3ff] transition-colors">
          {item.part}
        </h5>
        <span className="text-[9px] text-[#00f3ff] font-mono font-bold">x{item.quantity}</span>
      </div>
      <p className="text-[8px] text-gray-600 italic mt-0.5 font-mono uppercase truncate">{item.purpose}</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<'forge' | 'gallery' | 'components'>('forge');
  const [availableParts, setAvailableParts] = useState<Part[]>(() => StorageService.getParts());
  const [categories, setCategories] = useState<PartCategory[]>(() => StorageService.getCategories());
  const [selectedParts, setSelectedParts] = useState<Part[]>([]);
  const [config, setConfig] = useState<MachineConfig>({
    useBattery: true,
    powerType: '18650',
    structureMaterial: 'Brass',
    difficulty: 'Moderate',
    userPrompt: '',
    brassLight: true,
    brassWires: false,
    synthesisCount: 1
  });

  const [designs, setDesigns] = useState<MachineDesign[]>([]);
  const [lastForgeSessionCount, setLastForgeSessionCount] = useState(0);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [activeDesignIndex, setActiveDesignIndex] = useState(-1);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [inspectedPart, setInspectedPart] = useState<Part | null>(null);
  const [isDataReady, setIsDataReady] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasSelectedKey, setHasSelectedKey] = useState(false);
  const [identityName, setIdentityName] = useState("GUEST_AGENT");
  const [showApiKeyManager, setShowApiKeyManager] = useState(false);
  const [activeApiKeyName, setActiveApiKeyName] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if user was authenticated in this session
    return sessionStorage.getItem('cyberforge_authenticated') === 'true';
  });

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasSelectedKey(hasKey);
      }
    };
    checkKey();

    // Check for API keys in the manager
    const updateActiveKeyName = () => {
      const activeKey = ApiKeyManager.getActive();
      setActiveApiKeyName(activeKey ? activeKey.name : null);
      setHasSelectedKey(ApiKeyManager.hasKeys());
    };
    updateActiveKeyName();
  }, []);

  const handleSwitchIdentity = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasSelectedKey(true);
      const name = prompt("Enter Identity Alias:", identityName);
      if (name) setIdentityName(name.toUpperCase());
    }
  };

  const handleManualBatchSave = async () => {
    const targetCount = lastForgeSessionCount || config.synthesisCount;
    const targets = designs.slice(-targetCount);
    if (targets.length === 0) {
      alert("FORGE_CACHE_EMPTY: No blueprints to export.");
      return;
    }

    setIsExporting(true);
    try {
      for (const design of targets) {
        // Create a placeholder image if none exists
        let imageData = design.images && design.images[0];

        if (!imageData) {
          // Generate a simple placeholder canvas
          const canvas = document.createElement('canvas');
          canvas.width = 1024;
          canvas.height = 1024;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Dark background
            ctx.fillStyle = '#0a0a0f';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Grid pattern
            ctx.strokeStyle = '#1a1a2e';
            ctx.lineWidth = 2;
            for (let x = 0; x < canvas.width; x += 50) {
              ctx.beginPath();
              ctx.moveTo(x, 0);
              ctx.lineTo(x, canvas.height);
              ctx.stroke();
            }
            for (let y = 0; y < canvas.height; y += 50) {
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(canvas.width, y);
              ctx.stroke();
            }

            // Text placeholder
            ctx.fillStyle = '#00f3ff';
            ctx.font = 'bold 48px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('CYBERFORGE', canvas.width / 2, canvas.height / 2 - 100);
            ctx.fillStyle = '#666';
            ctx.font = '32px monospace';
            ctx.fillText('IMAGE GENERATION PENDING', canvas.width / 2, canvas.height / 2);
            ctx.fillText('TEXT DATA EXPORT', canvas.width / 2, canvas.height / 2 + 50);

            imageData = canvas.toDataURL('image/png');
          }
        }

        if (imageData) {
          const blob = await convertToWebPBlobWithMetadata(imageData, design);
          const sanitizedName = design.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          downloadFile(blob, `${sanitizedName}_blueprint.webp`);
          await new Promise(r => setTimeout(r, 400)); // Paced downloads
        }
      }
      alert(`Successfully exported ${targets.length} blueprint(s)!`);
    } catch (e) {
      console.error("Batch Export Error:", e);
      alert("EXPORT_PROTOCOL_ERROR: Datasheet generation failed.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSynthesize = async () => {
    if (selectedParts.length === 0 && config.userPrompt.trim().length === 0) {
      alert("WORKBENCH_VACANT: Load components or describe vision.");
      return;
    }
    setStatus(AppStatus.GENERATING);
    setIsDataReady(false);
    setLastForgeSessionCount(config.synthesisCount);
    try {
      const results = await generateDesigns(selectedParts, config);
      if (results && results.length > 0) {
        setDesigns(prev => [...prev, ...results]);
        setIsDataReady(true);
      }
    } catch (err: any) {
      console.error("Synthesis Core Error:", err);
      setStatus(AppStatus.ERROR);
      alert("NEURAL_SYNC_FAILED: Check project selection in the Identity Console.");
    }
  };

  useEffect(() => {
    const pending = designs.filter(d => d.images.length === 0);
    if (pending.length > 0 && status === AppStatus.SUCCESS && !isImageLoading) {
      (async () => {
        setIsImageLoading(true);
        try {
          const results = await Promise.all(pending.map(async (design) => {
            const img = await generateImageForDesign(design, config);
            return { id: design.id, img };
          }));
          setDesigns(prev => prev.map(d => {
            const match = results.find(r => r.id === d.id);
            if (match && match.img) return { ...d, images: [match.img] };
            return d;
          }));
          const firstNewIdx = designs.findIndex(d => d.id === pending[0].id);
          setActiveDesignIndex(firstNewIdx >= 0 ? firstNewIdx : designs.length - 1);
        } catch (e) {
          console.error("Batch Rendering Error:", e);
        } finally {
          setIsImageLoading(false);
        }
      })();
    }
  }, [designs, status, config, isImageLoading]);

  const handleLogin = () => {
    sessionStorage.setItem('cyberforge_authenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleClone = (metadata: import('./services/metadataService').BlueprintMetadata) => {
    // Switch to forge view
    setView('forge');

    // Update config with cloned design parameters
    setConfig(prev => ({
      ...prev,
      difficulty: (metadata.difficulty as any) || 'Moderate',
      structureMaterial: (metadata.material as any) || 'Brass',
      userPrompt: `${metadata.name}: ${metadata.description}`,
      synthesisCount: 1
    }));

    // Try to match parts from BOM
    const matchedParts: Part[] = [];
    metadata.bom.forEach(bomItem => {
      const partName = bomItem.part.toLowerCase();
      const found = availableParts.find(p =>
        p.name.toLowerCase().includes(partName) ||
        partName.includes(p.name.toLowerCase())
      );
      if (found) {
        matchedParts.push(found);
      }
    });

    setSelectedParts(matchedParts);

    console.log('🔄 CLONE COMPLETE:', {
      name: metadata.name,
      difficulty: metadata.difficulty,
      material: metadata.material,
      bomItems: metadata.bom.length,
      matchedParts: matchedParts.length
    });
  };

  const activeDesign = activeDesignIndex >= 0 ? designs[activeDesignIndex] : null;

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const galleryModules = import.meta.glob('/public/gallery/*.webp', { eager: true });
  const galleryCount = Object.keys(galleryModules).length;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 flex flex-col overflow-x-hidden selection:bg-[#00f3ff] selection:text-black font-mono">

      <header className="p-8 pb-4 bg-[#0a0a0f] flex items-center justify-between no-print border-b border-[#00f3ff11] z-50">
        <div className="flex items-center gap-6">
          <h1 className="cyber-font text-4xl font-black text-white glitch-text italic tracking-tighter leading-none">CYBERFORGE</h1>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-[#00f3ff] bg-[#00f3ff11] px-2 py-0.5 border border-[#00f3ff22]">{VERSION}</span>
            <span className="text-[10px] font-mono text-[#00f3ff] bg-[#00f3ff11] px-2 py-0.5 border border-[#00f3ff22] ml-2">{CURRENT_IMAGE_MODEL.toUpperCase()}</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end border-r border-gray-900 pr-6 mr-2">
            <div className="text-[8px] text-gray-600 font-black uppercase tracking-[0.2em] mb-1">Identity_Console</div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] text-white font-black leading-none">{identityName}</div>
                <div className="text-[7px] text-[#00f3ff] mt-0.5 uppercase">Status: {hasSelectedKey ? 'SYNCED' : 'OFFLINE'}</div>
                {activeApiKeyName && (
                  <div className="text-[7px] text-[#ff00ff] mt-0.5 uppercase">Key: {activeApiKeyName}</div>
                )}
              </div>
              <button onClick={() => setShowApiKeyManager(true)} className={`p-2 border transition-all hover:bg-white hover:text-black ${hasSelectedKey ? 'border-[#00f3ff] text-[#00f3ff]' : 'border-red-500 text-red-500 animate-pulse'}`} title="Manage API Keys">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              </button>
            </div>
          </div>

          <div className="flex bg-black border border-gray-900 p-1 rounded-sm h-10">
            <button onClick={() => setView('forge')} className={`px-5 text-[10px] font-black uppercase transition-all ${view === 'forge' ? 'bg-[#00f3ff] text-black' : 'text-gray-600 hover:text-white'}`}>FORGE</button>
            <button onClick={() => setView('gallery')} className={`px-5 text-[10px] font-black uppercase transition-all ${view === 'gallery' ? 'bg-[#ff00ff] text-white' : 'text-gray-600 hover:text-white'}`}>GALLERY ({galleryCount})</button>
            <button onClick={() => setView('components')} className={`px-5 text-[10px] font-black uppercase transition-all ${view === 'components' ? 'bg-white text-black' : 'text-gray-600 hover:text-white'}`}>COMPONENTS</button>
          </div>
        </div>

        <button onClick={() => { setDesigns([]); setStatus(AppStatus.IDLE); setActiveDesignIndex(-1); }} className="px-6 py-2 h-10 text-[11px] font-black border border-gray-800 text-gray-500 hover:text-white transition-all uppercase bg-black/50">PURGE</button>
      </header>

      <main className="w-full mx-auto p-8 pt-6 space-y-8 flex flex-col relative flex-1">
        {view === 'forge' ? (
          <>
            <section className={`space-y-6 transition-opacity duration-500 ${status === AppStatus.GENERATING ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              <div className="space-y-4">
                <div className="text-[11px] text-[#00f3ff] font-black uppercase tracking-[0.4em] italic">NEURAL_PROMPT</div>
                <textarea
                  value={config.userPrompt}
                  onChange={(e) => setConfig(prev => ({ ...prev, userPrompt: e.target.value }))}
                  placeholder="Describe artifact... e.g. 'retro weather station in brass case'"
                  className="w-full h-24 bg-[#0a0a0f] border border-gray-900 p-6 text-base text-white focus:outline-none focus:border-[#00f3ff] font-mono transition-all resize-none shadow-inner"
                />
              </div>

              <div className="flex flex-wrap gap-8 items-start py-6 border-t border-white/5 bg-[#0a0a0f]/30 p-6 rounded-sm">
                <div className="space-y-3">
                  <div className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Complexity</div>
                  <div className="flex bg-black border border-gray-900 p-0.5">
                    {(['Easy', 'Moderate', 'Hard'] as Difficulty[]).map(d => (
                      <button key={d} onClick={() => setConfig(prev => ({ ...prev, difficulty: d }))} className={`px-4 py-2 text-[10px] font-black uppercase transition-all ${config.difficulty === d ? 'bg-white text-black' : 'text-gray-600 hover:text-white'}`}>{d}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Material</div>
                  <div className="flex bg-black border border-gray-900 p-0.5">
                    {(['Brass', 'Acrylic', 'Plywood', '3D Print'] as StructureMaterial[]).map(mat => (
                      <button key={mat} onClick={() => setConfig(prev => ({ ...prev, structureMaterial: mat }))} className={`px-4 py-2 text-[10px] font-black uppercase transition-all ${config.structureMaterial === mat ? 'bg-[#00f3ff] text-black' : 'text-gray-600 hover:text-white'}`}>{mat}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Aesthetics</div>
                  <div className="flex gap-3">
                    <button onClick={() => setConfig(prev => ({ ...prev, brassLight: !prev.brassLight }))} className={`px-4 py-2 text-[10px] font-black uppercase border transition-all ${config.brassLight ? 'border-[#ff00ff] text-[#ff00ff] bg-[#ff00ff0a]' : 'border-gray-900 text-gray-700'}`}>LIGHTS: {config.brassLight ? 'ON' : 'OFF'}</button>
                    <button onClick={() => setConfig(prev => ({ ...prev, brassWires: !prev.brassWires }))} className={`px-4 py-2 text-[10px] font-black uppercase border transition-all ${config.brassWires ? 'border-[#00f3ff] text-[#00f3ff] bg-[#00f3ff0a]' : 'border-gray-900 text-gray-700'}`}>WIRING: {config.brassWires ? 'ON' : 'OFF'}</button>
                  </div>
                </div>

                <div className="ml-auto flex items-center gap-6 bg-black/50 p-4 border border-white/5 rounded-sm">
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] text-gray-600 font-black uppercase tracking-[0.3em] mb-1">Activation_Units</span>
                    <div className="flex gap-1 bg-black p-1 border border-gray-800">
                      {[1, 2, 3, 4, 5].map(num => (
                        <button key={num} onClick={() => setConfig(prev => ({ ...prev, synthesisCount: num }))} className={`w-7 h-7 flex items-center justify-center text-[10px] font-black border transition-all ${config.synthesisCount === num ? 'bg-[#00f3ff] text-black border-[#00f3ff]' : 'text-gray-500 border-transparent hover:border-gray-700'}`}>{num}</button>
                      ))}
                    </div>
                  </div>

                  <button onClick={handleSynthesize} className={`group relative px-6 py-2.5 border-2 flex items-center justify-center transition-all duration-300 ${selectedParts.length === 0 ? 'border-[#ff00ff] hover:bg-[#ff00ff]' : 'border-[#00f3ff] hover:bg-[#00f3ff]'}`}>
                    <span className={`text-[11px] font-black cyber-font italic tracking-[0.1em] group-hover:text-black ${selectedParts.length === 0 ? 'text-[#ff00ff]' : 'text-[#00f3ff]'}`}>FORGE_INIT</span>
                  </button>
                </div>
              </div>
            </section>

            <section className={`bg-black/40 border border-[#00f3ff11] transition-opacity duration-500 ${status === AppStatus.GENERATING ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              <PartSelector
                availableParts={availableParts} selectedParts={selectedParts}
                categories={categories}
                onAddPart={(p) => setSelectedParts(prev => [...prev, p])}
                onRegisterPart={(p) => setAvailableParts(prev => [...prev, p])}
                onRemovePart={(id) => setSelectedParts(prev => prev.filter(p => p.id !== id))}
                onInspectPart={setInspectedPart}
              />
            </section>

            {status === AppStatus.GENERATING && <SynthesisProgress isDataReady={isDataReady} onComplete={() => setStatus(AppStatus.SUCCESS)} />}

            {activeDesign && (
              <main className="w-full animate-reveal space-y-12 pb-32 pt-12 border-t border-white/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex items-center gap-8">
                    <div className="text-[11px] text-gray-600 font-black uppercase tracking-[0.4em] italic">VARIANTS:</div>
                    <div className="flex gap-4">
                      {designs.slice(-(lastForgeSessionCount || 1)).map((d) => (
                        <button key={d.id} onClick={() => setActiveDesignIndex(designs.indexOf(d))} className={`w-20 h-20 border-2 transition-all overflow-hidden relative ${activeDesignIndex === designs.indexOf(d) ? 'border-[#00f3ff] scale-110 shadow-[0_0_15px_#00f3ff44]' : 'border-gray-900 opacity-40'}`}>
                          {d.images[0] ? <img src={d.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black animate-pulse flex items-center justify-center text-[8px] text-gray-800 uppercase font-black">Sync</div>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleManualBatchSave} disabled={isExporting || isImageLoading}
                    className="px-12 py-5 bg-[#ff00ff] text-white text-[13px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all flex items-center gap-5 shadow-[0_0_30px_#ff00ff44] disabled:opacity-50"
                  >
                    {isExporting ? <span className="animate-pulse">ENCODING_WEBP...</span> : <><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg> EXPORT_ALL_BLUEPRINTS</>}
                  </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                  <div className="lg:w-2/3 flex flex-col gap-6">
                    <div className="aspect-square bg-[#050505] border border-white/10 relative overflow-hidden flex items-center justify-center shadow-2xl">
                      {isImageLoading && activeDesign.images.length === 0 ? (
                        <div className="flex flex-col items-center gap-6">
                          <div className="w-16 h-16 border-4 border-[#00f3ff11] border-t-[#00f3ff] rounded-full animate-spin"></div>
                          <div className="text-[#00f3ff] animate-pulse font-mono tracking-[0.6em] uppercase text-xs">visualizing_design...</div>
                        </div>
                      ) : activeDesign.images && activeDesign.images[0] ? (
                        <img src={activeDesign.images[0]} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-gray-900 uppercase font-mono text-[12px] tracking-[1em]">Neural Void</div>
                      )}
                    </div>
                    <div className="bg-[#0a0a0f]/50 p-10 border border-white/5 space-y-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h2 className="text-5xl font-black text-white cyber-font italic uppercase tracking-tighter glitch-text">{activeDesign.name}</h2>
                        </div>
                        <button
                          onClick={async () => {
                            setIsExporting(true);
                            try {
                              let imageData = activeDesign.images && activeDesign.images[0];
                              if (!imageData) {
                                const canvas = document.createElement('canvas');
                                canvas.width = 1024;
                                canvas.height = 1024;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                  ctx.fillStyle = '#0a0a0f';
                                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                                  ctx.strokeStyle = '#1a1a2e';
                                  ctx.lineWidth = 2;
                                  for (let x = 0; x < canvas.width; x += 50) {
                                    ctx.beginPath();
                                    ctx.moveTo(x, 0);
                                    ctx.lineTo(x, canvas.height);
                                    ctx.stroke();
                                  }
                                  for (let y = 0; y < canvas.height; y += 50) {
                                    ctx.beginPath();
                                    ctx.moveTo(0, y);
                                    ctx.lineTo(canvas.width, y);
                                    ctx.stroke();
                                  }
                                  ctx.fillStyle = '#00f3ff';
                                  ctx.font = 'bold 48px monospace';
                                  ctx.textAlign = 'center';
                                  ctx.fillText('CYBERFORGE', canvas.width / 2, canvas.height / 2 - 100);
                                  ctx.fillStyle = '#666';
                                  ctx.font = '32px monospace';
                                  ctx.fillText('IMAGE GENERATION PENDING', canvas.width / 2, canvas.height / 2);
                                  ctx.fillText('TEXT DATA EXPORT', canvas.width / 2, canvas.height / 2 + 50);
                                  imageData = canvas.toDataURL('image/png');
                                }
                              }
                              if (imageData) {
                                const blob = await convertToWebPBlobWithMetadata(imageData, activeDesign);
                                const sanitizedName = activeDesign.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                                downloadFile(blob, `blueprint_${sanitizedName}.webp`);
                                alert('Blueprint exported successfully!');
                              }
                            } catch (e) {
                              console.error('Export Error:', e);
                              alert('Export failed. Check console for details.');
                            } finally {
                              setIsExporting(false);
                            }
                          }}
                          disabled={isExporting}
                          className="px-6 py-3 bg-[#00f3ff] text-black text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all flex items-center gap-3 disabled:opacity-50 shrink-0"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                          SAVE WEBP
                        </button>
                      </div>
                      <p className="text-[16px] text-gray-400 leading-relaxed font-mono uppercase italic border-l-2 border-[#00f3ff33] pl-6 py-2">"{activeDesign.description}"</p>
                    </div>
                  </div>

                  <div className="lg:w-1/3 bg-[#0a0a0f] border border-white/5 flex flex-col shadow-2xl overflow-hidden min-h-[600px] relative">
                    <header className="p-10 text-[14px] text-[#00f3ff] font-black uppercase tracking-[0.6em] border-b border-white/5 bg-[#00f3ff05] flex justify-between items-center">
                      <span>BOM_MANIFEST</span>
                      <span className="text-gray-700 text-[10px] font-mono">NODE_UID: {activeDesign.id}</span>
                    </header>
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20">
                      {activeDesign.bom.map((item, i) => (
                        <BOMRow key={i} item={item} onInspect={(n) => {
                          const existing = availableParts.find(p => p.name.toLowerCase() === n.toLowerCase());
                          setInspectedPart(existing || { id: 'v-' + Math.random(), name: n, category: 'Passive' });
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
              </main>
            )}
          </>
        ) : view === 'gallery' ? (
          <GalleryView onClone={handleClone} />
        ) : (
          <ComponentsView
            parts={availableParts}
            categories={categories}
            onAddPart={(p) => {
              const updated = [...availableParts, p];
              setAvailableParts(updated);
              StorageService.saveParts(updated);
            }}
            onRemovePart={(id) => {
              const updated = availableParts.filter(p => p.id !== id);
              setAvailableParts(updated);
              StorageService.saveParts(updated);
            }}
            onUpdatePart={(updatedPart) => {
              const updated = availableParts.map(p => p.id === updatedPart.id ? updatedPart : p);
              setAvailableParts(updated);
              StorageService.saveParts(updated);
            }}
            onAddCategory={(cat) => {
              const updated = [...categories, cat];
              setCategories(updated);
              StorageService.saveCategories(updated);
            }}
            onRemoveCategory={(cat) => {
              const updated = categories.filter(c => c !== cat);
              setCategories(updated);
              StorageService.saveCategories(updated);
              // Move deleted category items to Passive
              const partsUpdated = availableParts.map(p => p.category === cat ? { ...p, category: 'Passive' } : p);
              setAvailableParts(partsUpdated);
              StorageService.saveParts(partsUpdated);
            }}
            onUpdateCategory={(oldCat, newCat) => {
              const updated = categories.map(c => c === oldCat ? newCat : c);
              setCategories(updated);
              StorageService.saveCategories(updated);
              // Update parts with old category
              const partsUpdated = availableParts.map(p => p.category === oldCat ? { ...p, category: newCat } : p);
              setAvailableParts(partsUpdated);
              StorageService.saveParts(partsUpdated);
            }}
          />
        )}
      </main>

      <footer className="h-16 bg-[#0a0a0f] border-t border-[#00f3ff11] flex items-center justify-between px-10 text-[11px] text-gray-700 font-mono shrink-0 no-print">
        <div className="flex gap-12 uppercase tracking-widest">
          <span className="flex items-center gap-4 text-gray-500">NEURAL_LINK: STABLE</span>
          <span className="flex items-center gap-4 text-gray-500 italic">AGENT: {identityName}</span>
        </div>
        <div className="opacity-40 italic tracking-[0.5em] text-[10px] uppercase font-black">
          &copy; CYBERFORGE_SYNDICATE // PROJECT_SYNC_PROTOCOL_{VERSION}
        </div>
      </footer>

      {inspectedPart && <PartDetailPopup part={inspectedPart} onClose={() => setInspectedPart(null)} />}
      {showApiKeyManager && (
        <ApiKeyManagerComponent
          onClose={() => setShowApiKeyManager(false)}
          onKeyChanged={() => {
            const activeKey = ApiKeyManager.getActive();
            setActiveApiKeyName(activeKey ? activeKey.name : null);
            setHasSelectedKey(ApiKeyManager.hasKeys());
          }}
        />
      )}
    </div>
  );
};

export default App;