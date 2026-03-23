package org.trostheide.generativeArt.utils;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PerlinNoiseTest {

    @Test
    void noiseReturnsValueBetweenZeroAndOne() {
        PerlinNoise noise = new PerlinNoise(42);
        for (double x = 0; x < 10; x += 0.5) {
            for (double y = 0; y < 10; y += 0.5) {
                double val = noise.noise(x, y);
                assertTrue(val >= 0.0 && val <= 1.0,
                        "Noise at (" + x + "," + y + ") = " + val + " out of [0,1]");
            }
        }
    }

    @Test
    void sameSeedProducesSameOutput() {
        PerlinNoise noise1 = new PerlinNoise(123);
        PerlinNoise noise2 = new PerlinNoise(123);

        for (double x = 0; x < 5; x += 1.0) {
            for (double y = 0; y < 5; y += 1.0) {
                assertEquals(noise1.noise(x, y), noise2.noise(x, y),
                        "Same seed should produce same noise at (" + x + "," + y + ")");
            }
        }
    }

    @Test
    void differentSeedsProduceDifferentOutput() {
        PerlinNoise noise1 = new PerlinNoise(1);
        PerlinNoise noise2 = new PerlinNoise(999);

        // At least some values should differ
        boolean anyDifferent = false;
        for (double x = 0; x < 5; x += 1.0) {
            for (double y = 0; y < 5; y += 1.0) {
                if (noise1.noise(x, y) != noise2.noise(x, y)) {
                    anyDifferent = true;
                    break;
                }
            }
        }
        assertTrue(anyDifferent, "Different seeds should produce different noise");
    }

    @Test
    void noiseIsContinuous() {
        PerlinNoise noise = new PerlinNoise(42);
        double prev = noise.noise(0, 0);
        for (double x = 0.01; x < 1.0; x += 0.01) {
            double curr = noise.noise(x, 0);
            double diff = Math.abs(curr - prev);
            assertTrue(diff < 0.5, "Noise should change smoothly, but jumped by " + diff);
            prev = curr;
        }
    }
}
