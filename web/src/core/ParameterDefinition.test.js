import { describe, it, expect } from 'vitest';
import { ParameterDefinition } from './ParameterDefinition.js';

describe('ParameterDefinition', () => {
    it('integer factory creates correct definition', () => {
        const pd = ParameterDefinition.integer('count', 5, 1, 10, 'Number of items');

        expect(pd.name).toBe('count');
        expect(pd.type).toBe('integer');
        expect(pd.defaultValue).toBe(5);
        expect(pd.min).toBe(1);
        expect(pd.max).toBe(10);
        expect(pd.description).toBe('Number of items');
    });

    it('doubleVal factory creates correct definition', () => {
        const pd = ParameterDefinition.doubleVal('scale', 1.5, 0.1, 10.0, 'Scale factor');

        expect(pd.name).toBe('scale');
        expect(pd.type).toBe('double');
        expect(pd.defaultValue).toBe(1.5);
        expect(pd.min).toBe(0.1);
        expect(pd.max).toBe(10.0);
    });

    it('bool factory creates correct definition', () => {
        const pd = ParameterDefinition.bool('enabled', true, 'Toggle feature');

        expect(pd.name).toBe('enabled');
        expect(pd.type).toBe('boolean');
        expect(pd.defaultValue).toBe(true);
        expect(pd.min).toBeNull();
        expect(pd.max).toBeNull();
    });

    it('string factory creates correct definition', () => {
        const pd = ParameterDefinition.string('title', 'Hello', 'A title');

        expect(pd.name).toBe('title');
        expect(pd.type).toBe('string');
        expect(pd.defaultValue).toBe('Hello');
    });

    it('selection factory creates correct definition', () => {
        const pd = ParameterDefinition.selection('mode', 'A', ['A', 'B', 'C'], 'Select mode');

        expect(pd.name).toBe('mode');
        expect(pd.type).toBe('selection');
        expect(pd.defaultValue).toBe('A');
        expect(pd.options).toEqual(['A', 'B', 'C']);
    });

    it('selection default is in options', () => {
        const pd = ParameterDefinition.selection('choice', 'Y', ['X', 'Y', 'Z'], 'Pick one');
        expect(pd.options).toContain(pd.defaultValue);
    });

    it('options default to empty array', () => {
        const pd = ParameterDefinition.integer('x', 0, 0, 10, 'test');
        expect(pd.options).toEqual([]);
    });
});
