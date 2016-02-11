'use strict';

var parseXML = require('./utils/parse_xml');
var timestampToSeconds = require('./utils/timestamp_to_seconds');
var stringToBoolean = require('./utils/string_to_boolean');
var extend = require('./utils/extend');
var trimObject = require('./utils/trim_object');
var numberify = require('./utils/numberify');

var creativeParsers = {
    linear: parseLinear,
    companions: parseCompanions,
    nonLinear: parseNonLinear
};

var adParsers = {
    inline: parseInline,
    wrapper: parseWrapper
};

function single(collection) {
    return collection[0] || { attributes: {} };
}

function parseResources(ad) {
    var resources = ad.find('StaticResource,IFrameResource,HTMLResource');

    return resources.map(function(resource) {
        return {
            type: resource.tag.replace(/Resource$/, '').toLowerCase(),
            creativeType: resource.attributes.creativeType,
            data: resource.value
        };
    });
}

function parseLinear(creative) {
    var duration = single(creative.find('Duration'));
    var events = creative.find('Tracking');
    var adParameters = single(creative.find('AdParameters'));
    var videoClicks = creative.find('VideoClicks')[0];
    var mediaFiles = creative.find('MediaFile');

    return {
        type: 'linear',
        duration: timestampToSeconds(duration.value) || undefined,
        trackingEvents: events.map(function(event) {
            return { event: event.attributes.event, uri: event.value };
        }),
        parameters: adParameters.value,
        videoClicks: videoClicks && (function() {
            var clickThrough = single(videoClicks.find('ClickThrough'));
            var trackings = videoClicks.find('ClickTracking');
            var customClicks = videoClicks.find('CustomClick');

            return {
                clickThrough: clickThrough.value,
                clickTrackings: trackings.map(function(tracking) {
                    return tracking.value;
                }),
                customClicks: customClicks.map(function(click) {
                    return { id: click.attributes.id, uri: click.value };
                })
            };
        }()),
        mediaFiles: mediaFiles.map(function(mediaFile) {
            var attrs = mediaFile.attributes;

            return {
                id: attrs.id,
                delivery: attrs.delivery,
                type: attrs.type,
                uri: mediaFile.value,
                bitrate: numberify(attrs.bitrate),
                width: numberify(attrs.width),
                height: numberify(attrs.height),
                scalable: stringToBoolean(attrs.scalable),
                maintainAspectRatio: stringToBoolean(attrs.maintainAspectRatio),
                apiFramework: attrs.apiFramework
            };
        })
    };
}

function parseCompanions(creative) {
    var companions = creative.find('Companion');

    return {
        type: 'companions',
        companions: companions.map(function(companion) {
            var events = companion.find('Tracking');
            var companionClickThrough = single(companion.find('CompanionClickThrough'));
            var altText = single(companion.find('AltText'));
            var adParameters = single(companion.find('AdParameters'));

            return {
                id: companion.attributes.id,
                width: numberify(companion.attributes.width),
                height: numberify(companion.attributes.height),
                expandedWidth: numberify(companion.attributes.expandedWidth),
                expandedHeight: numberify(companion.attributes.expandedHeight),
                apiFramework: companion.attributes.apiFramework,
                resources: parseResources(companion),
                trackingEvents: events.map(function(event) {
                    return { event: event.attributes.event, uri: event.value };
                }),
                clickThrough: companionClickThrough.value,
                altText: altText.value,
                parameters: adParameters.value
            };
        })
    };
}

function parseNonLinear(creative) {
    var ads = creative.find('NonLinear');
    var events = creative.find('Tracking');

    return {
        type: 'nonLinear',
        ads: ads.map(function(ad) {
            var nonLinearClickThrough = single(ad.find('NonLinearClickThrough'));
            var adParameters = single(ad.find('AdParameters'));

            return {
                id: ad.attributes.id,
                width: numberify(ad.attributes.width),
                height: numberify(ad.attributes.height),
                expandedWidth: numberify(ad.attributes.expandedWidth),
                expandedHeight: numberify(ad.attributes.expandedHeight),
                scalable: stringToBoolean(ad.attributes.scalable),
                maintainAspectRatio: stringToBoolean(ad.attributes.maintainAspectRatio),
                minSuggestedDuration: timestampToSeconds(ad.attributes.minSuggestedDuration) ||
                    undefined,
                apiFramework: ad.attributes.apiFramework,
                resources: parseResources(ad),
                clickThrough: nonLinearClickThrough.value,
                parameters: adParameters.value
            };
        }),
        trackingEvents: events.map(function(event) {
            return { event: event.attributes.event, uri: event.value };
        })
    };
}

function parseInline(ad) {
    var adTitle = single(ad.find('AdTitle'));
    var description = single(ad.find('Description'));
    var survey = single(ad.find('Survey'));

    return {
        type: 'inline',
        title: adTitle.value,
        description: description.value,
        survey: survey.value
    };
}

function parseWrapper(ad) {
    var vastAdTagURI = single(ad.find('VASTAdTagURI'));

    return {
        type: 'wrapper',
        vastAdTagURI: vastAdTagURI.value
    };
}

module.exports = function pojoFromXML(xml) {
    var $ = parseXML(xml);

    if (!$('VAST')[0]) {
        throw new Error('[' + xml + '] is not a valid VAST document.');
    }

    return trimObject({
        version: single($('VAST')).attributes.version,
        ads: $('Ad').map(function(ad) {
            var type = single(ad.find('Wrapper,InLine')).tag.toLowerCase();
            var adSystem = single(ad.find('AdSystem'));
            var errors = ad.find('Error');
            var impressions = ad.find('Impression');
            var creatives = ad.find('Creative');

            return extend({
                id: ad.attributes.id,
                system: {
                    name: adSystem.value,
                    version: adSystem.attributes.version
                },
                errors: errors.map(function(error) { return error.value; }),
                impressions: impressions.map(function(impression) {
                    return { uri: impression.value, id: impression.attributes.id };
                }),
                creatives: creatives.map(function(creative) {
                    var type = (function() {
                        var element = single(creative.find('Linear,CompanionAds,NonLinearAds'));

                        switch (element.tag) {
                        case 'Linear':
                            return 'linear';
                        case 'CompanionAds':
                            return 'companions';
                        case 'NonLinearAds':
                            return 'nonLinear';
                        }
                    }());

                    return extend({
                        id: creative.attributes.id,
                        sequence: numberify(creative.attributes.sequence),
                        adID: creative.attributes.AdID
                    }, creativeParsers[type](creative));
                })
            }, adParsers[type](ad));
        })
    }, true);
};
