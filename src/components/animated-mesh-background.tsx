'use client';

import { useRef, useEffect, useState } from 'react';
import { Renderer, Program, Triangle, Mesh } from 'ogl';

interface AnimatedMeshBackgroundProps {
  primaryColor?: string;
  secondaryColor?: string;
  meshDensity?: number;
  animationSpeed?: number;
  noiseScale?: number;
  className?: string;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
};

const AnimatedMeshBackground: React.FC<AnimatedMeshBackgroundProps> = ({
  primaryColor = '#a855f7',
  secondaryColor = '#3b82f6',
  meshDensity = 0.5,
  animationSpeed = 1.0,
  noiseScale = 1.0,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const cleanupFunctionRef = useRef<(() => void) | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const uniformsRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let visibilityTimeout: NodeJS.Timeout | null = null;

    observerRef.current = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        
        if (visibilityTimeout) {
          clearTimeout(visibilityTimeout);
        }

        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          visibilityTimeout = setTimeout(() => {
            setIsVisible(false);
          }, 500);
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    observerRef.current.observe(containerRef.current);

    return () => {
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    if (cleanupFunctionRef.current) {
      cleanupFunctionRef.current();
      cleanupFunctionRef.current = null;
    }

    const initializeWebGL = async () => {
      if (!containerRef.current) return;

      await new Promise(resolve => setTimeout(resolve, 10));

      if (!containerRef.current) return;

      const renderer = new Renderer({
        dpr: Math.min(window.devicePixelRatio, 2),
        alpha: true
      });
      rendererRef.current = renderer;

      const gl = renderer.gl;
      gl.canvas.style.width = '100%';
      gl.canvas.style.height = '100%';

      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      containerRef.current.appendChild(gl.canvas);

      const vert = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

      const frag = `precision highp float;

uniform float iTime;
uniform vec2 iResolution;
uniform vec3 primaryColor;
uniform vec3 secondaryColor;
uniform float meshDensity;
uniform float animationSpeed;
uniform float noiseScale;

varying vec2 vUv;

float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float smoothNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  
  float a = noise(i);
  float b = noise(i + vec2(1.0, 0.0));
  float c = noise(i + vec2(0.0, 1.0));
  float d = noise(i + vec2(1.0, 1.0));
  
  float ab = mix(a, b, f.x);
  float cd = mix(c, d, f.x);
  return mix(ab, cd, f.y);
}

float perlin(vec2 p) {
  float value = 0.0;
  float amplitude = 1.0;
  float frequency = 1.0;
  float maxValue = 0.0;
  
  for(int i = 0; i < 4; i++) {
    value += amplitude * smoothNoise(p * frequency + vec2(iTime * 0.3 * animationSpeed));
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  
  return value / maxValue;
}

void main() {
  vec2 uv = vUv;
  
  // Create mesh pattern
  vec2 meshCoord = uv * meshDensity * 10.0;
  vec2 meshPattern = abs(sin(meshCoord * 3.14159));
  float meshLine = min(meshPattern.x, meshPattern.y);
  meshLine = smoothstep(0.1, 0.05, meshLine);
  
  // Add noise distortion
  float n = perlin(uv * noiseScale * 3.0);
  
  // Animated glow effect
  float glowY = mod(uv.y + iTime * 0.2 * animationSpeed, 1.0);
  float glowStrength = exp(-pow(glowY - 0.5, 2.0) * 4.0) * 0.5;
  
  // Combine mesh with noise
  float meshNoise = meshLine * (0.5 + 0.5 * n);
  
  // Color gradients
  vec3 color = mix(primaryColor, secondaryColor, n * 0.5 + 0.5);
  
  // Animated alpha based on mesh and glow
  float alpha = (meshNoise + glowStrength) * 0.6;
  alpha += smoothNoise(uv + iTime * 0.1 * animationSpeed) * 0.2;
  
  // Add brightness variation
  float brightness = 0.3 + 0.7 * (0.5 + 0.5 * sin(iTime * animationSpeed + uv.x * 5.0));
  
  vec3 finalColor = color * brightness;
  
  gl_FragColor = vec4(finalColor, alpha * 0.4);
}`;

      const uniforms = {
        iTime: { value: 0 },
        iResolution: { value: [1, 1] },
        primaryColor: { value: hexToRgb(primaryColor) },
        secondaryColor: { value: hexToRgb(secondaryColor) },
        meshDensity: { value: meshDensity },
        animationSpeed: { value: animationSpeed },
        noiseScale: { value: noiseScale }
      };
      uniformsRef.current = uniforms;

      const geometry = new Triangle(gl);
      const program = new Program(gl, {
        vertex: vert,
        fragment: frag,
        uniforms
      });
      const mesh = new Mesh(gl, { geometry, program });

      const updatePlacement = () => {
        if (!containerRef.current || !renderer) return;

        renderer.dpr = Math.min(window.devicePixelRatio, 2);

        const { clientWidth: wCSS, clientHeight: hCSS } = containerRef.current;
        renderer.setSize(wCSS, hCSS);

        const dpr = renderer.dpr;
        const w = wCSS * dpr;
        const h = hCSS * dpr;

        uniforms.iResolution.value = [w, h];
      };

      const loop = (t: number) => {
        if (!rendererRef.current || !uniformsRef.current) {
          return;
        }

        uniforms.iTime.value = t * 0.001;

        try {
          renderer.render({ scene: mesh });
          animationIdRef.current = requestAnimationFrame(loop);
        } catch (error) {
          console.warn('WebGL rendering error:', error);
          return;
        }
      };

      window.addEventListener('resize', updatePlacement);
      updatePlacement();
      animationIdRef.current = requestAnimationFrame(loop);

      cleanupFunctionRef.current = () => {
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
          animationIdRef.current = null;
        }

        window.removeEventListener('resize', updatePlacement);

        if (renderer) {
          try {
            const canvas = renderer.gl.canvas;
            const loseContextExt = renderer.gl.getExtension('WEBGL_lose_context');
            if (loseContextExt) {
              loseContextExt.loseContext();
            }

            if (canvas && canvas.parentNode) {
              canvas.parentNode.removeChild(canvas);
            }
          } catch (error) {
            console.warn('Error during WebGL cleanup:', error);
          }
        }

        rendererRef.current = null;
        uniformsRef.current = null;
      };
    };

    initializeWebGL();

    return () => {
      if (cleanupFunctionRef.current) {
        cleanupFunctionRef.current();
        cleanupFunctionRef.current = null;
      }
    };
  }, [isVisible, primaryColor, secondaryColor, meshDensity, animationSpeed, noiseScale]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full pointer-events-none z-[3] overflow-hidden relative ${className}`.trim()}
    />
  );
};

export default AnimatedMeshBackground;
