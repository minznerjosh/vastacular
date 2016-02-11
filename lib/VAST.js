'use strict';

var LiePromise = require('lie');
var request = require('superagent');
var copy = require('./utils/copy');
var defaults = require('./utils/defaults');
var extend = require('./utils/extend');
var nodeifyPromise = require('./utils/nodeify_promise');
var push = Array.prototype.push;
var xmlFromVast = require('./xml_from_vast');

var adDefaults = {
    inline: inline,
    wrapper: wrapper
};

var inlineDefaults = {
    linear: linear,
    companions: companions,
    nonLinear: nonLinear
};

function noop() {}

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

    (creative.mediaFiles || []).forEach(function(mediaFile) {
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

    this.__private__ = { wrappers: [], inlines: [] };
}

Object.defineProperties(VAST.prototype, {
    wrappers: {
        get: function getWrappers() {
            var wrappers = this.__private__.wrappers;

            wrappers.length = 0;
            push.apply(wrappers, this.filter('ads', function(ad) {
                return ad.type === 'wrapper';
            }));

            return wrappers;
        }
    },

    inlines: {
        get: function getInlines() {
            var inlines = this.__private__.inlines;

            inlines.length = 0;
            push.apply(inlines, this.filter('ads', function(ad) {
                return ad.type === 'inline';
            }));

            return inlines;
        }
    }
});

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

VAST.prototype.map = function map(prop, mapper) {
    var array = this.get(prop) || [];
    var length = array.length;
    var result = [];

    if (!(array instanceof Array)) { return result; }

    var index = 0;
    for (; index < length; index++) {
        result.push(mapper.call(this, array[index], index, array));
    }

    return result;
};

VAST.prototype.filter = function filter(prop, predicate) {
    var array = this.get(prop) || [];
    var length = array.length;
    var result = [];

    if (!(array instanceof Array)) { return result; }

    var index = 0;
    for (; index < length; index++) {
        if (predicate.call(this, array[index], index, array)) {
            result.push(array[index]);
        }
    }

    return result;
};

VAST.prototype.find = function find(prop, predicate) {
    var array = this.get(prop) || [];
    var length = array.length;

    if (!(array instanceof Array)) { return undefined; }

    var index = 0;
    for (; index < length; index++) {
        if (predicate.call(this, array[index], index, array)) {
            return array[index];
        }
    }

    return undefined;
};

VAST.prototype.toPOJO = function toPOJO() {
    var pojo = JSON.parse(JSON.stringify(this));
    delete pojo.__private__;

    return pojo;
};

VAST.prototype.copy = function copy() {
    return new this.constructor(this.toPOJO());
};

VAST.prototype.resolveWrappers = function resolveWrappers(/*maxRedirects, callback*/) {
    var maxRedirects = isNaN(arguments[0]) ? Infinity : arguments[0];
    var callback = typeof arguments[0] === 'function' ? arguments[0] : arguments[1];

    var VAST = this.constructor;
    var vast = this;

    function decorateWithWrapper(wrapper, ad) {
        var wrapperCreativesByType = byType(wrapper.creatives);

        function typeIs(type) {
            return function checkType(creative) { return creative.type === type; };
        }

        function byType(creatives) {
            return {
                linear: creatives.filter(typeIs('linear')),
                companions: creatives.filter(typeIs('companions')),
                nonLinear: creatives.filter(typeIs('nonLinear'))
            };
        }

        // Extend the ad with the impressions and errors from the wrapper
        defaults(wrapper.impressions, ad.impressions);
        defaults(wrapper.errors, ad.errors);

        // Extend the ad's creatives with the creatives in the wrapper
        ad.creatives.forEach(function(creative) {
            defaults(wrapperCreativesByType[creative.type].shift() || {}, creative);
        });

        // If the ad is also a wrapper, add any of the wrapper's unused creatives to the ad so that
        // the final inline ad can use all of the creatives from the wrapper.
        push.apply(ad.creatives, ad.type !== 'wrapper' ? [] : [
            'linear', 'companions', 'nonLinear'
        ].reduce(function(result, type) {
            return result.concat(wrapperCreativesByType[type]);
        }, []));

        return ad;
    }

    if (maxRedirects === 0) {
        return LiePromise.reject(new Error('Too many redirects were made.'));
    }

    return nodeifyPromise(LiePromise.all(this.map('wrappers', function requestVAST(wrapper) {
        return LiePromise.resolve(request.get(wrapper.vastAdTagURI))
            .then(function makeVAST(response) {
                return {
                    wrapper: wrapper,
                    response: VAST.pojoFromXML(response.text).ads
                };
            });
    })).then(function merge(configs) {
        var wrappers = configs.map(function(config) { return config.wrapper; });
        var responses = configs.map(function(config) { return config.response; });

        return new VAST(extend(vast.toPOJO(), {
            ads: vast.map('ads', function(ad) {
                var wrapperIndex = wrappers.indexOf(ad);
                var wrapper = wrappers[wrapperIndex];
                var response = responses[wrapperIndex];

                return response ? response.map(decorateWithWrapper.bind(null, wrapper)) : [ad];
            }).reduce(function(result, array) { return result.concat(array); })
        }));
    }).then(function recurse(result) {
        if (result.get('wrappers.length') > 0) {
            return result.resolveWrappers(maxRedirects - 1);
        }

        return result;
    }), callback);
};

VAST.prototype.toXML = function toXML() {
    var check = this.validate();

    if (!check.valid) {
        throw new Error('VAST is invalid: ' + check.reasons.join(', '));
    }

    return xmlFromVast(this);
};

VAST.prototype.validate = function validate() {
    var vast = this;
    var reasons = [];
    var adValidators = {
        inline: function validateInlineAd(getAdProp) {
            var creativeValidators = {
                linear: function validateLinearCreative(getCreativeProp) {
                    makeAssertions(getCreativeProp, {
                        exists: ['duration'],
                        atLeastOne: ['mediaFiles']
                    });
                },
                companions: function validateCompanionsCreative(getCreativeProp) {
                    vast.get(getCreativeProp('companions')).forEach(function(companion, index) {
                        function getCompanionProp(prop) {
                            return getCreativeProp('companions[' + index + '].' + prop);
                        }

                        makeAssertions(getCompanionProp, {
                            exists: [],
                            atLeastOne: ['resources']
                        });
                    });
                },
                nonLinear: function validateNonLinearCreative(getCreativeProp) {
                    vast.get(getCreativeProp('ads')).forEach(function(ad, index) {
                        function getAdProp(prop) {
                            return getCreativeProp('ads[' + index + '].' + prop);
                        }

                        makeAssertions(getAdProp, {
                            exists: [],
                            atLeastOne: ['resources']
                        });
                    });
                }
            };

            makeAssertions(getAdProp, {
                exists: ['title'],
                atLeastOne: ['creatives']
            });

            vast.get(getAdProp('creatives')).forEach(function(creative, index) {
                function getCreativeProp(prop) {
                    return getAdProp('creatives[' + index + '].' + prop);
                }

                makeAssertions(getCreativeProp, {
                    exists: ['type'],
                    atLeastOne: []
                });

                (creativeValidators[creative.type] || noop)(getCreativeProp);
            });
        },
        wrapper: function validateWrapperAd(getAdProp) {
            makeAssertions(getAdProp, {
                exists: ['vastAdTagURI'],
                atLeastOne:[]
            });
        }
    };

    function assert(truthy, reason) {
        if (!truthy) { reasons.push(reason); }
    }

    function assertExists(prop) {
        assert(vast.get(prop), prop + ' is required');
    }

    function assertAtLeastOneValue(prop) {
        assert(vast.get(prop + '.length') > 0, prop + ' must contain at least one value');
    }

    function makeAssertions(getter, types) {
        types.exists.map(getter).forEach(assertExists);
        types.atLeastOne.map(getter).forEach(assertAtLeastOneValue);
    }

    makeAssertions(function(prop) { return prop; }, {
        exists: [],
        atLeastOne: ['ads']
    });

    this.get('ads').forEach(function(ad, index) {
        function getAdProp(prop) {
            return 'ads[' + index + '].' + prop;
        }

        makeAssertions(getAdProp, {
            exists: ['type', 'system.name'],
            atLeastOne: ['impressions']
        });

        (adValidators[ad.type] || noop)(getAdProp);
    });

    return { valid: reasons.length === 0, reasons: reasons.length === 0 ? null : reasons };
};

VAST.pojoFromXML = require('./pojo_from_xml');

VAST.fetch = function fetch(uri/*, options, callback*/) {
    var options = typeof arguments[1] === 'object' ? arguments[1] || {} : {};
    var callback = typeof arguments[2] === 'function' ? arguments[2] : arguments[1];

    var VAST = this;

    return nodeifyPromise(LiePromise.resolve(request.get(uri).set(options.headers || {}))
        .then(function makeVAST(response) {
            var vast = new VAST(VAST.pojoFromXML(response.text));

            return options.resolveWrappers ? vast.resolveWrappers(options.maxRedirects) : vast;
        }), callback);
};

module.exports = VAST;
