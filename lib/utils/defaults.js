'use strict';

var push = Array.prototype.push;

function isObject(value) {
    return Object(value) === value;
}

function isArray(value) {
    return value instanceof Array;
}

module.exports = function defaults(config, target) {
    if ([config, target].every(isArray)) {
        push.apply(target, config.filter(function(item) {
            return target.indexOf(item) < 0;
        }));

        return target;
    }

    return Object.keys(config).reduce(function(target, key) {
        var values = [config[key], target[key]];

        if (values.every(isObject)) {
            defaults(config[key], target[key]);
        }

        if (!(key in target)) {
            target[key] = config[key];
        }

        return target;
    }, target);
};
