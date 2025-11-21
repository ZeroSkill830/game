
import React from 'react';
import { useGameStore, WEAPONS } from '../store';
import { initAudio } from '../audio';

export const UI: React.FC = () => {
  const { score, playerName, health, ammo, isPlaying, isGameOver, startGame, reset, currentWeapon, getWeaponStats, killFeed } = useGameStore();

  const weaponStats = getWeaponStats();
  const currentAmmoCount = ammo[currentWeapon];
  const maxAmmo = weaponStats.maxAmmo;

  const handleStart = () => {
    initAudio();
    startGame();
  };

  if (isGameOver) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-50">
        <h1 className="text-5xl font-bold mb-4 text-red-500 font-['Press_Start_2P']">GAME OVER</h1>
        <p className="text-2xl mb-8">Punteggio Finale: {score}</p>
        <button
          onClick={reset}
          className="px-8 py-4 bg-white text-black font-bold rounded hover:bg-gray-200 transition"
        >
          TORNA AL MENU
        </button>
      </div>
    );
  }

  if (!isPlaying) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white z-50">
        <h1 className="text-4xl md:text-6xl font-bold mb-2 font-['Press_Start_2P'] text-blue-400 text-center">
          OFFICE CRISIS
        </h1>
        <p className="text-lg mb-8 text-slate-400">Training Room - Simulazione Ufficio</p>

        <div className="bg-slate-800 p-6 rounded-lg mb-8 max-w-md text-sm text-slate-300 border border-slate-700">
          <p className="mb-2"><strong className="text-white">WASD</strong> per muoversi</p>
          <p className="mb-2"><strong className="text-white">SPAZIO</strong> per saltare</p>
          <p className="mb-2"><strong className="text-white">1-2-3</strong> o Rotella per cambiare arma</p>
          <p className="mb-2"><strong className="text-white">CLICK SX</strong> per sparare</p>
          <p className="mb-0"><strong className="text-white">R</strong> per ricaricare</p>
        </div>

        <button
          onClick={handleStart}
          className="px-10 py-4 bg-blue-600 text-white font-bold rounded-sm hover:bg-blue-500 transition shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:shadow-none active:translate-y-1"
        >
          INIZIA TURNO
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {/* Crosshair */}
      <div className="crosshair">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="2" fill="white" />
          {currentWeapon === 'shotgun' ? (
            // Shotgun crosshair (Wider)
            <>
              <line x1="8" y1="8" x2="5" y2="5" stroke="white" strokeWidth="2" />
              <line x1="16" y1="8" x2="19" y2="5" stroke="white" strokeWidth="2" />
              <line x1="8" y1="16" x2="5" y2="19" stroke="white" strokeWidth="2" />
              <line x1="16" y1="16" x2="19" y2="19" stroke="white" strokeWidth="2" />
            </>
          ) : (
            // Standard
            <>
              <line x1="12" y1="4" x2="12" y2="9" stroke="white" strokeWidth="2" />
              <line x1="12" y1="15" x2="12" y2="20" stroke="white" strokeWidth="2" />
              <line x1="4" y1="12" x2="9" y2="12" stroke="white" strokeWidth="2" />
              <line x1="15" y1="12" x2="20" y2="12" stroke="white" strokeWidth="2" />
            </>
          )}
        </svg>
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start">
        <div className="flex flex-col">
          <div className="text-4xl font-['Press_Start_2P'] text-white drop-shadow-md">
            {playerName}
          </div>
          <div className="text-blue-300 text-sm font-bold mt-2">FREE ROAM</div>
        </div>

        {/* Kill Feed */}
        <div className="absolute top-20 right-6 flex flex-col items-end gap-1 pointer-events-none">
          {killFeed.map((msg) => (
            <div key={msg.id} className="bg-black/50 text-white px-3 py-1 rounded text-sm animate-fade-in-out">
              {msg.message}
            </div>
          ))}
        </div>

        {/* Health Bar */}
        <div className="w-48 bg-slate-800 h-6 rounded-full overflow-hidden border-2 border-slate-600 relative">
          <div
            className={`h-full transition-all duration-300 ${health > 50 ? 'bg-green-500' : health > 20 ? 'bg-yellow-500' : 'bg-red-600'}`}
            style={{ width: `${health}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
            {Math.round(health)}%
          </div>
        </div>
      </div>

      {/* Ammo / Weapon Info */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-1">
        <div className="text-yellow-400 font-bold text-lg tracking-widest uppercase mb-1">
          {weaponStats.name}
        </div>
        <div className="text-right">
          <div className={`text-5xl font-bold font-['Press_Start_2P'] ${currentAmmoCount === 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {currentAmmoCount} <span className="text-2xl text-slate-400">/ {maxAmmo}</span>
          </div>
          {currentAmmoCount === 0 && <div className="text-white font-bold mt-2">PREMI 'R'</div>}
        </div>
      </div>

      {/* Weapon Selection Helper */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 text-white text-xs opacity-50">
        <div className={currentWeapon === 'pistol' ? 'text-yellow-400 font-bold' : ''}>[1] PISTOLA</div>
        <div className={currentWeapon === 'shotgun' ? 'text-yellow-400 font-bold' : ''}>[2] POMPA</div>
        <div className={currentWeapon === 'smg' ? 'text-yellow-400 font-bold' : ''}>[3] RAPID</div>
      </div>
    </div>
  );
};
