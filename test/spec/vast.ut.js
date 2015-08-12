var VAST = require('../../lib/VAST');

describe('VAST', function() {
    it('should exist', function() {
        expect(VAST).toEqual(jasmine.any(Function));
        expect(VAST.name).toBe('VAST');
    });
});
