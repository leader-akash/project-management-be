/**
 * Capitalizes each word (handles multiple spaces; empty-safe).
 * @param {string} input
 * @returns {string}
 */
function toTitleCase(input) {
  if (input == null || typeof input !== "string") return input;
  const trimmed = input.trim();
  if (!trimmed) return "";
  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

module.exports = { toTitleCase };
