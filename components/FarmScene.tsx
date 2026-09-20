"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";

import type {
  PlantSnapshot,
  ReplayStep,
} from "@/lib/replay";

interface FarmSceneProps {
  replayStep: ReplayStep | null;
  cinematic?: boolean;
}

const BOARD_SIZE = 10;
const TILE_SIZE = 1;

const COLORS = {
  grass: "#7FA35F",
  grassDark: "#65854D",
  soil: "#8A6244",
  soilDark: "#6F4D36",

  wheat: "#D9B24C",
  carrot: "#E4773E",
  tomato: "#C95A45",
  strawberry: "#C84D68",
  melon: "#6FA94E",

  plantLeaf: "#4C873F",
  plantLeafLight: "#78B94F",

  agent: "#C7F36B",
  agentDark: "#78A83E",

  opponent: "#D8754F",

  water: "#75C9D6",
  path: "#C8B995",

  building: "#76533A",
  roof: "#35513C",

  stone: "#A6A28E",

  grid: "#D9E3C5",

  actionWater: "#75C9D6",
  actionHarvest: "#F2B84B",
  actionPlant: "#C7F36B",
  actionMove: "#FFFFFF",
  actionClear: "#D8754F",
};

function boardToWorld(x: number, y: number) {
  return [
    (x - 4.5) * TILE_SIZE,
    0,
    (y - 4.5) * TILE_SIZE,
  ] as const;
}

/* ---------------------------------------------------------
   Ground
--------------------------------------------------------- */

function Ground() {
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry
          args={[
            18,
            14,
          ]}
        />

        <meshStandardMaterial color={COLORS.grass} />
      </mesh>

      {Array.from(
        { length: BOARD_SIZE + 1 },
        (_, i) => {
          const offset =
            (i - BOARD_SIZE / 2) * TILE_SIZE;

          return (
            <group key={i}>
              <mesh
                position={[
                  offset,
                  0.006,
                  0,
                ]}
              >
                <boxGeometry
                  args={[
                    0.012,
                    0.012,
                    BOARD_SIZE,
                  ]}
                />

                <meshBasicMaterial
                  color={COLORS.grid}
                  transparent
                  opacity={0.45}
                />
              </mesh>

              <mesh
                position={[
                  0,
                  0.006,
                  offset,
                ]}
              >
                <boxGeometry
                  args={[
                    BOARD_SIZE,
                    0.012,
                    0.012,
                  ]}
                />

                <meshBasicMaterial
                  color={COLORS.grid}
                  transparent
                  opacity={0.45}
                />
              </mesh>
            </group>
          );
        },
      )}
    </group>
  );
}

/* ---------------------------------------------------------
   Soil
--------------------------------------------------------- */

function SoilTile({
  x,
  y,
}: {
  x: number;
  y: number;
}) {
  const [wx, , wz] = boardToWorld(x, y);

  return (
    <mesh
      position={[
        wx,
        0.018,
        wz,
      ]}
      receiveShadow
    >
      <boxGeometry
        args={[
          0.86,
          0.035,
          0.86,
        ]}
      />

      <meshStandardMaterial
        color={COLORS.soil}
        roughness={1}
      />
    </mesh>
  );
}

function FarmPlots({
  plants,
}: {
  plants: PlantSnapshot[];
}) {
  const plantedTiles = new Set(
    plants.map(
      (plant) =>
        `${plant.x}-${plant.y}`,
    ),
  );

  const tiles: Array<[number, number]> = [];

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (
        plantedTiles.has(
          `${x}-${y}`,
        )
      ) {
        tiles.push([x, y]);
      }
    }
  }

  /*
   * Keep the FARM-MIND cultivation area
   * visually readable even when the replay
   * contains only a few plants.
   */
  const cluster = [
    [4, 4],
    [3, 4],
    [4, 3],
    [3, 3],
    [2, 4],
    [4, 2],
    [2, 3],
  ] as Array<[number, number]>;

  for (const tile of cluster) {
    if (
      !tiles.some(
        ([x, y]) =>
          x === tile[0] &&
          y === tile[1],
      )
    ) {
      tiles.push(tile);
    }
  }

  return (
    <group>
      {tiles.map(([x, y]) => (
        <SoilTile
          key={`${x}-${y}`}
          x={x}
          y={y}
        />
      ))}
    </group>
  );
}

