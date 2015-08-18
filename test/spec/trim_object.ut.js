var trimObject = require('../../lib/utils/trim_object');

describe('trimObject(object, deep)', function() {
    var object;

    beforeEach(function() {
        object = {
            id: 33,
            exists: true,
            sup: undefined,
            foo: 0,
            params: null,
            name: 'Josh',
            something: undefined,
            arr: [
                {
                    foo: 'hey',
                    bar: undefined,
                    sub: { age: 24, name: undefined }
                },
                null,
                undefined,
                {
                    foo: 'hey',
                    bar: 'cool'
                }
            ],
            sub: {
                foo: 'bar',
                cool: undefined,
                sub: { foo: 'bar', cool: undefined }
            }
        };
    });

    it('should return a new object without any undefined properties', function() {
        expect(trimObject(object)).toEqual({
            id: 33,
            exists: true,
            foo: 0,
            params: null,
            name: 'Josh',
            arr: [
                {
                    foo: 'hey',
                    bar: undefined,
                    sub: { age: 24, name: undefined }
                },
                null,
                undefined,
                {
                    foo: 'hey',
                    bar: 'cool'
                }
            ],
            sub: {
                foo: 'bar',
                cool: undefined,
                sub: { foo: 'bar', cool: undefined }
            }
        });
    });

    it('should trim sub-objects if deep is true', function() {
        expect(trimObject(object, true)).toEqual({
            id: 33,
            exists: true,
            foo: 0,
            params: null,
            name: 'Josh',
            arr: [
                {
                    foo: 'hey',
                    sub: { age: 24 }
                },
                null,
                {
                    foo: 'hey',
                    bar: 'cool'
                }
            ],
            sub: {
                foo: 'bar',
                sub: { foo: 'bar' }
            }
        });
    });

    it('should return whatever is passed ot it if passed a non-object', function() {
        expect(trimObject(null)).toBe(null);
        expect(trimObject('foo')).toBe('foo');
        expect(trimObject(undefined)).toBe(undefined);
    });
});
