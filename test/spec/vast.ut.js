/* jshint latedef:nofunc */

var VAST = require('../../lib/VAST');
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
    var jsonVAST;

    beforeEach(function() {
        jsonVAST = require('../../lib/pojo_from_xml')(require('fs').readFileSync(require('path').resolve(__dirname, '../helpers/vast_2.0.xml')).toString());
    });

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

        describe('methods:', function() {
            describe('get(prop)', function() {
                it('should get a property of the instance', function() {
                    expect(vast.get('ads')).toBe(vast.ads);
                });

                it('should get nested properties', function() {
                    expect(vast.get('ads[1].creatives[0].type')).toBe(vast.ads[1].creatives[0].type);
                });

                it('should return undefined if an object is undefined', function() {
                    expect(vast.get('ads[1].creatives[33].type')).toBeUndefined();
                    expect(vast.get('ads[0].creatives[0].mediaFiles[0].scalable.foo')).toBeUndefined();
                });

                it('should return itself is no prop is provided', function() {
                    expect(vast.get()).toBe(vast);
                    expect(vast.get(null)).toBe(vast);
                    expect(vast.get('')).toBe(vast);
                });
            });

            describe('set(prop, value)', function() {
                var value;

                beforeEach(function() {
                    value = { foo: 'bar' };
                });

                it('should set a property of the instance', function() {
                    expect(vast.set('test', value)).toBe(value);
                    expect(vast.test).toBe(value);
                });

                it('should set nested properties', function() {
                    var orig = vast.ads[1].creatives[0];
                    vast.set('ads[1].creatives[0].type', value);

                    expect(vast.ads[1].creatives[0].type).toBe(value);
                    expect(vast.ads[1].creatives[0]).toBe(orig);
                });

                it('should create objects that don\'t exist along the way', function() {
                    var creative = vast.ads[0].creatives[1];
                    expect(vast.set('ads[0].creatives[1].foo.1.bar', value)).toBe(value);

                    expect(vast.ads[0].creatives[1].foo[1].bar).toBe(value);
                    expect(vast.ads[0].creatives[1].foo).toEqual({ '1': { bar: value } });
                    expect(vast.ads[0].creatives[1]).toBe(creative);

                    expect(vast.set('ads[10].foo', value)).toBe(value);
                    expect(vast.ads[10].foo).toBe(value);
                    expect(vast.ads[10]).toEqual({ foo: value });
                });

                it('should create Arrays that don\'t exist along the way', function() {
                    expect(vast.set('ads[0].monkies[1]', value)).toBe(value);
                    expect(vast.ads[0].monkies[1]).toBe(value);
                    expect(vast.ads[0].monkies).toEqual(jasmine.any(Array));

                    expect(vast.set('ads[10][1]', value)).toBe(value);
                    expect(vast.ads[10][1]).toBe(value);
                    expect(vast.ads[10]).toEqual(jasmine.any(Array));
                });

                it('should throw an error if no prop is provided', function() {
                    var origKeys = Object.keys(vast);
                    expect(function() { vast.set(); }).toThrow();
                    expect(Object.keys(vast)).toEqual(origKeys);
                });
            });

            describe('map(array, mapper)', function() {
                var mapper;

                beforeEach(function() {
                    mapper = jasmine.createSpy('mapper()').and.callFake(function(object) { return object.type; });
                });

                it('should map an array', function() {
                    expect(vast.map('ads[0].creatives', mapper)).toEqual(['linear', 'companions', 'nonLinear']);
                    vast.get('ads[0].creatives').forEach(function(creative, index, array) {
                        var call = mapper.calls.all()[index];
                        expect(call.args).toEqual([creative, index, array]);
                        expect(call.object).toBe(vast);
                    });
                });

                it('should return an Array if given a reference to a non-array', function() {
                    expect(vast.map('ads[0]', mapper)).toEqual([]);
                    expect(vast.map('ads[0].creatives[0].type', mapper)).toEqual([]);
                    expect(vast.map('foo.bar[0].hello.world', mapper)).toEqual([]);
                });
            });

            describe('filter(array, predicate)', function() {
                var predicate;

                beforeEach(function() {
                    predicate = jasmine.createSpy('predicate()').and.callFake(function(event) { return (/creativeView|midpoint/).test(event.event); });
                });

                it('should filter an array', function() {
                    expect(vast.filter('ads[0].creatives[0].trackingEvents', predicate)).toEqual([
                        { event: 'creativeView', uri: 'http://myTrackingURL/creativeView' },
                        { event: 'midpoint', uri: 'http://myTrackingURL/midpoint' }
                    ]);
                    vast.get('ads[0].creatives[0].trackingEvents').forEach(function(event, index, array) {
                        var call = predicate.calls.all()[index];
                        expect(call.args).toEqual([event, index, array]);
                        expect(call.object).toBe(vast);
                    });
                });

                it('should return an array if given an reference to a non-array', function() {
                    predicate.and.returnValue(true);
                    expect(vast.filter('ads[0]', predicate)).toEqual([]);
                    expect(vast.filter('ads[0].creatives[0].type', predicate)).toEqual([]);
                    expect(vast.filter('foo.bar[0].hello.world', predicate)).toEqual([]);
                });
            });

            describe('find(array, predicate)', function() {
                var predicate;

                beforeEach(function() {
                    predicate = jasmine.createSpy('predicate()').and.callFake(function(creative) { return creative.type === 'companions'; });
                });

                it('should find an item in an array', function() {
                    expect(vast.find('ads[0].creatives', predicate)).toBe(vast.get('ads[0].creatives[1]'));
                    expect(predicate.calls.count()).toBe(2);
                    predicate.calls.all().forEach(function(call, index) {
                        expect(call.args).toEqual([vast.get('ads[0].creatives')[index], index, vast.get('ads[0].creatives')]);
                        expect(call.object).toBe(vast);
                    });
                });

                it('should return undefined if the predicate never returns something truthy', function() {
                    predicate.and.returnValue(false);
                    expect(vast.find('ads[0].creatives', predicate)).toBeUndefined();
                });

                it('should return undefined if given an reference to a non-array', function() {
                    predicate.and.returnValue(true);
                    expect(vast.find('ads[0]', predicate)).toBeUndefined();
                    expect(vast.find('ads[0].creatives[0].type', predicate)).toBeUndefined();
                    expect(vast.find('foo.bar[0].hello.world', predicate)).toBeUndefined();
                });
            });
        });
    });
});
