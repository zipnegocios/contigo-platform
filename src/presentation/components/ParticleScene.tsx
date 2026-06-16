/**
 * ParticleScene — Three.js WebGL Particle Effects
 *
 * HARDCODED COLORS (Bucket 2 Exception):
 * This component uses hardcoded hex colors for Three.js WebGL shader uniforms.
 * CSS variables cannot be resolved in WebGL uniforms, so hardcoding is intentional.
 * Colors are mapped to design tokens below.
 *
 * Color Mapping:
 * - #1E1A16 → admin sidebar bg (dark panel)
 * - #E3C064 → var(--contigo-primary) / var(--gold-400)
 * - #D02E2E → custom accent red (for sphere)
 * - #FAF6F0 → var(--neutral-50) (light particle dots)
 * - #F5EDE0 → var(--neutral-100) (particle blend)
 *
 * See AUDIT_HARDCODED_COLORS.md (Bucket 2) for details.
 */

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ---- Motion Path Helpers ----
function getLemniscatePos(t: number, angle: number): THREE.Vector3 {
  const x = (Math.cos(t) / (1 + Math.sin(t) ** 2)) * 3;
  const y = (Math.cos(t) * Math.sin(t) / (1 + Math.sin(t) ** 2)) * 3;
  const rotatedX = x * Math.cos(angle) - y * Math.sin(angle);
  const rotatedY = x * Math.sin(angle) + y * Math.cos(angle);
  return new THREE.Vector3(rotatedX, rotatedY, 0);
}

function getCirclePos(t: number, radius: number, zAngle: number, yAngle: number): THREE.Vector3 {
  let x = Math.cos(t) * radius;
  let y = Math.sin(t) * radius;
  const rotatedX = x * Math.cos(zAngle) - y * Math.sin(zAngle);
  const rotatedY = x * Math.sin(zAngle) + y * Math.cos(zAngle);
  const finalX = rotatedX * Math.cos(yAngle);
  const rotatedZ = rotatedX * Math.sin(yAngle);
  return new THREE.Vector3(finalX, rotatedY, rotatedZ);
}

// ---- Shared Particle Shader ----
const particleVertexShader = `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uScrollProgress;
  attribute float aSize;
  varying float vOpacities;

  void main() {
    vec3 p = position;
    vec3 worldPosition = (modelMatrix * vec4(p, 1.0)).xyz;
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * uPixelRatio * (80.0 / -mvPosition.z);
    vOpacities = uOpacity * (1.0 - uScrollProgress);
  }
`;

const particleFragmentShader = `
  uniform vec3 uColor;
  varying float vOpacities;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float l = length(uv);
    float o = 1.0 - smoothstep(0.0, 0.5, l);
    o *= vOpacities;
    if (o < 0.01) discard;
    gl_FragColor = vec4(uColor, o);
  }
`;

// ---- Background Gradient Shader ----
const bgVertexShader = `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

const bgFragmentShader = `
  uniform vec2 uResolution;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  void main() {
    float mixValue = (gl_FragCoord.y / uResolution.y);
    gl_FragColor = vec4(mix(uColorA, uColorB, mixValue), 1.0);
  }
