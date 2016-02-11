/* jshint latedef:nofunc */

var VAST = require('../../lib/VAST');
var extend = require('../../lib/utils/extend');
var LiePromise = require('lie');
var request = require('superagent');

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
    var xmlVAST;

    beforeEach(function() {
        xmlVAST = require('fs').readFileSync(require.resolve('../helpers/vast_2.0.xml')).toString().trim();
        jsonVAST = require('../../lib/pojo_from_xml')(xmlVAST);
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

            describe('fetch(uri, options, cb)', function() {
                var uri;
                var result;
                var requestDeferreds;
                var success, failure;

                beforeEach(function() {
                    uri = 'http://cinema6.com/vast/some-tag.xml';
                    requestDeferreds = {};

                    success = jasmine.createSpy('success()');
                    failure = jasmine.createSpy('failure()');

                    spyOn(request, 'get').and.callFake(function(url) {
                        var deferred = {};
                        var req = {
                            then: function(fulfill, reject) {
                                deferred.resolve = fulfill;
                                deferred.reject = reject;

                                return this;
                            },
                            set: jasmine.createSpy('req.set()').and.callFake(function() {
                                return this;
                            })
                        };

                        requestDeferreds[url] = deferred;
                        deferred.request = req;

                        return req;
                    });

                    result = VAST.fetch(uri);
                    result.then(success, failure);
                });

                it('should return a LiePromise', function() {
                    expect(result).toEqual(jasmine.any(LiePromise));
                });

                it('should make a network request for the provided URI', function() {
                    expect(request.get).toHaveBeenCalledWith(uri);
                    expect(requestDeferreds[uri].request.set).toHaveBeenCalledWith({});
                });

                describe('if the request is successful', function() {
                    var vastXML, vast;

                    beforeEach(function(done) {
                        vastXML = require('fs').readFileSync(require.resolve('../helpers/vast_2.0.xml')).toString();
                        vast = new VAST(VAST.pojoFromXML(vastXML));

                        requestDeferreds[uri].resolve({ text: vastXML });
                        result.then(done, done);
                    });

                    it('should fulfill the promise with a VAST object', function() {
                        expect(success).toHaveBeenCalledWith(vast);
                    });
                });

                describe('if the request fails', function() {
                    var reason;

                    beforeEach(function(done) {
                        reason = new Error('Network error.');
                        requestDeferreds[uri].reject(reason);
                        result.then(done, done);
                    });

                    it('should be rejected with the reason', function() {
                        expect(failure).toHaveBeenCalledWith(reason);
                    });
                });

                describe('if options.resolveWrappers is true', function() {
                    var vastXML, vast;

                    beforeEach(function() {
                        vastXML = require('fs').readFileSync(require.resolve('../helpers/vast_2.0.xml')).toString();
                        vast = new VAST(VAST.pojoFromXML(vastXML));

                        result = VAST.fetch(uri, { resolveWrappers: true, maxRedirects: 10 });
                        result.then(success, failure);
                    });

                    describe('when the VAST is fetched', function() {
                        beforeEach(function(done) {
                            spyOn(VAST.prototype, 'resolveWrappers').and.callThrough();
                            requestDeferreds[uri].resolve({ text: vastXML });
                            setTimeout(done, 5);
                        });

                        it('should call resolveWrappers() on the VAST object it creates', function() {
                            expect(VAST.prototype.resolveWrappers).toHaveBeenCalledWith(10);
                            expect(VAST.prototype.resolveWrappers.calls.mostRecent().object.toPOJO()).toEqual(vast.toPOJO());
                        });

                        describe('when the wrapper is fetched', function() {
                            var expected;
                            var inlineXML;

                            beforeEach(function(done) {
                                inlineXML = require('fs').readFileSync(require.resolve('../helpers/vast_2.0--inline1.xml')).toString();
                                requestDeferreds[vast.get('wrappers[0].vastAdTagURI')].resolve({ text: inlineXML });

                                vast.resolveWrappers().then(function(_expected_) {
                                    expected = _expected_;
                                });
                                requestDeferreds[vast.get('wrappers[0].vastAdTagURI')].resolve({ text: inlineXML });

                                result.then(done, done);
                            });

                            it('should return the resolved VAST', function() {
                                expect(success).toHaveBeenCalledWith(expected);
                            });
                        });
                    });
                });

                describe('if options.headers is provided', function() {
                    beforeEach(function() {
                        VAST.fetch(uri, { headers: { 'API-Key': 'foobar', Accept: 'application/json' } });
                    });

                    it('should make a request with the provided headers', function() {
                        expect(request.get).toHaveBeenCalledWith(uri);
                        expect(requestDeferreds[uri].request.set).toHaveBeenCalledWith({ 'API-Key': 'foobar', Accept: 'application/json' });
                    });
                });

                describe('if a callback is provided', function() {
                    var value, reason;
                    var callback;
                    var promise;

                    beforeEach(function() {
                        callback = jasmine.createSpy('callback()');

                        promise = VAST.fetch(uri, null, callback).then(function(_value_) {
                            value = _value_;
                        }, function(_reason_) {
                            reason = _reason_;
                        });
                    });

                    describe('when the promise is fulfilled', function() {
                        var vastXML;

                        beforeEach(function(done) {
                            vastXML = require('fs').readFileSync(require.resolve('../helpers/vast_2.0.xml')).toString();
                            requestDeferreds[uri].resolve({ text: vastXML });
                            promise.then(done, done);
                        });

                        it('should call the callback', function() {
                            expect(callback).toHaveBeenCalledWith(null, value);
                        });
                    });

                    describe('when the promise is rejected', function() {
                        beforeEach(function(done) {
                            reason = new Error('Error');
                            requestDeferreds[uri].reject(reason);
                            promise.then(done, done);
                        });

                        it('should call the callback', function() {
                            expect(callback).toHaveBeenCalledWith(reason);
                        });
                    });
                });

                describe('if only a callback is provided', function() {
                    var callback;

                    beforeEach(function(done) {
                        callback = jasmine.createSpy('callback()');
                        callback.headers = { 'foo': 'bar' };

                        VAST.fetch(uri, callback).then(done, done);
                        requestDeferreds[uri].reject(new Error('Problem'));
                    });

                    it('should call the callback', function() {
                        expect(callback).toHaveBeenCalled();
                    });

                    it('should not treat the callback as an options object', function() {
                        expect(requestDeferreds[uri].request.set).toHaveBeenCalledWith({});
                    });
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

        describe('with invalid VAST', function() {
            beforeEach(function() {
                jsonVAST = require('../../lib/pojo_from_xml')(require('fs').readFileSync(require.resolve('../helpers/vast_2.0--invalid.xml')).toString());
                vast = new VAST(jsonVAST);
            });

            it('should instantiate', function() {
                expect(vast).toEqual(deepObjectContaining({
                    version: '2.0',
                    ads: [
                        {
                            system: {
                                version: null
                            },
                            type: 'inline',
                            errors: [],
                            impressions: [],
                            creatives: [
                                {
                                    type: 'linear',
                                    mediaFiles: [
                                        {
                                            type: 'video/x-flv',
                                            uri: 'http://media.scanscout.com/ads/partner1_a1d1fbbc-c4d4-419f-b6c8-e9db63fd4491.flv'
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }));
            });
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

        describe('properties:', function() {
            describe('wrappers', function() {
                it('should be an array of all of the wrapper ads', function() {
                    expect(vast.wrappers).toEqual(vast.filter('ads', function(ad) { return ad.type === 'wrapper'; }));
                });

                it('should return the same array instance each time', function() {
                    expect(vast.wrappers).toBe(vast.wrappers);
                });

                it('should stay up-to-date', function() {
                    vast.set('ads', vast.filter('ads', function(ad) { return ad.type !== 'wrapper'; }));
                    expect(vast.wrappers).toEqual([]);
                });
            });

            describe('inlines', function() {
                it('should be an array of all of the inline ads', function() {
                    expect(vast.inlines).toEqual(vast.filter('ads', function(ad) { return ad.type === 'inline'; }));
                });

                it('should return the same array instance each time', function() {
                    expect(vast.inlines).toBe(vast.inlines);
                });

                it('should stay up-to-date', function() {
                    vast.set('ads', vast.filter('ads', function(ad) { return ad.type !== 'inline'; }));
                    expect(vast.inlines).toEqual([]);
                });
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

            describe('toPOJO()', function() {
                var expected;
                var result;

                beforeEach(function() {
                    expected = (function() {
                        var pojo = JSON.parse(JSON.stringify(vast));

                        delete pojo.__private__;
                        return pojo;
                    }());
                    result = vast.toPOJO();
                });

                it('should return the data as a POJO', function() {
                    expect(result).toEqual(expected);
                });
            });

            describe('copy()', function() {
                var result;

                beforeEach(function() {
                    result = vast.copy();
                });

                it('should return a copy of the VAST', function() {
                    expect(result).toEqual(vast);
                    expect(result).not.toBe(vast);
                });
            });

            describe('resolveWrappers()', function() {
                var success, failure;
                var requestDeferreds;
                var result;

                beforeEach(function() {
                    success = jasmine.createSpy('success()');
                    failure = jasmine.createSpy('failure()');

                    requestDeferreds = {};

                    vast = new VAST({
                        version: '2.0',
                        ads: [
                            {
                                id: '1',
                                type: 'wrapper',
                                vastAdTagURI: 'http://cinema6.com/tags/vast1.xml',
                                system: { name: 'ad-server' },
                                creatives: [],
                                impressions: []
                            },
                            {
                                id: '2',
                                type: 'inline',
                                system: { name: 'ad-server' },
                                title: 'My Ad',
                                impressions: [{ uri: 'http://cinema6.com/pixels/impression' }],
                                creatives: [
                                    {
                                        type: 'linear',
                                        duration: 30,
                                        mediaFiles: [{ uri: 'video.mp4', type: 'video/mp4' }]
                                    }
                                ]
                            },
                            {
                                id: '3',
                                type: 'wrapper',
                                vastAdTagURI: 'http://cinema6.com/tags/vast2.xml',
                                system: { name: 'ad-server' },
                                impressions: [],
                                creatives: []
                            }
                        ]
                    });

                    spyOn(request, 'get').and.callFake(function(url) {
                        var deferred = {};
                        var req = {
                            then: function(fulfill, reject) {
                                deferred.resolve = fulfill;
                                deferred.reject = reject;

                                return this;
                            }
                        };

                        requestDeferreds[url] = deferred;

                        return req;
                    });

                    result = vast.resolveWrappers();
                    result.then(success, failure);
                });

                it('should return a LiePromise', function() {
                    expect(result).toEqual(jasmine.any(LiePromise));
                });

                it('should make a request for the tags', function() {
                    expect(request.get).toHaveBeenCalledWith(vast.ads[0].vastAdTagURI);
                    expect(request.get).toHaveBeenCalledWith(vast.ads[2].vastAdTagURI);
                    expect(request.get.calls.count()).toBe(2);
                });

                describe('if a callback is provided', function() {
                    var callback;
                    var promise;
                    var value, reason;

                    beforeEach(function() {
                        callback = jasmine.createSpy('callback()');
                        promise = vast.resolveWrappers(Infinity, callback).then(function(_value_) {
                            value = _value_;
                        }, function(_reason_) {
                            reason = _reason_;
                        });
                    });

                    describe('when the tags are fetched', function() {
                        var vastXML1, vastXML2;

                        beforeEach(function(done) {
                            vastXML1 = require('fs').readFileSync(require.resolve('../helpers/vast_2.0--inline1.xml')).toString();
                            vastXML2 = require('fs').readFileSync(require.resolve('../helpers/vast_2.0--inline2.xml')).toString();

                            requestDeferreds[vast.ads[0].vastAdTagURI].resolve({ text: vastXML1 });
                            requestDeferreds[vast.ads[2].vastAdTagURI].resolve({ text: vastXML2 });

                            promise.then(done, done);
                        });

                        it('should call the callback with the value', function() {
                            expect(callback).toHaveBeenCalledWith(null, value);
                        });
                    });

                    describe('if there is a problem', function() {
                        beforeEach(function(done) {
                            reason = new Error('Stuff is bad.');
                            requestDeferreds[vast.ads[2].vastAdTagURI].reject(reason);

                            promise.then(done, done);
                        });

                        it('should call the callback with the reason', function() {
                            expect(callback).toHaveBeenCalledWith(reason);
                        });
                    });

                    describe('and it is the only argument', function() {
                        beforeEach(function(done) {
                            callback.calls.reset();
                            vast.resolveWrappers(callback).then(done, done);
                            requestDeferreds[vast.ads[0].vastAdTagURI].reject(new Error('BOO!'));
                        });

                        it('should still be called', function() {
                            expect(callback).toHaveBeenCalledWith(jasmine.any(Error));
                        });
                    });
                });

                describe('when the tags are fetched', function() {
                    var vastXML1, vastXML2;
                    var vast1, vast2;

                    beforeEach(function(done) {
                        vastXML1 = require('fs').readFileSync(require.resolve('../helpers/vast_2.0--inline1.xml')).toString();
                        vastXML2 = require('fs').readFileSync(require.resolve('../helpers/vast_2.0--inline2.xml')).toString();
                        vast1 = new VAST(VAST.pojoFromXML(vastXML1));
                        vast2 = new VAST(VAST.pojoFromXML(vastXML2));

                        requestDeferreds[vast.ads[0].vastAdTagURI].resolve({ text: vastXML1 });
                        requestDeferreds[vast.ads[2].vastAdTagURI].resolve({ text: vastXML2 });

                        setTimeout(done, 5);
                    });

                    it('should fulfill the promise with a VAST that inlines the returned VAST', function() {
                        var expected = vast.copy();
                        expected.set('ads', vast1.ads.concat([vast.get('ads[1]')], vast2.ads));

                        expect(success).toHaveBeenCalledWith(expected);
                    });
                });

                describe('if a request fails', function() {
                    var error;

                    beforeEach(function(done) {
                        error = new Error('404: Not found');
                        requestDeferreds[vast.ads[2].vastAdTagURI].reject(error);

                        setTimeout(done, 5);
                    });

                    it('should reject with an error', function() {
                        expect(failure).toHaveBeenCalledWith(error);
                    });
                });

                describe('if another wrapper is returned', function() {
                    var vastXML1, vastXML2;
                    var vast1, vast2;

                    beforeEach(function(done) {
                        vastXML1 = require('fs').readFileSync(require.resolve('../helpers/vast_2.0--wrapper1.xml')).toString();
                        vastXML2 = require('fs').readFileSync(require.resolve('../helpers/vast_2.0--inline2.xml')).toString();
                        vast1 = new VAST(VAST.pojoFromXML(vastXML1));
                        vast2 = new VAST(VAST.pojoFromXML(vastXML2));

                        requestDeferreds[vast.ads[0].vastAdTagURI].resolve({ text: vastXML1 });
                        requestDeferreds[vast.ads[2].vastAdTagURI].resolve({ text: vastXML2 });

                        setTimeout(done, 5);
                    });

                    it('should not fulfill the promise', function() {
                        expect(success).not.toHaveBeenCalled();
                    });

                    it('should make a request for the next tag', function() {
                        expect(request.get).toHaveBeenCalledWith(vast1.wrappers[0].vastAdTagURI);
                    });

                    describe('when the request for the next tag succeeds', function() {
                        var vastXML3;
                        var vast3;

                        beforeEach(function(done) {
                            vastXML3 = require('fs').readFileSync(require.resolve('../helpers/vast_2.0--inline3.xml')).toString();
                            vast3 = new VAST(VAST.pojoFromXML(vastXML3));

                            requestDeferreds[vast1.wrappers[0].vastAdTagURI].resolve({ text: vastXML3 });

                            setTimeout(done, 5);
                        });

                        it('should fulfill the promise with the wrapper-free vast', function() {
                            var expected = vast.copy();
                            expected.set('ads', vast3.ads.concat([vast.get('ads[1]')], vast2.ads));

                            expect(success).toHaveBeenCalledWith(expected);
                        });
                    });
                });

                describe('if the wrapper includes creatives', function() {
                    var result;

                    describe('and there are the same amount of creatives in the response', function() {
                        var inlineXML;
                        var inline;

                        beforeEach(function(done) {
                            vast = new VAST({
                                version: '2.0',
                                ads: [
                                    {
                                        id: '1',
                                        type: 'wrapper',
                                        vastAdTagURI: 'http://cinema6.com/tags/vast1.xml',
                                        system: { name: 'ad-server' },
                                        impressions: [{ uri: 'http://cinema6.com/pixels/impression' }],
                                        errors: ['http://cinema6.com/pixels/error'],
                                        creatives: [
                                            {
                                                type: 'linear',
                                                trackingEvents: [
                                                    { event: 'creativeView', uri: 'http://cinema6.com/pixels/creativeView' },
                                                    { event: 'complete', uri: 'http://cinema6.com/pixels/complete' }
                                                ],
                                                videoClicks: {
                                                    clickThrough: 'http://cinema6.com/',
                                                    clickTrackings: ['http://cinema6.com/pixels/click'],
                                                    customClicks: [
                                                        { id: 'foo', uri: 'http://cinema6.com/foo' }
                                                    ]
                                                }
                                            },
                                            {
                                                type: 'linear',
                                                trackingEvents: [
                                                    { event: 'creativeView', uri: 'http://cinema6.com/pixels/creativeView2' },
                                                    { event: 'complete', uri: 'http://cinema6.com/pixels/complete2' }
                                                ],
                                                videoClicks: {
                                                    clickTrackings: ['http://cinema6.com/pixels/click']
                                                }
                                            }
                                        ]
                                    }
                                ]
                            });

                            inlineXML = require('fs').readFileSync(require.resolve('../helpers/vast_2.0--inline4.xml')).toString();
                            inline = new VAST(VAST.pojoFromXML(inlineXML));

                            vast.resolveWrappers().then(function(_result_) {
                                result = _result_;
                            }).then(done, done);

                            requestDeferreds[vast.ads[0].vastAdTagURI].resolve({ text: inlineXML });
                        });

                        it('should merge the impressions and errors', function() {
                            expect(result.get('ads[0].impressions')).toEqual(inline.get('ads[0].impressions').concat(vast.get('ads[0].impressions')));
                            expect(result.get('ads[0].errors')).toEqual(inline.get('ads[0].errors').concat(vast.get('ads[0].errors')));
                        });

                        it('should extend the inline VAST with the creatives from the wrapper', function() {
                            expect(result.get('ads[0].creatives[0].type')).toBe('linear');
                            expect(result.get('ads[0].creatives[0].trackingEvents')).toEqual(inline.get('ads[0].creatives[0].trackingEvents').concat(vast.get('ads[0].creatives[0].trackingEvents')));
                            expect(result.get('ads[0].creatives[0].videoClicks.clickThrough')).toBe(inline.get('ads[0].creatives[0].videoClicks.clickThrough'));
                            expect(result.get('ads[0].creatives[0].videoClicks.clickTrackings')).toEqual(inline.get('ads[0].creatives[0].videoClicks.clickTrackings').concat(vast.get('ads[0].creatives[0].videoClicks.clickTrackings')));
                            expect(result.get('ads[0].creatives[0].videoClicks.customClicks')).toEqual(vast.get('ads[0].creatives[0].videoClicks.customClicks'));

                            expect(result.get('ads[0].creatives[1].type')).toBe('linear');
                            expect(result.get('ads[0].creatives[1].trackingEvents')).toEqual(vast.get('ads[0].creatives[1].trackingEvents').concat(inline.get('ads[0].creatives[1].trackingEvents')));
                            expect(result.get('ads[0].creatives[1].videoClicks.clickThrough')).toBe(inline.get('ads[0].creatives[1].videoClicks.clickThrough'));
                            expect(result.get('ads[0].creatives[1].videoClicks.clickTrackings')).toEqual(vast.get('ads[0].creatives[1].videoClicks.clickTrackings').concat(inline.get('ads[0].creatives[1].videoClicks.clickTrackings')));
                        });
                    });

                    describe('and there are fewer creatives in the response', function() {
                        var inlineXML;
                        var inline;

                        beforeEach(function(done) {
                            vast = new VAST({
                                version: '2.0',
                                ads: [
                                    {
                                        id: '1',
                                        type: 'wrapper',
                                        vastAdTagURI: 'http://cinema6.com/tags/vast1.xml',
                                        system: { name: 'ad-server' },
                                        impressions: [{ uri: 'http://cinema6.com/pixels/impression' }],
                                        errors: ['http://cinema6.com/pixels/error'],
                                        creatives: [
                                            {
                                                type: 'nonLinear',
                                                ads: [
                                                    { width: 970, height: 200, resources: [{ type: 'static', creativeType: 'image/png', data: 'http://cinema6.com/images/ad.png' }] }
                                                ],
                                                trackingEvents: [
                                                    { event: 'creativeView', uri: 'http://cinema6.com/pixels/creativeView' },
                                                    { event: 'complete', uri: 'http://cinema6.com/pixels/complete' }
                                                ]
                                            },
                                            {
                                                type: 'nonLinear',
                                                trackingEvents: [
                                                    { event: 'creativeView', uri: 'http://cinema6.com/pixels/creativeView2' },
                                                    { event: 'complete', uri: 'http://cinema6.com/pixels/complete2' }
                                                ],
                                                ads: []
                                            }
                                        ]
                                    }
                                ]
                            });

                            inlineXML = require('fs').readFileSync(require.resolve('../helpers/vast_2.0--inline3.xml')).toString();
                            inline = new VAST(VAST.pojoFromXML(inlineXML));

                            vast.resolveWrappers().then(function(_result_) {
                                result = _result_;
                            }).then(done, done);

                            requestDeferreds[vast.ads[0].vastAdTagURI].resolve({ text: inlineXML });
                        });

                        it('should merge the impressions and errors', function() {
                            result.get('ads').forEach(function(ad, index) {
                                expect(ad.impressions).toEqual(inline.ads[index].impressions.concat(vast.get('ads[0].impressions')));
                                expect(ad.errors).toEqual(inline.ads[index].errors.concat(vast.get('ads[0].errors')));
                            });
                        });

                        it('should ignore the extra creatives', function() {
                            var wrapperAd = vast.get('ads[0]');

                            expect(result.get('ads.length')).toBe(inline.get('ads.length'));

                            result.get('ads').forEach(function(ad, adIndex) {
                                expect(ad.creatives.length).toBe(inline.ads[adIndex].creatives.length);

                                ad.creatives.forEach(function(creative, creativeIndex) {
                                    expect(creative.type).toBe(inline.ads[adIndex].creatives[creativeIndex].type);
                                    expect(creative.ads).toEqual(inline.ads[adIndex].creatives[creativeIndex].ads.concat(wrapperAd.creatives[0].ads));
                                    expect(creative.trackingEvents).toEqual(inline.ads[adIndex].creatives[creativeIndex].trackingEvents.concat(wrapperAd.creatives[0].trackingEvents));
                                });
                            });
                        });
                    });

                    describe('and there are fewer creatives in the wrapper', function() {
                        var inlineXML;
                        var inline;

                        beforeEach(function(done) {
                            vast = new VAST({
                                version: '2.0',
                                ads: [
                                    {
                                        id: '1',
                                        type: 'wrapper',
                                        vastAdTagURI: 'http://cinema6.com/tags/vast1.xml',
                                        system: { name: 'ad-server' },
                                        impressions: [{ uri: 'http://cinema6.com/pixels/impression' }],
                                        errors: ['http://cinema6.com/pixels/error'],
                                        creatives: [
                                            {
                                                type: 'companions',
                                                companions: [
                                                    { width: 970, height: 200, resources: [{ type: 'static', creativeType: 'image/png', data: 'http://cinema6.com/images/ad.png' }], trackingEvents: [] }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            });

                            inlineXML = require('fs').readFileSync(require.resolve('../helpers/vast_2.0--inline5.xml')).toString();
                            inline = new VAST(VAST.pojoFromXML(inlineXML));

                            vast.resolveWrappers().then(function(_result_) {
                                result = _result_;
                            }).then(done, done);

                            requestDeferreds[vast.ads[0].vastAdTagURI].resolve({ text: inlineXML });
                        });

                        it('should merge the impressions and errors', function() {
                            expect(result.get('ads[0].impressions')).toEqual(inline.get('ads[0].impressions').concat(vast.get('ads[0].impressions')));
                            expect(result.get('ads[0].errors')).toEqual(inline.get('ads[0].errors').concat(vast.get('ads[0].errors')));
                        });

                        it('should ignore the extra creatives', function() {
                            expect(result.get('ads[0].creatives[0].companions')).toEqual(inline.get('ads[0].creatives[0].companions').concat(vast.get('ads[0].creatives[0].companions')));
                            expect(result.get('ads[0].creatives[1]')).toEqual(inline.get('ads[0].creatives[1]'));
                        });
                    });

                    describe('and there is an assortment of creative types', function() {
                        var inlineXML;
                        var inline;

                        function typeIs(type) {
                            return function checkType(creative) {
                                return creative.type === type;
                            };
                        }

                        beforeEach(function(done) {
                            vast = new VAST({
                                version: '2.0',
                                ads: [
                                    {
                                        id: '1',
                                        type: 'wrapper',
                                        vastAdTagURI: 'http://cinema6.com/tags/vast1.xml',
                                        system: { name: 'ad-server' },
                                        impressions: [{ uri: 'http://cinema6.com/pixels/impression' }],
                                        errors: ['http://cinema6.com/pixels/error'],
                                        creatives: [
                                            {
                                                type: 'companions',
                                                companions: [
                                                    { width: 970, height: 200, resources: [{ type: 'static', creativeType: 'image/png', data: 'http://cinema6.com/images/ad.png' }], trackingEvents: [] }
                                                ]
                                            },
                                            {
                                                type: 'companions',
                                                companions: [
                                                    { width: 300, height: 250, resources: [{ type: 'static', creativeType: 'image/jpeg', data: 'http://cinema6.com/images/ad2.jpg' }], trackingEvents: [] }
                                                ]
                                            },
                                            {
                                                type: 'nonLinear',
                                                ads: [
                                                    { width: 970, height: 200, resources: [{ type: 'static', creativeType: 'image/png', data: 'http://cinema6.com/images/ad.png' }] }
                                                ],
                                                trackingEvents: [
                                                    { event: 'creativeView', uri: 'http://cinema6.com/pixels/creativeView' },
                                                    { event: 'complete', uri: 'http://cinema6.com/pixels/complete' }
                                                ]
                                            },
                                            {
                                                type: 'nonLinear',
                                                trackingEvents: [
                                                    { event: 'creativeView', uri: 'http://cinema6.com/pixels/creativeView2' },
                                                    { event: 'complete', uri: 'http://cinema6.com/pixels/complete2' }
                                                ],
                                                ads: []
                                            },
                                            {
                                                type: 'linear',
                                                trackingEvents: [
                                                    { event: 'creativeView', uri: 'http://cinema6.com/pixels/creativeView' },
                                                    { event: 'complete', uri: 'http://cinema6.com/pixels/complete' }
                                                ],
                                                videoClicks: {
                                                    clickThrough: 'http://cinema6.com/',
                                                    clickTrackings: ['http://cinema6.com/pixels/click'],
                                                    customClicks: [
                                                        { id: 'foo', uri: 'http://cinema6.com/foo' }
                                                    ]
                                                }
                                            },
                                            {
                                                type: 'linear',
                                                trackingEvents: [
                                                    { event: 'creativeView', uri: 'http://cinema6.com/pixels/creativeView2' },
                                                    { event: 'complete', uri: 'http://cinema6.com/pixels/complete2' }
                                                ],
                                                videoClicks: {
                                                    clickTrackings: ['http://cinema6.com/pixels/click']
                                                }
                                            }
                                        ]
                                    }
                                ]
                            });

                            inlineXML = require('fs').readFileSync(require.resolve('../helpers/vast_2.0--inline6.xml')).toString();
                            inline = new VAST(VAST.pojoFromXML(inlineXML));

                            vast.resolveWrappers().then(function(_result_) {
                                result = _result_;
                            }).then(done, done);

                            requestDeferreds[vast.ads[0].vastAdTagURI].resolve({ text: inlineXML });
                        });

                        it('should merge the impressions and errors', function() {
                            expect(result.get('ads[0].impressions')).toEqual(inline.get('ads[0].impressions').concat(vast.get('ads[0].impressions')));
                            expect(result.get('ads[0].errors')).toEqual(inline.get('ads[0].errors').concat(vast.get('ads[0].errors')));
                        });

                        it('should merge the companion ads', function() {
                            var wrapperCompanions = vast.filter('ads[0].creatives', typeIs('companions'));
                            var inlineCompanions = inline.filter('ads[0].creatives', typeIs('companions'));
                            var resultCompanions = result.filter('ads[0].creatives', typeIs('companions'));

                            expect(resultCompanions.length).toBe(inlineCompanions.length);
                            resultCompanions.forEach(function(resultCompanion, index) {
                                var wrapperCompanion = wrapperCompanions[index];
                                var inlineCompanion = inlineCompanions[index];

                                expect(resultCompanion.type).toBe(inlineCompanion.type);
                                expect(resultCompanion.companions).toEqual(inlineCompanion.companions.concat(wrapperCompanion.companions));
                            });
                        });

                        it('should merge the nonLinear ads', function() {
                            var wrapperNonLinears = vast.filter('ads[0].creatives', typeIs('nonLinear'));
                            var inlineNonLinears = inline.filter('ads[0].creatives', typeIs('nonLinear'));
                            var resultNonLinears = result.filter('ads[0].creatives', typeIs('nonLinear'));

                            expect(resultNonLinears.length).toBe(inlineNonLinears.length);
                            resultNonLinears.forEach(function(resultNonLinear, index) {
                                var wrapperNonLinear = wrapperNonLinears[index];
                                var inlineNonLinear = inlineNonLinears[index];

                                expect(resultNonLinear.type).toBe(inlineNonLinear.type);
                                expect(resultNonLinear.ads).toEqual(inlineNonLinear.ads.concat(wrapperNonLinear.ads));
                                expect(resultNonLinear.trackingEvents).toEqual(inlineNonLinear.trackingEvents.concat(wrapperNonLinear.trackingEvents));
                            });
                        });

                        it('should merge the linear ads', function() {
                            var wrapperLinears = vast.filter('ads[0].creatives', typeIs('linear'));
                            var inlineLinears = inline.filter('ads[0].creatives', typeIs('linear'));
                            var resultLinears = result.filter('ads[0].creatives', typeIs('linear'));

                            expect(resultLinears.length).toBe(inlineLinears.length);
                            resultLinears.forEach(function(resultLinear, index) {
                                var wrapperLinear = wrapperLinears[index];
                                var inlineLinear = inlineLinears[index];

                                expect(resultLinear.type).toBe(inlineLinear.type);
                                expect(resultLinear.trackingEvents).toEqual(inlineLinear.trackingEvents.concat(wrapperLinear.trackingEvents));
                            });
                        });
                    });

                    describe('and the wrapper returns another wrapper', function() {
                        var wrapperXML, wrapper;
                        var inlineXML, inline;

                        beforeEach(function(done) {
                            vast = new VAST({
                                version: '2.0',
                                ads: [
                                    {
                                        id: '1',
                                        type: 'wrapper',
                                        vastAdTagURI: 'http://cinema6.com/tags/vast1.xml',
                                        system: { name: 'ad-server' },
                                        impressions: [{ uri: 'http://cinema6.com/pixels/impression' }],
                                        errors: ['http://cinema6.com/pixels/error'],
                                        creatives: [
                                            {
                                                type: 'linear',
                                                trackingEvents: [
                                                    { event: 'creativeView', uri: 'http://cinema6.com/pixels/creativeView' },
                                                    { event: 'complete', uri: 'http://cinema6.com/pixels/complete' }
                                                ],
                                                videoClicks: {
                                                    clickThrough: 'http://cinema6.com/',
                                                    clickTrackings: ['http://cinema6.com/pixels/click'],
                                                    customClicks: [
                                                        { id: 'foo', uri: 'http://cinema6.com/foo' }
                                                    ]
                                                }
                                            },
                                            {
                                                type: 'companions',
                                                companions: [
                                                    { width: 300, height: 250, resources: [{ type: 'static', creativeType: 'image/jpeg', data: 'http://cinema6.com/images/ad2.jpg' }], trackingEvents: [] }
                                                ]
                                            },
                                            {
                                                type: 'nonLinear',
                                                ads: [
                                                    { width: 970, height: 200, resources: [{ type: 'static', creativeType: 'image/png', data: 'http://cinema6.com/images/ad.png' }] }
                                                ],
                                                trackingEvents: [
                                                    { event: 'creativeView', uri: 'http://cinema6.com/pixels/creativeView' },
                                                    { event: 'complete', uri: 'http://cinema6.com/pixels/complete' }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            });

                            wrapperXML = require('fs').readFileSync(require.resolve('../helpers/vast_2.0--wrapper2.xml')).toString();
                            wrapper = new VAST(VAST.pojoFromXML(wrapperXML));
                            inlineXML = require('fs').readFileSync(require.resolve('../helpers/vast_2.0--inline7.xml')).toString();
                            inline = new VAST(VAST.pojoFromXML(inlineXML));

                            vast.resolveWrappers().then(function(_result_) {
                                result = _result_;
                            }).then(done, done);

                            requestDeferreds[vast.ads[0].vastAdTagURI].resolve({ text: wrapperXML });
                            setTimeout(function() { requestDeferreds[wrapper.ads[0].vastAdTagURI].resolve({ text: inlineXML }); }, 5);
                        });

                        it('should combine the linear creatives', function() {
                            expect(result.get('ads[0].creatives[0].trackingEvents')).toEqual(inline.get('ads[0].creatives[0].trackingEvents').concat(wrapper.get('ads[0].creatives[0].trackingEvents'), vast.get('ads[0].creatives[0].trackingEvents')));
                            expect(result.get('ads[0].creatives[0].videoClicks.clickThrough')).toBe(inline.get('ads[0].creatives[0].videoClicks.clickThrough'));
                            expect(result.get('ads[0].creatives[0].videoClicks.clickTrackings')).toEqual(inline.get('ads[0].creatives[0].videoClicks.clickTrackings').concat(vast.get('ads[0].creatives[0].videoClicks.clickTrackings')));
                            expect(result.get('ads[0].creatives[0].videoClicks.customClicks')).toEqual(vast.get('ads[0].creatives[0].videoClicks.customClicks'));
                        });

                        it('should combine the companions', function() {
                            expect(result.get('ads[0].creatives[1].companions')).toEqual(inline.get('ads[0].creatives[1].companions').concat(vast.get('ads[0].creatives[1].companions')));
                        });

                        it('should combine the nonLinear creatives', function() {
                            expect(result.get('ads[0].creatives[2].ads')).toEqual(inline.get('ads[0].creatives[2].ads').concat(vast.get('ads[0].creatives[2].ads')));
                            expect(result.get('ads[0].creatives[2].trackingEvents')).toEqual(inline.get('ads[0].creatives[2].trackingEvents').concat(wrapper.get('ads[0].creatives[1].trackingEvents'), vast.get('ads[0].creatives[2].trackingEvents')));
                        });

                        it('should combine the errors and impressions', function() {
                            expect(result.get('ads[0].impressions')).toEqual(inline.get('ads[0].impressions').concat(wrapper.get('ads[0].impressions'), vast.get('ads[0].impressions')));
                            expect(result.get('ads[0].errors')).toEqual(inline.get('ads[0].errors').concat(wrapper.get('ads[0].errors'), vast.get('ads[0].errors')));
                        });
                    });
                });

                describe('if maxRedirects is specified', function() {
                    function wait(time) {
                        return new LiePromise(function(resolve) {
                            setTimeout(resolve, time || 0);
                        });
                    }

                    beforeEach(function(done) {
                        success = jasmine.createSpy('success()');
                        failure = jasmine.createSpy('failure()');

                        vast.resolveWrappers(4).then(success, failure);
                        LiePromise.resolve().then(done);
                    });

                    it('should not resolve the promise', function() {
                        expect(success).not.toHaveBeenCalled();
                    });

                    describe('before maxRedirects is exceeded', function() {
                        var vastXML1, vastXML2;
                        var vast1;

                        beforeEach(function(done) {
                            vastXML1 = require('fs').readFileSync(require.resolve('../helpers/vast_2.0--wrapper1.xml')).toString();
                            vastXML2 = require('fs').readFileSync(require.resolve('../helpers/vast_2.0--inline2.xml')).toString();
                            vast1 = new VAST(VAST.pojoFromXML(vastXML1));

                            LiePromise.resolve().then(function() {
                                requestDeferreds[vast.ads[0].vastAdTagURI].resolve({ text: vastXML1 });
                                requestDeferreds[vast.ads[2].vastAdTagURI].resolve({ text: vastXML2 });

                                return wait(5);
                            }).then(function() {
                                requestDeferreds[vast1.ads[0].vastAdTagURI].resolve({ text: vastXML1 });

                                return wait(5);
                            }).then(function() {
                                requestDeferreds[vast1.ads[0].vastAdTagURI].resolve({ text: vastXML1 });

                                return wait(5);
                            }).then(done, done);
                        });

                        it('should not resolve or reject the promise', function() {
                            expect(success).not.toHaveBeenCalled();
                            expect(failure).not.toHaveBeenCalled();
                        });
                    });

                    describe('when maxRedirects is exceeded', function() {
                        var vastXML1, vastXML2;
                        var vast1;

                        beforeEach(function(done) {
                            vastXML1 = require('fs').readFileSync(require.resolve('../helpers/vast_2.0--wrapper1.xml')).toString();
                            vastXML2 = require('fs').readFileSync(require.resolve('../helpers/vast_2.0--inline2.xml')).toString();
                            vast1 = new VAST(VAST.pojoFromXML(vastXML1));

                            LiePromise.resolve().then(function() {
                                requestDeferreds[vast.ads[0].vastAdTagURI].resolve({ text: vastXML1 });
                                requestDeferreds[vast.ads[2].vastAdTagURI].resolve({ text: vastXML2 });

                                return wait(5);
                            }).then(function() {
                                requestDeferreds[vast1.ads[0].vastAdTagURI].resolve({ text: vastXML1 });

                                return wait(5);
                            }).then(function() {
                                requestDeferreds[vast1.ads[0].vastAdTagURI].resolve({ text: vastXML1 });

                                return wait(5);
                            }).then(function() {
                                requestDeferreds[vast1.ads[0].vastAdTagURI].resolve({ text: vastXML1 });

                                return wait(5);
                            }).then(done, done);
                        });

                        it('should reject the promise', function() {
                            expect(failure).toHaveBeenCalledWith(new Error('Too many redirects were made.'));
                        });
                    });
                });
            });

            describe('toXML()', function() {
                it('should convert the VAST into a string of XML', function() {
                    expect(vast.toXML()).toBe(xmlVAST);
                });

                describe('when called on a minimal vast', function() {
                    beforeEach(function() {
                        xmlVAST = require('fs').readFileSync(require.resolve('../helpers/vast_2.0--minimal.xml')).toString().trim();
                        vast = new VAST(VAST.pojoFromXML(xmlVAST));
                    });

                    it('should work', function() {
                        expect(vast.toXML()).toBe(xmlVAST);
                    });
                });

                describe('if called on invalid VAST', function() {
                    beforeEach(function() {
                        vast = new VAST(VAST.pojoFromXML(require('fs').readFileSync(require.resolve('../helpers/vast_2.0--invalid.xml')).toString()));
                    });

                    it('should throw an Error', function() {
                        expect(function() { vast.toXML(); }).toThrow(new Error(
                            'VAST is invalid: ' + vast.validate().reasons.join(', ')
                        ));
                    });
                });
            });

            describe('validate()', function() {
                it('should return an Object indicating validity', function() {
                    expect(vast.validate()).toEqual({ valid: true, reasons: null });
                });

                describe('with VAST with multiple issues', function() {
                    beforeEach(function() {
                        vast = new VAST(VAST.pojoFromXML(require('fs').readFileSync(require.resolve('../helpers/vast_2.0--invalid.xml')).toString()));
                    });

                    it('should include all the reasons the VAST is not valid', function() {
                        expect(vast.validate()).toEqual({
                            valid: false,
                            reasons: jasmine.arrayContaining([
                                'ads[0].system.name is required',
                                'ads[0].impressions must contain at least one value',
                                'ads[0].title is required',
                                'ads[0].creatives[0].duration is required'
                            ])
                        });
                    });
                });

                describe('if the VAST has no ads', function() {
                    beforeEach(function() {
                        vast.ads.length = 0;
                    });

                    it('should return an Object indicating invalidity', function() {
                        expect(vast.validate()).toEqual({ valid: false, reasons: ['ads must contain at least one value'] });
                    });
                });

                describe('an inline ad', function() {
                    var ad;

                    beforeEach(function() {
                        ad = vast.find('ads', function(ad) {
                            return ad.type === 'inline';
                        });
                    });

                    describe('with no type', function() {
                        beforeEach(function() {
                            delete ad.type;
                        });

                        it('should return an Object indicating invalidity', function() {
                            expect(vast.validate()).toEqual({ valid: false, reasons: ['ads[0].type is required'] });
                        });
                    });

                    describe('without an ad system name', function() {
                        beforeEach(function() {
                            delete ad.system.name;
                        });

                        it('should return an Object indicating invalidity', function() {
                            expect(vast.validate()).toEqual({ valid: false, reasons: ['ads[0].system.name is required'] });
                        });
                    });

                    describe('without a title', function() {
                        beforeEach(function() {
                            delete ad.title;
                        });

                        it('should return an Object indicating invalidity', function() {
                            expect(vast.validate()).toEqual({ valid: false, reasons: ['ads[0].title is required'] });
                        });
                    });

                    describe('without an impression', function() {
                        beforeEach(function() {
                            ad.impressions.length = 0;
                        });

                        it('should return an Object indicating invalidity', function() {
                            expect(vast.validate()).toEqual({ valid: false, reasons: ['ads[0].impressions must contain at least one value'] });
                        });
                    });

                    describe('without any creatives', function() {
                        beforeEach(function() {
                            ad.creatives.length = 0;
                        });

                        it('should return an Object indicating invalidity', function() {
                            expect(vast.validate()).toEqual({ valid: false, reasons: ['ads[0].creatives must contain at least one value'] });
                        });
                    });

                    describe('with a linear creative', function() {
                        var creative, index;

                        beforeEach(function() {
                            creative = vast.find('ads[' + vast.ads.indexOf(ad) + '].creatives', function(creative) {
                                return creative.type === 'linear';
                            });
                            index = vast.ads[vast.ads.indexOf(ad)].creatives.indexOf(creative);
                        });

                        describe('without a type', function() {
                            beforeEach(function() {
                                delete creative.type;
                            });

                            it('should return an Object indicating invalidity', function() {
                                expect(vast.validate()).toEqual({ valid: false, reasons: ['ads[0].creatives[' + index + '].type is required'] });
                            });
                        });

                        describe('without a duration', function() {
                            beforeEach(function() {
                                delete creative.duration;
                            });

                            it('should return an Object indicating invalidity', function() {
                                expect(vast.validate()).toEqual({ valid: false, reasons: ['ads[0].creatives[' + index + '].duration is required'] });
                            });
                        });

                        describe('without any mediaFiles', function() {
                            beforeEach(function() {
                                creative.mediaFiles.length = 0;
                            });

                            it('should return an Object indicating invalidity', function() {
                                expect(vast.validate()).toEqual({ valid: false, reasons: ['ads[0].creatives[' + index + '].mediaFiles must contain at least one value'] });
                            });
                        });
                    });

                    describe('with a companion ads creative', function() {
                        var creative, index;

                        beforeEach(function() {
                            creative = vast.find('ads[' + vast.ads.indexOf(ad) + '].creatives', function(creative) {
                                return creative.type === 'companions';
                            });
                            index = vast.ads[vast.ads.indexOf(ad)].creatives.indexOf(creative);
                        });

                        describe('without a type', function() {
                            beforeEach(function() {
                                delete creative.type;
                            });

                            it('should return an Object indicating invalidity', function() {
                                expect(vast.validate()).toEqual({ valid: false, reasons: ['ads[0].creatives[' + index + '].type is required'] });
                            });
                        });

                        describe('companion', function() {
                            var companion;

                            beforeEach(function() {
                                companion = creative.companions[0];
                            });

                            describe('without any resources', function() {
                                beforeEach(function() {
                                    companion.resources.length = 0;
                                });

                                it('should return an Object indicating invalidity', function() {
                                    expect(vast.validate()).toEqual({ valid: false, reasons: ['ads[0].creatives[' + index + '].companions[0].resources must contain at least one value'] });
                                });
                            });
                        });
                    });

                    describe('with a nonLinear creative', function() {
                        var creative, index;

                        beforeEach(function() {
                            creative = vast.find('ads[' + vast.ads.indexOf(ad) + '].creatives', function(creative) {
                                return creative.type === 'nonLinear';
                            });
                            index = vast.ads[vast.ads.indexOf(ad)].creatives.indexOf(creative);
                        });

                        describe('without a type', function() {
                            beforeEach(function() {
                                delete creative.type;
                            });

                            it('should return an Object indicating invalidity', function() {
                                expect(vast.validate()).toEqual({ valid: false, reasons: ['ads[0].creatives[' + index + '].type is required'] });
                            });
                        });

                        describe('ad', function() {
                            var ad;

                            beforeEach(function() {
                                ad = creative.ads[0];
                            });

                            describe('without any resources', function() {
                                beforeEach(function() {
                                    ad.resources.length = 0;
                                });

                                it('should return an Object indicating invalidity', function() {
                                    expect(vast.validate()).toEqual({ valid: false, reasons: ['ads[0].creatives[' + index + '].ads[0].resources must contain at least one value'] });
                                });
                            });
                        });
                    });
                });

                describe('with a wrapper ad', function() {
                    var ad;

                    beforeEach(function() {
                        ad = vast.find('ads', function(ad) {
                            return ad.type === 'wrapper';
                        });
                    });

                    describe('with no type', function() {
                        beforeEach(function() {
                            delete ad.type;
                        });

                        it('should return an Object indicating invalidity', function() {
                            expect(vast.validate()).toEqual({ valid: false, reasons: ['ads[1].type is required'] });
                        });
                    });

                    describe('without an ad system name', function() {
                        beforeEach(function() {
                            delete ad.system.name;
                        });

                        it('should return an Object indicating invalidity', function() {
                            expect(vast.validate()).toEqual({ valid: false, reasons: ['ads[1].system.name is required'] });
                        });
                    });

                    describe('without a vastAdTagURI', function() {
                        beforeEach(function() {
                            delete ad.vastAdTagURI;
                        });

                        it('should return an Object indicating invalidity', function() {
                            expect(vast.validate()).toEqual({ valid: false, reasons: ['ads[1].vastAdTagURI is required'] });
                        });
                    });

                    describe('without an impression', function() {
                        beforeEach(function() {
                            ad.impressions.length = 0;
                        });

                        it('should return an Object indicating invalidity', function() {
                            expect(vast.validate()).toEqual({ valid: false, reasons: ['ads[1].impressions must contain at least one value'] });
                        });
                    });

                    describe('without any creatives', function() {
                        beforeEach(function() {
                            ad.creatives.length = 0;
                        });

                        it('should return an Object indicating validity', function() {
                            expect(vast.validate()).toEqual({ valid: true, reasons: null });
                        });
                    });
                });
            });
        });
    });
});
