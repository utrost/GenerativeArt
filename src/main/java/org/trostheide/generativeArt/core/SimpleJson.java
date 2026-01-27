package org.trostheide.generativeArt.core;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

/**
 * A very basic JSON string builder and parser to avoid external dependencies.
 */
public class SimpleJson {

    public static String toJson(Object obj) {
        if (obj == null)
            return "null";
        if (obj instanceof String)
            return "\"" + obj + "\"";
        if (obj instanceof Number || obj instanceof Boolean)
            return obj.toString();

        if (obj instanceof List<?>) {
            List<?> list = (List<?>) obj;
            return "[" + list.stream().map(SimpleJson::toJson).collect(Collectors.joining(",")) + "]";
        }

        if (obj instanceof Map<?, ?>) {
            Map<?, ?> map = (Map<?, ?>) obj;
            return "{" + map.entrySet().stream()
                    .map(e -> "\"" + e.getKey() + "\":" + toJson(e.getValue()))
                    .collect(Collectors.joining(",")) + "}";
        }

        // Handle ParameterDefinition specifically if passed as object
        if (obj instanceof ParameterDefinition) {
            ParameterDefinition pd = (ParameterDefinition) obj;
            return "{" +
                    "\"name\":\"" + pd.name() + "\"," +
                    "\"type\":\"" + pd.type() + "\"," +
                    "\"defaultValue\":" + toJson(pd.defaultValue()) + "," +
                    "\"min\":" + toJson(pd.min()) + "," +
                    "\"max\":" + toJson(pd.max()) + "," +
                    "\"description\":\"" + pd.description() + "\"" +
                    "}";
        }

        // Handle ArtGenerator metadata
        if (obj instanceof ArtGenerator) {
            ArtGenerator g = (ArtGenerator) obj;
            return "{" +
                    "\"id\":\"" + g.getId() + "\"," +
                    "\"displayName\":\"" + g.getDisplayName() + "\"," +
                    "\"parameters\":" + toJson(g.getParameterDefinitions()) +
                    "}";
        }

        return "\"" + obj.toString() + "\"";
    }

    /**
     * Extremely naive JSON parser for flat string/number/boolean maps.
     * Expects: {"key": value, "key2": "value"}
     */
    public static Map<String, Object> parseFlatMap(String json) {
        Map<String, Object> result = new HashMap<>();
        json = json.trim();
        if (json.startsWith("{"))
            json = json.substring(1);
        if (json.endsWith("}"))
            json = json.substring(0, json.length() - 1);

        // This regex is fragile but works for simple non-nested JSON without commas in
        // strings
        String[] pairs = json.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");

        for (String pair : pairs) {
            String[] parts = pair.split(":", 2);
            if (parts.length < 2)
                continue;

            String key = parts[0].trim().replaceAll("^\"|\"$", "");
            String valueStr = parts[1].trim();

            Object value;
            if (valueStr.startsWith("\"")) {
                value = valueStr.substring(1, valueStr.length() - 1);
            } else if (valueStr.equals("true")) {
                value = true;
            } else if (valueStr.equals("false")) {
                value = false;
            } else if (valueStr.contains(".")) {
                try {
                    value = Double.parseDouble(valueStr);
                } catch (Exception e) {
                    value = valueStr;
                }
            } else {
                try {
                    value = Integer.parseInt(valueStr);
                } catch (Exception e) {
                    value = valueStr;
                }
            }
            result.put(key, value);
        }
        return result;
    }
}
