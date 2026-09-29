/**
 * CAMPUS PULSE — CENTRALIZED BLOCKED USERS CONFIGURATION (BACKEND)
 * 
 * Blocked reporter/user identifiers for issue reporting.
 * Case-insensitive, trimmed, space-normalized exact token matching.
 */

export const BLOCKED_IDENTIFIERS = [
  'udbhav',
  'verma',
  'uv',
  '1ms24is137'
];

export const BLOCKED_USER_ERROR_MESSAGE = 'Your account is not allowed to submit issue reports.';

/**
 * Validates whether a reporter / user identifier is blocked from submitting issue reports.
 * 
 * @param {string} [identifier] The username, student ID, reporter name, or identifier string
 * @returns {boolean} true if blocked, false if allowed
 */
export function isBlockedUser(identifier) {
  if (!identifier || typeof identifier !== 'string') {
    return false;
  }

  const raw = identifier.trim().toLowerCase();
  if (!raw || raw === 'anonymous') {
    return false;
  }

  // 1. Normalized whitespace: collapse multiple internal spaces
  const normalized = raw.replace(/\s+/g, ' ');
  // 2. Stripped whitespace: remove all spaces
  const spaceStripped = raw.replace(/\s+/g, '');

  // Direct exact match checks against normalized blocked list
  for (const blocked of BLOCKED_IDENTIFIERS) {
    const blockedNormalized = blocked.toLowerCase().trim();
    const blockedSpaceStripped = blockedNormalized.replace(/\s+/g, '');

    if (normalized === blockedNormalized || spaceStripped === blockedSpaceStripped) {
      return true;
    }
  }

  // Exact token match check (prevents blocking "Suvarna" or "Silverman" while blocking "Udbhav Verma")
  const tokens = raw.split(/[\s/\-_,.:;]+/);
  for (const token of tokens) {
    const cleanToken = token.trim();
    if (!cleanToken) continue;
    for (const blocked of BLOCKED_IDENTIFIERS) {
      if (cleanToken === blocked.toLowerCase().trim()) {
        return true;
      }
    }
  }

  return false;
}
