import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, Mesh } from 'three';
import { Billboard } from '@react-three/drei';
import { RemotePlayerState } from '../store';
import { FloatingText } from './FloatingText';
import { v4 as uuidv4 } from 'uuid';

interface RemotePlayerProps {
    state: RemotePlayerState;
}

interface DamageText {
    id: string;
    value: number;
    position: [number, number, number];
}

export function RemotePlayer({ state }: RemotePlayerProps) {
    const groupRef = useRef<Group>(null);
    const meshRef = useRef<Mesh>(null);
    const [flash, setFlash] = useState(0);
    const [texts, setTexts] = useState<DamageText[]>([]);
    const prevHealth = useRef(state.health);

    useEffect(() => {
        // Detect damage
        if (state.health < prevHealth.current) {
            const damage = prevHealth.current - state.health;
            setFlash(1);

            const offsetX = (Math.random() - 0.5) * 0.5;
            const newTextId = uuidv4();
            setTexts(prev => [...prev, { id: newTextId, value: damage, position: [offsetX, 2, 0] }]);
        }
        prevHealth.current = state.health;
    }, [state.health]);

    useFrame((_, delta) => {
        if (groupRef.current) {
            // Interpolate position for smoothness (simple lerp)
            groupRef.current.position.lerp(new Vector3(...state.position), 0.1);
            // Rotation can be direct or interpolated
            groupRef.current.rotation.set(...state.rotation);
        }

        if (flash > 0) setFlash((prev) => Math.max(0, prev - delta * 10));
    });

    const removeText = (id: string) => {
        setTexts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <group ref={groupRef} userData={{ isRemotePlayer: true, playerId: state.id }}>
            {/* Health Bar - Above head (which is at 0 relative to group) */}
            <Billboard position={[0, 0.6, 0]}>
                <group>
                    {/* Background */}
                    <mesh position={[0, 0, -0.01]}>
                        <planeGeometry args={[1.2, 0.15]} />
                        <meshBasicMaterial color="black" />
                    </mesh>
                    {/* Bar */}
                    <mesh position={[(-1.2 + (1.2 * (state.health / 100))) / 2 - 0.6 + 0.6, 0, 0]} scale={[Math.max(0, state.health / 100), 1, 1]}>
                        <planeGeometry args={[1.1, 0.1]} />
                        <meshBasicMaterial color={state.health > 50 ? "#22c55e" : state.health > 20 ? "#eab308" : "#ef4444"} />
                    </mesh>
                </group>
            </Billboard>

            {/* Floating Damage Texts */}
            {texts.map(t => (
                <FloatingText
                    key={t.id}
                    data={{ id: t.id, text: `-${t.value}`, position: t.position, color: "#ef4444" }}
                    onComplete={removeText}
                />
            ))}

            {/* Simple capsule representation for now */}
            {/* Group is at Eye Level (1.6). Feet are at -1.6. Capsule center at -0.7 (approx) */}
            <mesh ref={meshRef} position={[0, -0.7, 0]}>
                <capsuleGeometry args={[0.4, 1.8, 4, 8]} />
                <meshStandardMaterial
                    color={flash > 0 ? "#ef4444" : "red"}
                    emissive={flash > 0 ? "#ef4444" : "#000000"}
                    emissiveIntensity={flash > 0 ? 1 : 0}
                />
            </mesh>

            {/* Weapon indicator - Near hands */}
            <mesh position={[0.3, -0.4, -0.5]} scale={[0.2, 0.2, 1]}>
                <boxGeometry />
                <meshStandardMaterial color="black" />
            </mesh>
        </group>
    );
}