/* ---------------------------------------------------------
   Crops
--------------------------------------------------------- */

function cropColor(crop: string | null) {
  switch (crop) {
    case "WHEAT":
      return COLORS.wheat;

    case "CARROT":
      return COLORS.carrot;

    case "TOMATO":
      return COLORS.tomato;

    case "STRAWBERRY":
      return COLORS.strawberry;

    case "MELON":
      return COLORS.melon;

    default:
      return COLORS.plantLeaf;
  }
}

function Crop({
  plant,
}: {
  plant: PlantSnapshot;
}) {
  const group =
    useRef<THREE.Group>(null);

  const [x, , z] = boardToWorld(
    plant.x,
    plant.y,
  );

  const color = cropColor(
    plant.crop,
  );

  useFrame((state) => {
    if (!group.current) return;

    const t = state.clock.elapsedTime;

    group.current.rotation.z =
      Math.sin(
        t * 1.4 + plant.x,
      ) * 0.035;
  });

  const age =
    typeof plant.age === "number"
      ? plant.age
      : 0;

  const scale = plant.mature
    ? 1.15
    : Math.min(
        1,
        0.55 + age * 0.06,
      );

  return (
    <group
      ref={group}
      position={[
        x,
        0.08,
        z,
      ]}
      scale={scale}
    >
      <mesh
        position={[
          0,
          0.22,
          0,
        ]}
      >
        <cylinderGeometry
          args={[
            0.035,
            0.045,
            0.42,
            6,
          ]}
        />

        <meshStandardMaterial
          color={COLORS.plantLeaf}
        />
      </mesh>

      <mesh
        position={[
          -0.09,
          0.25,
          0,
        ]}
        rotation={[
          0,
          0,
          -0.45,
        ]}
      >
        <sphereGeometry
          args={[
            0.11,
            8,
            6,
          ]}
        />

        <meshStandardMaterial
          color={
            COLORS.plantLeafLight
          }
        />
      </mesh>

      <mesh
        position={[
          0.09,
          0.3,
          0,
        ]}
        rotation={[
          0,
          0,
          0.45,
        ]}
      >
        <sphereGeometry
          args={[
            0.11,
            8,
            6,
          ]}
        />

        <meshStandardMaterial
          color={COLORS.plantLeaf}
        />
      </mesh>

      <mesh
        position={[
          0,
          0.42,
          0,
        ]}
      >
        <sphereGeometry
          args={[
            plant.mature
              ? 0.14
              : 0.09,
            10,
            8,
          ]}
        />

        <meshStandardMaterial
          color={color}
          roughness={0.75}
        />
      </mesh>

      {plant.watered && (
        <mesh
          position={[
            0,
            0.015,
            0,
          ]}
          rotation={[
            -Math.PI / 2,
            0,
            0,
          ]}
        >
          <ringGeometry
            args={[
              0.26,
              0.29,
              24,
            ]}
          />

          <meshBasicMaterial
            color={COLORS.water}
            transparent
            opacity={0.55}
          />
        </mesh>
      )}
    </group>
  );
}

function Crops({
  plants,
}: {
  plants: PlantSnapshot[];
}) {
  return (
    <group>
      {plants.map((plant) => (
        <Crop
          key={`${plant.x}-${plant.y}`}
          plant={plant}
        />
      ))}
    </group>
  );
}

/* ---------------------------------------------------------
   Action helpers
--------------------------------------------------------- */

function getActionColor(action: string) {
  switch (action) {
    case "WATER":
      return COLORS.actionWater;

    case "HARVEST":
      return COLORS.actionHarvest;

    case "PLANT":
      return COLORS.actionPlant;

    case "CLEAR":
      return COLORS.actionClear;

    case "NORTH":
    case "SOUTH":
    case "EAST":
    case "WEST":
      return COLORS.actionMove;

    default:
      return COLORS.agent;
  }
}

