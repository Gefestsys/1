"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// Resolve the model URL relative to this file so Next can bundle/serve it
const MODEL_URL = new URL("./scene.gltf", import.meta.url).toString();

import { applyMaterialConfigToMaterial, defaultRobotMaterials, type RobotMaterialsConfig } from "./robot-materials";

export default function RobotViewer({ className = "", materialConfig }: { className?: string; materialConfig?: RobotMaterialsConfig }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const currentConfigRef = useRef<RobotMaterialsConfig | undefined>(materialConfig);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(2.5, 2, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.physicallyCorrectLights = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const dir1 = new THREE.DirectionalLight(0xffffff, 1.0);
    dir1.position.set(3, 5, 2);
    scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dir2.position.set(-3, 2, -2);
    scene.add(dir2);

    const rim = new THREE.DirectionalLight(0xff2a2a, 0.6);
    rim.position.set(-2, 3, 3);
    scene.add(rim);

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    // Lower blur value to avoid excessive sigmaRadians warning in three.js
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.02);
    scene.environment = envRT.texture;

    // Use a LoadingManager so we can rewrite dependent asset URLs
    const manager = new THREE.LoadingManager();
    const BIN_URL = new URL("./scene.bin", import.meta.url).toString();
    const EMISSIVE_TEX_URL = new URL("./textures/Light_emissive.png", import.meta.url).toString();
    manager.setURLModifier((url) => {
      if (url.endsWith("scene.bin")) return BIN_URL;
      if (url.endsWith("textures/Light_emissive.png")) return EMISSIVE_TEX_URL;
      return url;
    });

    const loader = new GLTFLoader(manager);

    const applyMaterialOverrides = (root: THREE.Object3D) => {
      const cfg = currentConfigRef.current || defaultRobotMaterials;
      root.traverse((child) => {
        const mesh = child as unknown as THREE.Mesh;
        // @ts-ignore
        if (!mesh || !mesh.isMesh) return;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat) => {
          const m = mat as THREE.Material & Partial<THREE.MeshStandardMaterial & THREE.MeshPhysicalMaterial> & { envMapIntensity?: number };
          if (!m) return;
          const name = m.name || "";
          const byName = cfg[name];
          if (byName) {
            applyMaterialConfigToMaterial(m, byName);
            return;
          }
          // Fallback heuristics for any unmatched materials
          const matName = name.toLowerCase();
          const isGlass = matName.includes("glass");
          const isLight = matName.includes("light") || matName.includes("display") || Boolean((m as any).emissiveMap);
          const isPlastic = matName.includes("plastic");
          const isMetal = matName.includes("metal") || matName.includes("copper");

          if (isLight) {
            applyMaterialConfigToMaterial(m, {
              color: "#0d0303",
              emissive: "#ff1a1a",
              emissiveIntensity: 4.0,
              metalness: 0.0,
              roughness: 0.9,
              envMapIntensity: 0.05,
              transparent: false,
              opacity: 1.0,
            });
          } else if (isGlass) {
            applyMaterialConfigToMaterial(m, {
              color: "#141414",
              transparent: true,
              opacity: 0.2,
              roughness: 0.05,
              envMapIntensity: 0.1,
            });
          } else if (isPlastic) {
            applyMaterialConfigToMaterial(m, {
              color: "#1a1a1a",
              metalness: Math.min((m as any).metalness ?? 0.0, 0.15),
              roughness: Math.max((m as any).roughness ?? 0.5, 0.5),
              envMapIntensity: 0.6,
            });
          } else if (isMetal) {
            if ("color" in m && (m as any).color?.multiplyScalar) (m as any).color.multiplyScalar(0.85);
            if ("envMapIntensity" in m) (m as any).envMapIntensity = 1.2;
          } else {
            if ("color" in m && (m as any).color?.multiplyScalar) (m as any).color.multiplyScalar(0.7);
            if ("envMapIntensity" in m) (m as any).envMapIntensity = 0.8;
          }
          (m as any).needsUpdate = true;
        });
      });
    };

    let model: THREE.Object3D | null = null;
    let mixer: THREE.AnimationMixer | null = null;

    loader.load(
      MODEL_URL,
      (gltf) => {
        model = gltf.scene;
        modelRef.current = model;
        scene.add(model);

        // Auto-center and scale to fit the view
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        model.position.x += -center.x;
        model.position.y += -center.y + 0.7; // lift model up in its local grid (adjusted per request)
        model.position.z += -center.z;

        const maxAxis = Math.max(size.x, size.y, size.z);
        const desiredSize = 1.6; // standard size
        const scale = desiredSize / (maxAxis || 1);
        model.scale.setScalar(scale);

        applyMaterialOverrides(model);

        if (gltf.animations && gltf.animations.length) {
          mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => {
            const action = mixer!.clipAction(clip);
            action.play();
          });
        }

        // Apply requested rotation
        model.rotation.y = Math.PI * 0.41;
      },
      undefined,
      (err) => {
        // eslint-disable-next-line no-console
        console.error("Failed to load robot model:", err);
      }
    );

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3;
    controls.maxDistance = 6;
    controls.enablePan = false;
    controls.target.set(0, 0.8, 0);
    controls.autoRotate = false;

    const robotsSection = document.getElementById("robots");

    // === MOUSE ROTATION PARAMETERS (легко настраиваются) ===
    // Измените эти значения чтобы контролировать чувствительность поворотов:
    const HORIZONTAL_SENSITIVITY = 1.2;  // Горизонтальный поворот (азимут) - увеличьте для сильнее, уменьшьте для слабже
    const VERTICAL_SENSITIVITY = 1.2;    // Вертикальный поворот (полюс) - увеличьте для более выраженного наклона
    // === КОНЕЦ ПАРАМЕТРОВ ===

    const handleMouseMove = (e: MouseEvent) => {
      if (!robotsSection) return;

      const rect = robotsSection.getBoundingClientRect();

      // Check if cursor is within robots section
      if (e.clientX < rect.left || e.clientX > rect.right ||
          e.clientY < rect.top || e.clientY > rect.bottom) {
        // Reset to default position when cursor leaves section
        mouseRef.current.targetX = 0;
        mouseRef.current.targetY = 0;
        return;
      }

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = e.clientX;
      const y = e.clientY;

      mouseRef.current.targetX = (x - centerX) / (rect.width / 2) * HORIZONTAL_SENSITIVITY;
      mouseRef.current.targetY = -(y - centerY) / (rect.height / 2) * VERTICAL_SENSITIVITY;
    };

    document.addEventListener("mousemove", handleMouseMove);

    const resize = () => {
      if (!container) return;
      const { clientWidth, clientHeight } = container;
      camera.aspect = clientWidth / Math.max(clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight, false);
    };

    resize();
    window.addEventListener("resize", resize);

    let lastTime = 0;
    let raf = 0;
    const baseDistance = 3.5;
    const baseAzimuth = Math.PI * 0.21;
    const basePolar = Math.PI * 0.47;

    // === ROTATION STRENGTH PARAMETERS ===
    // Настройка расстояния и углов поворота камеры:
    const CAMERA_ROTATION_X = 0.85;  // Горизонтальный поворот камеры - больше значение = сильнее поворот влево-вправо
    const CAMERA_ROTATION_Y = 0.85;  // Вертикальный поворот камеры - больше значение = сильнее поворот вверх-вниз
    const EASING_SPEED = 0.16;       // Плавность анимации (0-1) - меньше = более плавное, больше = более отзывчивое
    // === КОНЕЦ ПАРАМЕТРОВ ===

    const animate = (t: number) => {
      const delta = Math.min((t - lastTime) / 1000, 0.05);
      lastTime = t;

      // Smooth cursor tracking with easing
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * EASING_SPEED;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * EASING_SPEED;

      // Calculate camera position based on cursor position (spherical coordinates)
      const azimuth = baseAzimuth + mouseRef.current.x * CAMERA_ROTATION_X;
      const polar = basePolar + mouseRef.current.y * CAMERA_ROTATION_Y;

      // Update camera position to orbit around the model
      camera.position.x = baseDistance * Math.sin(polar) * Math.cos(azimuth);
      camera.position.y = baseDistance * Math.cos(polar) + 0.5;
      camera.position.z = baseDistance * Math.sin(polar) * Math.sin(azimuth);

      camera.lookAt(0, 0.8, 0);

      mixer?.update(delta);
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(raf);
      controls.dispose();
      mixer?.stopAllAction();
      if (model) {
        scene.remove(model);
      }
      pmrem.dispose();
      envRT.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  // Re-apply overrides when external config changes
  useEffect(() => {
    currentConfigRef.current = materialConfig;
    const model = modelRef.current;
    if (!model) return;
    // Walk and re-apply without reloading the model
    const apply = (root: THREE.Object3D) => {
      const cfg = currentConfigRef.current || defaultRobotMaterials;
      root.traverse((child) => {
        const mesh = child as unknown as THREE.Mesh;
        // @ts-ignore
        if (!mesh || !mesh.isMesh) return;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat) => {
          const m = mat as THREE.Material & Partial<THREE.MeshStandardMaterial & THREE.MeshPhysicalMaterial> & { envMapIntensity?: number };
          if (!m) return;
          const name = m.name || "";
          const byName = cfg[name];
          if (byName) applyMaterialConfigToMaterial(m, byName);
        });
      });
    };
    apply(model);
  }, [materialConfig]);

  return (
    <div
      ref={containerRef}
      className={"w-full h-full " + className}
      aria-label="3D модель робота"
      role="img"
      suppressHydrationWarning
    />
  );
}
