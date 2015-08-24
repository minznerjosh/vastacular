var nodeifyPromise = require('../../lib/utils/nodeify_promise');
var LiePromise = require('lie');

describe('nodeifyPromise(promise, callback)', function() {
    var promise;
    var resolve, reject;
    var callback;
    var result;

    beforeEach(function() {
        callback = jasmine.createSpy('callback()');
        promise = new LiePromise(function(_resolve_, _reject_) {
            resolve = _resolve_;
            reject = _reject_;
        });

        result = nodeifyPromise(promise, callback);
    });

    it('should return the promise', function() {
        expect(result).toBe(promise);
    });

    describe('if the promise is fulfilled', function() {
        var value;

        beforeEach(function(done) {
            value = { foo: 'bar' };

            resolve(value);
            LiePromise.resolve().then(done);
        });

        it('should call the callback with (null, value)', function() {
            expect(callback).toHaveBeenCalledWith(null, value);
        });
    });

    describe('if the promise is rejected', function() {
        var reason;

        beforeEach(function(done) {
            reason = new Error('Everything is awful');

            reject(reason);
            LiePromise.resolve().then(done);
        });

        it('should callback with (reason)', function() {
            expect(callback).toHaveBeenCalledWith(reason);
        });
    });

    describe('if the callback is not a function', function() {
        beforeEach(function() {
            spyOn(promise, 'then').and.callThrough();
            result = nodeifyPromise(promise, 'foo');
        });

        it('should return the promise', function() {
            expect(result).toBe(promise);
        });

        it('should not listen for the promise\'s value/reason', function() {
            expect(promise.then).not.toHaveBeenCalled();
        });
    });
});
