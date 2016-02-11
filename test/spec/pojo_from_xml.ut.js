var pojoFromXML = require('../../lib/pojo_from_xml');
var parseXML = require('../../lib/utils/parse_xml');
var timestampToSeconds = require('../../lib/utils/timestamp_to_seconds');
var stringToBoolean = require('../../lib/utils/string_to_boolean');
var trimObject = require('../../lib/utils/trim_object');
var xml = require('fs').readFileSync(require.resolve('../helpers/vast_2.0.xml')).toString();
var minimalXML = require('fs').readFileSync(require.resolve('../helpers/vast_2.0--minimal.xml')).toString();
var invalidXML = require('fs').readFileSync(require.resolve('../helpers/vast_2.0--invalid.xml')).toString();

describe('pojoFromXML(xml)', function() {
    var pojo;
    var queryXML;

    beforeEach(function() {
        queryXML = parseXML(xml);
        pojo = pojoFromXML(xml);
    });

    it('should set the vast version', function() {
        expect(pojo.version).toBe(queryXML('VAST')[0].attributes.version);
    });

    it('should include an Array of ads', function() {
        expect(pojo.ads).toEqual(jasmine.any(Array));
        expect(pojo.ads.length).toBe(queryXML('Ad').length);
    });

    it('should throw an error if nonsense is provided', function() {
        expect(function() { pojoFromXML('foo bar'); }).toThrow(new Error('[foo bar] is not a valid VAST document.'));
    });

    describe('an inline ad', function() {
        var inline;
        var inlineXML;

        beforeEach(function() {
            inline = pojo.ads[0];
            inlineXML = queryXML('Ad')[0];
        });

        it('should have an id', function() {
            expect(inline.id).toBe(inlineXML.attributes.id);
        });

        it('should have its type set to inline', function() {
            expect(inline.type).toBe('inline');
        });

        it('should have a system', function() {
            var adSystem = inlineXML.find('AdSystem')[0];

            expect(inline.system).toEqual({
                name: adSystem.value,
                version: adSystem.attributes.version
            });
        });

        it('should have a title', function() {
            expect(inline.title).toEqual(inlineXML.find('AdTitle')[0].value);
        });

        it('should have a description', function() {
            expect(inline.description).toEqual(inlineXML.find('Description')[0].value);
        });

        it('should have a survey', function() {
            expect(inline.survey).toEqual(inlineXML.find('Survey')[0].value);
        });

        it('should have errors', function() {
            expect(inline.errors).toEqual(inlineXML.find('Error').map(function(error) {
                return error.value;
            }));
        });

        it('should have impressions', function() {
            expect(inline.impressions).toEqual(inlineXML.find('Impression').map(function(impression) {
                return {
                    uri: impression.value,
                    id: impression.attributes.id
                };
            }));
        });

        it('should have an Array of impressions', function() {
            expect(inline.creatives).toEqual(jasmine.any(Array));
            expect(inline.creatives.length).toBe(inlineXML.find('Creative').length);
        });

        describe('a linear creative', function() {
            var linear;
            var linearXML;

            beforeEach(function() {
                linear = inline.creatives[0];
                linearXML = inlineXML.find('Creative')[0];
            });

            it('should have an id', function() {
                expect(linear.id).toBe(linearXML.attributes.id);
            });

            it('should have a sequence', function() {
                expect(linear.sequence).toBe(parseInt(linearXML.attributes.sequence, 10));
            });

            it('should have an adID', function() {
                expect(linear.adID).toBe(linearXML.attributes.AdID);
            });

            it('should have a type', function() {
                expect(linear.type).toBe('linear');
            });

            it('should have a duration', function() {
                expect(linear.duration).toBe(timestampToSeconds(linearXML.find('Duration')[0].value));
            });

            it('should have trackingEvents', function() {
                expect(linear.trackingEvents).toEqual(linearXML.find('Tracking').map(function(tracking) {
                    return { event: tracking.attributes.event, uri: tracking.value };
                }));
            });

            it('should have parameters', function() {
                expect(linear.parameters).toBe(linearXML.find('AdParameters')[0].value);
            });

            it('should have videoClicks', function() {
                expect(linear.videoClicks).toEqual({
                    clickThrough: linearXML.find('ClickThrough')[0].value,
                    clickTrackings: linearXML.find('ClickTracking').map(function(tracking) { return tracking.value; }),
                    customClicks: linearXML.find('CustomClick').map(function(click) {
                        return { id: click.attributes.id, uri: click.value };
                    })
                });
            });

            it('should have mediaFiles', function() {
                expect(linear.mediaFiles).toEqual(linearXML.find('MediaFile').map(function(mediaFile) {
                    return trimObject({
                        id: mediaFile.attributes.id,
                        delivery: mediaFile.attributes.delivery,
                        type: mediaFile.attributes.type,
                        uri: mediaFile.value,
                        bitrate: parseInt(mediaFile.attributes.bitrate),
                        width: parseInt(mediaFile.attributes.width),
                        height: parseInt(mediaFile.attributes.height),
                        scalable: stringToBoolean(mediaFile.attributes.scalable),
                        maintainAspectRatio: stringToBoolean(mediaFile.attributes.maintainAspectRatio),
                        apiFramework: mediaFile.attributes.apiFramework
                    });
                }));
            });

            it('should only have the properties of a linear creative', function() {
                expect(Object.keys(linear)).toEqual([
                    'id',
                    'sequence',
                    'adID',
                    'type',
                    'duration',
                    'trackingEvents',
                    'parameters',
                    'videoClicks',
                    'mediaFiles'
                ]);
            });
        });

        describe('a companions creative', function() {
            var companion;
            var companionXML;

            beforeEach(function() {
                companion = inline.creatives[1];
                companionXML = inlineXML.find('Creative')[1];
            });

            it('should have an id', function() {
                expect(companion.id).toBe(companionXML.attributes.id);
            });

            it('should have a sequence', function() {
                expect(companion.sequence).toBe(parseInt(companionXML.attributes.sequence, 10));
            });

            it('should have an adID', function() {
                expect(companion.adID).toBe(companionXML.attributes.AdID);
            });

            it('should have a type', function() {
                expect(companion.type).toBe('companions');
            });

            it('should have companions', function() {
                expect(companion.companions.length).toBe(companionXML.find('Companion').length);
                expect(companion.companions).toEqual(companionXML.find('Companion').map(function(companion) {
                    return trimObject({
                        id: companion.attributes.id,
                        width: parseInt(companion.attributes.width, 10),
                        height: parseInt(companion.attributes.height, 10),
                        expandedWidth: parseInt(companion.attributes.expandedWidth, 10) || undefined,
                        expandedHeight: parseInt(companion.attributes.expandedHeight, 10) || undefined,
                        apiFramework: companion.attributes.apiFramework,
                        resources: companion.find('StaticResource,IFrameResource,HTMLResource').map(function(resource) {
                            return trimObject({
                                type: (function(tag) {
                                    switch (tag) {
                                    case 'StaticResource':
                                        return 'static';
                                    case 'IFrameResource':
                                        return 'iframe';
                                    case 'HTMLResource':
                                        return 'html';
                                    }
                                }(resource.tag)),
                                creativeType: resource.attributes.creativeType,
                                data: resource.value
                            });
                        }),
                        trackingEvents: companion.find('Tracking').map(function(event) {
                            return {
                                event: event.attributes.event,
                                uri: event.value
                            };
                        }),
                        clickThrough: (companion.find('CompanionClickThrough')[0] || {}).value,
                        altText: (companion.find('AltText')[0] || {}).value,
                        parameters: (companion.find('AdParameters')[0] || {}).value
                    });
                }));
            });

            it('should only have the properties of a companions creative', function() {
                expect(Object.keys(companion)).toEqual([
                    'id',
                    'sequence',
                    'adID',
                    'type',
                    'companions'
                ]);
            });
        });

        describe('a non-linear creative', function() {
            var nonLinear;
            var nonLinearXML;

            beforeEach(function() {
                nonLinear = inline.creatives[2];
                nonLinearXML = inlineXML.find('Creative')[2];
            });

            it('should have an id', function() {
                expect(nonLinear.id).toBe(nonLinearXML.attributes.id);
            });

            it('should have a sequence', function() {
                expect(nonLinear.sequence).toBe(parseInt(nonLinearXML.attributes.sequence));
            });

            it('should have a type', function() {
                expect(nonLinear.type).toBe('nonLinear');
            });

            it('should have ads', function() {
                expect(nonLinear.ads).toEqual(jasmine.any(Array));
                expect(nonLinear.ads.length).toBe(nonLinearXML.find('NonLinear').length);
            });

            describe('ads :', function() {
                [0, 1].forEach(function(index) {
                    describe(index, function() {
                        var ad;
                        var adXML;

                        beforeEach(function() {
                            ad = nonLinear.ads[index];
                            adXML = nonLinearXML.find('NonLinear')[index];
                        });

                        it('should have an id', function() {
                            expect(ad.id).toBe(adXML.attributes.id);
                        });

                        it('should have a width', function() {
                            expect(ad.width).toBe(parseInt(adXML.attributes.width));
                        });

                        it('should have a height', function() {
                            expect(ad.height).toBe(parseInt(adXML.attributes.height));
                        });

                        it('should have an expandedWidth', function() {
                            expect(ad.expandedWidth).toBe(parseInt(adXML.attributes.expandedWidth) || undefined);
                        });

                        it('should have an expandedHeight', function() {
                            expect(ad.expandedHeight).toBe(parseInt(adXML.attributes.expandedHeight) || undefined);
                        });

                        it('should have a scalable boolean', function() {
                            expect(ad.scalable).toBe(stringToBoolean(adXML.attributes.scalable));
                        });

                        it('should have a maintainAspectRatio boolean', function() {
                            expect(ad.maintainAspectRatio).toBe(stringToBoolean(adXML.attributes.maintainAspectRatio));
                        });

                        it('should have a minSuggestedDuration', function() {
                            expect(ad.minSuggestedDuration).toBe(timestampToSeconds(adXML.attributes.minSuggestedDuration) || undefined);
                        });

                        it('should have an apiFramework', function() {
                            expect(ad.apiFramework).toBe(adXML.attributes.apiFramework);
                        });

                        it('should have resources', function() {
                            expect(ad.resources).toEqual(adXML.find('StaticResource,IFrameResource,HTMLResource').map(function(resource) {
                                return trimObject({
                                    type: (function(tag) {
                                        switch (tag) {
                                        case 'StaticResource':
                                            return 'static';
                                        case 'IFrameResource':
                                            return 'iframe';
                                        case 'HTMLResource':
                                            return 'html';
                                        }
                                    }(resource.tag)),
                                    creativeType: resource.attributes.creativeType,
                                    data: resource.value
                                });
                            }));
                        });

                        it('should have a clickThrough', function() {
                            expect(ad.clickThrough).toBe((adXML.find('NonLinearClickThrough')[0] || {}).value);
                        });

                        it('should have parameters', function() {
                            expect(ad.parameters).toBe((adXML.find('AdParameters')[0] || {}).value);
                        });
                    });
                });
            });

            it('should have trackingEvents', function() {
                expect(nonLinear.trackingEvents).toEqual(nonLinearXML.find('Tracking').map(function(tracking) {
                    return {
                        event: tracking.attributes.event,
                        uri: tracking.value
                    };
                }));
            });

            it('should only have the properties of a nonLinear creative', function() {
                expect(Object.keys(nonLinear)).toEqual([
                    'id',
                    'sequence',
                    'type',
                    'ads',
                    'trackingEvents'
                ]);
            });
        });

        it('should only have the keys of an inline ad', function() {
            expect(Object.keys(inline)).toEqual([
                'id',
                'system',
                'errors',
                'impressions',
                'creatives',
                'type',
                'title',
                'description',
                'survey'
            ]);
        });
    });

    describe('a wrapper ad', function() {
        var wrapper;
        var wrapperXML;

        beforeEach(function() {
            wrapper = pojo.ads[1];
            wrapperXML = queryXML('Ad')[1];
        });

        it('should have an id', function() {
            expect(wrapper.id).toBe(wrapperXML.attributes.id);
        });

        it('should have a type', function() {
            expect(wrapper.type).toBe('wrapper');
        });

        it('should have a system', function() {
            expect(wrapper.system).toEqual({
                name: wrapperXML.find('AdSystem')[0].value,
                version: wrapperXML.find('AdSystem')[0].attributes.version
            });
        });

        it('should have a vastAdTagURI', function() {
            expect(wrapper.vastAdTagURI).toBe(wrapperXML.find('VASTAdTagURI')[0].value);
        });

        it('should have errors', function() {
            expect(wrapper.errors).toEqual(wrapperXML.find('Error').map(function(error) { return error.value; }));
        });

        it('should have impressions', function() {
            expect(wrapper.impressions).toEqual(wrapperXML.find('Impression').map(function(impression) {
                return { id: impression.attributes.id, uri: impression.value };
            }));
        });

        it('should have creatives', function() {
            expect(wrapper.creatives).toEqual(jasmine.any(Array));
            expect(wrapper.creatives.length).toEqual(wrapperXML.find('Creative').length);
        });

        it('should only have the keys of a wrapper ad', function() {
            expect(Object.keys(wrapper)).toEqual([
                'id',
                'system',
                'errors',
                'impressions',
                'creatives',
                'type',
                'vastAdTagURI'
            ]);
        });
    });

    describe('if given minimal xml', function() {
        beforeEach(function() {
            queryXML = parseXML(minimalXML);
            pojo = pojoFromXML(minimalXML);
        });

        it('should parse the version', function() {
            expect(pojo.version).toBe(queryXML('VAST')[0].attributes.version);
        });

        describe('the inline ad', function() {
            var inline;
            var inlineXML;

            beforeEach(function() {
                inline = pojo.ads[0];
                inlineXML = queryXML('Ad')[0];
            });

            it('should be parsed', function() {
                expect(inline).toEqual({
                    id: '229',
                    type: 'inline',
                    title: 'LiveRail creative 2',
                    system: {
                        name: 'LiveRail'
                    },
                    errors: [],
                    impressions: [{ uri: 'http://pr.ybp.yahoo.com/sync/liverail/3.1427315934667.3769710346467753322' }],
                    creatives: [
                        {
                            type: 'linear',
                            duration: 11,
                            trackingEvents: [],
                            mediaFiles: [{
                                delivery: 'progressive',
                                type: 'video/x-flv',
                                uri: 'http://cdn.liverail.com/adasset4/1331/229/7969/lo.flv',
                                width: 640,
                                height: 480
                            }]
                        },
                        {
                            type: 'companions',
                            companions: [{
                                width: 300,
                                height: 60,
                                resources: [{
                                    type: 'static',
                                    creativeType: 'application/x-shockwave-flash',
                                    data: 'http://cdn.liverail.com/adasset4/1331/229/7969/5122396e510b80db6b5ef4013ddabe90.swf',
                                }],
                                trackingEvents: []
                            }]
                        },
                        {
                            type: 'nonLinear',
                            ads: [{
                                width: 300,
                                height: 60,
                                resources: [{
                                    type: 'iframe',
                                    data: 'http://cdn.liverail.com/adasset/228/8455/overlay.html'
                                }]
                            }],
                            trackingEvents: []
                        }
                    ]
                });
            });
        });

        describe('the wrapper ad', function() {
            var wrapper;
            var wrapperXML;

            beforeEach(function() {
                wrapper = pojo.ads[1];
                wrapperXML = queryXML('Ad')[1];
            });

            it('should be parsed', function() {
                expect(wrapper).toEqual({
                    id: '602833',
                    type: 'wrapper',
                    system: { name: 'Acudeo Compatible' },
                    errors: [],
                    impressions: [{ uri: 'http://myTrackingURL/wrapper/impression' }],
                    creatives: [],
                    vastAdTagURI: 'http://demo.tremormedia.com/proddev/vast/vast_inline_linear.xml'
                });
            });
        });
    });

    describe('if given invalid VAST', function() {
        beforeEach(function() {
            queryXML = parseXML(invalidXML);
            pojo = pojoFromXML(invalidXML);
        });

        it('should be parsed', function() {
            expect(pojo).toEqual({
                version: '2.0',
                ads: [
                    {
                        type: 'inline',
                        system: {},
                        errors: [],
                        impressions: [],
                        creatives: [
                            {
                                type: 'linear',
                                trackingEvents: [],
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
            });
        });
    });
});
