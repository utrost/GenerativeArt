package org.trostheide.generativeArt;

import java.io.FileWriter;
import java.io.IOException;
import java.util.Map;

public class LSystem {

    // --- Configuration ---
    private static final int ITERATIONS = 4;
    private static final String AXIOM = "F";
    private static final Map<Character, String> RULES = Map.of('F', "F+F-F-F+F");
    private static final double ANGLE_DEGREES = 90.0;
    private static final double INITIAL_X = 200;
    private static final double INITIAL_Y = 600;
    private static final double LINE_LENGTH = 10.0;
    private static final int SVG_WIDTH = 1000;
    private static final int SVG_HEIGHT = 1000;

    public static void main(String[] args) {
        String lSystemString = generateLSystemString();
        String svgPath = interpretLSystem(lSystemString);
        writeSvgFile(svgPath);
    }

    private static String generateLSystemString() {
        String current = AXIOM;
        for (int i = 0; i < ITERATIONS; i++) {
            StringBuilder next = new StringBuilder();
            for (char c : current.toCharArray()) {
                next.append(RULES.getOrDefault(c, String.valueOf(c)));
            }
            current = next.toString();
        }
        return current;
    }

    private static String interpretLSystem(String lSystemString) {
        StringBuilder pathBuilder = new StringBuilder();
        pathBuilder.append(String.format("M %.2f %.2f ", INITIAL_X, INITIAL_Y));

        double currentX = INITIAL_X;
        double currentY = INITIAL_Y;
        double currentAngle = 0;

        for (char command : lSystemString.toCharArray()) {
            switch (command) {
                case 'F':
                    double newX = currentX + LINE_LENGTH * Math.cos(Math.toRadians(currentAngle));
                    double newY = currentY + LINE_LENGTH * Math.sin(Math.toRadians(currentAngle));
                    pathBuilder.append(String.format("L %.2f %.2f ", newX, newY));
                    currentX = newX;
                    currentY = newY;
                    break;
                case '+':
                    currentAngle += ANGLE_DEGREES;
                    break;
                case '-':
                    currentAngle -= ANGLE_DEGREES;
                    break;
            }
        }
        return pathBuilder.toString();
    }

    private static void writeSvgFile(String pathData) {
        String svgContent = String.format(
            "<svg width=\"%d\" height=\"%d\" viewBox=\"0 0 %d %d\" xmlns=\"http://www.w3.org/2000/svg\">\n" +
            "    <path d=\"%s\" stroke=\"black\" fill=\"none\" stroke-width=\"1\"/>\n" +
            "</svg>",
            SVG_WIDTH, SVG_HEIGHT, SVG_WIDTH, SVG_HEIGHT, pathData
        );

        try (FileWriter writer = new FileWriter("lsystem.svg")) {
            writer.write(svgContent);
            System.out.println("Successfully generated lsystem.svg");
        } catch (IOException e) {
            System.err.println("Error writing SVG file: " + e.getMessage());
        }
    }
}
