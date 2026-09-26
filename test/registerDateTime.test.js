import assert from 'node:assert/strict';
import test from 'node:test';

import { parseRegistrationDateTime } from '../src/utils/registerDateTime.js';

const expected = '2026-09-28T19:00:00.000Z';

test('parses Discord Unix seconds with every supported display style', () => {
    for (const style of ['', ':t', ':T', ':d', ':D', ':f', ':F', ':R']) {
        const parsed = parseRegistrationDateTime(`<t:1790622000${style}>`);
        assert.equal(parsed?.toISOString(), expected, style || 'no style');
    }
});

test('keeps accepting ISO date/time values', () => {
    assert.equal(
        parseRegistrationDateTime('2026-09-28T20:00:00+01:00')?.toISOString(),
        expected
    );
});

test('rejects malformed and out-of-range Discord timestamps', () => {
    for (const value of [
        '<t:1790622000:X>',
        '<t:1790622000:F> extra',
        '<t:1790622000.5:F>',
        '<t:999999999999999999999:F>',
        'not a date',
        '',
        null,
    ]) {
        assert.equal(parseRegistrationDateTime(value), null, String(value));
    }
});
