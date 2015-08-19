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

VAST.prototype.get = function get(prop) {
    var parts = (prop || '').match(/[^\[\]\.]+/g) || [];

    return parts.reduce(function(result, part) {
        return (result || undefined) && result[part];
    }, this);
};

VAST.prototype.set = function set(prop, value) {
    var parts = (function() {
        var regex = (/[^\[\]\.]+/g);
        var result = [];

        var match;
        while (match = regex.exec(prop)) {
            result.push({
                token: match[0],
                type: getType(match, match.index + match[0].length)
            });
        }

        return result;
    }());
    var last = parts.pop();
    var object = parts.reduce(function(object, part) {
        return object[part.token] || (object[part.token] = new part.type());
    }, this);

    function getType(match, index) {
        switch (match.input.charAt(index)) {
        case '.':
            return Object;
        case '[':
            return Array;
        case ']':
            return getType(match, index + 1);
        default:
            return null;
        }
    }

    if (!prop) { throw new Error('prop must be specified.'); }

    return (object[last.token] = value);
};

VAST.pojoFromXML = require('./pojo_from_xml');

module.exports = VAST;
