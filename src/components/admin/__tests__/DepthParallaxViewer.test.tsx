/**
 * Unit tests for DepthParallaxViewer
 *
 * Tests WebGL fallback when context is null (Requirement 3.5)
 * Tests static image display when no depth map (Requirement 3.6)
 *
 * Strategy: Mock React hooks so the component function can execute
 * in node environment. We control useState to simulate webglSupported states.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

// --- State tracking for mocked useState ---
let webglSupportedValue = true;
const setWebglSupported = vi.fn();

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof React>("react");
  return {
    ...actual,
    useRef: vi.fn((init: unknown) => ({ current: init })),
    useEffect: vi.fn(),
    useCallback: vi.fn((fn: unknown) => fn),
    useState: vi.fn((init: unknown) => {
      // Component has one useState(true) for webglSupported
      if (init === true) {
        return [webglSupportedValue, setWebglSupported];
      }
      return [init, vi.fn()];
    }),
  };
});

// Import AFTER mock setup
import { DepthParallaxViewer } from "../DepthParallaxViewer";

function p(el: React.ReactElement): Record<string, unknown> {
  return (el as { props: Record<string, unknown> }).props ?? {};
}

function findAll(
  el: React.ReactElement | null | undefined,
  pred: (e: React.ReactElement) => boolean,
): React.ReactElement[] {
  if (!el || typeof el !== "object") return [];
  const out: React.ReactElement[] = [];
  if (pred(el)) out.push(el);
  const kids = p(el).children;
  if (kids) {
    for (const c of Array.isArray(kids) ? kids : [kids]) {
      if (c && typeof c === "object" && "type" in c) {
        out.push(...findAll(c as React.ReactElement, pred));
      }
    }
  }
  return out;
}

function render(props: {
  imageUrl: string;
  depthMapUrl: string | null;
  intensity: number;
  className?: string;
}) {
  return DepthParallaxViewer(props);
}

beforeEach(() => {
  webglSupportedValue = true;
  vi.clearAllMocks();
});

describe("DepthParallaxViewer", () => {
  /**
   * Requirement 3.6: When no depth map is loaded, display the original
   * image without any displacement effect.
   */
  describe("static image when no depth map (Req 3.6)", () => {
    it("renders <img> fallback when depthMapUrl is null", () => {
      const el = render({
        imageUrl: "/uploads/products/test.jpg",
        depthMapUrl: null,
        intensity: 50,
      });
      expect(el.type).not.toBe("canvas");
      expect(el.type).toBe("div");
      const imgs = findAll(el, (e) => e.type === "img");
      expect(imgs).toHaveLength(1);
      expect(p(imgs[0]).src).toBe("/uploads/products/test.jpg");
    });

    it("does not show WebGL warning when depthMapUrl is null", () => {
      const el = render({
        imageUrl: "/test.jpg",
        depthMapUrl: null,
        intensity: 50,
      });
      const paragraphs = findAll(el, (e) => e.type === "p");
      const warning = paragraphs.find((e) => {
        const text = p(e).children;
        return typeof text === "string" && text.includes("WebGL");
      });
      expect(warning).toBeUndefined();
    });

    it("passes className to wrapper div", () => {
      const el = render({
        imageUrl: "/test.jpg",
        depthMapUrl: null,
        intensity: 50,
        className: "custom-cls",
      });
      expect(p(el).className).toBe("custom-cls");
    });

    it("img has alt='Preview'", () => {
      const el = render({
        imageUrl: "/test.jpg",
        depthMapUrl: null,
        intensity: 50,
      });
      const imgs = findAll(el, (e) => e.type === "img");
      expect(p(imgs[0]).alt).toBe("Preview");
    });
  });

  /**
   * Requirement 3.5: If browser does not support WebGL, display the
   * original image and show an informational message.
   */
  describe("WebGL fallback (Req 3.5)", () => {
    it("shows static img + WebGL warning when webglSupported=false", () => {
      webglSupportedValue = false;
      const el = render({
        imageUrl: "/uploads/products/test.jpg",
        depthMapUrl: "/depth.png",
        intensity: 50,
      });
      // Should NOT be a canvas
      expect(el.type).toBe("div");
      // Should have an <img>
      const imgs = findAll(el, (e) => e.type === "img");
      expect(imgs).toHaveLength(1);
      expect(p(imgs[0]).src).toBe("/uploads/products/test.jpg");
      // Should have a <p> with WebGL message
      const paragraphs = findAll(el, (e) => e.type === "p");
      const warning = paragraphs.find((e) => {
        const text = p(e).children;
        return typeof text === "string" && text.includes("WebGL");
      });
      expect(warning).toBeDefined();
    });

    it("WebGL warning contains amber styling", () => {
      webglSupportedValue = false;
      const el = render({
        imageUrl: "/test.jpg",
        depthMapUrl: "/depth.png",
        intensity: 50,
      });
      const paragraphs = findAll(el, (e) => e.type === "p");
      const warning = paragraphs.find((e) => {
        const text = p(e).children;
        return typeof text === "string" && text.includes("WebGL");
      });
      expect(warning).toBeDefined();
      expect(p(warning!).className).toContain("amber");
    });

    it("renders canvas when webglSupported=true and depthMapUrl set", () => {
      webglSupportedValue = true;
      const el = render({
        imageUrl: "/test.jpg",
        depthMapUrl: "/depth.png",
        intensity: 50,
      });
      expect(el.type).toBe("canvas");
    });

    it("canvas has touch-action:none and pointer handlers", () => {
      webglSupportedValue = true;
      const el = render({
        imageUrl: "/test.jpg",
        depthMapUrl: "/depth.png",
        intensity: 50,
      });
      expect(p(el).style).toEqual({ touchAction: "none" });
      expect(typeof p(el).onPointerMove).toBe("function");
      expect(typeof p(el).onPointerLeave).toBe("function");
    });

    it("canvas passes className prop", () => {
      const el = render({
        imageUrl: "/test.jpg",
        depthMapUrl: "/depth.png",
        intensity: 50,
        className: "viewer",
      });
      expect(p(el).className).toBe("viewer");
    });
  });

  describe("render branch correctness", () => {
    it("different imageUrl values pass through to img src", () => {
      const urls = ["/kitchen.jpg", "/wardrobe.jpg", "/api/media/temp/abc"];
      for (const url of urls) {
        const el = render({ imageUrl: url, depthMapUrl: null, intensity: 50 });
        const imgs = findAll(el, (e) => e.type === "img");
        expect(p(imgs[0]).src).toBe(url);
      }
    });

    it("webglSupported=false takes priority over depthMapUrl check", () => {
      // Even with depthMapUrl=null, webglSupported=false renders the WebGL fallback
      // Actually: component checks webglSupported first, then depthMapUrl
      webglSupportedValue = false;
      const el = render({
        imageUrl: "/test.jpg",
        depthMapUrl: null,
        intensity: 50,
      });
      // webglSupported=false branch renders div+img+p(WebGL warning)
      expect(el.type).toBe("div");
      const paragraphs = findAll(el, (e) => e.type === "p");
      const warning = paragraphs.find((e) => {
        const text = p(e).children;
        return typeof text === "string" && text.includes("WebGL");
      });
      expect(warning).toBeDefined();
    });
  });
});
