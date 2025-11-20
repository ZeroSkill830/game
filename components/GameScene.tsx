
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, Stars } from '@react-three/drei';
import { Vector3, Group, Mesh, Object3D, Raycaster, Vector2 } from 'three';
import { Level, BOUNDS, COLLIDERS, getRandomSpawnPoint } from './Level';
import { Weapon } from './Weapon';
import { useGameStore, WEAPONS } from '../store';
import { playGunshot, playFootstep, playReload, playEmptyClick, startAmbience } from '../audio';
import { Projectiles, ProjectileSystemHandle } from './Projectiles';
import { TargetDummy } from './TargetDummy';

// Helper function for AABB Collision
const checkCollision = (newPos: Vector3) => {
  const playerRadius = 0.4; // Player width radius

  for (const obj of COLLIDERS) {
    // Calculate object bounds
    const minX = obj.position[0] - obj.size[0] / 2;
    const maxX = obj.position[0] + obj.size[0] / 2;
    const minZ = obj.position[2] - obj.size[2] / 2;
    const maxZ = obj.position[2] + obj.size[2] / 2;

    // Check intersection (Simple AABB vs Point+Radius)
    if (
      newPos.x + playerRadius > minX &&
      newPos.x - playerRadius < maxX &&
      newPos.z + playerRadius > minZ &&
      newPos.z - playerRadius < maxZ
    ) {
      return true;
    }
  }
  return false;
};

import { useMultiplayer } from './hooks/useMultiplayer';
import { RemotePlayer } from './RemotePlayer';
import { Tombstone } from './Tombstone';

// ... imports

