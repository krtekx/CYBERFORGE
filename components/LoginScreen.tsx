import { useState, useEffect, FC } from 'react';

interface LoginScreenProps {
    onLogin: () => void;
}

// The secret password sequence (4 words in order)
const SECRET_SEQUENCE = ['NEURAL', 'FORGE', 'CYBER', 'FLUX'];

// All 9 words in the grid (includes the 4 secret words + 5 decoys)
const GRID_WORDS = [
    'NEURAL', 'QUANTUM', 'FORGE',
    'PLASMA', 'CYBER', 'MATRIX',
    'VOID', 'FLUX', 'NEXUS'
];

export const LoginScreen: FC<LoginScreenProps> = ({ onLogin }) => {
    const [selectedWords, setSelectedWords] = useState<string[]>([]);
    const [isShaking, setIsShaking] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        // Check if the sequence is correct
        if (selectedWords.length === SECRET_SEQUENCE.length) {
            const isCorrect = selectedWords.every((word, index) => word === SECRET_SEQUENCE[index]);

            if (isCorrect) {
                setIsSuccess(true);
                setTimeout(() => {
                    onLogin();
                }, 800);
            } else {
                // Wrong sequence - shake and reset
                setIsShaking(true);
                setTimeout(() => {
                    setIsShaking(false);
                    setSelectedWords([]);
                }, 600);
            }
        }
    }, [selectedWords, onLogin]);

    const handleWordClick = (word: string) => {
        if (selectedWords.length < SECRET_SEQUENCE.length) {
            setSelectedWords([...selectedWords, word]);
        }
    };

    const handleReset = () => {
        setSelectedWords([]);
    };

    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
            {/* Animated background grid */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(#00f3ff 1px, transparent 1px), linear-gradient(90deg, #00f3ff 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }} />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-12 p-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-7xl font-black text-white cyber-font italic uppercase tracking-tighter glitch-text">
                        CYBERFORGE
                    </h1>
                    <p className="text-[#00f3ff] text-sm font-mono uppercase tracking-[0.3em]">
                        NEURAL ACCESS PROTOCOL
                    </p>
                </div>

                {/* Sequence display */}
                <div className="flex gap-3 h-16">
                    {Array.from({ length: SECRET_SEQUENCE.length }).map((_, index) => (
                        <div
                            key={index}
                            className={`w-32 h-full border-2 flex items-center justify-center font-mono text-sm uppercase tracking-wider transition-all ${selectedWords[index]
                                ? isSuccess
                                    ? 'border-[#00ff00] bg-[#00ff0011] text-[#00ff00]'
                                    : 'border-[#00f3ff] bg-[#00f3ff11] text-[#00f3ff]'
                                : 'border-gray-800 text-gray-800'
                                } ${isShaking ? 'animate-shake border-red-500' : ''}`}
                        >
                            {selectedWords[index] || '---'}
                        </div>
                    ))}
                </div>

                {/* 3x3 Grid of words */}
                <div className="grid grid-cols-3 gap-4">
                    {GRID_WORDS.map((word, index) => {
                        const isSelected = selectedWords.includes(word);
                        const selectCount = selectedWords.filter(w => w === word).length;

                        return (
                            <button
                                key={index}
                                onClick={() => handleWordClick(word)}
                                disabled={selectedWords.length >= SECRET_SEQUENCE.length}
                                className={`w-40 h-40 border-2 font-black text-xl uppercase tracking-wider transition-all relative overflow-hidden group ${isSelected
                                    ? 'border-[#00f3ff] bg-[#00f3ff22] text-[#00f3ff] scale-95'
                                    : 'border-gray-700 text-gray-500 hover:border-[#00f3ff] hover:text-white hover:scale-105'
                                    } ${isShaking ? 'animate-shake' : ''}`}
                            >
                                {/* Hover effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#00f3ff11] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                {/* Word */}
                                <span className="relative z-10">{word}</span>

                                {/* Selection indicator */}
                                {selectCount > 0 && (
                                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#00f3ff] text-black text-xs flex items-center justify-center font-bold">
                                        {selectCount}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Reset button */}
                {selectedWords.length > 0 && !isSuccess && (
                    <button
                        onClick={handleReset}
                        className="px-8 py-3 border border-gray-700 text-gray-500 text-xs uppercase tracking-[0.3em] hover:border-white hover:text-white transition-all"
                    >
                        RESET SEQUENCE
                    </button>
                )}

                {/* Success message */}
                {isSuccess && (
                    <div className="text-[#00ff00] text-sm font-mono uppercase tracking-[0.3em] animate-pulse">
                        ✓ ACCESS GRANTED
                    </div>
                )}
            </div>

            {/* Add shake animation */}
            <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
        </div>
    );
};
