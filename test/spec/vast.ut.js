var VAST = require('../../lib/VAST');

describe('VAST', function() {
    it('should exist', function() {
        expect(VAST).toEqual(jasmine.any(Function));
        expect(VAST.name).toBe('VAST');
    });

    describe('static', function() {
        describe('methods', function() {
            describe('pojoFromXML()', function() {
                it('should exist', function() {
                    expect(VAST.pojoFromXML).toBe(require('../../lib/pojo_from_xml'));
                });
            });
        });
    });
});
