package org.trostheide.generativeArt.core;

import java.util.List;
import java.util.Map;

public interface ArtGenerator {
    /**
     * Unique identifier for the generator.
     */
    String getId();

    /**
     * Human-readable name for the UI.
     */
    String getDisplayName();

    /**
     * List of parameters this generator accepts.
     */
    List<ParameterDefinition> getParameterDefinitions();

    /**
     * Generates the SVG content based on the provided parameters.
     * 
     * @param params Map of parameter names to values (caller must cast
     *               appropriately)
     * @return The raw SVG XML string (not the full file, just the content, or full
     *         file with headers?)
     *         Let's return the FULL SVG content including XML header and svg tag.
     */
    String generate(Map<String, Object> params);
}
