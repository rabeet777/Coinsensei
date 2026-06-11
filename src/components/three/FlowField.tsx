"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * The Exchange Field — a custom fragment-shader flow field.
 * Horizontal currents of light (pulse cyan → settlement mint) drift
 * across obsidian, bending gently toward the cursor. Pure WebGL,
 * no R3F overhead; renders nothing under prefers-reduced-motion.
 */

const VERT = /* glsl */ `
  void main() { gl_Position = vec4(position, 1.0); }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform vec2 uRes;
  uniform float uTime;
  uniform vec2 uMouse;     // 0..1
  uniform float uIntensity;

  // hash + value noise + fbm
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.55;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.04 + vec2(13.7, 7.1);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec2 p = uv;
    p.x *= uRes.x / uRes.y;

    float t = uTime * 0.055;

    // cursor pull — currents lean toward the mouse
    vec2 m = uMouse;
    m.x *= uRes.x / uRes.y;
    float md = length(p - m);
    vec2 pull = normalize(p - m + 1e-4) * exp(-md * 2.1) * 0.22;

    // domain-warped horizontal flow
    vec2 q = vec2(
      fbm(p * 1.35 + vec2(t * 1.6, -t * 0.4)),
      fbm(p * 1.35 + vec2(-t, t * 0.8) + 4.7)
    );
    vec2 r = p + (q - 0.5) * 1.15 - pull;
    float stream = fbm(vec2(r.x * 1.1 - t * 2.2, r.y * 3.4));

    // ribbon bands across the middle of the frame
    float band = smoothstep(0.18, 0.62, stream)
               * smoothstep(0.95, 0.42, abs(uv.y - 0.52 + (q.y - 0.5) * 0.34) * 2.0);

    // two-hue flow: cyan in the upper current, mint settling below
    vec3 obsidian = vec3(0.012, 0.024, 0.035);
    vec3 cyan = vec3(0.086, 0.851, 0.961);
    vec3 mint = vec3(0.169, 0.941, 0.651);
    float hueMix = clamp(uv.y * 1.4 - 0.2 + (q.x - 0.5) * 0.7, 0.0, 1.0);
    vec3 flow = mix(cyan, mint, hueMix);

    vec3 col = obsidian;
    col += flow * band * (0.55 + 0.45 * fbm(r * 3.0 + t)) * uIntensity;

    // faint counter-current shimmer
    float wisps = fbm(vec2(p.x * 2.4 + t * 3.4, p.y * 6.0 - t));
    col += cyan * smoothstep(0.74, 0.96, wisps) * 0.10 * uIntensity;

    // cursor ember
    col += flow * exp(-md * 5.0) * 0.13;

    // vignette + subtle grain
    float vig = smoothstep(1.25, 0.35, length(uv - vec2(0.5, 0.46)));
    col *= mix(0.55, 1.0, vig);
    col += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.012;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function FlowField({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.domElement.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uIntensity: { value: 1 },
    };

    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms,
      })
    );
    scene.add(quad);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      renderer.setSize(w, h, false);
      uniforms.uRes.value.set(
        w * renderer.getPixelRatio(),
        h * renderer.getPixelRatio()
      );
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const target = new THREE.Vector2(0.5, 0.5);
    const onMove = (e: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      target.set(
        (e.clientX - rect.left) / rect.width,
        1 - (e.clientY - rect.top) / rect.height
      );
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // pause when offscreen / tab hidden
    let visible = true;
    const io = new IntersectionObserver(
      ([entry]) => (visible = entry.isIntersecting),
      { threshold: 0 }
    );
    io.observe(mount);

    let raf = 0;
    const clock = new THREE.Clock();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      uniforms.uTime.value = clock.getElapsedTime();
      uniforms.uMouse.value.lerp(target, 0.045);
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      quad.geometry.dispose();
      (quad.material as THREE.Material).dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden
      className={className}
      style={{ position: "absolute", inset: 0 }}
    />
  );
}
