'use strict';

module.exports = function stringToBoolean(string) {
    switch ((string || '').toLowerCase()) {
    case 'true':
        return true;
    case 'false':
        return false;
    }
};
