import { describe, it, expect } from "vitest";
import fc from "fast-check";

/**
 * Feature: depth-parallax-viewer, Property 7: Pointer position normalization
 *
 * For any pointer event at (clientX, clientY) over a canvas with bounding rect,
 * the normalized offset is in [-1, 1] range.
 *
 * Validates: Requirements 3.2, 3.3
 */

// Pure extraction of the normalization logic from DepthParallaxViewer's handlePointerMove
function normalizePointerPosition(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): { x: number; y: number } {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  return {
    x: Math.max(-1, Math.min(1, (clientX - cx) / (rect.width / 2))),
    y: Math.max(-1, Math.min(1, (clientY - cy) / (rect.height / 2))),
  };
}

// Arbitrary: realistic canvas bounding rect (positive width/height, reasonable screen coords)
const arbRect = fc.record({
  left: fc.double({ min: 0, max: 3000, noNaN: true }),
  top: fc.double({ min: 0, max: 3000, noNaN: true }),
  width: fc.double({ min: 1, max: 4000, noNaN: true }),
  height: fc.double({ min: 1, max: 4000, noNaN: true }),
});

// Arbitrary: pointer position anywhere on screen
const arbPointer = fc.record({
  clientX: fc.double({ min: -1000, max: 5000, noNaN: true }),
  clientY: fc.double({ min: -1000, max: 5000, noNaN: true }),
});

describe("Feature: depth-parallax-viewer, Property 7: Pointer position normalization", () => {
  it("normalized x is always in [-1, 1] for any pointer position and canvas rect", () => {
    fc.assert(
      fc.property(arbPointer, arbRect, (pointer, rect) => {
        const result = normalizePointerPosition(
          pointer.clientX,
          pointer.clientY,
          rect,
        );
        expect(result.x).toBeGreaterThanOrEqual(-1);
        expect(result.x).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 },
    );
  });

  it("normalized y is always in [-1, 1] for any pointer position and canvas rect", () => {
    fc.assert(
      fc.property(arbPointer, arbRect, (pointer, rect) => {
        const result = normalizePointerPosition(
          pointer.clientX,
          pointer.clientY,
          rect,
        );
        expect(result.y).toBeGreaterThanOrEqual(-1);
        expect(result.y).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 },
    );
  });

  it("pointer at canvas center produces (0, 0)", () => {
    fc.assert(
      fc.property(arbRect, (rect) => {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const result = normalizePointerPosition(centerX, centerY, rect);
        expect(result.x).toBeCloseTo(0, 10);
        expect(result.y).toBeCloseTo(0, 10);
      }),
      { numRuns: 100 },
    );
  });

  it("pointer at canvas edges produces values at or near ±1", () => {
    fc.assert(
      fc.property(arbRect, (rect) => {
        // Right edge
        const right = normalizePointerPosition(
          rect.left + rect.width,
          rect.top + rect.height / 2,
          rect,
        );
        expect(right.x).toBeCloseTo(1, 10);

        // Left edge
        const left = normalizePointerPosition(
          rect.left,
          rect.top + rect.height / 2,
          rect,
        );
        expect(left.x).toBeCloseTo(-1, 10);

        // Bottom edge
        const bottom = normalizePointerPosition(
          rect.left + rect.width / 2,
          rect.top + rect.height,
          rect,
        );
        expect(bottom.y).toBeCloseTo(1, 10);

        // Top edge
        const top = normalizePointerPosition(
          rect.left + rect.width / 2,
          rect.top,
          rect,
        );
        expect(top.y).toBeCloseTo(-1, 10);
      }),
      { numRuns: 100 },
    );
  });

  it("pointer outside canvas bounds is clamped to [-1, 1]", () => {
    fc.assert(
      fc.property(arbRect, (rect) => {
        // Far right (well outside)
        const farRight = normalizePointerPosition(
          rect.left + rect.width * 5,
          rect.top,
          rect,
        );
        expect(farRight.x).toBe(1);

        // Far left (well outside)
        const farLeft = normalizePointerPosition(
          rect.left - rect.width * 5,
          rect.top,
          rect,
        );
        expect(farLeft.x).toBe(-1);
      }),
      { numRuns: 100 },
    );
  });

  it("normalization is monotonic: moving right increases x, moving down increases y", () => {
    fc.assert(
      fc.property(
        arbRect,
        fc.double({ min: 0, max: 4000, noNaN: true }),
        fc.double({ min: 0, max: 4000, noNaN: true }),
        fc.double({ min: 0.01, max: 500, noNaN: true }),
        (rect, baseX, baseY, delta) => {
          const a = normalizePointerPosition(baseX, baseY, rect);
          const b = normalizePointerPosition(baseX + delta, baseY, rect);
          const c = normalizePointerPosition(baseX, baseY + delta, rect);
          // x should not decrease when moving right
          expect(b.x).toBeGreaterThanOrEqual(a.x);
          // y should not decrease when moving down
          expect(c.y).toBeGreaterThanOrEqual(a.y);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: depth-parallax-viewer, Property 8: Intensity value clamping
 *
 * For any numeric input, intensity is clamped to integer range [0, 100].
 * Values below 0 become 0, values above 100 become 100.
 * Fractional values are rounded to the nearest integer.
 *
 * Validates: Requirements 4.5
 */

// Pure extraction of the intensity clamping logic used by the system
// (HTML range input min/max + integer rounding before passing to shader/recipe)
function clampIntensity(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
}

describe("Feature: depth-parallax-viewer, Property 8: Intensity value clamping", () => {
  it("clamped intensity is always an integer in [0, 100] for any numeric input", () => {
    fc.assert(
      fc.property(
        fc.double({
          min: -1e6,
          max: 1e6,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (value) => {
          const result = clampIntensity(value);
          expect(Number.isInteger(result)).toBe(true);
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(100);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("values below 0 are clamped to 0", () => {
    fc.assert(
      fc.property(
        fc.double({
          min: -1e6,
          max: -0.5,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (value) => {
          const result = clampIntensity(value);
          expect(result).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("values above 100 are clamped to 100", () => {
    fc.assert(
      fc.property(
        fc.double({
          min: 100.5,
          max: 1e6,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (value) => {
          const result = clampIntensity(value);
          expect(result).toBe(100);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("values in [0, 100] are rounded to nearest integer and preserved", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (value) => {
        const result = clampIntensity(value);
        expect(result).toBe(value);
      }),
      { numRuns: 100 },
    );
  });

  it("fractional values in valid range are rounded to nearest integer", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
        (value) => {
          const result = clampIntensity(value);
          expect(result).toBe(Math.round(value));
        },
      ),
      { numRuns: 100 },
    );
  });

  it("clamping is idempotent: clamp(clamp(x)) === clamp(x)", () => {
    fc.assert(
      fc.property(
        fc.double({
          min: -1e6,
          max: 1e6,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (value) => {
          const once = clampIntensity(value);
          const twice = clampIntensity(once);
          expect(twice).toBe(once);
        },
      ),
      { numRuns: 100 },
    );
  });
});
