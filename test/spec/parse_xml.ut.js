var parseXML = require('../../lib/utils/parse_xml');
var fs = require('fs');
var exampleXML = fs.readFileSync(require.resolve('../helpers/example.xml')).toString();

describe('parseXML(xml)', function() {
    var result;

    beforeEach(function() {
        result = parseXML(exampleXML);
    });

    it('should return a function', function() {
        expect(result).toEqual(jasmine.any(Function));
    });

    describe('when the returned function is called', function() {
        var queryXML;

        beforeEach(function() {
            queryXML = result;
        });

        it('should find a singular node', function() {
            expect(queryXML('AdTitle')).toEqual([
                jasmine.objectContaining({
                    tag: 'AdTitle',
                    value: 'VAST 2.0 Instream Test 1',
                    attributes: {}
                })
            ]);
        });

        it('should find many nodes', function() {
            expect(queryXML('Creative')).toEqual([
                jasmine.objectContaining({
                    tag: 'Creative',
                    attributes: jasmine.any(Object)
                }),
                jasmine.objectContaining({
                    tag: 'Creative',
                    attributes: jasmine.any(Object)
                })
            ]);
        });

        it('should make the value null if the element is a container for other elements', function() {
            expect(queryXML('Linear')).toEqual([
                jasmine.objectContaining({
                    value: null
                })
            ]);
        });

        it('should set the attributes if the element has them', function() {
            expect(queryXML('Creative MediaFile')).toEqual([
                jasmine.objectContaining({
                    attributes: {
                        delivery: 'progressive',
                        type: 'video/x-flv',
                        bitrate: '500',
                        width: '400',
                        height: '300',
                        scalable: 'true',
                        maintainAspectRatio: 'true'
                    }
                })
            ]);
        });

        it('should allow children to be found', function() {
            expect(JSON.stringify(queryXML('Companion')[0].find('Tracking'))).toEqual(JSON.stringify(queryXML('Companion Tracking')));
        });

        it('should allow children to be fetched', function() {
            expect(JSON.stringify(queryXML('Linear TrackingEvents')[0].children())).toEqual(JSON.stringify(queryXML('Linear TrackingEvents Tracking')));
        });
    });
});