function isMovementAction(action: string) {
  return (
    action === "NORTH" ||
    action === "SOUTH" ||
    action === "EAST" ||
    action === "WEST"
  );
}

/* ---------------------------------------------------------
   FARM-MIND agent
--------------------------------------------------------- */

function Agent({
  position,
  action,
}: {
  position: [number, number];
  action: string;
}) {
  const group =
    useRef<THREE.Group>(null);

  const targetWorld = new THREE.Vector3();

  useEffect(() => {
    const [x, , z] = boardToWorld(
      position[0],
      position[1],
    );

    targetWorld.set(
      x,
      0.28,
      z,
    );
  }, [
    position,
    targetWorld,
  ]);

  const [x, , z] = boardToWorld(
    position[0],
    position[1],
  );

  const actionColor =
    getActionColor(action);

  useFrame((state) => {
    if (!group.current) return;

    const t = state.clock.elapsedTime;

    /*
     * Smooth vertical hover.
     * Horizontal position remains tied
     * to the actual replay position.
     */
    group.current.position.x = THREE.MathUtils.lerp(
      group.current.position.x,
      x,
      0.16,
    );

    group.current.position.z = THREE.MathUtils.lerp(
      group.current.position.z,
      z,
      0.16,
    );

    group.current.position.y =
      0.28 +
      Math.sin(t * 2.2) *
        0.025;
  });

  return (
    <group
      ref={group}
      position={[
        x,
        0.28,
        z,
      ]}
    >
      {/* action aura */}
      <mesh
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
      >
        <ringGeometry
          args={[
            0.34,
            0.39,
            40,
          ]}
        />

        <meshBasicMaterial
          color={actionColor}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* agent core */}
      <mesh>
        <sphereGeometry
          args={[
            0.18,
            18,
            18,
          ]}
        />

        <meshStandardMaterial
          color={COLORS.agent}
          emissive={COLORS.agentDark}
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* vertical marker */}
      <mesh
        position={[
          0,
          0.32,
          0,
        ]}
      >
        <cylinderGeometry
          args={[
            0.018,
            0.018,
            0.5,
            6,
          ]}
        />

        <meshBasicMaterial
          color={actionColor}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* action-specific pulse */}
      {action !== "PASS" && (
        <ActionPulse
          action={action}
          color={actionColor}
        />
      )}
    </group>
  );
}

/* ---------------------------------------------------------
   Action pulse
--------------------------------------------------------- */

function ActionPulse({
  action,
  color,
}: {
  action: string;
  color: string;
}) {
  const ring =
    useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ring.current) return;

    const t =
      state.clock.elapsedTime;

    const pulse =
      0.85 +
      Math.sin(t * 4) *
        0.15;

    ring.current.scale.set(
      pulse,
      pulse,
      pulse,
    );

    const material =
      ring.current.material as THREE.MeshBasicMaterial;

    material.opacity =
      0.18 +
      (Math.sin(t * 4) + 1) *
        0.08;
  });

  if (
    action === "PASS"
  ) {
    return null;
  }

  return (
    <mesh
      ref={ring}
      position={[
        0,
        0.012,
        0,
      ]}
      rotation={[
        -Math.PI / 2,
        0,
        0,
      ]}
    >
      <ringGeometry
        args={[
          0.42,
          0.47,
          40,
        ]}
      />

      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.25}
      />
    </mesh>
  );
}

/* ---------------------------------------------------------
   Opponent
--------------------------------------------------------- */

