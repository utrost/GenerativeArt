package org.trostheide.generativeArt;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;
import org.trostheide.generativeArt.core.ParameterType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AllGeneratorsTest {

    private List<ArtGenerator> generators;

    @BeforeAll
    void setUp() {
        generators = List.of(
                new GenerativeRibbon(),
                new FlowFieldGenerator(),
                new LSystemGenerator(),
                new ReactionDiffusionGenerator(),
                new HarmonographGenerator(),
                new PhyllotaxisGenerator(),
                new StrangeAttractorsGenerator(),
                new CirclePackingGenerator(),
                new TruchetTilesGenerator(),
                new TwistedMoireGenerator(),
                new VoronoiRipplesGenerator(),
                new PipeNetworkGenerator(),
                new ParametricGridGenerator(),
                new MagneticFieldGenerator(),
                new FourierSeriesGenerator(),
                new MazeGenerator(),
                new SpirographGenerator(),
                new PenroseTilingGenerator(),
                new WaveInterferenceGenerator(),
                new ChladniPatternGenerator(),
                new CelticKnotGenerator(),
                new ContourMapGenerator()
        );
    }

    Stream<ArtGenerator> allGenerators() {
        return generators.stream();
    }

    // ---- Test 1: Instantiation and valid display name ----

    @ParameterizedTest(name = "{0}")
    @MethodSource("allGenerators")
    void generatorHasValidId(ArtGenerator generator) {
        String id = generator.getId();
        assertNotNull(id, "getId() must not return null");
        assertFalse(id.isBlank(), "getId() must not be blank");
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("allGenerators")
    void generatorHasValidDisplayName(ArtGenerator generator) {
        String name = generator.getDisplayName();
        assertNotNull(name, "getDisplayName() must not return null");
        assertFalse(name.isBlank(), "getDisplayName() must not be blank");
        assertTrue(name.length() >= 3, "Display name should be at least 3 characters: " + name);
    }

    // ---- Test 2: Parameter definitions are non-null and valid ----

    @ParameterizedTest(name = "{0}")
    @MethodSource("allGenerators")
    void parameterDefinitionsAreNonNull(ArtGenerator generator) {
        List<ParameterDefinition> params = generator.getParameterDefinitions();
        assertNotNull(params, "getParameterDefinitions() must not return null for " + generator.getDisplayName());
        assertFalse(params.isEmpty(),
                "getParameterDefinitions() should have at least one parameter for " + generator.getDisplayName());
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("allGenerators")
    void parameterDefinitionsHaveValidNames(ArtGenerator generator) {
        for (ParameterDefinition param : generator.getParameterDefinitions()) {
            assertNotNull(param.name(), "Parameter name must not be null in " + generator.getDisplayName());
            assertFalse(param.name().isBlank(),
                    "Parameter name must not be blank in " + generator.getDisplayName());
            assertNotNull(param.type(), "Parameter type must not be null for '" + param.name()
                    + "' in " + generator.getDisplayName());
        }
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("allGenerators")
    void numericParametersHaveMinLessThanMax(ArtGenerator generator) {
        for (ParameterDefinition param : generator.getParameterDefinitions()) {
            if (param.type() == ParameterType.INTEGER && param.min() != null && param.max() != null) {
                int min = ((Number) param.min()).intValue();
                int max = ((Number) param.max()).intValue();
                assertTrue(min <= max,
                        "Integer param '" + param.name() + "' in " + generator.getDisplayName()
                                + ": min (" + min + ") must be <= max (" + max + ")");
            }
            if (param.type() == ParameterType.DOUBLE && param.min() != null && param.max() != null) {
                double min = ((Number) param.min()).doubleValue();
                double max = ((Number) param.max()).doubleValue();
                assertTrue(min <= max,
                        "Double param '" + param.name() + "' in " + generator.getDisplayName()
                                + ": min (" + min + ") must be <= max (" + max + ")");
            }
        }
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("allGenerators")
    void numericParameterDefaultsAreInRange(ArtGenerator generator) {
        for (ParameterDefinition param : generator.getParameterDefinitions()) {
            if (param.type() == ParameterType.INTEGER && param.min() != null && param.max() != null
                    && param.defaultValue() != null) {
                int def = ((Number) param.defaultValue()).intValue();
                int min = ((Number) param.min()).intValue();
                int max = ((Number) param.max()).intValue();
                assertTrue(def >= min && def <= max,
                        "Integer param '" + param.name() + "' in " + generator.getDisplayName()
                                + ": default (" + def + ") must be in [" + min + ", " + max + "]");
            }
            if (param.type() == ParameterType.DOUBLE && param.min() != null && param.max() != null
                    && param.defaultValue() != null) {
                double def = ((Number) param.defaultValue()).doubleValue();
                double min = ((Number) param.min()).doubleValue();
                double max = ((Number) param.max()).doubleValue();
                assertTrue(def >= min && def <= max,
                        "Double param '" + param.name() + "' in " + generator.getDisplayName()
                                + ": default (" + def + ") must be in [" + min + ", " + max + "]");
            }
        }
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("allGenerators")
    void selectionParametersHaveValidDefaults(ArtGenerator generator) {
        for (ParameterDefinition param : generator.getParameterDefinitions()) {
            if (param.options() != null && !param.options().isEmpty()) {
                assertNotNull(param.defaultValue(),
                        "Selection param '" + param.name() + "' in " + generator.getDisplayName()
                                + " must have a default value");
                assertTrue(param.options().contains(param.defaultValue().toString()),
                        "Selection param '" + param.name() + "' in " + generator.getDisplayName()
                                + ": default '" + param.defaultValue() + "' must be in options " + param.options());
            }
        }
    }

    // ---- Test 3: generate() produces valid SVG output ----

    @ParameterizedTest(name = "{0}")
    @MethodSource("allGenerators")
    void generateProducesValidSvg(ArtGenerator generator) {
        Map<String, Object> params = buildDefaultParams(generator);
        String svg = generator.generate(params);

        assertNotNull(svg, "generate() must not return null for " + generator.getDisplayName());
        assertFalse(svg.isBlank(), "generate() must not return blank SVG for " + generator.getDisplayName());
        assertTrue(svg.contains("<svg"),
                "SVG output must contain '<svg' tag for " + generator.getDisplayName());
        assertTrue(svg.contains("</svg>"),
                "SVG output must contain closing '</svg>' tag for " + generator.getDisplayName());
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("allGenerators")
    void generateProducesSvgWithDimensions(ArtGenerator generator) {
        Map<String, Object> params = buildDefaultParams(generator);
        String svg = generator.generate(params);

        // SVG should declare width and height attributes
        assertTrue(svg.contains("width="),
                "SVG should contain width attribute for " + generator.getDisplayName());
        assertTrue(svg.contains("height="),
                "SVG should contain height attribute for " + generator.getDisplayName());
    }

    // ---- Helper ----

    private Map<String, Object> buildDefaultParams(ArtGenerator generator) {
        Map<String, Object> params = new HashMap<>();
        // Provide standard dimensions
        params.put("width", 200);
        params.put("height", 200);
        params.put("paperSize", "A4 Portrait");

        for (ParameterDefinition pd : generator.getParameterDefinitions()) {
            if (pd.defaultValue() != null) {
                params.put(pd.name(), pd.defaultValue());
            }
        }
        return params;
    }
}
