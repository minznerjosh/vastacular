var vastacular = require('../../index');
var VAST = require('../../lib/VAST');

describe('main export', function() {
    describe('VAST', function() {
        it('should be the VAST constructor', function() {
            expect(vastacular.VAST).toBe(VAST);
        });
    });
});
