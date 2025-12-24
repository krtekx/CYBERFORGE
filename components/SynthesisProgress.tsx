
// Adding missing prop to interface and using it in component definition
import React, { useState, useEffect, useRef } from 'react';

interface Task {
  id: number;
  label: string;
  progress: number;
  status: 'PROCESSING' | 'COMPLETE' | 'WAITING';
  speed: number; 
  startDelay: number; 
}

const TASK_POOL = [
  "PARTS_COLLECTING", "PARTS_COMPATIBILITY", "HARDWARE_MAPPING", "CIRCUIT_ROUTING",
  "VOLTAGE_STABILIZATION", "SIGNAL_SYNC", "CORE_PROTOTYPING", "THERMAL_PROFILING",
  "FIRMWARE_COMPILATION", "I/O_INITIALIZATION", "COMPONENT_REGISTRATION", "NEURAL_INDEXING",
  "ASSEMBLY_SIMULATION", "FINAL_CALIBRATION", "PARITY_CHECK"
];

interface SynthesisProgressProps {
  onComplete: () => void;
  isDataReady: boolean;
  isRandomMode?: boolean;
}

const SynthesisProgress: React.FC<SynthesisProgressProps> = ({ onComplete, isDataReady, isRandomMode }) => {
  const [tasks, setTasks] = useState<Task[]>(
    TASK_POOL.map((label, i) => ({
      id: i,
      label,
      progress: 0,
      status: 'PROCESSING',
      speed: Math.random() * 0.4 + 0.1, 
      startDelay: Math.random() * 200
    }))
  );
  const [totalProgress, setTotalProgress] = useState(0);
  const [cycleCount, setCycleCount] = useState(1);
  const animationFrameRef = useRef<number>(null);
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    const update = () => {
      setTicks(t => t + 1);
      setTasks(prev => {
        const allDone = prev.every(t => t.progress >= 99);
        
        if (allDone) {
          if (isDataReady) {
            if (totalProgress < 100) {
              setTotalProgress(p => Math.min(p + 1.5, 100));
              return prev;
            } else {
              setTimeout(onComplete, 500);
              return prev;
            }
          } else {
            // Cycle back
            setCycleCount(c => c + 1);
            return TASK_POOL.map((label, i) => ({
              id: Date.now() + i,
              label,
              progress: 0,
              status: 'PROCESSING',
              speed: Math.random() * 0.4 + 0.1,
              startDelay: Math.random() * 100
            }));
          }
        }

        const next = prev.map(task => {
          if (task.progress >= 100) return task;
          if (ticks < task.startDelay) return task;

          const baseSpeed = isDataReady ? 1.5 : 1.0;
          const increment = Math.random() * task.speed * baseSpeed;
          return { ...task, progress: Math.min(task.progress + increment, 100) };
        });

        const avg = next.reduce((acc, t) => acc + t.progress, 0) / next.length;
        setTotalProgress(tp => {
          const smoothing = 0.1;
          const delta = avg - tp;
          return tp + delta * smoothing;
        });

        return next;
      });
      animationFrameRef.current = requestAnimationFrame(update);
    };

    animationFrameRef.current = requestAnimationFrame(update);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isDataReady, totalProgress, ticks, onComplete]);

  return (
    <div className="fixed inset-0 z-[400] bg-[#020202] flex flex-col items-center justify-center p-6 font-mono">
      <div className="w-full max-w-4xl bg-black border border-[#00f3ff11] p-10 shadow-2xl relative overflow-hidden flex flex-col">
        <header className="mb-10 flex justify-between items-end border-b border-gray-900 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-900/40"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-900/40"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-green-900/40"></div>
            </div>
            <h2 className="text-[#00f3ff] text-xl font-black cyber-font italic uppercase tracking-tighter">mISS3_FORGE_ENV</h2>
            <div className="text-[9px] text-gray-700 font-mono border-l border-gray-900 pl-4">LAYER_0{cycleCount}</div>
          </div>
          <div className="text-right text-[10px] text-[#00f3ff] animate-pulse">
            {isDataReady ? 'READY_FOR_MANIFEST' : 'SEARCHING_NEURAL_VOID'}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 overflow-hidden">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center gap-4">
              <div className={`w-36 text-[8px] font-black uppercase truncate transition-colors ${task.progress >= 99 ? 'text-gray-900' : 'text-[#00f3ff]'}`}>
                {task.label}
              </div>
              <div className="flex-1 h-[2px] bg-gray-950 relative">
                <div 
                  className="h-full bg-[#00f3ff] transition-all duration-75 shadow-[0_0_8px_#00f3ff66]" 
                  style={{ width: `${task.progress}%` }}
                ></div>
              </div>
              <div className={`w-8 text-right text-[8px] font-mono ${task.progress >= 99 ? 'text-gray-900' : 'text-[#00f3ff] opacity-40'}`}>
                {Math.floor(task.progress).toString().padStart(2, '0')}%
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-900">
           <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] text-white font-black uppercase tracking-[0.4em] italic">AGGREGATE_SYNTHESIS_PAYLOAD</span>
              <span className="text-[10px] text-[#ff00ff] font-black cyber-font">{Math.floor(totalProgress)}%</span>
           </div>
           <div className="w-full h-1.5 bg-gray-950 border border-gray-900 relative overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#ff00ff22] to-[#ff00ff] shadow-[0_0_20px_#ff00ff88]" 
                style={{ width: `${totalProgress}%` }}
              ></div>
           </div>
           <div className="flex justify-between mt-4 text-[7px] font-mono text-gray-800 uppercase tracking-widest">
              <span>Entropy: 0.9{Math.floor(Math.random()*999)}</span>
              <span>Load: {((totalProgress*1024)/100).toFixed(0)}KB/s</span>
           </div>
        </div>
      </div>
      
      <div className="mt-8 text-[9px] text-gray-800 uppercase tracking-[0.6em] animate-pulse font-mono">
        root@cyberforge:~# Manifesting_Artifact_Stream...
      </div>
    </div>
  );
};

export default SynthesisProgress;