function Opponent({
  position,
}: {
  position: [number, number];
}) {
  const group =
    useRef<THREE.Group>(null);

  const [x, , z] = boardToWorld(
    position[0],
    position[1],
  );

  useFrame((state) => {
    if (!group.current) return;

    group.current.position.y =
      0.18 +
      Math.sin(
        state.clock.elapsedTime * 1.7,
      ) *
        0.015;
  });

  return (
    <group
      ref={group}
      position={[
        x,
        0.18,
        z,
      ]}
    >
      <mesh>
        <sphereGeometry
          args={[
            0.12,
            12,
            12,
          ]}
        />

        <meshStandardMaterial
          color={COLORS.opponent}
        />
      </mesh>

      <mesh
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
      >
        <ringGeometry
          args={[
            0.19,
            0.22,
            24,
          ]}
        />

        <meshBasicMaterial
          color={COLORS.opponent}
          transparent
          opacity={0.45}
        />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------
   Target tile
--------------------------------------------------------- */
function TargetTile({
  target,
  action,
}: {
  target: [number, number] | null;
  action: string;
}) {
  const ring =
    useRef<THREE.Mesh>(null);

  const color =
    getActionColor(action);

  useFrame((state) => {
    if (!ring.current || !target) {
      return;
    }

    const t =
      state.clock.elapsedTime;

    const pulse =
      1 +
      Math.sin(t * 3.5) *
        0.06;

    ring.current.scale.set(
      pulse,
      pulse,
      pulse,
    );
  });

  if (!target) {
    return null;
  }

  const [x, , z] = boardToWorld(
    target[0],
    target[1],
  );

  return (
    <group
      position={[
        x,
        0.035,
        z,
      ]}
    >
      {/* Target ring */}
      <mesh
        ref={ring}
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
      >
        <ringGeometry
          args={[
            0.32,
            0.39,
            32,
          ]}
        />

        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Center marker */}
      <mesh
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
      >
        <circleGeometry
          args={[
            0.07,
            16,
          ]}
        />

        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.75}
        />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------
   Movement direction
--------------------------------------------------------- */

function MovementIndicator({
  position,
  action,
}: {
  position: [number, number];
  action: string;
}) {
  if (!isMovementAction(action)) {
    return null;
  }

  const [x, , z] = boardToWorld(
    position[0],
    position[1],
  );

  let rotation = 0;

  if (action === "NORTH") {
    rotation = 0;
  } else if (action === "EAST") {
    rotation = -Math.PI / 2;
  } else if (action === "SOUTH") {
    rotation = Math.PI;
  } else if (action === "WEST") {
    rotation = Math.PI / 2;
  }

  return (
    <group
      position={[
        x,
        0.08,
        z,
      ]}
      rotation={[
        0,
        rotation,
        0,
      ]}
    >
      <mesh
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
      >
        <coneGeometry
          args={[
            0.13,
            0.28,
            3,
          ]}
        />

        <meshBasicMaterial
          color={COLORS.actionMove}
          transparent
          opacity={0.65}
        />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------
   Barn
--------------------------------------------------------- */

function Barn() {
  return (
    <group
      position={[
        2.8,
        0,
        -3.1,
      ]}
    >
      <mesh
        position={[
          0,
          0.65,
          0,
        ]}
        castShadow
      >
        <boxGeometry
          args={[
            1.7,
            1.3,
            1.4,
          ]}
        />

        <meshStandardMaterial
          color={COLORS.building}
        />
      </mesh>

      <mesh
        position={[
          0,
          1.48,
          0,
        ]}
        castShadow
      >
        <coneGeometry
          args={[
            1.25,
            0.65,
            4,
          ]}
        />

        <meshStandardMaterial
          color={COLORS.roof}
        />
      </mesh>

      <mesh
        position={[
          0,
          0.48,
          0.72,
        ]}
      >
        <boxGeometry
          args={[
            0.48,
            0.75,
            0.04,
          ]}
        />

        <meshStandardMaterial
          color="#3C2D23"
        />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------
   Trees
--------------------------------------------------------- */

function Tree({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh
        position={[
          0,
          0.42,
          0,
        ]}
        castShadow
      >
        <cylinderGeometry
          args={[
            0.08,
            0.11,
            0.8,
            7,
          ]}
        />

        <meshStandardMaterial
          color={COLORS.building}
        />
      </mesh>

      <mesh
        position={[
          0,
          1.0,
          0,
        ]}
        castShadow
      >
        <sphereGeometry
          args={[
            0.48,
            8,
            7,
          ]}
        />

        <meshStandardMaterial
          color={COLORS.grassDark}
        />
      </mesh>
    </group>
  );
}


/* ---------------------------------------------------------
   Distant cinematic landscape
--------------------------------------------------------- */

function Landscape() {
  return (
    <group>
      <mesh position={[0, 5, -8.5]} rotation={[0, 0, 0]}>
        <planeGeometry args={[28, 12]} />
        <meshBasicMaterial color="#A9C9BE" />
      </mesh>

      <group position={[0, 0, -8]}>
        <mesh position={[-5, 3.2, 0]}>
          <coneGeometry args={[3.8, 6.4, 5]} />
          <meshStandardMaterial color="#486B58" roughness={1} />
        </mesh>
        <mesh position={[0, 3.8, 0.3]}>
          <coneGeometry args={[4.5, 7.5, 5]} />
          <meshStandardMaterial color="#365846" roughness={1} />
        </mesh>
        <mesh position={[5.2, 3.0, 0.2]}>
          <coneGeometry args={[3.6, 6, 5]} />
          <meshStandardMaterial color="#55775D" roughness={1} />
        </mesh>
      </group>

      <mesh position={[4.5, 5.2, -7.6]}>
        <sphereGeometry args={[1.1, 24, 16]} />
        <meshBasicMaterial color="#F6D98C" transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------
   River + foreground landscape
--------------------------------------------------------- */

function River() {
  const water = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!water.current) return;
    const t = state.clock.elapsedTime;
    water.current.position.y = -0.01 + Math.sin(t * 0.7) * 0.004;
  });

  return (
    <group position={[0, -0.005, 5.9]}>
      <mesh ref={water} receiveShadow>
        <boxGeometry args={[18, 0.08, 1.35]} />
        <meshStandardMaterial
          color="#4E9DA8"
          roughness={0.25}
          metalness={0.05}
        />
      </mesh>

      <mesh position={[0, 0.035, -0.78]}>
        <boxGeometry args={[18, 0.12, 0.16]} />
        <meshStandardMaterial color="#8C8067" roughness={1} />
      </mesh>

      <mesh position={[0, 0.035, 0.78]}>
        <boxGeometry args={[18, 0.12, 0.16]} />
        <meshStandardMaterial color="#8C8067" roughness={1} />
      </mesh>
    </group>
  );
}

function FlowerPatch({
  position,
}: {
  position: [number, number, number];
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.z =
      Math.sin(state.clock.elapsedTime * 1.1 + position[0]) * 0.025;
  });

  return (
    <group ref={group} position={position}>
      {Array.from({ length: 5 }, (_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * 0.14,
              0.08,
              Math.sin(angle) * 0.14,
            ]}
            castShadow
          >
            <sphereGeometry args={[0.07, 8, 6]} />
            <meshStandardMaterial color="#F2B84B" />
          </mesh>
        );
      })}
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.055, 8, 6]} />
        <meshStandardMaterial color="#7B4B2E" />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------
   Cinematic farm road
--------------------------------------------------------- */

function FarmRoad({
  z = -5.7,
}: {
  z?: number;
}) {
  return (
    <group position={[0, 0.012, z]}>
      <mesh receiveShadow>
        <boxGeometry args={[18, 0.08, 1.9]} />
        <meshStandardMaterial
          color="#5C665E"
          roughness={0.92}
        />
      </mesh>

      <mesh position={[0, 0.045, 0]}>
        <boxGeometry args={[18, 0.012, 0.08]} />
        <meshStandardMaterial color="#E8D89A" />
      </mesh>

      {Array.from({ length: 9 }, (_, index) => (
        <mesh
          key={index}
          position={[-8.1 + index * 2, 0.052, 0]}
        >
          <boxGeometry args={[1.05, 0.018, 0.06]} />
          <meshBasicMaterial color="#F6E7B2" />
        </mesh>
      ))}

      <mesh
        position={[0, 0.06, -0.86]}
      >
        <boxGeometry args={[18, 0.018, 0.05]} />
        <meshBasicMaterial color="#D9C98B" />
      </mesh>

      <mesh
        position={[0, 0.06, 0.86]}
      >
        <boxGeometry args={[18, 0.018, 0.05]} />
        <meshBasicMaterial color="#D9C98B" />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------
   Ambient farm tractor
--------------------------------------------------------- */

function Tractor({
  z = -5.7,
}: {
  z?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const wheelRefs = useRef<THREE.Mesh[]>([]);

  useFrame((state) => {
    if (!group.current) return;

    const t = state.clock.elapsedTime;
    const travel = 18;
    const x = ((t * 1.15) % travel) - travel / 2;

    group.current.position.x = x;
    group.current.position.y =
      0.08 + Math.sin(t * 2.2) * 0.008;

    wheelRefs.current.forEach((wheel) => {
      wheel.rotation.z -= 0.035;
    });
  });

  const addWheel = (ref: THREE.Mesh | null) => {
    if (ref && !wheelRefs.current.includes(ref)) {
      wheelRefs.current.push(ref);
    }
  };

  return (
    <group
      ref={group}
      position={[-9, 0.08, z]}
      scale={0.9}
      rotation={[0, 0, 0]}
    >
      {/* rear chassis */}
      <mesh position={[-0.25, 0.38, 0]} castShadow>
        <boxGeometry args={[0.95, 0.28, 0.72]} />
        <meshStandardMaterial color="#B84932" roughness={0.72} />
      </mesh>

      {/* front hood */}
      <mesh position={[0.55, 0.5, 0]} castShadow>
        <boxGeometry args={[0.75, 0.3, 0.62]} />
        <meshStandardMaterial color="#C95738" roughness={0.7} />
      </mesh>

      {/* cabin */}
      <mesh position={[-0.28, 0.82, 0]} castShadow>
        <boxGeometry args={[0.55, 0.62, 0.62]} />
        <meshStandardMaterial
          color="#385444"
          transparent
          opacity={0.92}
          roughness={0.45}
        />
      </mesh>

      {/* roof */}
      <mesh position={[-0.28, 1.17, 0]} castShadow>
        <boxGeometry args={[0.7, 0.09, 0.72]} />
        <meshStandardMaterial color="#D6C78B" />
      </mesh>

      {/* front grille */}
      <mesh position={[0.94, 0.5, 0]}>
        <boxGeometry args={[0.06, 0.22, 0.42]} />
        <meshStandardMaterial color="#28332D" />
      </mesh>

      {/* rear wheels */}
      {[
        [-0.45, 0.25, -0.43],
        [-0.45, 0.25, 0.43],
      ].map((position, index) => (
        <mesh
          key={index}
          ref={addWheel}
          position={position as [number, number, number]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.3, 0.3, 0.16, 14]} />
          <meshStandardMaterial color="#27302C" roughness={1} />
        </mesh>
      ))}

      {/* front wheels */}
      {[
        [0.63, 0.24, -0.38],
        [0.63, 0.24, 0.38],
      ].map((position, index) => (
        <mesh
          key={index}
          ref={addWheel}
          position={position as [number, number, number]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.22, 0.22, 0.14, 14]} />
          <meshStandardMaterial color="#27302C" roughness={1} />
        </mesh>
      ))}

      {/* tiny trailer */}
      <group position={[-1.1, 0.35, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.05, 0.38, 0.95]} />
          <meshStandardMaterial color="#7A563B" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <boxGeometry args={[1.12, 0.08, 1.0]} />
          <meshStandardMaterial color="#A77A4F" />
        </mesh>
        {[
          [-0.28, -0.52],
          [0.28, -0.52],
        ].map(([x, z], index) => (
          <mesh
            key={index}
            position={[x, -0.18, z]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.18, 0.18, 0.12, 12]} />
            <meshStandardMaterial color="#27302C" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ---------------------------------------------------------
   Animated windmill landmark
--------------------------------------------------------- */

function Windmill() {
  const blades = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!blades.current) return;
    blades.current.rotation.z =
      state.clock.elapsedTime * 0.55;
  });

  return (
    <group position={[-2.7, 0, -4.35]}>
      <mesh
        position={[0, 1.05, 0]}
        scale={[0.28, 1.15, 0.28]}
        castShadow
      >
        <coneGeometry args={[0.85, 2.5, 5]} />
        <meshStandardMaterial color="#7C6145" />
      </mesh>

      <mesh
        position={[0, 2.05, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.18, 0.18, 0.22, 12]} />
        <meshStandardMaterial color="#4A514A" />
      </mesh>

      <group
        ref={blades}
        position={[0, 2.05, 0.12]}
      >
        {[0, 1, 2, 3].map((index) => (
          <mesh
            key={index}
            rotation={[0, 0, index * (Math.PI / 2)]}
            position={[0, 0, 0]}
          >
            <boxGeometry args={[0.08, 0.95, 0.045]} />
            <meshStandardMaterial color="#D7D0B5" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ---------------------------------------------------------
   World
--------------------------------------------------------- */

function World({
  replayStep,
  cinematic = false,
}: {
  replayStep: ReplayStep | null;
  cinematic?: boolean;
}) {
  const playerPosition =
    replayStep?.p0_pos ?? [4, 4];

  const opponentPosition =
    replayStep?.p1_pos ?? [4, 4];

  const plants =
    replayStep?.plants ?? [];

  const target =
    replayStep?.telemetry
      ?.target_tile ?? null;

  const action =
    replayStep?.action ?? "PASS";

  return (
    <>
      <color
        attach="background"
        args={[cinematic ? "#78A8B5" : "#BFDCD0"]}
      />

      {cinematic && (
        <fog
          attach="fog"
          args={["#78A8B5", 15, 30]}
        />
      )}

      <PerspectiveCamera
        makeDefault
        position={
          cinematic
            ? [10.8, 7.6, 11.8]
            : [8.8, 8.2, 8.8]
        }
        fov={cinematic ? 48 : 42}
        near={0.1}
        far={100}
        onUpdate={(camera) => {
          camera.lookAt(
            0,
            cinematic ? 0.1 : 0,
            cinematic ? -0.7 : 0,
          );
        }}
      />

      <ambientLight intensity={cinematic ? 2.1 : 1.8} />

      <directionalLight
        position={[-7, 12, 8]}
        intensity={cinematic ? 3.8 : 2.5}
        castShadow
      />

      <directionalLight
        position={[7, 7, -6]}
        intensity={cinematic ? 1.15 : 0.8}
      />

      {cinematic && (
        <pointLight
          position={[6, 5, 5]}
          intensity={1.2}
          distance={18}
        />
      )}

      <Landscape />

      <Ground />

      <FarmRoad z={cinematic ? 4.15 : -5.7} />
      <Tractor z={cinematic ? 4.15 : -5.7} />
      <Windmill />

      {cinematic && (
        <>
          <River />
          <FlowerPatch position={[-6.4, 0, 5.1]} />
          <FlowerPatch position={[-5.7, 0, 4.5]} />
          <FlowerPatch position={[5.9, 0, 5.1]} />
          <FlowerPatch position={[6.4, 0, 4.6]} />
        </>
      )}

      <FarmPlots
        plants={plants}
      />

      <Crops
        plants={plants}
      />

      <TargetTile
        target={target}
        action={action}
      />

      <Agent
        position={playerPosition}
        action={action}
      />

      <MovementIndicator
        position={playerPosition}
        action={action}
      />

      <Opponent
        position={opponentPosition}
      />

      <Barn />

      <Tree
        position={[
          -3.6,
          0,
          -3.4,
        ]}
      />

      <Tree
        position={[
          -4.0,
          0,
          3.4,
        ]}
      />

      <Tree
        position={[
          3.8,
          0,
          3.7,
        ]}
      />

      <OrbitControls
  target={[0, 0, 0]}
  enablePan={false}
  enableDamping
  dampingFactor={0.08}
  minDistance={7}
  maxDistance={15}
  maxPolarAngle={Math.PI / 2.15}
  minPolarAngle={Math.PI / 5}
/>
    </>
  );
}

/* ---------------------------------------------------------
   Public component
--------------------------------------------------------- */
export default function FarmScene({
  replayStep,
  cinematic = false,
}: FarmSceneProps) {
  return (
    <div className="farm-scene">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
        }}
      >
        <World replayStep={replayStep} />
      </Canvas>
    </div>
  );
}