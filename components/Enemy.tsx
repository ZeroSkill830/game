import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Mesh } from 'three';
import { useGameStore } from '../store';

interface EnemyProps {
  position: [number, number, number];
  playerPosition: React.MutableRefObject<Vector3>;
  onDeath: (id: string) => void;
  id: string;
}

export const Enemy: React.FC<EnemyProps> = ({ position: initialPos, playerPosition, onDeath, id }) => {
  const meshRef = useRef<Mesh>(null);
  const [hp, setHp] = useState(3);
  const [hitFlash, setHitFlash] = useState(0);
  const { takeDamage, addScore, isPlaying } = useGameStore();

  // Internal position state to avoid direct prop mutation issues
  const currentPos = useRef(new Vector3(...initialPos));
  const speed = 2.5; // Units per second

  useFrame((state, delta) => {
    if (!isPlaying || !meshRef.current) return;

    // Movement Logic: Move towards player
    const playerPos = playerPosition.current;
    const direction = new Vector3().subVectors(playerPos, currentPos.current).normalize();
    
    // Update position
    currentPos.current.add(direction.multiplyScalar(speed * delta));
    meshRef.current.position.copy(currentPos.current);
    
    // Make enemy look at player
    meshRef.current.lookAt(playerPos);

    // Bobbing animation
    meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 5) * 0.01;

    // Collision with Player logic (Simple distance check)
    const dist = currentPos.current.distanceTo(playerPos);
    if (dist < 1.5) {
      takeDamage(0.5); // Damage per frame nearby
    }

    // Visual hit flash recovery
    if (hitFlash > 0) setHitFlash((prev) => Math.max(0, prev - delta * 5));
  });

  // Expose a method to be called by Raycaster
  // We attach this to the userData of the mesh so the main loop can find it
  if (meshRef.current) {
    meshRef.current.userData = {
      isEnemy: true,
      hit: () => {
        setHp((prev) => {
          const newHp = prev - 1;
          setHitFlash(1);
          if (newHp <= 0) {
            addScore(100);
            onDeath(id);
          }
          return newHp;
        });
      }
    };
  }

  return (
    <mesh ref={meshRef} position={initialPos} castShadow>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial 
        color={hitFlash > 0 ? "white" : "#dc2626"} 
        emissive={hitFlash > 0 ? "white" : "#7f1d1d"}
        emissiveIntensity={0.5}
      />
      {/* Glitchy Eyes */}
      <mesh position={[0.2, 0.1, 0.41]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <mesh position={[-0.2, 0.1, 0.41]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial color="white" />
      </mesh>
    </mesh>
  );
};