// Componente Controller del Giocatore
const PlayerController = () => {
  const { camera } = useThree();
  const { switchWeapon, nextWeapon, prevWeapon, currentWeapon, health } = useGameStore();
  const { sendUpdate } = useMultiplayer();

  // ... existing state ...
  const [moveForward, setMoveForward] = useState(false);
  const [moveBackward, setMoveBackward] = useState(false);
  const [moveLeft, setMoveLeft] = useState(false);
  const [moveRight, setMoveRight] = useState(false);

  // Physics State
  const velocity = useRef(new Vector3());
  const direction = useRef(new Vector3());
  const isGrounded = useRef(true);

  const playerSpeed = 8.0;
  const jumpForce = 6.0;
  const gravity = 15.0;
  const playerHeight = 1.6; // Eye level

  const stepTimer = useRef(0);
  const updateTimer = useRef(0);

  // Set random spawn position on mount
  useEffect(() => {
    const spawnPoint = getRandomSpawnPoint();
    camera.position.set(...spawnPoint);
  }, []);

  // ... useEffect for keys ...
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp': case 'KeyW': setMoveForward(true); break;
        case 'ArrowLeft': case 'KeyA': setMoveLeft(true); break;
        case 'ArrowDown': case 'KeyS': setMoveBackward(true); break;
        case 'ArrowRight': case 'KeyD': setMoveRight(true); break;
        case 'Space':
          if (isGrounded.current) {
            velocity.current.y = jumpForce;
            isGrounded.current = false;
          }
          break;
        case 'Digit1': switchWeapon('pistol'); break;
        case 'Digit2': switchWeapon('shotgun'); break;
        case 'Digit3': switchWeapon('smg'); break;
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp': case 'KeyW': setMoveForward(false); break;
        case 'ArrowLeft': case 'KeyA': setMoveLeft(false); break;
        case 'ArrowDown': case 'KeyS': setMoveBackward(false); break;
        case 'ArrowRight': case 'KeyD': setMoveRight(false); break;
      }
    };
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) nextWeapon();
      else prevWeapon();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('wheel', handleWheel);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('wheel', handleWheel);
    };
  }, [switchWeapon, nextWeapon, prevWeapon]);

  useFrame((state, delta) => {
    // ... existing movement logic ...
    // Input Vector
    direction.current.z = Number(moveForward) - Number(moveBackward);
    direction.current.x = Number(moveRight) - Number(moveLeft);
    direction.current.normalize();

    // Apply Gravity
    velocity.current.y -= gravity * delta;

    // Horizontal Friction
    const friction = isGrounded.current ? 10.0 : 2.0; // Less control in air
    velocity.current.x -= velocity.current.x * friction * delta;
    velocity.current.z -= velocity.current.z * friction * delta;

    // Acceleration
    if (moveForward || moveBackward) velocity.current.z -= direction.current.z * playerSpeed * delta;
    if (moveLeft || moveRight) velocity.current.x += direction.current.x * playerSpeed * delta;

    // 1. Apply X Movement & Collision
    const moveX = velocity.current.x * delta * playerSpeed;
    const startPos = camera.position.clone();
    camera.translateX(moveX);
    const posAfterX = camera.position.clone();
    if (checkCollision(new Vector3(posAfterX.x, 0, posAfterX.z))) {
      camera.position.copy(startPos);
      velocity.current.x = 0;
    }

    // 2. Apply Z Movement & Collision
    const posBeforeZ = camera.position.clone();
    const moveZ = velocity.current.z * delta * playerSpeed;
    camera.translateZ(moveZ);
    const posAfterZ = camera.position.clone();
    if (checkCollision(new Vector3(posAfterZ.x, 0, posAfterZ.z))) {
      camera.position.copy(posBeforeZ);
      velocity.current.z = 0;
    }

    // 3. Apply Y Movement (Jump/Gravity) - Global Axis
    camera.position.y += velocity.current.y * delta;

    // Floor Collision
    if (camera.position.y < playerHeight) {
      camera.position.y = playerHeight;
      velocity.current.y = 0;
      isGrounded.current = true;
    } else {
      isGrounded.current = false;
    }

    // Head Bob
    const isMoving = moveForward || moveBackward || moveLeft || moveRight;
    if (isMoving && isGrounded.current) {
      const bobFreq = 10;
      const bobAmp = 0.05;
      camera.position.y = playerHeight + Math.sin(state.clock.elapsedTime * bobFreq) * bobAmp;

      stepTimer.current += delta;
      if (stepTimer.current > 0.5) {
        playFootstep();
        stepTimer.current = 0;
      }
    } else {
      stepTimer.current = 0.4;
    }

    // Fallback bounds
    if (camera.position.x < BOUNDS.xMin) camera.position.x = BOUNDS.xMin;
    if (camera.position.x > BOUNDS.xMax) camera.position.x = BOUNDS.xMax;
    if (camera.position.z < BOUNDS.zMin) camera.position.z = BOUNDS.zMin;
    if (camera.position.z > BOUNDS.zMax) camera.position.z = BOUNDS.zMax;

    // Multiplayer Sync
    updateTimer.current += delta;
    if (updateTimer.current > 0.05) { // 20Hz update rate
      sendUpdate({
        position: [camera.position.x, camera.position.y, camera.position.z],
        rotation: [camera.rotation.x, camera.rotation.y, camera.rotation.z],
        weapon: currentWeapon,
        health: health
      });
      updateTimer.current = 0;
    }
  });

  return null;
};

