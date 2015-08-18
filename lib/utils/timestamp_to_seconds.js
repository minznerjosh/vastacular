'use strict';

module.exports = function timestampToSeconds(timestamp) {
    var parts = (timestamp || '').match(/^(\d\d):(\d\d):(\d\d)$/);

    return parts && parts.slice(1, 4).map(parseFloat).reduce(function(seconds, time, index) {
        var multiplier = Math.pow(60, Math.abs(index - 2));

        return seconds + (time * multiplier);
    }, 0);
};
