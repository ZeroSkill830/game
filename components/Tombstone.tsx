import React from 'react';
import { Tombstone as TombstoneType } from '../store';

interface TombstoneProps {
    data: TombstoneType;
}

export const Tombstone: React.FC<TombstoneProps> = ({ data }) => {
    // Position is eye level (1.6), so we lower it to ground
    const groundPos: [number, number, number] = [data.position[0], data.position[1] - 1.6, data.position[2]];

    return (
        <group position={groundPos}>
            {/* Base */}
            <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.6, 0.2, 0.4]} />
                <meshStandardMaterial color="#4b5563" />
            </mesh>
            {/* Stone */}
            <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.5, 1.0, 0.2]} />
                <meshStandardMaterial color="#6b7280" />
            </mesh>
            {/* Cross (optional detail) */}
            <mesh position={[0, 0.6, 0.11]}>
                <boxGeometry args={[0.1, 0.4, 0.02]} />
                <meshStandardMaterial color="#374151" />
            </mesh>
            <mesh position={[0, 0.7, 0.11]}>
                <boxGeometry args={[0.3, 0.1, 0.02]} />
                <meshStandardMaterial color="#374151" />
            </mesh>
        </group>
    );
};
