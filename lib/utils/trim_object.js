'use strict';

module.exports = function trimObject(object, deep) {
    if (Object(object) !== object) { return object; }

    return Object.keys(object).reduce(function(result, key) {
        if (deep && object[key] instanceof Array) {
            result[key] = object[key]
                .filter(function(value) { return value !== undefined; })
                .map(function(value) { return trimObject(value, true); });
        } else if (deep && object[key] instanceof Object) {
            result[key] = trimObject(object[key], true);
        } else if (object[key] !== undefined) {
            result[key] = object[key];
        }

        return result;
    }, {});
};
