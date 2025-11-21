import React, { useEffect, useState } from 'react';
import { GameScene } from './components/GameScene';
import { UI } from './components/UI';
import { useGameStore } from './store';

function App() {
  const { setRoomId, roomId, setPlayerName } = useGameStore();
  const [inputName, setInputName] = useState('');

  useEffect(() => {
    // Auto-join if room is hardcoded, but we wait for name now.
    // Actually, we just want to ensure we are in the global room when we join.
  }, []);

  const handleJoin = () => {
    if (inputName.trim()) {
      setPlayerName(inputName.trim());
      setRoomId('global-room');
    }
  };

  if (!roomId) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
        <div className="p-8 bg-slate-800 rounded-lg shadow-xl">
          <h1 className="text-4xl font-bold mb-8 text-center">OFFICE CRISIS</h1>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="Enter Your Name"
              className="px-4 py-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <button
              onClick={handleJoin}
              disabled={!inputName.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded font-bold transition-colors"
            >
              ENTER GAME
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <UI />
      <GameScene />
    </div>
  );
}

export default App;