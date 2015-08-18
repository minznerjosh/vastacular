'use strict';

module.exports = function numberify(value) {
    if (!(/string|number|boolean/).test(typeof value)) { return undefined; }

    return isNaN(value) ? undefined : Number(value);
};
