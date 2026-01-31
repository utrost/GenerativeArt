export class ParameterDefinition {
    constructor(name, type, defaultValue, min, max, description, options) {
        this.name = name; // Identifier
        this.type = type; // 'integer', 'double', 'boolean', 'color', 'selection'
        this.defaultValue = defaultValue;
        this.min = min;
        this.max = max;
        this.description = description;
        this.options = options || [];
    }

    static integer(name, defaultValue, min, max, description) {
        return new ParameterDefinition(name, 'integer', defaultValue, min, max, description);
    }

    static doubleVal(name, defaultValue, min, max, description) {
        return new ParameterDefinition(name, 'double', defaultValue, min, max, description);
    }

    static string(name, defaultValue, description) {
        return new ParameterDefinition(name, 'string', defaultValue, null, null, description);
    }

    static bool(name, defaultValue, description) {
        return new ParameterDefinition(name, 'boolean', defaultValue, null, null, description);
    }

    static selection(name, defaultValue, options, description) {
        return new ParameterDefinition(name, 'selection', defaultValue, null, null, description, options);
    }

    // Add others like boolean, color later if needed
}
