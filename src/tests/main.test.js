import { describe, it, expect } from 'vitest';

describe('Basic Template Test', () => {
    it('runs vitest properly', () => {
        expect(1 + 1).toBe(2);
    });

    it('can access global test functions', () => {
        const testObj = { name: 'Bytes Game' };
        expect(testObj).toHaveProperty('name', 'Bytes Game');
    });
});
