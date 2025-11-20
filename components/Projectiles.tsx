
import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, InstancedMesh, Object3D } from 'three';
import { BOUNDS, COLLIDERS } from './Level';

const MAX_PROJECTILES = 50;
const PROJECTILE_SPEED = 60;

export interface ProjectileSystemHandle {
  fire: (origin: Vector3, direction: Vector3, damage: number) => void;
}

interface ProjectilesProps {
    targetsRef?: React.MutableRefObject<Object3D[]>;
}

export const Projectiles = forwardRef<ProjectileSystemHandle, ProjectilesProps>(({ targetsRef }, ref) => {
  const meshRef = useRef<InstancedMesh>(null);
  
  // Data stores for active projectiles
  const positions = useRef<Float32Array>(new Float32Array(MAX_PROJECTILES * 3));
  const velocities = useRef<Float32Array>(new Float32Array(MAX_PROJECTILES * 3));
  const damages = useRef<Float32Array>(new Float32Array(MAX_PROJECTILES)); // Store damage per projectile
  const active = useRef<boolean[]>(new Array(MAX_PROJECTILES).fill(false));
  const lifeTimes = useRef<Float32Array>(new Float32Array(MAX_PROJECTILES));
  
  const tempObj = new Object3D();
  const tempTargetPos = new Vector3(); // Reusable vector for world position calculations

  useImperativeHandle(ref, () => ({
    fire: (origin: Vector3, direction: Vector3, damage: number) => {
      const index = active.current.findIndex(a => !a);
      if (index === -1) return;

      active.current[index] = true;
      lifeTimes.current[index] = 0;
      damages.current[index] = damage;

      const spawnPos = origin.clone().add(direction.clone().multiplyScalar(0.5));

      positions.current[index * 3] = spawnPos.x;
      positions.current[index * 3 + 1] = spawnPos.y;
      positions.current[index * 3 + 2] = spawnPos.z;

      velocities.current[index * 3] = direction.x * PROJECTILE_SPEED;
      velocities.current[index * 3 + 1] = direction.y * PROJECTILE_SPEED;
      velocities.current[index * 3 + 2] = direction.z * PROJECTILE_SPEED;

      if (meshRef.current) {
          tempObj.position.copy(spawnPos);
          tempObj.lookAt(spawnPos.clone().add(direction));
          tempObj.scale.set(1, 1, 1);
          tempObj.updateMatrix();
          meshRef.current.setMatrixAt(index, tempObj.matrix);
          meshRef.current.instanceMatrix.needsUpdate = true;
      }
    }
  }));

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    for (let i = 0; i < MAX_PROJECTILES; i++) {
      if (!active.current[i]) {
        tempObj.position.set(0, -9999, 0);
        tempObj.scale.set(0, 0, 0);
        tempObj.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObj.matrix);
        continue;
      }

      // Previous Position
      const px = positions.current[i * 3];
      const py = positions.current[i * 3 + 1];
      const pz = positions.current[i * 3 + 2];

      // Update Position
      positions.current[i * 3] += velocities.current[i * 3] * delta;
      positions.current[i * 3 + 1] += velocities.current[i * 3 + 1] * delta;
      positions.current[i * 3 + 2] += velocities.current[i * 3 + 2] * delta;

      lifeTimes.current[i] += delta;

      const x = positions.current[i * 3];
      const y = positions.current[i * 3 + 1];
      const z = positions.current[i * 3 + 2];

      // 1. Check World Bounds
      const hitMapBounds = x < BOUNDS.xMin || x > BOUNDS.xMax || z < BOUNDS.zMin || z > BOUNDS.zMax || y < 0 || y > 8;
      
      // 2. Check Internal Walls/Desks Collision
      let hitObstacle = false;
      // Simple Point vs AABB check for bullet
      for (const collider of COLLIDERS) {
          const halfX = collider.size[0] / 2;
          const halfY = collider.size[1] / 2;
          const halfZ = collider.size[2] / 2;
          
          // NOTE: This ignores rotation for desks for performance, assuming axis-aligned for bullet checks is acceptable for low-poly
          // For strict accuracy, we'd need to rotate the point into the object's local space.
          if (
              x >= collider.position[0] - halfX && x <= collider.position[0] + halfX &&
              y >= collider.position[1] - halfY && y <= collider.position[1] + halfY &&
              z >= collider.position[2] - halfZ && z <= collider.position[2] + halfZ
          ) {
              hitObstacle = true;
              break;
          }
      }

      // 3. Check collisions with Targets
      let hitTarget = false;
      if (targetsRef && targetsRef.current) {
          for (const target of targetsRef.current) {
              // FIX: Use World Position instead of Local Position
              target.getWorldPosition(tempTargetPos);
              
              const distSq = (x - tempTargetPos.x)**2 + (y - tempTargetPos.y)**2 + (z - tempTargetPos.z)**2;
              
              // Adjusted radius for hit detection
              if (distSq < 1.0) {
                  hitTarget = true;
                  if (target.userData.hit) {
                      target.userData.hit(damages.current[i]);
                  }
                  break;
              }
          }
      }

      const timeOut = lifeTimes.current[i] > 1.5;

      if (hitMapBounds || hitObstacle || timeOut || hitTarget) {
        active.current[i] = false;
      } else {
        tempObj.position.set(x, y, z);
        tempObj.scale.set(1, 1, 1);
        
        const targetX = x + velocities.current[i*3];
        const targetY = y + velocities.current[i*3+1];
        const targetZ = z + velocities.current[i*3+2];
        
        tempObj.lookAt(targetX, targetY, targetZ);
        tempObj.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObj.matrix);
      }
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[undefined, undefined, MAX_PROJECTILES]} 
      frustumCulled={false}
    >
      <boxGeometry args={[0.05, 0.05, 0.8]} /> 
      <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={3} toneMapped={false} />
    </instancedMesh>
  );
});