`;

// ---- Text Coordinate Extraction ----
function extractTextCoordinates(
  text: string,
  font: string,
  fontSize: number,
  sampleStep: number = 4
): { x: number; y: number; z: number }[] {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = font;
  const textWidth = ctx.measureText(text).width;
  canvas.width = Math.ceil(textWidth + 20);
  canvas.height = Math.ceil(fontSize * 1.5);

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = font;
  ctx.fillStyle = 'white';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 10, canvas.height / 2);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const coords: { x: number; y: number; z: number }[] = [];

  for (let row = 0; row < canvas.height; row += sampleStep) {
    for (let col = 0; col < canvas.width; col += sampleStep) {
      const i = (row * canvas.width + col) * 4;
      if (data[i] > 128) {
        const x = (col / canvas.width - 0.5) * 8;
        const y = -(row / canvas.height - 0.5) * 4;
        coords.push({ x, y, z: (Math.random() - 0.5) * 2 });
      }
    }
  }
  return coords;
}

// ---- Motion Path Component ----
interface MotionPathProps {
  children: React.ReactNode;
  type: 'lemniscate' | 'circle';
  radius?: number;
  speed: number;
  zAngle?: number;
  yAngle?: number;
  offset?: number;
  direction?: number;
}

function MotionPath({
  children,
  type,
  radius = 1,
  speed,
  zAngle = 0,
  yAngle = 0,
  offset = 0,
  direction = 1,
}: MotionPathProps) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(offset);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;
    const t =
      ((timeRef.current + offset) * (Math.PI * 2)) / speed % (Math.PI * 2);

    let pos: THREE.Vector3;
    if (type === 'lemniscate') {
      pos = getLemniscatePos(t, zAngle);
    } else {
      pos = getCirclePos(t, radius, zAngle, yAngle);
    }

    groupRef.current.position.lerp(pos, 0.1);
    groupRef.current.rotation.z = t * direction;
  });

  return <group ref={groupRef}>{children}</group>;
}

// ---- Particle Points Component ----
interface ParticlePointsProps {
  coordinates: { x: number; y: number; z: number }[];
  color: string;
  baseSize: number;
  opacity: number;
  globalOpacity: React.MutableRefObject<number>;
}

function ParticlePoints({
  coordinates,
  color,
  baseSize,
  opacity,
  globalOpacity,
}: ParticlePointsProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, sizes } = useMemo(() => {
    const positions = new Float32Array(coordinates.length * 3);
    const sizes = new Float32Array(coordinates.length);
    coordinates.forEach((coord, i) => {
      positions[i * 3] = coord.x;
      positions[i * 3 + 1] = coord.y;
      positions[i * 3 + 2] = coord.z;
      sizes[i] = baseSize;
    });
    return { positions, sizes };
  }, [coordinates, baseSize]);

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uOpacity.value =
        opacity * globalOpacity.current;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
          uScrollProgress: { value: 0 },
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: opacity },
        }}
      />
    </points>
  );
}

// ---- Background Plane ----
interface BackgroundPlaneProps {
  colorA: React.MutableRefObject<THREE.Color>;
  colorB: React.MutableRefObject<THREE.Color>;
}

function BackgroundPlane({ colorA, colorB }: BackgroundPlaneProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uColorA.value.copy(colorA.current);
      materialRef.current.uniforms.uColorB.value.copy(colorB.current);
      materialRef.current.uniforms.uResolution.value.set(size.width, size.height);
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={bgVertexShader}
        fragmentShader={bgFragmentShader}
        uniforms={{
          uResolution: { value: new THREE.Vector2(size.width, size.height) },
          // WebGL shader colors — hardcoded for THREE.Color compatibility
          // #1E1A16 = admin sidebar bg | #E3C064 = var(--contigo-primary)
          uColorA: { value: new THREE.Color('#1E1A16') },
          uColorB: { value: new THREE.Color('#E3C064') },
        }}
        depthWrite={false}
      />
    </mesh>
  );
}

// ---- Accent Sphere ----
interface AccentSphereProps {
  globalOpacity: React.MutableRefObject<number>;
}

function AccentSphere({ globalOpacity }: AccentSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.material = new THREE.MeshBasicMaterial({
        color: '#D02E2E',
        transparent: true,
        opacity: globalOpacity.current,
      });
    }
  });

  return (
    <mesh ref={meshRef} position={[1.5, 0.5, 0]}>
      <sphereGeometry args={[0.15, 16, 16]} />
      {/* WebGL shader color — hardcoded for THREE.Color | #D02E2E = accent red */}
      <meshBasicMaterial color="#D02E2E" transparent />
    </mesh>
  );
}

// ---- Dot Surface ----
function DotSurface({ globalOpacity }: { globalOpacity: React.MutableRefObject<number> }) {
  const coordinates = useMemo(() => {
    const coords: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < 6000; i++) {
      coords.push({
        x: Math.random() * 20 - 10,
        y: Math.random() * 20 - 10,
        z: Math.random() * 20 - 10,
      });
    }
    return coords;
  }, []);

  return (
    <MotionPath type="lemniscate" speed={14} zAngle={0.3} offset={2}>
      {/* Particle color — #FAF6F0 = var(--neutral-50) */}
      <ParticlePoints
        coordinates={coordinates}
        color="#FAF6F0"
        baseSize={0.02}
        opacity={0.3}
        globalOpacity={globalOpacity}
      />
    </MotionPath>
  );
}

// ---- Wordmark Particles ----
function WordmarkParticles({ globalOpacity }: { globalOpacity: React.MutableRefObject<number> }) {
  const [coordinates, setCoordinates] = useState<{ x: number; y: number; z: number }[]>([]);

  useEffect(() => {
    // Wait for fonts to load before sampling
    document.fonts.ready.then(() => {
      const coords = extractTextCoordinates(
        'CONTIGO',
        '700 120px "Cormorant Garamond", serif',
        120,
        3
      );
      setCoordinates(coords);
    });
  }, []);

  if (coordinates.length === 0) return null;

  return (
    <MotionPath type="lemniscate" speed={6} zAngle={0} offset={0}>
      <ParticlePoints
        coordinates={coordinates}
        color="#E3C064"
        baseSize={0.04}
        opacity={0.8}
        globalOpacity={globalOpacity}
      />
      <AccentSphere globalOpacity={globalOpacity} />
    </MotionPath>
  );
}

// ---- Monogram Particles ----
function MonogramParticles({ globalOpacity }: { globalOpacity: React.MutableRefObject<number> }) {
  const [coordinates, setCoordinates] = useState<{ x: number; y: number; z: number }[]>([]);

  useEffect(() => {
    document.fonts.ready.then(() => {
      const coords = extractTextCoordinates(
        'CC',
        '700 180px "Cormorant Garamond", serif',
        180,
        4
      );
      setCoordinates(coords);
    });
  }, []);

  if (coordinates.length === 0) return null;

  return (
    <MotionPath type="circle" speed={5} radius={1.5} zAngle={0.7} yAngle={0.2} offset={1}>
      <ParticlePoints
        coordinates={coordinates}
        color="#E3C064"
        baseSize={0.05}
        opacity={0.8}
        globalOpacity={globalOpacity}
      />
    </MotionPath>
  );
}

// ---- Main Scene ----
function Scene() {
  const { camera } = useThree();
  // WebGL shader colors — hardcoded for THREE.Color uniforms
  // #1E1A16 = admin sidebar bg | #E3C064 = var(--contigo-primary)
  const colorA = useRef(new THREE.Color('#1E1A16'));
  const colorB = useRef(new THREE.Color('#E3C064'));
  const globalOpacity = useRef(0.8);
  const mousePos = useRef({ x: 0, y: 0 });

  // Track mouse for parallax
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  useFrame(() => {
    const scrollProgress = Math.min(window.scrollY / window.innerHeight, 1);

    // Camera parallax from mouse
    camera.position.x += (mousePos.current.x * 0.005 - camera.position.x) * 0.1;
    camera.position.y += (mousePos.current.y * 0.005 - camera.position.y) * 0.1;

    // Camera push-through on scroll
    const targetZ = 5 - scrollProgress * 7;
    camera.position.z += (targetZ - camera.position.z) * 0.1;

    // Color morph — WebGL shader animation colors
    // #FAF6F0 = var(--neutral-50) | #F5EDE0 = var(--neutral-100)
    colorA.current.lerpColors(
      new THREE.Color('#1E1A16'),
      new THREE.Color('#FAF6F0'),
      scrollProgress
    );
    colorB.current.lerpColors(
      new THREE.Color('#E3C064'),
      new THREE.Color('#F5EDE0'),
      scrollProgress
    );

    // Global opacity fade
    globalOpacity.current = 0.8 * (1 - scrollProgress) + 0.1;
  });

  return (
    <>
      <BackgroundPlane colorA={colorA} colorB={colorB} />
      <WordmarkParticles globalOpacity={globalOpacity} />
      <MonogramParticles globalOpacity={globalOpacity} />
      <DotSurface globalOpacity={globalOpacity} />
    </>
  );
}

// ---- Exported Canvas Wrapper ----
interface ParticleSceneProps {
  className?: string;
}

export default function ParticleScene({ className }: ParticleSceneProps) {
  return (
    <div className={className} style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
