var stringToBoolean = require('../../lib/utils/string_to_boolean');

describe('stringToBoolean(string)', function() {
    it('should return true if any form of "true" is provided', function() {
        expect(stringToBoolean('true')).toBe(true);
        expect(stringToBoolean('tRUe')).toBe(true);
        expect(stringToBoolean('TRUE')).toBe(true);
    });

    it('should return false if any form of "false" is provided', function() {
        expect(stringToBoolean('false')).toBe(false);
        expect(stringToBoolean('falSE')).toBe(false);
        expect(stringToBoolean('FALSE')).toBe(false);
    });

    it('should return undefined if neither "true" or "false" is provided', function() {
        expect(stringToBoolean('hey')).toBeUndefined();
        expect(stringToBoolean(null)).toBeUndefined();
        expect(stringToBoolean()).toBeUndefined();
    });
});
