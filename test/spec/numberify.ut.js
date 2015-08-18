var numberify = require('../../lib/utils/numberify');

describe('numberify(value)', function() {
    it('should return a Number if passed one', function() {
        expect(numberify(2)).toBe(2);
        expect(numberify(56.82)).toBe(56.82);
        expect(numberify(0)).toBe(0);
    });

    it('should convert a string to a Number', function() {
        expect(numberify('2')).toBe(2);
        expect(numberify('56.82')).toBe(56.82);
        expect(numberify('0')).toBe(0);
    });

    it('should return undefined if passed a non-number', function() {
        expect(numberify(undefined)).toBeUndefined();
        expect(numberify(null)).toBeUndefined();
        expect(numberify('foo')).toBeUndefined();
        expect(numberify({})).toBeUndefined();
        expect(numberify([])).toBe(undefined);
    });

    it('should convert a boolean into a Number', function() {
        expect(numberify(true)).toBe(1);
        expect(numberify(false)).toBe(0);
    });
});
