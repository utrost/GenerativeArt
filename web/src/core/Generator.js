export class Generator {
    getId() {
        throw new Error("Method 'getId()' must be implemented.");
    }

    getDisplayName() {
        throw new Error("Method 'getDisplayName()' must be implemented.");
    }

    getParameterDefinitions() {
        return [];
    }

    /**
     * @param {Object} params - Key-value map of parameters
     * @returns {string} SVG content
     */
    generate(params) {
        throw new Error("Method 'generate()' must be implemented.");
    }

    /**
     * Called when a parameter value is changed in the UI.
     * Generators can override this to update other parameters dynamically.
     * 
     * @param {string} paramName The name of the parameter that changed
     * @param {*} newValue The new value of the parameter
     * @param {Object} currentValues The map of all current parameter values. Modify this to apply changes.
     * @returns {boolean} true if the UI needs to be refreshed.
     */
    onParameterChanged(paramName, newValue, currentValues) {
        return false;
    }
}
