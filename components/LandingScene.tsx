"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars, Trail } from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";

function FloatingObject() {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHover] = useState(false);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 0.2;
            meshRef.current.rotation.y += delta * 0.3;
        }
    });

    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <Trail width={2} length={6} color="#4f46e5" attenuation={(t) => t * t}>
                <mesh
                    ref={meshRef}
                    onPointerOver={() => setHover(true)}
                    onPointerOut={() => setHover(false)}
                    scale={hovered ? 1.2 : 1}
                >
                    <icosahedronGeometry args={[2, 0]} />
                    <meshStandardMaterial
                        color={hovered ? "#6366f1" : "#4338ca"}
                        wireframe
                        emissive="#4338ca"
                        emissiveIntensity={0.5}
                    />
                </mesh>
            </Trail>
        </Float>
    );
}

export default function LandingScene() {
    return (
        <div className="absolute inset-0 -z-10 h-full w-full">
            <Canvas camera={{ position: [0, 0, 8] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <FloatingObject />
            </Canvas>
        </div>
    );
}
