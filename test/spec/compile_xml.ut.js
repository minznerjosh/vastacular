var compileXML = require('../../lib/utils/compile_xml');

describe('compileXML(data, trim)', function() {
    var data;
    var expected;

    beforeEach(function() {
        data = {
            tag: 'VAST',
            attributes: { version: '2.0' },
            children: [
                {
                    tag: 'Ad',
                    attributes: { id: '601364' },
                    children: [
                        {
                            tag: 'InLine',
                            attributes: {},
                            children: [
                                {
                                    tag: 'AdSystem',
                                    value: 'Acudeo Compatible',
                                    attributes: { version: null }
                                },
                                {
                                    tag: 'AdTitle',
                                    value: 'VAST 2.0 Instream Test 1'
                                },
                                {
                                    tag: 'Description',
                                    value: 'VAST 2.0 Instream Test 1',
                                    children: []
                                },
                                {
                                    tag: 'Error',
                                    value: 'http://myErrorURL/error',
                                    cdata: true
                                },
                                {
                                    tag: 'Impression',
                                    value: 'http://myTrackingURL/impression',
                                    cdata: true
                                },
                                {
                                    tag: 'Creatives',
                                    children: [
                                        {
                                            tag: 'Creative',
                                            attributes: { 'AdID': '601364' },
                                            children: [
                                                {
                                                    tag: 'Linear',
                                                    children: [
                                                        {
                                                            tag: 'Duration',
                                                            value: '00:00:30'
                                                        },
                                                        {
                                                            tag: 'TrackingEvents',
                                                            children: [
                                                                {
                                                                    tag: 'Tracking',
                                                                    attributes: { event: 'creativeView' },
                                                                    value: 'http://myTrackingURL/creativeView',
                                                                    cdata: true
                                                                },
                                                                {
                                                                    tag: 'Tracking',
                                                                    attributes: { event: 'start' },
                                                                    value: 'http://myTrackingURL/start',
                                                                    cdata: true
                                                                },
                                                                {
                                                                    tag: 'Tracking',
                                                                    attributes: { event: 'midpoint' },
                                                                    value: 'http://myTrackingURL/midpoint',
                                                                    cdata: true
                                                                },
                                                                {
                                                                    tag: 'Tracking',
                                                                    attributes: { event: 'firstQuartile' },
                                                                    value: 'http://myTrackingURL/firstQuartile',
                                                                    cdata: true
                                                                },
                                                                {
                                                                    tag: 'Tracking',
                                                                    attributes: { event: 'thirdQuartile' },
                                                                    value: 'http://myTrackingURL/thirdQuartile',
                                                                    cdata: true
                                                                },
                                                                {
                                                                    tag: 'Tracking',
                                                                    attributes: { event: 'complete' },
                                                                    value: 'http://myTrackingURL/complete',
                                                                    cdata: true
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            tag: 'VideoClicks',
                                                            children: [
                                                                {
                                                                    tag: 'ClickThrough',
                                                                    value: 'http://www.tremormedia.com',
                                                                    cdata: true
                                                                },
                                                                {
                                                                    tag: 'ClickTracking',
                                                                    value: 'http://myTrackingURL/click',
                                                                    cdata: true
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            tag: 'MediaFiles',
                                                            children: [
                                                                {
                                                                    tag: 'MediaFile',
                                                                    attributes: {
                                                                        delivery: 'progressive',
                                                                        type: 'video/x-flv',
                                                                        bitrate: '500',
                                                                        width: 400,
                                                                        height: 300,
                                                                        scalable: true,
                                                                        maintainAspectRatio: true
                                                                    },
                                                                    value: 'http://cdnp.tremormedia.com/video/acudeo/Carrot_400x300_500kb.flv',
                                                                    cdata: true
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            tag: 'Creative',
                                            attributes: { AdID: '601364-Companion' },
                                            children: [
                                                {
                                                    tag: 'CompanionAds',
                                                    children: [
                                                        {
                                                            tag: 'Companion',
                                                            attributes: { width: '300', height: '250' },
                                                            children: [
                                                                {
                                                                    tag: 'StaticResource',
                                                                    attributes: { creativeType: 'image/jpeg' },
                                                                    value: 'http://demo.tremormedia.com/proddev/vast/Blistex1.jpg',
                                                                    cdata: true
                                                                },
                                                                {
                                                                    tag: 'TrackingEvents',
                                                                    children: [
                                                                        {
                                                                            tag: 'Tracking',
                                                                            attributes: { event: 'creativeView' },
                                                                            value: 'http://myTrackingURL/firstCompanionCreativeView',
                                                                            cdata: true
                                                                        }
                                                                    ]
                                                                },
                                                                {
                                                                    tag: 'CompanionClickThrough',
                                                                    value: 'http://www.tremormedia.com',
                                                                    cdata: true
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            tag: 'Companion',
                                                            attributes: { width: '728', height: '90' },
                                                            children: [
                                                                {
                                                                    tag: 'StaticResource',
                                                                    attributes: { creativeType: 'image/jpeg' },
                                                                    value: 'http://demo.tremormedia.com/proddev/vast/728x90_banner1.jpg',
                                                                    cdata: true
                                                                },
                                                                {
                                                                    tag: 'CompanionClickThrough',
                                                                    value: 'http://www.tremormedia.com',
                                                                    cdata: true
                                                                },
                                                                {
                                                                    tag: 'TrackingEvents'
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    tag: 'Extensions',
                                    children: [
                                        {
                                            tag: 'Extension',
                                            children: [
                                                {
                                                    tag: 'Empty',
                                                    cdata: true
                                                },
                                                {
                                                    tag: 'Bool',
                                                    cdata: true,
                                                    value: true
                                                },
                                                {
                                                    tag: 'False',
                                                    cdata: true,
                                                    value: false,
                                                    attributes: { attr: false }
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        expected = require('fs').readFileSync(require.resolve('../helpers/example.xml')).toString().trim();
    });

    it('should compile the JS object into a string of XML', function() {
        expect(compileXML(data)).toBe(expected);
    });

    describe('if the contents must be escaped', function() {
        beforeEach(function() {
            data = {
                tag: 'root',
                children: [
                    {
                        tag: 'foo',
                        value: 'A quote is this: "It\'s going to be a bumpy ride for me & my friends!"'
                    },
                    {
                        tag: 'bar',
                        attributes: {
                            quote: '"',
                            apostrophe: '\'',
                            ampersand: '&',
                            tag: '<bar>'
                        },
                        value: '"I don\'t need to be escpaed!" <xml> CDATA rules!',
                        cdata: true
                    },
                    {
                        tag: 'tag',
                        value: '<xml>'
                    },
                    {
                        tag: 'data',
                        value: 'It is hard to put a ]]> in a cdata section. You have to split up the ]]>... It\'s not easy.',
                        cdata: true
                    }
                ]
            };

            expected = require('fs').readFileSync(require.resolve('../helpers/special.xml')).toString().trim();
        });

        it('should escape them', function() {
            expect(compileXML(data)).toBe(expected);
        });
    });

    describe('if trim is true', function() {
        beforeEach(function() {
            data = {
                tag: 'User',
                children: [
                    {
                        tag: 'name',
                        value: 'Joshua D. Minzner'
                    },
                    {
                        tag: 'company',
                        attributes: { privacy: 'self', age: undefined },
                        value: 'Cinema6, Inc.'
                    },
                    {
                        tag: 'superiors',
                        value: undefined,
                        children: [],
                        required: true
                    },
                    {
                        tag: 'friends',
                        attributes: { public: true },
                        children: []
                    },
                    {
                        tag: 'phone',
                        attributes: { foo: null, bar: undefined },
                        value: null
                    },
                    {
                        tag: 'town',
                        value: undefined
                    },
                    {
                        tag: 'website',
                        value: 'http://www.minzner.org',
                        cdata: true,
                        attributes: { personal: false, maxVisits: null }
                    },
                    {
                        tag: 'hungry',
                        value: false
                    },
                    {
                        tag: 'homes',
                        value: 0,
                        cdata: true
                    },
                    {
                        tag: 'Children',
                        children: []
                    },
                    {
                        tag: 'parents',
                        attributes: { foo: null, bar: undefined },
                        children: [
                            {
                                tag: 'parent',
                                children: [{ tag: 'name', value: 'Louan' }]
                            },
                            {
                                tag: 'parent',
                                children: [{ tag: 'name', value: 'Dan' }]
                            }
                        ]
                    }
                ]
            };

            expected = require('fs').readFileSync(require.resolve('../helpers/trimmable.xml')).toString().trim();
        });

        it('should remove elements and attributes with no values', function() {
            expect(compileXML(data, true)).toBe(expected);
        });
    });
});
