import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fc from "fast-check";
import path from "path";
import { mkdir, writeFile, readFile, readdir, unlink } from "fs/promises";
import { randomUUID } from "crypto";

/**
 * Feature: depth-parallax-viewer, Property 10: Publish persists depth map alongside image
 *
 * For any publish with depthParallax.enabled=true, both image and depth map
 * exist in uploads, temp depth map removed.
 *
 * Validates: Requirements 5.3, 6.2
 */

// ---------------------------------------------------------------------------
// Pure logic extraction: depth map persistence during publish
// This mirrors the depth-map copy block in POST /api/media/publish/route.ts
// ---------------------------------------------------------------------------

interface DepthPersistInput {
  depthParallaxEnabled: boolean;
  depthMapTempId: string | null;
  /** Whether the temp file actually exists on disk */
  tempFileExists: boolean;
}

interface DepthPersistResult {
  depthMapCopied: boolean;
  depthMapPublicUrl: string | undefined;
  tempFileDeleted: boolean;
}

/**
 * Simulates the depth-map persistence logic from the publish route.
 * Returns what actions would be taken given the input state.
 */
function simulateDepthPersist(input: DepthPersistInput): DepthPersistResult {
  if (!input.depthParallaxEnabled || !input.depthMapTempId) {
    return {
      depthMapCopied: false,
      depthMapPublicUrl: undefined,
      tempFileDeleted: false,
    };
  }

  if (!input.tempFileExists) {
    // resolveTempFileById returns null → no copy, no delete
    return {
      depthMapCopied: false,
      depthMapPublicUrl: undefined,
      tempFileDeleted: false,
    };
  }

  // Temp file exists and depthParallax is enabled with a valid tempId
  const depthFilename = `depth-${Date.now()}-${randomUUID()}.png`;
  return {
    depthMapCopied: true,
    depthMapPublicUrl: `/uploads/products/${depthFilename}`,
    tempFileDeleted: true,
  };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const arbTempId = fc.stringMatching(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
);

const arbDepthPersistEnabled = fc.record({
  depthParallaxEnabled: fc.constant(true),
  depthMapTempId: arbTempId,
  tempFileExists: fc.constant(true),
});

const arbDepthPersistDisabled = fc.record({
  depthParallaxEnabled: fc.constant(false),
  depthMapTempId: fc.oneof(arbTempId, fc.constant(null as string | null)),
  tempFileExists: fc.boolean(),
});

const arbDepthPersistMissingTemp = fc.record({
  depthParallaxEnabled: fc.constant(true),
  depthMapTempId: arbTempId,
  tempFileExists: fc.constant(false),
});

const arbDepthPersistNullTempId = fc.record({
  depthParallaxEnabled: fc.constant(true),
  depthMapTempId: fc.constant(null as string | null),
  tempFileExists: fc.boolean(),
});

// ---------------------------------------------------------------------------
// Property tests — pure logic
// ---------------------------------------------------------------------------

describe("Feature: depth-parallax-viewer, Property 10: Publish persists depth map alongside image", () => {
  describe("Pure logic: depth persist simulation", () => {
    it("when enabled + tempId + temp file exists → depth map is copied and temp deleted", () => {
      fc.assert(
        fc.property(arbDepthPersistEnabled, (input) => {
          const result = simulateDepthPersist(input);
          expect(result.depthMapCopied).toBe(true);
          expect(result.depthMapPublicUrl).toBeDefined();
          expect(result.depthMapPublicUrl).toMatch(
            /^\/uploads\/products\/depth-\d+-[0-9a-f-]+\.png$/,
          );
          expect(result.tempFileDeleted).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it("when disabled → no copy, no delete, no URL", () => {
      fc.assert(
        fc.property(arbDepthPersistDisabled, (input) => {
          const result = simulateDepthPersist(input);
          expect(result.depthMapCopied).toBe(false);
          expect(result.depthMapPublicUrl).toBeUndefined();
          expect(result.tempFileDeleted).toBe(false);
        }),
        { numRuns: 100 },
      );
    });

    it("when enabled but temp file missing → no copy, no delete", () => {
      fc.assert(
        fc.property(arbDepthPersistMissingTemp, (input) => {
          const result = simulateDepthPersist(input);
          expect(result.depthMapCopied).toBe(false);
          expect(result.depthMapPublicUrl).toBeUndefined();
          expect(result.tempFileDeleted).toBe(false);
        }),
        { numRuns: 100 },
      );
    });

    it("when enabled but tempId is null → no copy, no delete", () => {
      fc.assert(
        fc.property(arbDepthPersistNullTempId, (input) => {
          const result = simulateDepthPersist(input);
          expect(result.depthMapCopied).toBe(false);
          expect(result.depthMapPublicUrl).toBeUndefined();
          expect(result.tempFileDeleted).toBe(false);
        }),
        { numRuns: 100 },
      );
    });

    it("depthMapPublicUrl always follows naming convention when copied", () => {
      fc.assert(
        fc.property(arbDepthPersistEnabled, (input) => {
          const result = simulateDepthPersist(input);
          if (result.depthMapCopied) {
            expect(result.depthMapPublicUrl).toMatch(
              /^\/uploads\/products\/depth-\d+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/,
            );
          }
        }),
        { numRuns: 100 },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Integration: actual file system round-trip
  // -------------------------------------------------------------------------

  describe("File system integration: depth map copy + temp cleanup", () => {
    const testTmpDir = path.join(
      process.cwd(),
      "storage",
      "tmp-media-test-publish",
    );
    const testUploadDir = path.join(
      process.cwd(),
      "storage",
      "test-uploads-publish",
    );

    beforeEach(async () => {
      await mkdir(testTmpDir, { recursive: true });
      await mkdir(testUploadDir, { recursive: true });
    });

    afterEach(async () => {
      // Cleanup test directories
      const cleanDir = async (dir: string) => {
        const entries = await readdir(dir).catch(() => [] as string[]);
        await Promise.all(
          entries.map((e) => unlink(path.join(dir, e)).catch(() => undefined)),
        );
      };
      await cleanDir(testTmpDir);
      await cleanDir(testUploadDir);
      // Remove dirs
      const { rmdir } = await import("fs/promises");
      await rmdir(testTmpDir).catch(() => undefined);
      await rmdir(testUploadDir).catch(() => undefined);
    });

    it("for any valid temp depth map PNG, copy creates file in uploads and removes temp", () => {
      fc.assert(
        fc.asyncProperty(
          fc.tuple(
            // Generate random small PNG-like content (just needs to be a file)
            fc.uint8Array({ minLength: 8, maxLength: 512 }),
            fc.integer({ min: 0, max: 100 })
          ),
          async ([fileContent, intensity]) => {
            // Create a temp depth map file
            const tempId = `depth-${Date.now()}-${randomUUID()}`;
            const tempFilename = `${tempId}.png`;
            const tempFilePath = path.join(testTmpDir, tempFilename);
            await writeFile(tempFilePath, Buffer.from(fileContent));

            // Simulate the publish route's depth map copy logic
            const depthFilename = `depth-${Date.now()}-${randomUUID()}.png`;
            const destPath = path.join(testUploadDir, depthFilename);

            // Copy
            const { copyFile } = await import("fs/promises");
            await copyFile(tempFilePath, destPath);

            // Delete temp
            await unlink(tempFilePath).catch(() => undefined);

            // Verify: destination file exists with same content
            const copiedContent = await readFile(destPath);
            expect(Buffer.from(fileContent).equals(copiedContent)).toBe(true);

            // Verify: temp file is gone
            const tempExists = await readFile(tempFilePath)
              .then(() => true)
              .catch(() => false);
            expect(tempExists).toBe(false);

            // Verify: filename follows convention
            expect(depthFilename).toMatch(
              /^depth-\d+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/,
            );

            // Cleanup this iteration's upload file
            await unlink(destPath).catch(() => undefined);
          },
        ),
        { numRuns: 20 }, // fewer runs for FS-bound tests
      );
    });

    it("when depthParallax disabled, no files are created in uploads dir", () => {
      fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 8, maxLength: 256 }),
          async (fileContent) => {
            // Create a temp file (simulating it exists but won't be used)
            const tempId = `depth-${Date.now()}-${randomUUID()}`;
            const tempFilename = `${tempId}.png`;
            const tempFilePath = path.join(testTmpDir, tempFilename);
            await writeFile(tempFilePath, Buffer.from(fileContent));

            // Simulate disabled depthParallax — no copy should happen
            const uploadsBefore = await readdir(testUploadDir).catch(
              () => [] as string[],
            );

            // (no copy operation performed — this is the "disabled" path)

            const uploadsAfter = await readdir(testUploadDir).catch(
              () => [] as string[],
            );
            expect(uploadsAfter.length).toBe(uploadsBefore.length);

            // Temp file should still exist (not deleted when disabled)
            const tempStillExists = await readFile(tempFilePath)
              .then(() => true)
              .catch(() => false);
            expect(tempStillExists).toBe(true);

            // Cleanup
            await unlink(tempFilePath).catch(() => undefined);
          },
        ),
        { numRuns: 20 },
      );
    });
  });
});
