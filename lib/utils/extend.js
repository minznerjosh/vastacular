'use strict';

module.exports = function extend(/*...objects*/) {
    var objects = Array.prototype.slice.call(arguments);

    return objects.reduce(function(result, object) {
        return Object.keys(object || {}).reduce(function(result, key) {
            result[key] = object[key];
            return result;
        }, result);
    }, {});
};
