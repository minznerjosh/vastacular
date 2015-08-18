/* jshint latedef:nofunc */

var VAST = require('../../lib/VAST');
var jsonVAST = require('../../lib/pojo_from_xml')(require('fs').readFileSync(require('path').resolve(__dirname, '../helpers/vast_2.0.xml')).toString());
var extend = require('../../lib/utils/extend');

function deepArrayContaining(array) {
    return jasmine.arrayContaining(array.map(function(item) {
        if (Object(item) === item) {
            if (item instanceof Array) {
                return deepArrayContaining(item);
            } else {
                return deepObjectContaining(item);
            }
        }

        return item;
    }));
}

function deepObjectContaining(object) {
    return jasmine.objectContaining(Object.keys(object).reduce(function(result, key) {
        if (Object(object[key]) === object[key]) {
            if (object[key] instanceof Array) {
                result[key] = deepArrayContaining(object[key]);
            } else {
                result[key] = deepObjectContaining(object[key]);
            }
        } else {
            result[key] = object[key];
        }

        return result;
    }, {}));
}

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

    describe('instance', function() {
        var vast;

        beforeEach(function() {
            vast = new VAST(jsonVAST);
        });

        it('should deep-copy all of the props of the jsonVAST to itself', function() {
            expect(vast).toEqual(deepObjectContaining(jsonVAST));
            expect(vast.ads[0].impressions[0]).not.toBe(jsonVAST.ads[0].impressions[0]);
        });

        describe('with minimal configuration', function() {
            beforeEach(function() {
                jsonVAST = {
                    version: '2.0',
                    ads: [
                        {
                            id: 'foo',
                            type: 'inline',
                            system: { name: 'ad-system' },
                            title: 'My Ad',
                            impressions: [{ ur: 'http://cinema6.com/pixels/impression' }],
                            creatives: [
                                {
                                    type: 'linear',
                                    duration: 60,
                                    mediaFiles: [
                                        { uri: 'http://cinema6.com/videos/my-video.mp4', delivery: 'progressive', type: 'video/mp4', width: 1920, height: 1080 }
                                    ]
                                },
                                {
                                    type: 'companions',
                                    companions: [
                                        {
                                            width: 300,
                                            height: 250,
                                            resources: [{ type: 'iframe', data: 'http://cinema6.com/iframe.html' }]
                                        }
                                    ]
                                },
                                {
                                    type: 'nonLinear',
                                    ads: [
                                        {
                                            width: 1920,
                                            height: 1080,
                                            resources: [{ type: 'html', data: '<p>hello</p>' }]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            id: 'bar',
                            type: 'wrapper',
                            system: { name: 'ad-system' },
                            impressions: [{ ur: 'http://cinema6.com/pixels/impression' }],
                            vastAdTagURI: 'http://cinema6.com/vast/tag.xml',
                            creatives: []
                        }
                    ]
                };

                vast = new VAST(jsonVAST);
            });

            it('should give the inline ad some defaults', function() {
                expect(vast.ads[0]).toEqual(extend(jsonVAST.ads[0], {
                    system: jasmine.objectContaining({ version: null }),
                    description: null,
                    survey: null,
                    errors: [],
                    creatives: jasmine.any(Array)
                }));
            });

            it('should give the linear ad some defaults', function() {
                expect(vast.ads[0].creatives[0]).toEqual(extend(jsonVAST.ads[0].creatives[0], {
                    id: null,
                    sequence: null,
                    adID: null,
                    trackingEvents: [],
                    parameters: null,
                    videoClicks: null,
                    mediaFiles: jasmine.any(Array)
                }));
            });

            it('should give the mediaFiles some defaults', function() {
                expect(vast.ads[0].creatives[0].mediaFiles[0]).toEqual(extend({
                    id: null,
                    bitrate: null,
                    scalable: null,
                    maintainAspectRatio: null,
                    apiFramework: null
                }, jsonVAST.ads[0].creatives[0].mediaFiles[0]));
            });

            it('should give the companion ad some defaults', function() {
                expect(vast.ads[0].creatives[1]).toEqual(extend(jsonVAST.ads[0].creatives[1], {
                    id: null,
                    sequence: null,
                    adID: null,
                    companions: jasmine.any(Array)
                }));
            });

            it('should give each companion some defaults', function() {
                expect(vast.ads[0].creatives[1].companions[0]).toEqual(extend({
                    expandedWidth: null,
                    expandedHeight: null,
                    apiFramework: null,
                    trackingEvents: [],
                    clickThrough: null,
                    altText: null,
                    parameters: null
                }, jsonVAST.ads[0].creatives[1].companions[0]));
            });

            it('should give the nonLinear ad some defaults', function() {
                expect(vast.ads[0].creatives[2]).toEqual(extend(jsonVAST.ads[0].creatives[2], {
                    id: null,
                    sequence: null,
                    adID: null,
                    trackingEvents: [],
                    ads: jasmine.any(Array)
                }));
            });

            it('should give each nonLinear some defaults', function() {
                expect(vast.ads[0].creatives[2].ads[0]).toEqual(extend({
                    id: null,
                    expandedWidth: null,
                    expandedHeight: null,
                    scalable: null,
                    maintainAspectRatio: null,
                    minSuggestedDuration: null,
                    apiFramework: null,
                    clickThrough: null,
                    parameters: null
                }, jsonVAST.ads[0].creatives[2].ads[0]));
            });

            it('should give the wrapper ad some defaults', function() {
                expect(vast.ads[1]).toEqual(extend(jsonVAST.ads[1], {
                    system: jasmine.objectContaining({ version: null }),
                    errors: []
                }));
            });
        });
    });
});
