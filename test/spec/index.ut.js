var vastacular = require('../../index');
var VAST = require('../../lib/VAST');
var pkg = require('../../package.json');

describe('main export', function() {
    describe('VAST', function() {
        it('should be the VAST constructor', function() {
            expect(vastacular.VAST).toBe(VAST);
        });
    });

    describe('version', function() {
        it('should be the version from package.json', function() {
            expect(vastacular.version).toBe(pkg.version);
        });
    });
});
