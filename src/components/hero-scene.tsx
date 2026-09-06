"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

function WaterSurface() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color("#060a10") },
      uColor2: { value: new THREE.Color("#00b4d8") },
      uOpacity: { value: 0.85 },
    }),
    []
  );

  useFrame((state) => {
    const t = state.elapsed;
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = t;
    }
    if (meshRef.current) {
      meshRef.current.rotation.x = -Math.PI / 2;
      const positions = meshRef.current.geometry.attributes.position;
      const arr = positions.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        const x = arr[i];
        const z = arr[i + 1];
        arr[i + 2] =
          Math.sin(x * 0.3 + t * 0.8) * 0.15 +
          Math.sin(z * 0.4 + t * 0.6) * 0.1 +
          Math.sin((x + z) * 0.2 + t * 1.2) * 0.08;
      }
      positions.needsUpdate = true;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, -0.5, 0]}>
      <planeGeometry args={[30, 30, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        vertexShader={`
          varying vec2 vUv;
          varying float vElevation;
          void main() {
            vUv = uv;
            vElevation = position.z;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform vec3 uColor1;
          uniform vec3 uColor2;
          uniform float uOpacity;
          varying vec2 vUv;
          varying float vElevation;
          void main() {
            float mixFactor = smoothstep(-0.2, 0.3, vElevation);
            vec3 color = mix(uColor1, uColor2, mixFactor * 0.4);
            float edge = smoothstep(0.0, 0.5, vUv.x) * smoothstep(1.0, 0.5, vUv.x);
            edge *= smoothstep(0.0, 0.5, vUv.y) * smoothstep(1.0, 0.5, vUv.y);
            gl_FragColor = vec4(color, uOpacity * edge * (0.6 + mixFactor * 0.4));
          }
        `}
      />
    </mesh>
  );
}

function RainParticles() {
  const count = 800;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  /* eslint-disable react-hooks/purity */
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = Math.random() * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
      vel[i] = 0.08 + Math.random() * 0.12;
    }
    return [pos, vel];
  }, []);
  /* eslint-enable react-hooks/purity */

  const dummy = useMemo(() => new THREE.Object3D(), []);

  /* eslint-disable react-hooks/immutability */
  useFrame(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] -= velocities[i];
      if (positions[i * 3 + 1] < -1) {
        positions[i * 3 + 1] = 12 + Math.random() * 3;
        positions[i * 3] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      }
      dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      dummy.scale.set(0.02, 0.15 + Math.random() * 0.1, 0.02);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[0.5, 0.5, 1, 4]} />
      <meshBasicMaterial color="#4dd4f0" transparent opacity={0.25} />
    </instancedMesh>
  );
}

function FloatingLights() {
  return (
    <>
      <pointLight position={[-5, 3, -5]} color="#00b4d8" intensity={2} distance={20} />
      <pointLight position={[5, 2, -3]} color="#ff3b5c" intensity={1.5} distance={15} />
      <pointLight position={[0, 4, 0]} color="#00d9ff" intensity={1} distance={25} />
      <spotLight
        position={[0, 10, 0]}
        angle={0.4}
        penumbra={0.8}
        color="#00b4d8"
        intensity={0.8}
        castShadow={false}
      />
    </>
  );
}

function FogParticles() {
  const count = 200;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  /* eslint-disable react-hooks/purity */
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 8 - 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return pos;
  }, []);
  /* eslint-enable react-hooks/purity */

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.elapsed;
    for (let i = 0; i < count; i++) {
      const x = positions[i * 3] + Math.sin(t * 0.1 + i) * 0.5;
      const y = positions[i * 3 + 1] + Math.sin(t * 0.15 + i * 0.5) * 0.3;
      const z = positions[i * 3 + 2] + Math.cos(t * 0.08 + i * 0.3) * 0.5;
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.3 + Math.sin(i) * 0.15);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#00b4d8" transparent opacity={0.04} />
    </instancedMesh>
  );
}

export function HeroSceneInner() {
  return (
    <Canvas
      camera={{ position: [0, 3, 8], fov: 50 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
      dpr={[1, 1.5]}
    >
      <fog attach="fog" args={["#060a10", 8, 30]} />
      <ambientLight intensity={0.15} />
      <FloatingLights />
      <Float speed={0.5} rotationIntensity={0.1} floatIntensity={0.3}>
        <WaterSurface />
      </Float>
      <RainParticles />
      <FogParticles />
    </Canvas>
  );
}
