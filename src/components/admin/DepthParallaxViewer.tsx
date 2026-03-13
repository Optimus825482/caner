"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import Image from "next/image";

interface DepthParallaxViewerProps {
  imageUrl: string;
  depthMapUrl: string | null;
  intensity: number; // 0-100
  zoom?: number; // 0.5-3.0, default 1.0
  focusPoint?: { x: number; y: number }; // 0-100 percentage, default {x:50,y:50}
  fogEnabled?: boolean; // default false
  fogDensity?: number; // 0-100, default 0
  fogColor?: string; // hex, default "#1a1a2e"
  rotationEnabled?: boolean; // default false
  rotationX?: number; // -30 to 30, default 0
  rotationY?: number; // -30 to 30, default 0
  depthColorize?: boolean; // default false
  depthColorFrom?: string; // hex, default "#000033"
  depthColorTo?: string; // hex, default "#ffcc00"
  className?: string;
  watermarkOverlay?: React.ReactNode;
}

// ── Vertex Shader (GLSL 300 es) ──
const VERT = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;
uniform float u_zoom;
uniform vec2 u_focusPoint;
uniform float u_rotX;
uniform float u_rotY;
void main() {
  float rx = u_rotX * 0.0174533;
  float ry = u_rotY * 0.0174533;
  vec2 pos = a_position;
  pos.x *= 1.0 + pos.y * sin(ry) * 0.15;
  pos.y *= 1.0 + pos.x * sin(rx) * 0.15;
  gl_Position = vec4(pos, 0.0, 1.0);
  vec2 tc = a_texCoord;
  tc = (tc - u_focusPoint) / u_zoom + u_focusPoint;
  v_texCoord = tc;
}`;

// ── Fragment Shader (GLSL 300 es) ──
const FRAG = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 fragColor;
uniform sampler2D u_image;
uniform sampler2D u_depthMap;
uniform vec2 u_mouse;
uniform float u_intensity;
uniform float u_fogEnabled;
uniform float u_fogDensity;
uniform vec3 u_fogColor;
uniform float u_depthColorize;
uniform vec3 u_depthColorFrom;
uniform vec3 u_depthColorTo;
void main() {
  vec2 tc = v_texCoord;
  if (tc.x < 0.0 || tc.x > 1.0 || tc.y < 0.0 || tc.y > 1.0) {
    fragColor = vec4(0, 0, 0, 1);
    return;
  }
  float depth = texture(u_depthMap, tc).r;
  vec2 disp = u_mouse * depth * u_intensity * 0.03;
  vec4 color = texture(u_image, clamp(tc - disp, 0.0, 1.0));
  if (u_depthColorize > 0.5) {
    color.rgb = mix(color.rgb, mix(u_depthColorFrom, u_depthColorTo, depth), 0.3);
  }
  if (u_fogEnabled > 0.5) {
    color.rgb = mix(color.rgb, u_fogColor, (1.0 - depth) * u_fogDensity);
  }
  fragColor = color;
}`;

// ── WebGL Helpers ──

function mkShader(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function mkProgram(
  gl: WebGL2RenderingContext,
  vs: WebGLShader,
  fs: WebGLShader,
) {
  const p = gl.createProgram();
  if (!p) return null;
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(p));
    gl.deleteProgram(p);
    return null;
  }
  return p;
}

