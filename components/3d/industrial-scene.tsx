
"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import * as THREE from "three";

function Wire({
  points,
  color,
}: {
  points: [number, number, number][];
  color: string;
}) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      points.map((point) => new THREE.Vector3(...point))
    );

    return new THREE.TubeGeometry(curve, 32, 0.018, 8, false);
  }, [points]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={color}
        metalness={0.65}
        roughness={0.3}
        emissive={color}
        emissiveIntensity={0.12}
      />
    </mesh>
  );
}

function CabinetModule({
  position,
  size,
  color = "#26394a",
}: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          metalness={0.75}
          roughness={0.3}
        />
      </mesh>

      <mesh position={[0, 0, size[2] / 2 + 0.012]}>
        <boxGeometry args={[size[0] * 0.65, size[1] * 0.12, 0.025]} />
        <meshStandardMaterial
          color="#71899a"
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>

      <mesh position={[0, size[1] * 0.25, size[2] / 2 + 0.025]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial
          color="#55d6a0"
          emissive="#18a66a"
          emissiveIntensity={1.5}
        />
      </mesh>
    </group>
  );
}

function ControlCabinet() {
  const modulePositions = [-0.9, -0.3, 0.3, 0.9];

  return (
    <group position={[0.45, 1.65, 0]}>
      {/* Cabinet outer enclosure */}
      <mesh position={[0, 0, -0.15]}>
        <boxGeometry args={[3.1, 3.25, 0.65]} />
        <meshStandardMaterial
          color="#263747"
          metalness={0.85}
          roughness={0.32}
        />
      </mesh>

      {/* Inner mounting plate */}
      <mesh position={[0, 0, 0.19]}>
        <boxGeometry args={[2.82, 3.02, 0.055]} />
        <meshStandardMaterial
          color="#a0a9ad"
          metalness={0.7}
          roughness={0.5}
        />
      </mesh>

      {/* Cabinet frame */}
      {[-1.53, 1.53].map((x) => (
        <mesh key={x} position={[x, 0, 0.24]}>
          <boxGeometry args={[0.09, 3.3, 0.16]} />
          <meshStandardMaterial color="#526779" metalness={0.9} />
        </mesh>
      ))}

      {/* DIN rails */}
      {[-0.95, 0, 0.9].map((y) => (
        <mesh key={y} position={[0, y, 0.29]}>
          <boxGeometry args={[2.7, 0.065, 0.1]} />
          <meshStandardMaterial
            color="#d1d6d8"
            metalness={0.95}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* PLC modules */}
      {modulePositions.map((x, index) => (
        <CabinetModule
          key={x}
          position={[x, 0.95, 0.43]}
          size={[0.43, 0.62, 0.24]}
          color={index === 1 ? "#344d61" : "#273b4d"}
        />
      ))}

      {/* Circuit breakers */}
      {modulePositions.map((x, index) => (
        <group key={x} position={[x, -0.05, 0.43]}>
          <CabinetModule
            position={[0, 0, 0]}
            size={[0.42, 0.58, 0.25]}
            color="#e0e4e4"
          />

          <mesh position={[0, -0.03, 0.15]}>
            <boxGeometry args={[0.1, 0.2, 0.035]} />
            <meshStandardMaterial color="#263747" />
          </mesh>

          <mesh position={[0, 0.2, 0.15]}>
            <sphereGeometry args={[0.025, 12, 12]} />
            <meshStandardMaterial
              color={index % 2 === 0 ? "#24c77a" : "#f5a623"}
              emissive={index % 2 === 0 ? "#24c77a" : "#f5a623"}
              emissiveIntensity={0.7}
            />
          </mesh>
        </group>
      ))}

      {/* Terminal blocks */}
      {Array.from({ length: 10 }).map((_, index) => (
        <mesh
          key={index}
          position={[-1.15 + index * 0.255, -1.15, 0.43]}
        >
          <boxGeometry args={[0.2, 0.28, 0.25]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? "#d9a52d" : "#4b9d9a"}
            metalness={0.4}
            roughness={0.45}
          />
        </mesh>
      ))}

      {/* Electrical wiring */}
      <Wire
        color="#f5a623"
        points={[
          [-1.15, 1.45, 0.5],
          [-1.15, 1.15, 0.65],
          [-0.9, 0.85, 0.65],
          [-0.9, 0.65, 0.5],
        ]}
      />

      <Wire
        color="#1476d4"
        points={[
          [-0.55, 1.45, 0.5],
          [-0.55, 1.2, 0.7],
          [-0.3, 0.9, 0.7],
          [-0.3, 0.65, 0.5],
        ]}
      />

      <Wire
        color="#e8e8e8"
        points={[
          [0.05, 1.45, 0.5],
          [0.05, 1.1, 0.7],
          [0.3, 0.9, 0.7],
          [0.3, 0.65, 0.5],
        ]}
      />

      <Wire
        color="#f5a623"
        points={[
          [0.65, 1.45, 0.5],
          [0.65, 1.1, 0.7],
          [0.9, 0.9, 0.7],
          [0.9, 0.65, 0.5],
        ]}
      />

      <Wire
        color="#1476d4"
        points={[
          [-1.1, -0.45, 0.5],
          [-1.1, -0.8, 0.7],
          [-0.8, -1.05, 0.7],
          [-0.8, -1.15, 0.5],
        ]}
      />

      <Wire
        color="#f5a623"
        points={[
          [0.8, -0.45, 0.5],
          [0.8, -0.8, 0.7],
          [1.05, -1.05, 0.7],
          [1.05, -1.15, 0.5],
        ]}
      />

      {/* Open cabinet door */}
      <group position={[1.9, 0, -0.2]} rotation={[0, -0.65, 0]}>
        <mesh>
          <boxGeometry args={[0.13, 3.25, 1.85]} />
          <meshStandardMaterial
            color="#34495b"
            metalness={0.9}
            roughness={0.25}
          />
        </mesh>

        <mesh position={[0.075, 0, 0]}>
          <boxGeometry args={[0.025, 2.9, 1.55]} />
          <meshStandardMaterial
            color="#263747"
            metalness={0.7}
            roughness={0.35}
          />
        </mesh>

        <mesh position={[0.12, 0, -0.65]}>
          <boxGeometry args={[0.08, 0.5, 0.08]} />
          <meshStandardMaterial color="#d3d9dc" metalness={0.9} />
        </mesh>

        {/* Warning symbol */}
        <mesh position={[0.09, 0.85, 0]}>
          <boxGeometry args={[0.035, 0.38, 0.38]} />
          <meshStandardMaterial
            color="#f5a623"
            emissive="#9a4d00"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}

function ElectricMotor() {
  return (
    <group position={[-1.55, 0.48, 1.15]} rotation={[0, 0, Math.PI / 2]}>
      {/* Motor body */}
      <mesh>
        <cylinderGeometry args={[0.48, 0.48, 1.05, 32]} />
        <meshStandardMaterial
          color="#263d52"
          metalness={0.9}
          roughness={0.28}
        />
      </mesh>

      {/* Motor end cover */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.16, 32]} />
        <meshStandardMaterial color="#8d9ca5" metalness={0.95} />
      </mesh>

      {/* Motor shaft */}
      <mesh position={[0, 0.78, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.38, 24]} />
        <meshStandardMaterial color="#c4cdd1" metalness={1} />
      </mesh>

      {/* Cooling fins */}
      {Array.from({ length: 9 }).map((_, index) => (
        <mesh
          key={index}
          position={[0, (index - 4) * 0.1, 0]}
        >
          <torusGeometry args={[0.46, 0.025, 8, 32]} />
          <meshStandardMaterial color="#62788b" metalness={0.85} />
        </mesh>
      ))}

      {/* Motor base */}
      <mesh position={[0, -0.57, 0]}>
        <boxGeometry args={[0.95, 0.14, 0.85]} />
        <meshStandardMaterial color="#536779" metalness={0.85} />
      </mesh>
    </group>
  );
}

function SceneContent() {
  return (
    <>
      <ambientLight intensity={1.1} />

      <directionalLight
        position={[5, 7, 5]}
        intensity={2.5}
        castShadow
      />

      <pointLight
        position={[-3, 3, 4]}
        color="#f5a623"
        intensity={35}
        distance={10}
      />

      <pointLight
        position={[3, 2, -3]}
        color="#3c83bd"
        intensity={25}
        distance={10}
      />

      <ControlCabinet />
      <ElectricMotor />

      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.12, 0]}
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          color="#101923"
          metalness={0.5}
          roughness={0.65}
        />
      </mesh>

      <Environment preset="city" />
    </>
  );
}

export default function IndustrialScene() {
  return (
    <Canvas
      camera={{
        position: [5.2, 3.6, 7],
        fov: 38,
      }}
      dpr={[1, 1.5]}
      shadows
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>

      <OrbitControls
        target={[0, 1.2, 0]}
        enablePan={false}
        enableZoom
        enableRotate
        minDistance={4.5}
        maxDistance={11}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2}
        autoRotate
        autoRotateSpeed={0.35}
        enableDamping
        dampingFactor={0.06}
      />
    </Canvas>
  );
}
