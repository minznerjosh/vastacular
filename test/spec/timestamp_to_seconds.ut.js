var timestampToSeconds = require('../../lib/utils/timestamp_to_seconds');

describe('timestampToSeconds(timestamp)', function() {
    it('should convert a timestamp with just seconds', function() {
        expect(timestampToSeconds('00:00:14')).toBe(14);
        expect(timestampToSeconds('00:00:44')).toBe(44);
        expect(timestampToSeconds('00:00:02')).toBe(2);
    });

    it('should convert a timestamp with just minutes', function() {
        expect(timestampToSeconds('00:04:00')).toBe(240);
        expect(timestampToSeconds('00:11:00')).toBe(660);
    });

    it('should convert a timestamp with just hours', function() {
        expect(timestampToSeconds('02:00:00')).toBe(7200);
        expect(timestampToSeconds('99:00:00')).toBe(356400);
    });

    it('should convert a timestamp with hours, minutes and seconds', function() {
        expect(timestampToSeconds('02:12:45')).toBe(7965);
        expect(timestampToSeconds('01:00:01')).toBe(3601);
    });

    it('should return null if not passed a timestamp', function() {
        expect(timestampToSeconds('hey')).toBeNull();
        expect(timestampToSeconds(undefined)).toBeNull();
    });
});
