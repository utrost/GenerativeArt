package org.trostheide.generativeArt.core;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class GeneratorRegistry {
    private static final List<ArtGenerator> generators = new ArrayList<>();

    public static void register(ArtGenerator generator) {
        generators.add(generator);
        System.out.println("Registered generator: " + generator.getDisplayName());
    }

    public static List<ArtGenerator> getAll() {
        return new ArrayList<>(generators);
    }

    public static Optional<ArtGenerator> getById(String id) {
        return generators.stream()
                .filter(g -> g.getId().equals(id))
                .findFirst();
    }
}
