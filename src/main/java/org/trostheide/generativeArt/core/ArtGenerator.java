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
    /**
     * Called when a parameter value is changed in the UI.
     * Generators can override this to update other parameters dynamically 
     * (e.g., selecting a preset updates multiple specific settings).
     * 
     * @param paramName The name of the parameter that changed
     * @param newValue The new value of the parameter
     * @param currentValues The map of all current parameter values. 
     *                      The generator may modify this map directly to apply changes.
     * @return true if the UI needs to be refreshed (components updated from currentValues map).
     */
    default boolean onParameterChanged(String paramName, Object newValue, Map<String, Object> currentValues) {
        return false; // Default implementation does nothing
    }
}
