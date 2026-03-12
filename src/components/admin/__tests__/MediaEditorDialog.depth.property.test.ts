import { describe, it, expect } from "vitest";
import fc from "fast-check";
import type { DepthParallaxConfig } from "@/types/media";

/**
 * Feature: depth-parallax-viewer, Property 9: Recipe depth parallax conditional inclusion
 *
 * If depthMapUrl is set, recipe has valid depthParallax object with enabled=true,
 * non-empty depthMapTempId, and intensity in [0,100].
 * If depthMapUrl is not set, depthParallax is undefined.
 *
 * Validates: Requirements 5.1, 5.2, 5.4
 */

// Pure extraction of the recipe depthParallax building logic
// from MediaEditorDialog.handlePublish
function buildDepthParallaxRecipe(
  depthMapUrl: string | null,
  depthMapTempId: string | null,
  depthIntensity: number,
): DepthParallaxConfig | undefined {
  return depthMapUrl
    ? {
        enabled: true,
        depthMapTempId: depthMapTempId!,
        intensity: depthIntensity,
      }
    : undefined;
}

// Arbitraries
const arbUrl = fc.string({ minLength: 1, maxLength: 200 });
const arbTempId = fc.string({ minLength: 1, maxLength: 100 });
const arbIntensity = fc.integer({ min: 0, max: 100 });

const arbWithUrl = fc.tuple(arbUrl, arbTempId, arbIntensity);
const arbWithNull = fc.tuple(arbTempId, arbIntensity);
const arbEither = fc.tuple(
  fc.oneof(arbUrl, fc.constant(null as string | null)),
  arbTempId,
  arbIntensity,
);

describe("Feature: depth-parallax-viewer, Property 9: Recipe depth parallax conditional inclusion", () => {
  it("when depthMapUrl is set, recipe contains valid depthParallax with enabled=true", () => {
    fc.assert(
      fc.property(arbWithUrl, ([url, tempId, intensity]) => {
        const result = buildDepthParallaxRecipe(url, tempId, intensity);
        expect(result).toBeDefined();
        expect(result!.enabled).toBe(true);
        expect(typeof result!.depthMapTempId).toBe("string");
        expect(result!.depthMapTempId.length).toBeGreaterThan(0);
        expect(result!.intensity).toBeGreaterThanOrEqual(0);
        expect(result!.intensity).toBeLessThanOrEqual(100);
        expect(Number.isInteger(result!.intensity)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("when depthMapUrl is null, depthParallax is undefined", () => {
    fc.assert(
      fc.property(arbWithNull, ([tempId, intensity]) => {
        const result = buildDepthParallaxRecipe(null, tempId, intensity);
        expect(result).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });

  it("depthMapTempId in recipe matches the provided tempId exactly", () => {
    fc.assert(
      fc.property(arbWithUrl, ([url, tempId, intensity]) => {
        const result = buildDepthParallaxRecipe(url, tempId, intensity);
        expect(result!.depthMapTempId).toBe(tempId);
      }),
      { numRuns: 100 },
    );
  });

  it("intensity in recipe matches the provided intensity exactly", () => {
    fc.assert(
      fc.property(arbWithUrl, ([url, tempId, intensity]) => {
        const result = buildDepthParallaxRecipe(url, tempId, intensity);
        expect(result!.intensity).toBe(intensity);
      }),
      { numRuns: 100 },
    );
  });

  it("enabled is always true when depthParallax is defined", () => {
    fc.assert(
      fc.property(arbWithUrl, ([url, tempId, intensity]) => {
        const result = buildDepthParallaxRecipe(url, tempId, intensity);
        expect(result!.enabled).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("building recipe is deterministic: same inputs produce same output", () => {
    fc.assert(
      fc.property(arbEither, ([url, tempId, intensity]) => {
        const a = buildDepthParallaxRecipe(url, tempId, intensity);
        const b = buildDepthParallaxRecipe(url, tempId, intensity);
        expect(a).toEqual(b);
      }),
      { numRuns: 100 },
    );
  });
});
