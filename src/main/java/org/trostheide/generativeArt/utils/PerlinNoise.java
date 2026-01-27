package org.trostheide.generativeArt.utils;

import java.util.Random;

/**
 * A standard implementation of Ken Perlin's "Perlin Noise".
 * Adapted for 2D usage.
 */
public class PerlinNoise {
    private final int[] p;
    private final double[] gx;
    private final double[] gy;

    public PerlinNoise(long seed) {
        Random r = new Random(seed);
        p = new int[512];
        gx = new double[512];
        gy = new double[512];

        for (int i = 0; i < 256; i++) {
            p[i] = i;
            double angle = r.nextDouble() * 2 * Math.PI;
            gx[i] = Math.cos(angle);
            gy[i] = Math.sin(angle);
        }

        for (int i = 0; i < 256; i++) {
            int j = r.nextInt(256);
            int temp = p[i];
            p[i] = p[j];
            p[j] = temp;
        }

        for (int i = 0; i < 256; i++) {
            p[i + 256] = p[i];
            gx[i + 256] = gx[i];
            gy[i + 256] = gy[i];
        }
    }

    public double noise(double x, double y) {
        int xi = (int) Math.floor(x) & 255;
        int yi = (int) Math.floor(y) & 255;

        double xf = x - Math.floor(x);
        double yf = y - Math.floor(y);

        double u = fade(xf);
        double v = fade(yf);

        int aa = p[p[xi] + yi];
        int ab = p[p[xi] + yi + 1];
        int ba = p[p[xi + 1] + yi];
        int bb = p[p[xi + 1] + yi + 1];

        double x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
        double x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);

        return (lerp(x1, x2, v) + 1) / 2; // Normalize to 0..1
    }

    private double fade(double t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    private double lerp(double a, double b, double t) {
        return a + t * (b - a);
    }

    private double grad(int hash, double x, double y) {
        // Dot product of gradient vector and distance vector
        return gx[hash] * x + gy[hash] * y;
    }
}
