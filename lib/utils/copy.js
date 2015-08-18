'use strict';

var push = Array.prototype.push;

function copyObject(object, target, deep) {
    return Object.keys(object).reduce(function(result, key) {
        result[key] = (deep ? copy(object[key], null, true) : object[key]);
        return result;
    }, target || {});
}

function copyArray(array, _target_, deep) {
    var target = _target_ || [];

    push.apply(target, deep ? array.map(function(item) { return copy(item, null, true); }) : array);

    return target;
}

function copy(object/*, target, deep*/) {
    var target = ((typeof arguments[1] === 'object') || null) && arguments[1];
    var deep = (typeof arguments[1] === 'boolean') ? arguments[1] : arguments[2];

    if (Object(object) !== object) { return object; }

    return (object instanceof Array) ?
        copyArray(object, target, deep) :
        copyObject(object, target, deep);
}

module.exports = copy;
