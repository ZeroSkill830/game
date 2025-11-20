import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import { Color } from 'three';

export interface FloatingTextData {
  id: string;
  position: [number, number, number];
  text: string;
  color: string;
}

export const FloatingText: React.FC<{ data: FloatingTextData, onComplete: (id: string) => void }> = ({ data, onComplete }) => {
  const textRef = useRef<any>(null);
  const lifeRef = useRef(0); // Use ref instead of state to avoid re-renders during animation
  
  useEffect(() => {
    if (textRef.current && textRef.current.material) {
      // Manually disable depthTest to allow seeing text through walls
      textRef.current.material.depthTest = false;
    }
  }, []);

  useFrame((state, delta) => {
    lifeRef.current += delta;

    if (lifeRef.current > 0.8) {
      onComplete(data.id);
      return;
    }

    if (textRef.current) {
      // Float upwards
      textRef.current.position.y += delta * 2; 
      
      // Fade out (modify opacity directly)
      if (lifeRef.current > 0.5) {
          const opacity = 1 - (lifeRef.current - 0.5) * 3.3; // Fast fade at end
          textRef.current.fillOpacity = Math.max(0, opacity);
          textRef.current.outlineOpacity = Math.max(0, opacity);
      }
    }
  });

  return (
    <Billboard position={data.position}>
      <Text
        ref={textRef}
        fontSize={0.5}
        color={data.color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="black"
        fontWeight="bold"
        renderOrder={1000} // High render priority
      >
        {data.text}
      </Text>
    </Billboard>
  );
};