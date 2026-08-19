function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Strips PII (email, phone, and user profile fields) from text.
 * @param {string} text - The input message string.
 * @param {object} profile - Known user profile details (name, college, branch, etc.).
 * @returns {string} Redacted text.
 */
function redactText(text, profile = {}) {
  if (!text || typeof text !== 'string') return '';

  let sanitized = text;

  // 1. Redact general email addresses
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '[email]');

  // 2. Redact phone numbers (covers international, indian, and standard 10-12 digit formats)
  sanitized = sanitized.replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[phone]');
  sanitized = sanitized.replace(/\b(?:\+?91[\-\s]?)?[6-9]\d{9}\b/g, '[phone]');

  // 3. Redact user's known profile details if available
  const fields = [
    { value: profile.name, placeholder: '[Candidate]' },
    { value: profile.college, placeholder: '[College]' },
    { value: profile.branch, placeholder: '[Branch]' },
    { value: profile.leetcodeUsername, placeholder: '[username]' }
  ];

  fields.forEach(({ value, placeholder }) => {
    if (value && typeof value === 'string' && value.trim().length > 1) {
      const regex = new RegExp(`\\b${escapeRegex(value.trim())}\\b`, 'gi');
      sanitized = sanitized.replace(regex, placeholder);
    }
  });

  return sanitized;
}

module.exports = { redactText };
