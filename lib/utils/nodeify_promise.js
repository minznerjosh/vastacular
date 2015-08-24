'use strict';

module.exports = function nodeifyPromise(promise, callback) {
    if (typeof callback !== 'function') { return promise; }

    promise.then(function callbackValue(value) {
        callback(null, value);
    }, function callbackReason(reason) {
        callback(reason);
    });

    return promise;
};
