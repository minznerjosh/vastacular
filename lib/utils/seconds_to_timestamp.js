'use strict';

function pad(number) {
    return ((number > 9) ? '' : '0') + number.toString();
}

module.exports = function secondsToTimestamp(seconds) {
    if (Number(seconds) !== seconds) { return null; }

    return [
        Math.floor(seconds / 60 / 60),
        Math.floor(seconds / 60 % 60),
        Math.floor(seconds % 60 % 60)
    ].map(pad).join(':');
};
