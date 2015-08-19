var copy = require('../../lib/utils/copy');
var extend = require('../../lib/utils/extend');

describe('copy(object, [target], [deep])', function() {
    var object;
    var result;

    beforeEach(function() {
        object = {
            name: 'Josh',
            age: 24,
            spouse: null,
            parents: [{ name: 'louan' }, { name: 'dan' }],
            address: {
                city: 'Princeton',
                state: 'NJ',
                meta: {
                    type: 'home'
                }
            }
        };
    });

    it('should return its first argument if passed a non-object', function() {
        expect(copy(null)).toBe(null);
        expect(copy(undefined)).toBe(undefined);
        expect(copy('foo')).toBe('foo');
        expect(copy(22)).toBe(22);
        expect(copy(true)).toBe(true);
    });

    describe('with no target', function() {
        beforeEach(function() {
            result = copy(object);
        });

        it('should return a shallow copy of the original', function() {
            expect(result).toEqual(object);
            expect(result).not.toBe(object);
            expect(result.address).toBe(object.address);
            expect(result.parents).toBe(object.parents);
        });
    });

    describe('with a target', function() {
        var target;

        beforeEach(function() {
            target = { foo: 'hello' };
            result = copy(object, target);
        });

        it('should return the target with the properties of the object shallow-copied to it', function() {
            expect(result).toEqual(extend(target, object));
            expect(result).toBe(target);
            expect(result.address).toBe(object.address);
        });
    });

    describe('with deep set to true', function() {
        beforeEach(function() {
            result = copy(object, null, true);
        });

        it('should create a deep copy of the original', function() {
            expect(result).toEqual(object);
            expect(result.address).not.toBe(object.address);
            expect(result.address.meta).not.toBe(object.address.meta);
        });
    });

    it('should work with just deep set', function() {
        expect(copy(object, true)).toEqual(copy(object, null, true));
    });

    describe('with arrays', function() {
        var array;

        beforeEach(function() {
            array = [{ name: 'Josh', address: { state: 'NJ' } }, { name: 'Evan', address: { state: 'NJ' } }];
        });

        describe('shallow copies', function() {
            beforeEach(function() {
                result = copy(array, null, false);
            });

            it('should work', function() {
                expect(result).toEqual(array);
                expect(result[0]).toBe(array[0]);
                expect(result[1]).toBe(array[1]);
            });
        });

        describe('deep copies', function() {
            beforeEach(function() {
                result = copy(array, null, true);
            });

            it('should work', function() {
                expect(result).toEqual(array);
                expect(result[0]).not.toBe(array[0]);
                expect(result[1]).not.toBe(array[1]);
                expect(result[0].address).not.toBe(array[0].address);
                expect(result[1].address).not.toBe(array[1].address);
            });
        });

        describe('copies with a target', function() {
            var target;

            beforeEach(function() {
                target = ['foo'];
                result = copy(array, target);
            });

            it('should work', function() {
                expect(result).toEqual(['foo'].concat(array));
                expect(result).toBe(target);
            });
        });
    });
});
