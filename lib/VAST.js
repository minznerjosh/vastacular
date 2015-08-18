'use strict';

var copy = require('./utils/copy');
var defaults = require('./utils/defaults');

var adDefaults = {
    inline: inline,
    wrapper: wrapper
};

var inlineDefaults = {
    linear: linear,
    companions: companions,
    nonLinear: nonLinear
};

function inline(ad) {
    defaults({
        description: null,
        survey: null
    }, ad);
}

function wrapper() {}

function linear(creative) {
    defaults({
        trackingEvents: [],
        parameters: null,
        videoClicks: null
    }, creative);

    creative.mediaFiles.forEach(function(mediaFile) {
        defaults({
            id: null,
            bitrate: null,
            scalable: null,
            maintainAspectRatio: null,
            apiFramework: null
        }, mediaFile);
    });
}

function companions(creative) {
    creative.companions.forEach(function(companion) {
        defaults({
            expandedWidth: null,
            expandedHeight: null,
            apiFramework: null,
            trackingEvents: [],
            clickThrough: null,
            altText: null,
            parameters: null
        }, companion);
    });
}

function nonLinear(creative) {
    defaults({
        trackingEvents: []
    }, creative);

    creative.ads.forEach(function(ad) {
        defaults({
            id: null,
            expandedWidth: null,
            expandedHeight: null,
            scalable: null,
            maintainAspectRatio: null,
            minSuggestedDuration: null,
            apiFramework: null,
            clickThrough: null,
            parameters: null
        }, ad);
    });
}

function VAST(json) {
    copy(json, this, true);

    this.ads.forEach(function(ad) {
        defaults({
            system: { version: null },
            errors: []
        }, ad);

        ad.creatives.forEach(function(creative) {
            defaults({
                id: null,
                sequence: null,
                adID: null
            }, creative);

            inlineDefaults[creative.type](creative);
        });

        adDefaults[ad.type](ad);
    });
}

VAST.pojoFromXML = require('./pojo_from_xml');

module.exports = VAST;
