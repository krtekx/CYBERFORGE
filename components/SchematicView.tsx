
import React, { useState, useRef, useEffect } from 'react';
import { SchematicNode, SchematicEdge } from '../types';
import { THEME_COLORS } from '../constants';

interface SchematicViewProps {
  nodes: SchematicNode[];
  edges: SchematicEdge[];
}

const SchematicView: React.FC<SchematicViewProps> = ({ nodes, edges }) => {
  const [scale, setScale] = useState(0.8);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-center on load
  useEffect(() => {
    if (nodes.length > 0) {
      const minX = Math.min(...nodes.map(n => n.x));
      const maxX = Math.max(...nodes.map(n => n.x));
      const minY = Math.min(...nodes.map(n => n.y));
      const maxY = Math.max(...nodes.map(n => n.y));
      
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      // Attempt to center the view
      setOffset({ x: 0, y: 0 }); 
    }
  }, [nodes]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * delta, 0.2), 10));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setScale(0.8);
    setOffset({ x: 0, y: 0 });
  };

  // Helper to draw curved connections
  const getBezierPath = (fromX: number, fromY: number, toX: number, toY: number) => {
    const dx = Math.abs(toX - fromX);
    const midX = (fromX + toX) / 2;
    // Create a slight curve
    return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
  };

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative w-full aspect-video bg-[#050505] rounded-lg overflow-hidden border border-[#00f3ff22] p-4 cursor-grab active:cursor-grabbing shadow-inner"
    >
      {/* Background Grid */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(#00f3ff 1px, transparent 1px)', 
          backgroundSize: '30px 30px',
          transform: `translate(${offset.x % 30}px, ${offset.y % 30}px) scale(${scale})`
        }}
      ></div>

      <div 
        style={{ 
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
        className="w-full h-full pointer-events-none"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          {/* Connection Wires */}
          {edges.map((edge, idx) => {
            const from = nodes.find(n => n.id === edge.from);
            const to = nodes.find(n => n.id === edge.to);
            if (!from || !to) return null;

            const isPower = edge.label.toUpperCase().includes('VCC') || edge.label.toUpperCase().includes('5V') || edge.label.toUpperCase().includes('3.3');
            const isGND = edge.label.toUpperCase().includes('GND') || edge.label.toUpperCase().includes('G');
            const color = isPower ? '#ff0055' : isGND ? '#666' : THEME_COLORS.cyan;

            return (
              <g key={`edge-${idx}`}>
                <path
                  d={getBezierPath(from.x, from.y, to.x, to.y)}
                  stroke={color}
                  strokeWidth="0.4"
                  fill="none"
                  strokeOpacity="0.8"
                />
                <rect 
                  x={(from.x + to.x) / 2 - 4} 
                  y={(from.y + to.y) / 2 - 1.5} 
                  width="8" 
                  height="3" 
                  fill="#050505" 
                  rx="0.5"
                  opacity="0.8"
                />
                <text
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 + 0.5}
                  fill={color}
                  fontSize="1.2"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="font-mono"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Components */}
          {nodes.map((node) => (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              <rect
                x="-8"
                y="-6"
                width="16"
                height="12"
                fill="#0a0a0f"
                stroke={THEME_COLORS.cyan}
                strokeWidth="0.3"
                rx="0.5"
                className="shadow-2xl"
              />
              {/* Pin Headers Decoration */}
              <line x1="-7" y1="-5" x2="-7" y2="5" stroke="#333" strokeWidth="0.5" strokeDasharray="0.5 0.5" />
              <line x1="7" y1="-5" x2="7" y2="5" stroke="#333" strokeWidth="0.5" strokeDasharray="0.5 0.5" />
              
              <text
                y="-2"
                fill="#fff"
                fontSize="2.5"
                fontWeight="900"
                textAnchor="middle"
                className="cyber-font italic"
              >
                {node.label}
              </text>
              <text
                y="2.5"
                fill={THEME_COLORS.cyan}
                fontSize="1.5"
                fontWeight="bold"
                textAnchor="middle"
                className="opacity-60 uppercase tracking-widest"
              >
                {node.type}
              </text>
              {/* Node ID marker */}
              <text
                x="6.5"
                y="5"
                fill="#222"
                fontSize="1"
                textAnchor="end"
              >
                ID:{node.id}
              </text>
            </g>
          ))}
        </svg>
      </div>
      
      {/* Controls UI */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 pointer-events-auto">
        <button 
          onClick={resetView}
          className="bg-black/80 border border-[#00f3ff44] text-[#00f3ff] text-[9px] px-3 py-1.5 uppercase font-black hover:bg-[#00f3ff22] transition-all"
        >
          FIT VIEW
        </button>
        <div className="text-[10px] text-gray-500 font-mono bg-black/80 p-2 border border-gray-900">
          MAGNIFICATION: {Math.round(scale * 100)}%
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2 pointer-events-none bg-black/60 p-3 border border-gray-900 backdrop-blur-sm">
        <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">DC POWER</span>
            <span className="w-8 h-1 bg-[#ff0055] rounded-full"></span>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">DATA / BUS</span>
            <span className="w-8 h-1 bg-[#00f3ff] rounded-full"></span>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">GROUND</span>
            <span className="w-8 h-1 bg-[#444] rounded-full"></span>
        </div>
      </div>
    </div>
  );
};

export default SchematicView;
