import type * as THREE from "three";

export type MaterialOverride = {
  color?: string; // hex string like #ff0000
  metalness?: number;
  roughness?: number;
  emissive?: string; // hex
  emissiveIntensity?: number;
  opacity?: number;
  transparent?: boolean;
  envMapIntensity?: number;
};

export type RobotMaterialsConfig = Record<string, MaterialOverride>;

// Default config for all materials present in src/components/scene.gltf
export const defaultRobotMaterials: RobotMaterialsConfig = {
  "BezierCurve.006_0": {
    color: "#ffffff",
    metalness: 0.05,
    roughness: 0.6,
    envMapIntensity: 0.6
  },
  White_Plastic: {
    color: "#000000",
    metalness: 0.8,
    roughness: 0.8,
    opacity: 0.60,
    transparent: true,
    envMapIntensity: 0.4
  },
  Copper: {
    color: "#f4a07e",
    metalness: 1.0,
    roughness: 0.1,
    envMapIntensity: 1.2
  },
  "Metal.001": {
    color: "#cccccc",
    metalness: 1.0,
    roughness: 0.8,
    envMapIntensity: 1.1
  },
  Black_Plastic: {
    color: "#0c0c0c",
    metalness: 0.9,
    roughness: 0.8,
    envMapIntensity: 0.6
  },
  Metal: {
    color: "#b3b3b3",
    metalness: 1.0,
    roughness: 0.6,
    envMapIntensity: 1.0
  },
  Glass: {
    color: "#141414",
    metalness: 1.0,
    roughness: 0.0,
    opacity: 0.2,
    transparent: true,
    envMapIntensity: 0.15
  },
  Light: {
    color: "#0a0303",
    emissive: "#ff1a1a",
    emissiveIntensity: 4.0,
    metalness: 0.0,
    roughness: 0.9,
    envMapIntensity: 0.05
  },
  Camera_Plastic: {
    color: "#050505",
    metalness: 0.7,
    roughness: 0.6,
    envMapIntensity: 0.6
  },
  Camera_Lens: {
    color: "#000000",
    metalness: 0.3,
    roughness: 0.0,
    opacity: 1.0,
    transparent: false,
    envMapIntensity: 0.2
  }
};

export function applyMaterialConfigToMaterial(
  mat: THREE.Material & Partial<THREE.MeshStandardMaterial & THREE.MeshPhysicalMaterial> & { envMapIntensity?: number },
  cfg?: MaterialOverride
) {
  if (!cfg) return;
  if (cfg.color && "color" in mat && (mat as any).color?.set) (mat as any).color.set(cfg.color);
  if (typeof cfg.metalness === "number" && "metalness" in mat) (mat as any).metalness = cfg.metalness;
  if (typeof cfg.roughness === "number" && "roughness" in mat) (mat as any).roughness = cfg.roughness;
  if (cfg.emissive && "emissive" in (mat as any)) (mat as any).emissive.set(cfg.emissive);
  if (typeof cfg.emissiveIntensity === "number" && "emissiveIntensity" in (mat as any))
    (mat as any).emissiveIntensity = cfg.emissiveIntensity;
  if (typeof cfg.opacity === "number" && "opacity" in mat) (mat as any).opacity = cfg.opacity;
  if (typeof cfg.transparent === "boolean" && "transparent" in mat) (mat as any).transparent = cfg.transparent;
  if (typeof cfg.envMapIntensity === "number" && "envMapIntensity" in mat) (mat as any).envMapIntensity = cfg.envMapIntensity;
  (mat as any).needsUpdate = true;
}