function loadTex(
  gl: WebGL2RenderingContext,
  url: string,
): Promise<{ tex: WebGLTexture; w: number; h: number }> {
  return new Promise((res, rej) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const t = gl.createTexture();
      if (!t) {
        rej(new Error("texture alloc failed"));
        return;
      }
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      res({ tex: t, w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => rej(new Error("img load failed: " + url));
    img.src = url;
  });
}

function hex2rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

// ── Component ──

export function DepthParallaxViewer({
  imageUrl,
  depthMapUrl,
  intensity,
  zoom = 1.0,
  focusPoint = { x: 50, y: 50 },
  fogEnabled = false,
  fogDensity = 0,
  fogColor = "#1a1a2e",
  rotationEnabled = false,
  rotationX = 0,
  rotationY = 0,
  depthColorize = false,
  depthColorFrom = "#000033",
  depthColorTo = "#ffcc00",
  className,
  watermarkOverlay,
}: DepthParallaxViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const progRef = useRef<WebGLProgram | null>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const texRef = useRef<{ img: WebGLTexture | null; dep: WebGLTexture | null }>(
    {
      img: null,
      dep: null,
    },
  );
  const uniRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const [webglOk, setWebglOk] = useState(true);

  // Keep props in a ref so the render loop always reads latest values
  const pRef = useRef({
    intensity,
    zoom,
    focusPoint,
    fogEnabled,
    fogDensity,
    fogColor,
    rotationEnabled,
    rotationX,
    rotationY,
    depthColorize,
    depthColorFrom,
    depthColorTo,
  });

  // Update ref with latest props in an effect
  useEffect(() => {
    pRef.current = {
      intensity,
      zoom,
      focusPoint,
      fogEnabled,
      fogDensity,
      fogColor,
      rotationEnabled,
      rotationX,
      rotationY,
      depthColorize,
      depthColorFrom,
      depthColorTo,
    };
  }, [
    intensity,
    zoom,
    focusPoint,
    fogEnabled,
    fogDensity,
    fogColor,
    rotationEnabled,
    rotationX,
    rotationY,
    depthColorize,
    depthColorFrom,
    depthColorTo,
  ]);

  // ── Init WebGL context and shaders ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2");
    if (!gl) {
      Promise.resolve().then(() => setWebglOk(false));
      return;
    }
    glRef.current = gl;

    const vs = mkShader(gl, gl.VERTEX_SHADER, VERT);
    const fs = mkShader(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = mkProgram(gl, vs, fs);
    if (!prog) return;
    progRef.current = prog;
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    // Cache uniform locations
    const names = [
      "u_image",
      "u_depthMap",
      "u_mouse",
      "u_intensity",
      "u_zoom",
      "u_focusPoint",
      "u_rotX",
      "u_rotY",
      "u_fogEnabled",
      "u_fogDensity",
      "u_fogColor",
      "u_depthColorize",
      "u_depthColorFrom",
      "u_depthColorTo",
    ];
    for (const n of names) uniRef.current[n] = gl.getUniformLocation(prog, n);

    // Fullscreen quad: [posX, posY, texU, texV] × 4 vertices
    const verts = new Float32Array([
      -1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 0,
    ]);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    const aP = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(aP);
    gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 16, 0);

    const aT = gl.getAttribLocation(prog, "a_texCoord");
    gl.enableVertexAttribArray(aT);
    gl.vertexAttribPointer(aT, 2, gl.FLOAT, false, 16, 8);

    // Store references to the values we'll need in cleanup
    const currentTexRef = texRef.current;
    const currentProgRef = progRef.current;
    
    return () => {
      if (currentTexRef.img) gl.deleteTexture(currentTexRef.img);
      if (currentTexRef.dep) gl.deleteTexture(currentTexRef.dep);
      if (currentProgRef) gl.deleteProgram(currentProgRef);
      if (vbo) gl.deleteBuffer(vbo);
      if (vao) gl.deleteVertexArray(vao);
      glRef.current = null;
      progRef.current = null;
    };
  }, []);

  // ── Load textures when URLs change ──
  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;
    let dead = false;

    (async () => {
      // Load main image texture
      try {
        if (texRef.current.img) {
          gl.deleteTexture(texRef.current.img);
          texRef.current.img = null;
        }
        const r = await loadTex(gl, imageUrl);
        if (dead) {
          gl.deleteTexture(r.tex);
          return;
        }
        texRef.current.img = r.tex;
        const c = canvasRef.current;
        if (c) {
          c.width = r.w;
          c.height = r.h;
          gl.viewport(0, 0, r.w, r.h);
        }
      } catch (e) {
        console.error("img tex:", e);
      }

      // Load depth map texture (or create black 1×1 fallback)
      if (depthMapUrl) {
        try {
          if (texRef.current.dep) {
            gl.deleteTexture(texRef.current.dep);
            texRef.current.dep = null;
          }
          const r = await loadTex(gl, depthMapUrl);
          if (dead) {
            gl.deleteTexture(r.tex);
            return;
          }
          texRef.current.dep = r.tex;
        } catch (e) {
          console.error("depth tex:", e);
        }
      } else {
        if (texRef.current.dep) {
          gl.deleteTexture(texRef.current.dep);
          texRef.current.dep = null;
        }
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          1,
          1,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          new Uint8Array([0, 0, 0, 255]),
        );
        texRef.current.dep = t;
      }
    })();

    return () => {
      dead = true;
    };
  }, [imageUrl, depthMapUrl]);

  // ── Render loop ──
  useEffect(() => {
    const gl = glRef.current;
    const prog = progRef.current;
    if (!gl || !prog) return;
    let on = true;

    function draw() {
      if (!on || !gl || !prog) return;
      const { img, dep } = texRef.current;
      if (!img) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      gl.useProgram(prog);
      const u = uniRef.current;
      const p = pRef.current;
      const m = mouseRef.current;

      // Set uniforms
      gl.uniform2f(u.u_mouse, m.x, m.y);
      gl.uniform1f(u.u_intensity, Math.max(0, Math.min(100, p.intensity)));
      gl.uniform1f(u.u_zoom, Math.max(0.5, Math.min(3.0, p.zoom)));
      gl.uniform2f(u.u_focusPoint, p.focusPoint.x / 100, p.focusPoint.y / 100);
      gl.uniform1f(u.u_rotX, p.rotationEnabled ? p.rotationX : 0);
      gl.uniform1f(u.u_rotY, p.rotationEnabled ? p.rotationY : 0);
      gl.uniform1f(u.u_fogEnabled, p.fogEnabled ? 1 : 0);
      gl.uniform1f(u.u_fogDensity, p.fogDensity / 100);
      const fc = hex2rgb(p.fogColor);
      gl.uniform3f(u.u_fogColor, fc[0], fc[1], fc[2]);
      gl.uniform1f(u.u_depthColorize, p.depthColorize ? 1 : 0);
      const cf = hex2rgb(p.depthColorFrom);
      gl.uniform3f(u.u_depthColorFrom, cf[0], cf[1], cf[2]);
      const ct = hex2rgb(p.depthColorTo);
      gl.uniform3f(u.u_depthColorTo, ct[0], ct[1], ct[2]);

      // Bind textures and draw
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, img);
      gl.uniform1i(u.u_image, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, dep);
      gl.uniform1i(u.u_depthMap, 1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      on = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ── Pointer handlers ──
  const onMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = {
      x: Math.max(
        -1,
        Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1),
      ),
      y: Math.max(
        -1,
        Math.min(1, -(((e.clientY - rect.top) / rect.height) * 2 - 1)),
      ),
    };
  }, []);

  const onLeave = useCallback(() => {
    mouseRef.current = { x: 0, y: 0 };
  }, []);

  // ── Fallback for no WebGL ──
  if (!webglOk) {
    return (
      <div className={className}>
        <Image
          src={imageUrl}
          alt="Preview"
          className="w-full h-full object-cover"
          width={0}
          height={0}
          sizes="100vw"
          style={{ width: '100%', height: 'auto' }}
        />
        <p className="text-xs text-center text-(--arvesta-text-muted) mt-1">
          WebGL desteklenmiyor
        </p>
      </div>
    );
  }

  // ── Render ──
  return (
    <div className={`relative ${className || ""}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ touchAction: "none" }}
      />
      {watermarkOverlay}
    </div>
  );
}
