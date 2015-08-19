var defaults = require('../../lib/utils/defaults');

describe('defaults(config, target)', function() {
    var config;
    var target;
    var result;

    beforeEach(function() {
        config = {
            name: null,
            age: 0,
            parents: [],
            phone: '555-555-5555',
            params: null,
            address: {
                city: null,
                state: 'NJ'
            },
            tags: ['human', 'employee']
        };
        target = {
            name: 'Josh',
            age: 24,
            phone: null,
            params: { foo: 'bar' },
            address: {
                city: 'Princeton'
            },
            tags: ['male', 'employee', 'engineer']
        };

        result = defaults(config, target);
    });

    it('should return the target', function() {
        expect(result).toBe(target);
    });

    it('should recursively give the target any properties the config has but it doesn\'t', function() {
        expect(target).toEqual({
            name: 'Josh',
            age: 24,
            phone: null,
            params: { foo: 'bar' },
            parents: [],
            address: {
                city: 'Princeton',
                state: 'NJ'
            },
            tags: ['male', 'employee', 'engineer', 'human']
        });
    });

    describe('if passed arrays', function() {
        beforeEach(function() {
            config = ['human', 'employee'];
            target = ['male', 'employee', 'engineer'];

            result = defaults(config, target);
        });

        it('should combine the arrays', function() {
            expect(result).toEqual(['male', 'employee', 'engineer', 'human']);
        });
    });

    describe('if the config is an array and the target is an object', function() {
        beforeEach(function() {
            config = ['foo', 'bar'];
            target = { foo: 'foo', bar: 'bar' };

            result = defaults(config, target);
        });

        it('should remain an object', function() {
            expect(result).toEqual({
                0: 'foo',
                1: 'bar',
                foo: 'foo',
                bar: 'bar'
            });
        });
    });

    describe('if the config is an object and the target is an Array', function() {
        beforeEach(function() {
            config = { foo: 'foo', bar: 'bar' };
            target = ['foo', 'bar'];

            result = defaults(config, target);
        });

        it('should remain an array', function() {
            var expected = ['foo', 'bar'];
            expected.foo = 'foo';
            expected.bar = 'bar';

            expect(result).toEqual(expected);
        });
    });
});
