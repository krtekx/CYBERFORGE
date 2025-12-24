
import React, { useState, useMemo, useRef } from 'react';
import { Part, PartCategory } from '../types';

// Removed missing import: generatePartThumbnail

interface PartSelectorProps {
  onAddPart: (part: Part) => void;
  onRegisterPart: (part: Part) => void;
  availableParts: Part[];
  selectedParts: Part[];
  onRemovePart: (id: string) => void;
  onInspectPart: (part: Part) => void;
}

const CATEGORY_MAP: Record<PartCategory, string> = {
  'Core': 'Cores',
  'Display': 'Displays',
  'Sensor': 'Sensors',
  'Power': 'Power',
  'Input': 'Inputs',
  'Actuator': 'Actuators',
  'Light': 'Lights',
  'Structure': 'Frames',
  'Comm': 'Comm',
  'Passive': 'Passives'
};

const CATEGORIES = Object.keys(CATEGORY_MAP) as PartCategory[];

const PartSelector: React.FC<PartSelectorProps> = ({ 
  onAddPart, 
  onRegisterPart, 
  availableParts, 
  selectedParts, 
  onRemovePart,
  onInspectPart
}) => {
  const [activeCategory, setActiveCategory] = useState<PartCategory | 'All'>('All');
  const groupedParts = useMemo(() => {
    return availableParts.filter(p => activeCategory === 'All' || p.category === activeCategory);
  }, [availableParts, activeCategory]);

  return (
    <div className="flex flex-col w-full bg-[#0a0a0f] border border-[#00f3ff11]">
      <div className="p-4 bg-black/40 border-b border-[#00f3ff22] flex flex-wrap items-center gap-6">
        <div className="flex flex-wrap gap-1">
          <button 
            onClick={() => setActiveCategory('All')}
            className={`px-4 py-2 text-[10px] font-black uppercase transition-all border ${activeCategory === 'All' ? 'bg-[#00f3ff] text-black border-[#00f3ff]' : 'text-gray-600 border-gray-900 hover:border-[#00f3ff33]'}`}
          >
            All NODES
          </button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-[9px] font-black uppercase transition-all border ${activeCategory === cat ? 'bg-[#ff00ff] text-black border-[#ff00ff]' : 'text-gray-600 border-gray-900 hover:border-[#ff00ff33]'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="ml-auto text-[10px] text-gray-700 font-mono uppercase">
          Workbench: {selectedParts.length} Active Nodes
        </div>
      </div>
      
      <div className="p-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar">
        {groupedParts.map(part => {
          const isSelected = selectedParts.some(p => p.id === part.id);
          return (
            <div 
              key={part.id} 
              className={`group p-3 border transition-all cursor-pointer flex flex-col justify-between h-24
                ${isSelected 
                  ? 'border-[#00f3ff33] bg-[#00f3ff05] opacity-50' 
                  : 'border-gray-900 bg-black hover:border-[#00f3ff55] hover:bg-[#00f3ff05]'
                }`}
              onClick={() => !isSelected && onAddPart(part)}
            >
              <div>
                <div className={`text-[10px] font-black uppercase truncate ${isSelected ? 'text-gray-600' : 'text-white'}`}>{part.name}</div>
                <div className="text-[7px] text-gray-700 font-mono uppercase mt-1">{part.category}</div>
              </div>
              <div className="flex justify-between items-end">
                <button onClick={(e) => { e.stopPropagation(); onInspectPart(part); }} className="text-[8px] text-cyan-800 hover:text-cyan-400 font-mono">DETAIL</button>
                {isSelected && <span className="text-[8px] text-[#00f3ff] font-black">LOCKED</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#050505] p-4 border-t border-[#00f3ff22] flex items-center gap-4">
        <div className="text-[10px] text-[#00f3ff] font-black uppercase tracking-widest shrink-0">Selected Nodes:</div>
        <div className="flex flex-wrap gap-2">
          {selectedParts.map(part => (
            <div 
              key={part.id}
              className="px-3 py-1 bg-[#00f3ff0a] border border-[#00f3ff] text-[9px] text-[#00f3ff] flex items-center gap-2 font-mono group"
            >
              <span>{part.name}</span>
              <button onClick={() => onRemovePart(part.id)} className="hover:text-red-500 font-bold">×</button>
            </div>
          ))}
          {selectedParts.length === 0 && <div className="text-[9px] text-gray-800 italic uppercase">Workbench Empty</div>}
        </div>
      </div>
    </div>
  );
};

export default PartSelector;