// Manager for game logic inside Canvas
const GameManager = () => {
  const { camera, scene } = useThree();
  const { isPlaying, isGameOver, shoot, reload, ammo, currentWeapon, getWeaponStats, otherPlayers } = useGameStore();
  const { sendAction, sendHit } = useMultiplayer();
  const [isShootingVisual, setIsShootingVisual] = useState(false);
  const lastShotTime = useRef(0);

  const projectilesRef = useRef<ProjectileSystemHandle>(null);
  const targetsRef = useRef<Object3D[]>([]);

  useEffect(() => {
    if (isPlaying) {
      startAmbience();
    }
  }, [isPlaying]);

  const handleShoot = () => {
    if (!isPlaying || isGameOver) return;

    const stats = getWeaponStats();
    const now = Date.now();
    if (now - lastShotTime.current < stats.fireRate) return;

    const currentAmmoVal = ammo[currentWeapon];
    if (currentAmmoVal <= 0) {
      playEmptyClick();
      return;
    }

    const shotSuccess = shoot();
    if (shotSuccess) {
      playGunshot(currentWeapon);
      lastShotTime.current = now;
      setIsShootingVisual(true);
      setTimeout(() => setIsShootingVisual(false), 100);

      sendAction('shoot', { weapon: currentWeapon });

      // Raycast for PvP
      const raycaster = new Raycaster();
      raycaster.setFromCamera(new Vector2(0, 0), camera);

      // Find all remote player meshes
      const remotePlayers = scene.children.filter(child =>
        child.userData.isRemotePlayer
      );

      const hits = raycaster.intersectObjects(remotePlayers, true);
      if (hits.length > 0) {
        // Hit the closest player
        const hitObject = hits[0].object;
        // Traverse up to find the group with the ID
        let current: Object3D | null = hitObject;
        while (current) {
          if (current.userData.playerId) {
            sendHit(current.userData.playerId, stats.damage);
            break;
          }
          current = current.parent;
        }
      }

      // Spawn Projectiles
      if (projectilesRef.current) {
        const origin = camera.position.clone();
        origin.y -= 0.1; // Slightly below eye level

        const baseDir = new Vector3(0, 0, -1);
        baseDir.applyQuaternion(camera.quaternion);

        for (let i = 0; i < stats.bulletCount; i++) {
          const spreadX = (Math.random() - 0.5) * stats.spread;
          const spreadY = (Math.random() - 0.5) * stats.spread;
          const spreadZ = (Math.random() - 0.5) * stats.spread;

          const dir = baseDir.clone().add(new Vector3(spreadX, spreadY, spreadZ)).normalize();
          // Pass weapon damage to projectile
          projectilesRef.current.fire(origin, dir, stats.damage);
        }
      }
    }
  };

  // Use callback to prevent infinite dependency loops or re-registration
  const registerTarget = useCallback((mesh: Mesh) => {
    if (mesh && !targetsRef.current.includes(mesh)) {
      targetsRef.current.push(mesh);
    }
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') {
        reload();
        playReload();
      }
    };
    const handleMouseDown = () => handleShoot();

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isPlaying, isGameOver, ammo, currentWeapon]);

  return (
    <>
      <group position={[0, 0, 0]}>
        <CameraAttachedWeapon isShooting={isShootingVisual} />
      </group>

      <PlayerController />

      {/* Remote Players */}
      {Object.values(otherPlayers).map((player) => (
        <RemotePlayer key={player.id} state={player} />
      ))}

      {/* Tombstones */}
      {useGameStore(state => state.tombstones).map((tombstone) => (
        <Tombstone key={tombstone.id} data={tombstone} />
      ))}

      {/* Projectiles System with reference to targets */}
      <Projectiles ref={projectilesRef} targetsRef={targetsRef} />

      {/* Targets */}
      <TargetDummy position={[0, 0, -10]} registerTarget={registerTarget} />
      <TargetDummy position={[5, 0, -10]} rotation={[0, -0.5, 0]} registerTarget={registerTarget} />
      <TargetDummy position={[-5, 0, -10]} rotation={[0, 0.5, 0]} registerTarget={registerTarget} />
    </>
  );
};

const CameraAttachedWeapon = ({ isShooting }: { isShooting: boolean }) => {
  const { camera } = useThree();
  const ref = useRef<Group>(null);
  useFrame(() => {
    if (ref.current) {
      ref.current.position.copy(camera.position);
      ref.current.quaternion.copy(camera.quaternion);
    }
  });
  return (
    <group ref={ref}>
      <Weapon isShooting={isShooting} />
    </group>
  );
};

export const GameScene: React.FC = () => {
  const { isPlaying, isGameOver } = useGameStore();

  return (
    <Canvas shadows camera={{ fov: 75 }}>
      <color attach="background" args={['#0f172a']} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <ambientLight intensity={0.4} />
      <pointLight position={[0, 10, 0]} intensity={0.8} castShadow />
      <directionalLight position={[5, 5, 5]} intensity={0.5} castShadow />

      <Level />
      <GameManager />

      {isPlaying && !isGameOver && (
        <PointerLockControls selector="#root" />
      )}
    </Canvas>
  );
};
