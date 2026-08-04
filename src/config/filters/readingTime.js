/**
 * Rough reading time for a post body, in whole minutes.
 *
 * Takes the RENDERED content (HTML), strips tags and entities, and divides by
 * 200 words per minute - a common average for prose read on screen. Deliberately
 * rounded up and floored at 1, because "0 min read" is nonsense and a decimal
 * implies a precision that doesn't exist.
 *
 * Usage: {{ content | readingTime }} -> 5
 */
module.exports = function (content) {
    if (!content) return 1;

    const words = String(content)
        // drop script/style bodies before stripping tags, or their contents
        // would be counted as prose
        .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        // entities collapse to a single character, not a word
        .replace(/&[a-z#0-9]+;/gi, " ")
        .split(/\s+/)
        .filter(Boolean).length;

    return Math.max(1, Math.round(words / 200));
};
