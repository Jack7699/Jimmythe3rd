const DISCORD_TIMESTAMP = /^<t:(-?\d+)(?::[tTdDfFR])?>$/;

export const REGISTRATION_DATE_TIME_HELP =
    'Use an ISO 8601 date/time like `2026-09-28T20:00:00+01:00` or a Discord timestamp like `<t:1790622000:F>`.';

export function parseRegistrationDateTime(value) {
    if (typeof value !== 'string') return null;

    const input = value.trim();
    const match = DISCORD_TIMESTAMP.exec(input);

    if (match) {
        // Discord timestamps contain Unix seconds, while Date expects milliseconds.
        const seconds = Number(match[1]);
        if (!Number.isSafeInteger(seconds)) return null;

        const date = new Date(seconds * 1000);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    if (input.startsWith('<t:')) return null;

    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? null : date;
}
