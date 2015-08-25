'use strict';

var secondsToTimestamp = require('./utils/seconds_to_timestamp');
var compileXML = require('./utils/compile_xml');

var creativeCompilers = {
    linear: compileLinear,
    companions: compileCompanions,
    nonLinear: compileNonLinear
};

function createTrackingEvents(trackingEvents) {
    return {
        tag: 'TrackingEvents',
        children: trackingEvents.map(function(trackingEvent) {
            return {
                tag: 'Tracking',
                attributes: { event: trackingEvent.event },
                value: trackingEvent.uri,
                cdata: true
            };
        })
    };
}

function createResources(resources) {
    return resources.map(function(resource) {
        return {
            tag: (function(type) {
                switch (type) {
                case 'static':
                    return 'StaticResource';
                case 'iframe':
                    return 'IFrameResource';
                case 'html':
                    return 'HTMLResource';
                }
            }(resource.type)),
            attributes: { creativeType: resource.creativeType },
            value: resource.data,
            cdata: true
        };
    });
}

function createAdParameters(creative) {
    return {
        tag: 'AdParameters',
        value: creative.parameters
    };
}

function compileLinear(creative) {
    return {
        tag: 'Linear',
        children: [
            {
                tag: 'Duration',
                value: secondsToTimestamp(creative.duration)
            },
            createTrackingEvents(creative.trackingEvents),
            createAdParameters(creative)
        ].concat(creative.videoClicks ? [
            {
                tag: 'VideoClicks',
                children: [
                    {
                        tag: 'ClickThrough',
                        value: creative.videoClicks.clickThrough,
                        cdata: true
                    }
                ].concat(creative.videoClicks.clickTrackings.map(function(clickTracking) {
                    return {
                        tag: 'ClickTracking',
                        value: clickTracking,
                        cdata: true
                    };
                }), creative.videoClicks.customClicks.map(function(customClick) {
                    return {
                        tag: 'CustomClick',
                        attributes: { id: customClick.id },
                        value: customClick.uri,
                        cdata: true
                    };
                }))
            }
        ]: [], [
            {
                tag: 'MediaFiles',
                children: creative.mediaFiles.map(function(mediaFile) {
                    return {
                        tag: 'MediaFile',
                        attributes: {
                            id: mediaFile.id,
                            width: mediaFile.width,
                            height: mediaFile.height,
                            bitrate: mediaFile.bitrate,
                            type: mediaFile.type,
                            delivery: mediaFile.delivery,
                            scalable: mediaFile.scalable,
                            maintainAspectRatio: mediaFile.maintainAspectRatio,
                            apiFramework: mediaFile.apiFramework
                        },
                        value: mediaFile.uri,
                        cdata: true
                    };
                })
            }
        ])
    };
}

function compileCompanions(creative) {
    return {
        tag: 'CompanionAds',
        children: creative.companions.map(function(companion) {
            return {
                tag: 'Companion',
                attributes: {
                    id: companion.id,
                    width: companion.width,
                    height: companion.height,
                    expandedWidth: companion.expandedWidth,
                    expandedHeight: companion.expandedHeight,
                    apiFramework: companion.apiFramework
                },
                children: createResources(companion.resources).concat([
                    createTrackingEvents(companion.trackingEvents),
                    {
                        tag: 'CompanionClickThrough',
                        value: companion.clickThrough,
                        cdata: true
                    },
                    {
                        tag: 'AltText',
                        value: companion.altText
                    },
                    createAdParameters(companion)
                ])
            };
        })
    };
}

function compileNonLinear(creative) {
    return {
        tag: 'NonLinearAds',
        children: creative.ads.map(function(ad) {
            return {
                tag: 'NonLinear',
                attributes: {
                    id: ad.id,
                    width: ad.width,
                    height: ad.height,
                    expandedWidth: ad.expandedWidth,
                    expandedHeight: ad.expandedHeight,
                    scalable: ad.scalable,
                    maintainAspectRatio: ad.maintainAspectRatio,
                    minSuggestedDuration: secondsToTimestamp(ad.minSuggestedDuration),
                    apiFramework: ad.apiFramework
                },
                children: createResources(ad.resources).concat([
                    {
                        tag: 'NonLinearClickThrough',
                        value: ad.clickThrough,
                        cdata: true
                    },
                    createAdParameters(ad)
                ])
            };
        }).concat([
            createTrackingEvents(creative.trackingEvents)
        ])
    };
}


module.exports = function xmlFromVast(vast) {
    return compileXML({
        tag: 'VAST',
        attributes: { version: vast.get('version') },
        children: vast.map('ads', function(ad) {
            return {
                tag: 'Ad',
                attributes: { id: ad.id },
                children: [
                    {
                        tag: (function() {
                            switch (ad.type) {
                            case 'inline':
                                return 'InLine';
                            case 'wrapper':
                                return 'Wrapper';
                            }
                        }()),
                        children: [
                            {
                                tag: 'AdSystem',
                                attributes: { version: ad.system.version },
                                value: ad.system.name
                            },
                            {
                                tag: 'AdTitle',
                                value: ad.title
                            },
                            {
                                tag: 'Description',
                                value: ad.description
                            },
                            {
                                tag: 'Survey',
                                value: ad.survey,
                                cdata: true
                            },
                            {
                                tag: 'VASTAdTagURI',
                                value: ad.vastAdTagURI,
                                cdata: true
                            }
                        ].concat(ad.errors.map(function(error) {
                            return {
                                tag: 'Error',
                                value: error,
                                cdata: true
                            };
                        }), ad.impressions.map(function(impression) {
                            return {
                                tag: 'Impression',
                                value: impression.uri,
                                cdata: true,
                                attributes: { id: impression.id }
                            };
                        }), [
                            {
                                tag: 'Creatives',
                                children: ad.creatives.map(function(creative) {
                                    return {
                                        tag: 'Creative',
                                        attributes: {
                                            id: creative.id,
                                            sequence: creative.sequence,
                                            AdID: creative.adID
                                        },
                                        children: [(function(type) {
                                            return creativeCompilers[type](creative);
                                        }(creative.type))]
                                    };
                                }),
                                required: true
                            }
                        ])
                    }
                ]
            };
        })
    }, true);
};
