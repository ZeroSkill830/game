import React, { useEffect, useState } from 'react';
import { GameScene } from './components/GameScene';
import { UI } from './components/UI';
import { useGameStore } from './store';

function App() {
  const { setRoomId, roomId } = useGameStore();
  const [inputRoom, setInputRoom] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setRoomId(room);
    }
  }, []);

  const handleJoin = () => {
    if (inputRoom) {
      setRoomId(inputRoom);
      // Update URL without reload
      const url = new URL(window.location.href);
      url.searchParams.set('room', inputRoom);
      window.history.pushState({}, '', url.toString());
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
              value={inputRoom}
              onChange={(e) => setInputRoom(e.target.value)}
              placeholder="Enter Room Name"
              className="px-4 py-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleJoin}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold transition-colors"
            >
              JOIN GAME
            </button>
            <button
              onClick={() => {
                const randomRoom = Math.random().toString(36).substring(7);
                setInputRoom(randomRoom);
                handleJoin();
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded font-bold transition-colors"
            >
              CREATE RANDOM ROOM
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