var secondsToTimestamp = require('../../lib/utils/seconds_to_timestamp');

describe('secondsToTimestamp(seconds)', function() {
    it('should convert less than a minute', function() {
        expect(secondsToTimestamp(0)).toBe('00:00:00');
        expect(secondsToTimestamp(3)).toBe('00:00:03');
        expect(secondsToTimestamp(10)).toBe('00:00:10');
        expect(secondsToTimestamp(22)).toBe('00:00:22');
        expect(secondsToTimestamp(59)).toBe('00:00:59');
    });

    it('should convert more than a minute', function() {
        expect(secondsToTimestamp(60)).toBe('00:01:00');
        expect(secondsToTimestamp(69)).toBe('00:01:09');
        expect(secondsToTimestamp(71)).toBe('00:01:11');
        expect(secondsToTimestamp(145)).toBe('00:02:25');
        expect(secondsToTimestamp(721)).toBe('00:12:01');
        expect(secondsToTimestamp(3599)).toBe('00:59:59');
    });

    it('should convert more than an hour', function() {
        expect(secondsToTimestamp(3600)).toBe('01:00:00');
        expect(secondsToTimestamp(3745)).toBe('01:02:25');
        expect(secondsToTimestamp(4321)).toBe('01:12:01');
        expect(secondsToTimestamp(10799)).toBe('02:59:59');
        expect(secondsToTimestamp(51129)).toBe('14:12:09');
        expect(secondsToTimestamp(436321)).toBe('121:12:01');
    });

    it('should return null if not passed a Number', function() {
        expect(secondsToTimestamp()).toBeNull();
        expect(secondsToTimestamp(null)).toBeNull();
        expect(secondsToTimestamp(true)).toBeNull();
        expect(secondsToTimestamp(false)).toBeNull();
        expect(secondsToTimestamp('foo')).toBeNull();
        expect(secondsToTimestamp(undefined)).toBeNull();
    });
});
