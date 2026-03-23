package org.trostheide.generativeArt.core;

import org.junit.jupiter.api.Test;
import org.trostheide.generativeArt.*;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class GeneratorRegistryTest {

    @Test
    void registeredGeneratorCanBeRetrievedById() {
        // Registry is static, so we test with generators that SwingApp would register.
        // Let's manually register one for the test.
        GeneratorRegistry.register(new SpirographGenerator());
        Optional<ArtGenerator> found = GeneratorRegistry.getById("spirograph");
        assertTrue(found.isPresent());
        assertEquals("Spirograph", found.get().getDisplayName());
    }

    @Test
    void getAllReturnsNonEmptyList() {
        // At this point the registry should have at least the one we registered above
        List<ArtGenerator> all = GeneratorRegistry.getAll();
        assertNotNull(all);
        assertFalse(all.isEmpty());
    }

    @Test
    void getByIdReturnsEmptyForUnknown() {
        Optional<ArtGenerator> found = GeneratorRegistry.getById("nonexistent_generator_xyz");
        assertTrue(found.isEmpty());
    }

    @Test
    void getAllReturnsDefensiveCopy() {
        List<ArtGenerator> list1 = GeneratorRegistry.getAll();
        List<ArtGenerator> list2 = GeneratorRegistry.getAll();
        assertNotSame(list1, list2);
    }
}
