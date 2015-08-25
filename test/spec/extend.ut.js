var extend = require('../../lib/utils/extend');

describe('extend(...objects)', function() {
    var one, two, three;

    beforeEach(function() {
        one = {
            hello: 'world',
            foo: 'bar'
        };
        two = {
            town: 'Princeton',
            zip: '08542'
        };
        three = {
            hello: 'is it me you\'re looking for?',
            state: 'NJ'
        };
    });

    it('should return a new object that combines all the properties of the provided ones', function() {
        expect(extend(one, two, three)).toEqual({
            hello: 'is it me you\'re looking for?',
            foo: 'bar',
            town: 'Princeton',
            zip: '08542',
            state: 'NJ'
        });
    });

    it('should handle null or undefined being an argument', function() {
        expect(extend(null, one)).toEqual(one);
    });
});
