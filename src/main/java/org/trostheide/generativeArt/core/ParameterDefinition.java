package org.trostheide.generativeArt.core;

public record ParameterDefinition(
        String name,
        ParameterType type,
        Object defaultValue,
        Object min,
        Object max,
        java.util.List<String> options,
        String description) {
    // Convenience constructors
    public static ParameterDefinition integer(String name, int defaultValue, int min, int max, String description) {
        return new ParameterDefinition(name, ParameterType.INTEGER, defaultValue, min, max, null, description);
    }

    public static ParameterDefinition doubleVal(String name, double defaultValue, double min, double max,
            String description) {
        return new ParameterDefinition(name, ParameterType.DOUBLE, defaultValue, min, max, null, description);
    }

    public static ParameterDefinition bool(String name, boolean defaultValue, String description) {
        return new ParameterDefinition(name, ParameterType.BOOLEAN, defaultValue, null, null, null, description);
    }

    public static ParameterDefinition string(String name, String defaultValue, String description) {
        return new ParameterDefinition(name, ParameterType.STRING, defaultValue, null, null, null, description);
    }

    public static ParameterDefinition selection(String name, String defaultValue, java.util.List<String> options,
            String description) {
        return new ParameterDefinition(name, ParameterType.STRING, defaultValue, null, null, options, description);
    }
}
