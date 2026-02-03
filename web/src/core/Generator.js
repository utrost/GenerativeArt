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
}
