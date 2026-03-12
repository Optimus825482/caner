"use client";

import { useRef, useEffect, useCallback, useState } from "react";

interface DepthParallaxViewerProps {
  imageUrl: string;
  depthMapUrl: string | null;
  intensity: number; // 0-100
  className?: string;
}

const VERTEX_SHADER_SRC = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

const FRAGMENT_SHADER_SRC = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_image;
uniform sampler2D u_depthMap;
uniform vec2 u_mouse;
uniform float u_intensity;

void main() {
  float depth = texture(u_depthMap, v_texCoord).r;
  float maxDisplacement = u_intensity * 0.03;
  vec2 displacement = u_mouse * depth * maxDisplacement;
  vec2 displacedCoord = v_texCoord - displacement;
  displacedCoord = clamp(displacedCoord, 0.0, 1.0);
  fragColor = texture(u_image, displacedCoord);
}
`;

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function loadTexture(
  gl: WebGL2RenderingContext,
  url: string,
): Promise<{ texture: WebGLTexture; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const texture = gl.createTexture();
      if (!texture) {
        reject(new Error("Failed to create texture"));
        return;
      }
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      resolve({ texture, width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

export function DepthParallaxViewer({
  imageUrl,
  depthMapUrl,
  intensity,
  className,
}: DepthParallaxViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const texturesRef = useRef<{
    image: WebGLTexture | null;
    depth: WebGLTexture | null;
  }>({ image: null, depth: null });
  const uniformsRef = useRef<{
    u_image: WebGLUniformLocation | null;
    u_depthMap: WebGLUniformLocation | null;
    u_mouse: WebGLUniformLocation | null;
    u_intensity: WebGLUniformLocation | null;
  }>({ u_image: null, u_depthMap: null, u_mouse: null, u_intensity: null });
  const [webglSupported, setWebglSupported] = useState(true);

  // 1. Initialize WebGL context + compile shaders (once)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2");
    if (!gl) {
      setWebglSupported(false);
      return;
    }
    glRef.current = gl;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vs || !fs) return;

    const program = createProgram(gl, vs, fs);
    if (!program) return;
    programRef.current = program;

    // Clean up individual shaders after linking
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    // Get uniform locations
    uniformsRef.current = {
      u_image: gl.getUniformLocation(program, "u_image"),
      u_depthMap: gl.getUniformLocation(program, "u_depthMap"),
      u_mouse: gl.getUniformLocation(program, "u_mouse"),
      u_intensity: gl.getUniformLocation(program, "u_intensity"),
    };

    // Create fullscreen quad
    // positions: 2 triangles covering [-1, 1]
    // texCoords: [0, 1] with Y flipped for WebGL
    const vertices = new Float32Array([
      // pos (x,y)    texCoord (s,t)
      -1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 0,
    ]);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 16, 0);

    const aTexCoord = gl.getAttribLocation(program, "a_texCoord");
    gl.enableVertexAttribArray(aTexCoord);
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 16, 8);

    return () => {
      // Cleanup on unmount
      if (texturesRef.current.image)
        gl.deleteTexture(texturesRef.current.image);
      if (texturesRef.current.depth)
        gl.deleteTexture(texturesRef.current.depth);
      if (programRef.current) gl.deleteProgram(programRef.current);
      if (vbo) gl.deleteBuffer(vbo);
      if (vao) gl.deleteVertexArray(vao);
      glRef.current = null;
      programRef.current = null;
    };
  }, []);

  // 2. Load textures when URLs change
  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;

    let cancelled = false;

    async function load() {
      // Load main image texture
      try {
        if (texturesRef.current.image) {
          gl!.deleteTexture(texturesRef.current.image);
          texturesRef.current.image = null;
        }
        const result = await loadTexture(gl!, imageUrl);
        if (cancelled) {
          gl!.deleteTexture(result.texture);
          return;
        }
        texturesRef.current.image = result.texture;

        // Resize canvas to match image aspect ratio
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = result.width;
          canvas.height = result.height;
          gl!.viewport(0, 0, result.width, result.height);
        }
      } catch (err) {
        console.error("Failed to load image texture:", err);
      }

      // Load depth map texture
      if (depthMapUrl) {
        try {
          if (texturesRef.current.depth) {
            gl!.deleteTexture(texturesRef.current.depth);
            texturesRef.current.depth = null;
          }
          const result = await loadTexture(gl!, depthMapUrl);
          if (cancelled) {
            gl!.deleteTexture(result.texture);
            return;
          }
          texturesRef.current.depth = result.texture;
        } catch (err) {
          console.error("Failed to load depth map texture:", err);
        }
      } else {
        if (texturesRef.current.depth) {
          gl!.deleteTexture(texturesRef.current.depth);
          texturesRef.current.depth = null;
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [imageUrl, depthMapUrl]);

  // 3. Pointer handlers
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    mouseRef.current = {
      x: Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width / 2))),
      y: Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height / 2))),
    };
  }, []);

  const handlePointerLeave = useCallback(() => {
    mouseRef.current = { x: 0, y: 0 };
  }, []);

  // 4. Render loop
  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    function render() {
      const gl = glRef.current;
      const program = programRef.current;
      if (!gl || !program) return;

      const { image, depth } = texturesRef.current;
      if (!image || !depth) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      gl.useProgram(program);

      // Set uniforms
      const u = uniformsRef.current;
      gl.uniform2f(u.u_mouse, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(u.u_intensity, intensity / 100);

      // Bind image texture to unit 0
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, image);
      gl.uniform1i(u.u_image, 0);

      // Bind depth map texture to unit 1
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, depth);
      gl.uniform1i(u.u_depthMap, 1);

      // Draw fullscreen quad (triangle strip, 4 vertices)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      rafRef.current = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [intensity]);

  // Fallback: no WebGL
  if (!webglSupported) {
    return (
      <div className={className}>
        <img
          src={imageUrl}
          alt="Preview"
          className="w-full h-full object-contain"
        />
        <p className="text-xs text-amber-400 mt-1">
          WebGL 2.0 gerekli — parallax efekti kullanılamıyor
        </p>
      </div>
    );
  }

  // Fallback: no depth map
  if (!depthMapUrl) {
    return (
      <div className={className}>
        <img
          src={imageUrl}
          alt="Preview"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ touchAction: "none" }}
    />
  );
}
