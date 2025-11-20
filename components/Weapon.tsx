import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { useGameStore, WeaponType } from '../store';

interface WeaponProps {
  isShooting: boolean;
}

const PistolModel = () => (
  <group>
    {/* Body */}
    <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.1, 0.15, 0.4]} />
        <meshStandardMaterial color="#334155" roughness={0.3} />
    </mesh>
    {/* Handle */}
    <mesh position={[0, -0.1, 0.1]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.09, 0.2, 0.1]} />
        <meshStandardMaterial color="#1e293b" />
    </mesh>
    {/* Barrel Detail */}
    <mesh position={[0, 0.05, -0.2]}>
        <boxGeometry args={[0.04, 0.04, 0.1]} />
        <meshStandardMaterial color="#0f172a" />
    </mesh>
    {/* Sight */}
    <mesh position={[0, 0.08, 0.15]}>
        <boxGeometry args={[0.02, 0.02, 0.05]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
    </mesh>
  </group>
);

const ShotgunModel = () => (
    <group position={[0, -0.05, 0.1]}>
       {/* Body */}
      <mesh position={[0, 0, 0.1]} castShadow>
          <boxGeometry args={[0.12, 0.15, 0.5]} />
          <meshStandardMaterial color="#475569" roughness={0.5} />
      </mesh>
       {/* Handle/Stock start */}
      <mesh position={[0, -0.1, 0.3]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.1, 0.2, 0.3]} />
          <meshStandardMaterial color="#78350f" />
      </mesh>
      {/* Barrels */}
      <mesh position={[-0.03, 0.05, -0.4]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} />
      </mesh>
      <mesh position={[0.03, 0.05, -0.4]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} />
      </mesh>
      {/* Pump */}
      <mesh position={[0, -0.02, -0.3]}>
         <boxGeometry args={[0.1, 0.08, 0.3]} />
         <meshStandardMaterial color="#3f2818" />
      </mesh>
    </group>
);

const SmgModel = () => (
    <group position={[0, -0.05, 0]}>
       {/* Main Block */}
       <mesh position={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[0.12, 0.15, 0.5]} />
          <meshStandardMaterial color="#1e1e1e" roughness={0.4} />
       </mesh>
       {/* Vertical Mag */}
       <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.08, 0.3, 0.1]} />
          <meshStandardMaterial color="#333" />
       </mesh>
       {/* Back Handle */}
       <mesh position={[0, -0.1, 0.2]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.08, 0.2, 0.1]} />
          <meshStandardMaterial color="#333" />
       </mesh>
       {/* Barrel */}
       <mesh position={[0, 0.05, -0.3]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.2]} />
          <meshStandardMaterial color="#666" />
       </mesh>
       {/* Sight */}
       <mesh position={[0, 0.15, 0.1]}>
          <boxGeometry args={[0.02, 0.05, 0.02]} />
          <meshStandardMaterial color="#0f0" emissive="#0f0" />
       </mesh>
    </group>
);

export const Weapon: React.FC<WeaponProps> = ({ isShooting }) => {
  const groupRef = useRef<Group>(null);
  const recoilAnim = useRef(0);
  const { currentWeapon, ammo } = useGameStore();

  const currentAmmo = ammo[currentWeapon];

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const time = state.clock.getElapsedTime();
    const swayX = Math.sin(time * 2) * 0.02;
    const swayY = Math.cos(time * 2) * 0.02;
    
    if (isShooting) {
      // Stronger recoil for shotgun
      const kick = currentWeapon === 'shotgun' ? 0.3 : currentWeapon === 'smg' ? 0.08 : 0.15;
      recoilAnim.current = kick;
    }

    recoilAnim.current = Math.max(0, recoilAnim.current - delta * 3);
    
    const currentRecoilZ = recoilAnim.current;
    const currentRecoilX = recoilAnim.current * 0.5;

    groupRef.current.position.x = 0.3 + swayX;
    groupRef.current.position.y = -0.25 + swayY;
    groupRef.current.position.z = -0.5 + currentRecoilZ;
    groupRef.current.rotation.x = currentRecoilX;
  });

  return (
    <group ref={groupRef} dispose={null}>
      {currentWeapon === 'pistol' && <PistolModel />}
      {currentWeapon === 'shotgun' && <ShotgunModel />}
      {currentWeapon === 'smg' && <SmgModel />}

      {/* Muzzle Flash */}
      {isShooting && currentAmmo > 0 && (
        <pointLight position={[0, 0.1, -0.6]} intensity={currentWeapon === 'shotgun' ? 8 : 4} color="#ffffaa" distance={3} decay={2} />
      )}
    </group>
  );
};