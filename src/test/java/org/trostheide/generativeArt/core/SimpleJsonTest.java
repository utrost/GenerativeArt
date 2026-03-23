package org.trostheide.generativeArt.core;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class SimpleJsonTest {

    // ---- toJson tests ----

    @Test
    void nullConvertsToNull() {
        assertEquals("null", SimpleJson.toJson(null));
    }

    @Test
    void stringIsQuoted() {
        assertEquals("\"hello\"", SimpleJson.toJson("hello"));
    }

    @Test
    void integerConvertsToString() {
        assertEquals("42", SimpleJson.toJson(42));
    }

    @Test
    void doubleConvertsToString() {
        assertEquals("3.14", SimpleJson.toJson(3.14));
    }

    @Test
    void booleanConvertsToString() {
        assertEquals("true", SimpleJson.toJson(true));
        assertEquals("false", SimpleJson.toJson(false));
    }

    @Test
    void listConvertsToJsonArray() {
        String json = SimpleJson.toJson(List.of("a", "b", "c"));
        assertEquals("[\"a\",\"b\",\"c\"]", json);
    }

    @Test
    void mapConvertsToJsonObject() {
        Map<String, Object> map = new HashMap<>();
        map.put("key", "value");
        String json = SimpleJson.toJson(map);
        assertTrue(json.contains("\"key\":\"value\""));
        assertTrue(json.startsWith("{"));
        assertTrue(json.endsWith("}"));
    }

    @Test
    void emptyListConvertsToEmptyArray() {
        assertEquals("[]", SimpleJson.toJson(List.of()));
    }

    // ---- parseFlatMap tests ----

    @Test
    void parseFlatMapWithStringValue() {
        Map<String, Object> result = SimpleJson.parseFlatMap("{\"name\":\"test\"}");
        assertEquals("test", result.get("name"));
    }

    @Test
    void parseFlatMapWithIntegerValue() {
        Map<String, Object> result = SimpleJson.parseFlatMap("{\"count\":42}");
        assertEquals(42, result.get("count"));
    }

    @Test
    void parseFlatMapWithDoubleValue() {
        Map<String, Object> result = SimpleJson.parseFlatMap("{\"scale\":1.5}");
        assertEquals(1.5, result.get("scale"));
    }

    @Test
    void parseFlatMapWithBooleanValues() {
        Map<String, Object> result = SimpleJson.parseFlatMap("{\"on\":true,\"off\":false}");
        assertEquals(true, result.get("on"));
        assertEquals(false, result.get("off"));
    }

    @Test
    void parseFlatMapWithMultipleEntries() {
        Map<String, Object> result = SimpleJson.parseFlatMap(
                "{\"name\":\"art\",\"width\":800,\"scale\":1.5,\"enabled\":true}");
        assertEquals("art", result.get("name"));
        assertEquals(800, result.get("width"));
        assertEquals(1.5, result.get("scale"));
        assertEquals(true, result.get("enabled"));
    }

    @Test
    void parseFlatMapHandlesEmptyJson() {
        Map<String, Object> result = SimpleJson.parseFlatMap("{}");
        assertTrue(result.isEmpty());
    }
}
