package org.trostheide.generativeArt.core;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ParameterDefinitionTest {

    @Test
    void integerFactoryCreatesCorrectDefinition() {
        ParameterDefinition pd = ParameterDefinition.integer("count", 5, 1, 10, "Number of items");

        assertEquals("count", pd.name());
        assertEquals(ParameterType.INTEGER, pd.type());
        assertEquals(5, pd.defaultValue());
        assertEquals(1, pd.min());
        assertEquals(10, pd.max());
        assertNull(pd.options());
        assertEquals("Number of items", pd.description());
    }

    @Test
    void doubleValFactoryCreatesCorrectDefinition() {
        ParameterDefinition pd = ParameterDefinition.doubleVal("scale", 1.5, 0.1, 10.0, "Scale factor");

        assertEquals("scale", pd.name());
        assertEquals(ParameterType.DOUBLE, pd.type());
        assertEquals(1.5, pd.defaultValue());
        assertEquals(0.1, pd.min());
        assertEquals(10.0, pd.max());
        assertNull(pd.options());
    }

    @Test
    void boolFactoryCreatesCorrectDefinition() {
        ParameterDefinition pd = ParameterDefinition.bool("enabled", true, "Toggle feature");

        assertEquals("enabled", pd.name());
        assertEquals(ParameterType.BOOLEAN, pd.type());
        assertEquals(true, pd.defaultValue());
        assertNull(pd.min());
        assertNull(pd.max());
        assertNull(pd.options());
    }

    @Test
    void stringFactoryCreatesCorrectDefinition() {
        ParameterDefinition pd = ParameterDefinition.string("title", "Hello", "A title");

        assertEquals("title", pd.name());
        assertEquals(ParameterType.STRING, pd.type());
        assertEquals("Hello", pd.defaultValue());
        assertNull(pd.min());
        assertNull(pd.max());
    }

    @Test
    void selectionFactoryCreatesCorrectDefinition() {
        List<String> options = List.of("A", "B", "C");
        ParameterDefinition pd = ParameterDefinition.selection("mode", "A", options, "Select mode");

        assertEquals("mode", pd.name());
        assertEquals(ParameterType.STRING, pd.type());
        assertEquals("A", pd.defaultValue());
        assertEquals(options, pd.options());
    }

    @Test
    void selectionDefaultIsInOptions() {
        List<String> options = List.of("X", "Y", "Z");
        ParameterDefinition pd = ParameterDefinition.selection("choice", "Y", options, "Pick one");

        assertTrue(pd.options().contains(pd.defaultValue().toString()));
    }
}
