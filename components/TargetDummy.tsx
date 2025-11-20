
import React, { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group } from 'three';
import { Billboard } from '@react-three/drei';
import { playHitMarker } from '../audio';
import { FloatingText } from './FloatingText';
import { v4 as uuidv4 } from 'uuid';

interface TargetDummyProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  registerTarget: (mesh: Mesh) => void;
}

interface DamageText {
    id: string;
    value: number;
    position: [number, number, number];
}

export const TargetDummy: React.FC<TargetDummyProps> = ({ position, rotation = [0, 0, 0], registerTarget }) => {
  const meshRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);
  const [flash, setFlash] = useState(0);
  const [wobble, setWobble] = useState(0);
  const [hp, setHp] = useState(100);
  const [texts, setTexts] = useState<DamageText[]>([]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.userData = {
        isTarget: true,
        hit: (damage: number) => {
          setFlash(1);
          setWobble(1);
          playHitMarker();
          setHp(prev => Math.max(0, prev - damage));
          
          // Add floating text with slight randomization to avoid stacking
          const offsetX = (Math.random() - 0.5) * 0.5;
          const newTextId = uuidv4();
          setTexts(prev => [...prev, { id: newTextId, value: damage, position: [offsetX, 2, 0] }]);
        }
      };
      registerTarget(meshRef.current);
    }
  }, [registerTarget]);

  useFrame((state, delta) => {
    if (flash > 0) setFlash((prev) => Math.max(0, prev - delta * 10));
    
    if (wobble > 0) {
        setWobble((prev) => Math.max(0, prev - delta * 3));
        if (groupRef.current) {
            groupRef.current.rotation.x = Math.sin(wobble * Math.PI) * 0.5; 
        }
    }

    // Auto-heal/Reset if "dead" for a while for training purposes
    if (hp <= 0 && Math.random() < 0.01) {
        setHp(100);
    }
  });

  const removeText = (id: string) => {
    setTexts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <group position={position} rotation={rotation as any}>
      {/* Health Bar */}
      <Billboard position={[0, 2.5, 0]}>
         <group>
             {/* Background */}
             <mesh position={[0, 0, -0.01]}>
                 <planeGeometry args={[1.2, 0.15]} />
                 <meshBasicMaterial color="black" />
             </mesh>
             {/* Bar */}
             <mesh position={[(-1.2 + (1.2 * (hp/100))) / 2 - 0.6 + 0.6, 0, 0]} scale={[hp/100, 1, 1]}>
                 <planeGeometry args={[1.1, 0.1]} />
                 <meshBasicMaterial color={hp > 50 ? "#22c55e" : hp > 20 ? "#eab308" : "#ef4444"} />
             </mesh>
         </group>
      </Billboard>

      {/* Floating Damage Texts */}
      {texts.map(t => (
        <FloatingText 
            key={t.id} 
            data={{id: t.id, text: `-${t.value}`, position: t.position, color: "#ef4444"}} 
            onComplete={removeText} 
        />
      ))}

      <group ref={groupRef}>
        {/* Base */}
        <mesh position={[0, 0.1, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
            <meshStandardMaterial color="#1e293b" />
        </mesh>
        {/* Asta */}
        <mesh position={[0, 0.8, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 1.4]} />
            <meshStandardMaterial color="#475569" />
        </mesh>
        {/* Corpo Bersaglio (Hittable) */}
        <mesh ref={meshRef} position={[0, 1.4, 0]} castShadow>
            <boxGeometry args={[0.6, 0.8, 0.2]} />
            <meshStandardMaterial 
                color={flash > 0 ? "#ef4444" : hp <= 0 ? "#1f2937" : "#facc15"} 
                emissive={flash > 0 ? "#ef4444" : "#000000"}
                emissiveIntensity={flash > 0 ? 1 : 0}
            />
        </mesh>
        {/* Cerchi concentrici (decorativi) */}
        <mesh position={[0, 1.4, 0.11]}>
             <ringGeometry args={[0.1, 0.15, 16]} />
             <meshBasicMaterial color="black" />
        </mesh>
        <mesh position={[0, 1.4, 0.11]}>
             <ringGeometry args={[0.2, 0.25, 16]} />
             <meshBasicMaterial color="black" />
        </mesh>
      </group>
    </group>
  );
};
