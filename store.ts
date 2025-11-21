import { create } from 'zustand';

export type WeaponType = 'pistol' | 'shotgun' | 'smg';

export interface WeaponStats {
  id: WeaponType;
  name: string;
  maxAmmo: number;
  fireRate: number; // ms between shots
  damage: number;
  spread: number;
  bulletCount: number; // 1 for pistol/smg, many for shotgun
}

export const WEAPONS: Record<WeaponType, WeaponStats> = {
  pistol: {
    id: 'pistol',
    name: 'PISTOLA 9MM',
    maxAmmo: 12,
    fireRate: 250,
    damage: 25,
    spread: 0.02,
    bulletCount: 1
  },
  shotgun: {
    id: 'shotgun',
    name: 'PUMP ACTION',
    maxAmmo: 6,
    fireRate: 800,
    damage: 15, // per pellet
    spread: 0.15,
    bulletCount: 6
  },
  smg: {
    id: 'smg',
    name: 'RAPID FIRE',
    maxAmmo: 30,
    fireRate: 100,
    damage: 12,
    spread: 0.08,
    bulletCount: 1
  }
};

interface GameState {
  score: number;
  health: number;
  isPlaying: boolean;
  isGameOver: boolean;

  currentWeapon: WeaponType;
  ammo: Record<WeaponType, number>; // Ammo per weapon type

  wave: number;

  startGame: () => void;
  endGame: () => void;
  addScore: (points: number) => void;
  takeDamage: (amount: number) => void;

  // Returns true if shot successful
  shoot: () => boolean;
  reload: () => void;
  switchWeapon: (type: WeaponType) => void;
  nextWeapon: () => void;
  prevWeapon: () => void;
  reset: () => void;

  getWeaponStats: () => WeaponStats;

  // Multiplayer
  roomId: string | null;
  playerId: string | null;
  playerName: string;
  otherPlayers: Record<string, RemotePlayerState>;
  setRoomId: (id: string) => void;
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  updateRemotePlayer: (id: string, state: Partial<RemotePlayerState>) => void;
  removeRemotePlayer: (id: string) => void;

  tombstones: Tombstone[];
  addTombstone: (tombstone: Tombstone) => void;
}

export interface Tombstone {
  id: string;
  position: [number, number, number];
}

export interface RemotePlayerState {
  id: string;
  name?: string;
  position: [number, number, number];
  rotation: [number, number, number];
  health: number;
  weapon: WeaponType;
}

export const useGameStore = create<GameState>((set, get) => ({
  score: 0,
  health: 100,
  isPlaying: false,
  isGameOver: false,
  wave: 1,

  currentWeapon: 'pistol',
  ammo: {
    pistol: WEAPONS.pistol.maxAmmo,
    shotgun: WEAPONS.shotgun.maxAmmo,
    smg: WEAPONS.smg.maxAmmo,
  },

  roomId: null,
  playerId: null,
  playerName: 'Player',
  otherPlayers: {},

  setRoomId: (id) => set({ roomId: id }),
  setPlayerId: (id) => set({ playerId: id }),
  setPlayerName: (name) => set({ playerName: name }),

  updateRemotePlayer: (id, state) => set((prev) => ({
    otherPlayers: {
      ...prev.otherPlayers,
      [id]: {
        ...(prev.otherPlayers[id] || {
          id,
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          health: 100,
          weapon: 'pistol'
        }),
        ...state
      }
    }
  })),

  removeRemotePlayer: (id) => set((prev) => {
    const newPlayers = { ...prev.otherPlayers };
    delete newPlayers[id];
    return { otherPlayers: newPlayers };
  }),

  tombstones: [],
  addTombstone: (tombstone) => set((prev) => ({ tombstones: [...prev.tombstones, tombstone] })),

  startGame: () => set({
    isPlaying: true,
    isGameOver: false,
    score: 0,
    health: 100,
    wave: 1,
    currentWeapon: 'pistol',
    ammo: {
      pistol: WEAPONS.pistol.maxAmmo,
      shotgun: WEAPONS.shotgun.maxAmmo,
      smg: WEAPONS.smg.maxAmmo,
    }
  }),

  endGame: () => set({ isPlaying: false, isGameOver: true }),

  reset: () => set({ isPlaying: false, isGameOver: false, score: 0, health: 100 }),

  addScore: (points) => set((state) => {
    const newScore = state.score + points;
    const newWave = Math.floor(newScore / 500) + 1;
    return { score: newScore, wave: newWave };
  }),

  takeDamage: (amount) => set((state) => {
    const newHealth = state.health - amount;
    if (newHealth <= 0) {
      return { health: 0, isPlaying: false, isGameOver: true };
    }
    return { health: newHealth };
  }),

  getWeaponStats: () => WEAPONS[get().currentWeapon],

  shoot: () => {
    const { currentWeapon, ammo } = get();
    const currentAmmo = ammo[currentWeapon];

    if (currentAmmo > 0) {
      set((state) => ({
        ammo: {
          ...state.ammo,
          [currentWeapon]: state.ammo[currentWeapon] - 1
        }
      }));
      return true;
    }
    return false;
  },

  reload: () => set((state) => ({
    ammo: {
      ...state.ammo,
      [state.currentWeapon]: WEAPONS[state.currentWeapon].maxAmmo
    }
  })),

  switchWeapon: (type) => set({ currentWeapon: type }),

  nextWeapon: () => {
    const types: WeaponType[] = ['pistol', 'shotgun', 'smg'];
    const currentIdx = types.indexOf(get().currentWeapon);
    const nextIdx = (currentIdx + 1) % types.length;
    set({ currentWeapon: types[nextIdx] });
  },

  prevWeapon: () => {
    const types: WeaponType[] = ['pistol', 'shotgun', 'smg'];
    const currentIdx = types.indexOf(get().currentWeapon);
    const prevIdx = (currentIdx - 1 + types.length) % types.length;
    set({ currentWeapon: types[prevIdx] });
  }
}));