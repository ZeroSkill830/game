import React from 'react';

// Definizione tipi per i collider
interface ColliderData {
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
  type: 'wall' | 'desk' | 'plant';
  color?: string;
}

// Definiamo tutti gli ostacoli fisici della mappa
export const COLLIDERS: ColliderData[] = [
  // --- Muri Esterni ---
  { position: [0, 2, -15], size: [30, 4, 1], type: 'wall' }, // Back
  { position: [0, 2, 15], size: [30, 4, 1], type: 'wall' },  // Front
  { position: [-15, 2, 0], size: [1, 4, 30], type: 'wall' }, // Left
  { position: [15, 2, 0], size: [1, 4, 30], type: 'wall' },  // Right

  // --- Strutture Interne (Cubicoli) ---
  { position: [-5, 1.5, -5], size: [1, 3, 8], type: 'wall', color: "#cbd5e1" },
  { position: [5, 1.5, 5], size: [1, 3, 8], type: 'wall', color: "#cbd5e1" },
  { position: [0, 1.5, 0], size: [8, 3, 1], type: 'wall', color: "#cbd5e1" },

  // --- Scrivanie ---
  // Nota: Per le collisioni semplici AABB, usiamo una dimensione che copra l'oggetto ruotato.
  // Una scrivania è circa 1.6x0.8. Ruotata occupa circa 1.5x1.5.
  { position: [-8, 0, -8], size: [1.8, 2, 1.8], rotation: [0, Math.PI / 4, 0], type: 'desk' },
  { position: [-8, 0, 8], size: [1.8, 2, 1.8], rotation: [0, -Math.PI / 4, 0], type: 'desk' },
  { position: [8, 0, -8], size: [1.8, 2, 1.8], rotation: [0, -Math.PI / 4, 0], type: 'desk' },
  { position: [8, 0, 8], size: [1.8, 2, 1.8], rotation: [0, Math.PI / 4, 0], type: 'desk' },

  { position: [0, 0, -12], size: [1.6, 2, 0.8], type: 'desk' },
  { position: [0, 0, 12], size: [1.6, 2, 0.8], rotation: [0, Math.PI, 0], type: 'desk' },

  // --- Pianta ---
  { position: [12, 0, -12], size: [1, 2, 1], type: 'plant' }
];

interface DeskProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

// Semplici blocchi per creare l'ufficio
const Desk: React.FC<DeskProps> = ({ position, rotation = [0, 0, 0] }) => {
  return (
    <group position={position} rotation={rotation as any}>
      {/* Top */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.05, 0.8]} />
        <meshStandardMaterial color="#b45309" roughness={0.6} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.7, 0.35, -0.35]} castShadow>
        <boxGeometry args={[0.1, 0.7, 0.1]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.5} />
      </mesh>
      <mesh position={[0.7, 0.35, -0.35]} castShadow>
        <boxGeometry args={[0.1, 0.7, 0.1]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.5} />
      </mesh>
      <mesh position={[-0.7, 0.35, 0.35]} castShadow>
        <boxGeometry args={[0.1, 0.7, 0.1]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.5} />
      </mesh>
      <mesh position={[0.7, 0.35, 0.35]} castShadow>
        <boxGeometry args={[0.1, 0.7, 0.1]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.5} />
      </mesh>
      {/* Monitor */}
      <group position={[0, 0.75, -0.2]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.6, 0.4, 0.05]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 0.2, 0.026]}>
          <planeGeometry args={[0.55, 0.35]} />
          <meshBasicMaterial color="#0ea5e9" />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      </group>
    </group>
  );
};

interface WallProps {
  position: [number, number, number];
  args: [number, number, number];
  color?: string;
}

const Wall: React.FC<WallProps> = ({ position, args, color = "#94a3b8" }) => (
  <mesh position={position} receiveShadow castShadow>
    <boxGeometry args={args} />
    <meshStandardMaterial color={color} />
  </mesh>
);

export const Level: React.FC = () => {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#f1f5f9" />
      </mesh>

      {/* Render Objects from Collision Data */}
      {COLLIDERS.map((obj, index) => {
        if (obj.type === 'wall') {
          return <Wall key={index} position={obj.position} args={obj.size} color={obj.color} />;
        }
        if (obj.type === 'desk') {
          return <Desk key={index} position={obj.position} rotation={obj.rotation} />;
        }
        if (obj.type === 'plant') {
          return (
            <group key={index} position={obj.position}>
              <mesh position={[0, 0.4, 0]} castShadow>
                <cylinderGeometry args={[0.3, 0.2, 0.8, 8]} />
                <meshStandardMaterial color="#78350f" />
              </mesh>
              <mesh position={[0, 1.2, 0]} castShadow>
                <dodecahedronGeometry args={[0.6]} />
                <meshStandardMaterial color="#16a34a" />
              </mesh>
            </group>
          );
        }
        return null;
      })}
    </group>
  );
};

// Export bounds for simple camera clamping (legacy, collision system handles strict bounds now)
export const BOUNDS = {
  xMin: -14,
  xMax: 14,
  zMin: -14,
  zMax: 14
};

// Generate a random spawn point that doesn't collide with objects
export const getRandomSpawnPoint = (): [number, number, number] => {
  const playerRadius = 0.4;
  const maxAttempts = 50;

  for (let i = 0; i < maxAttempts; i++) {
    const x = BOUNDS.xMin + Math.random() * (BOUNDS.xMax - BOUNDS.xMin);
    const z = BOUNDS.zMin + Math.random() * (BOUNDS.zMax - BOUNDS.zMin);
    const y = 1.6; // Eye level

    // Check if this position collides with any object
    let hasCollision = false;
    for (const obj of COLLIDERS) {
      const minX = obj.position[0] - obj.size[0] / 2;
      const maxX = obj.position[0] + obj.size[0] / 2;
      const minZ = obj.position[2] - obj.size[2] / 2;
      const maxZ = obj.position[2] + obj.size[2] / 2;

      if (
        x + playerRadius > minX &&
        x - playerRadius < maxX &&
        z + playerRadius > minZ &&
        z - playerRadius < maxZ
      ) {
        hasCollision = true;
        break;
      }
    }

    if (!hasCollision) {
      return [x, y, z];
    }
  }

  // Fallback to center if no valid position found
  return [0, 1.6, 0];
};
