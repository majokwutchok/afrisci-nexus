// Shared learner display helpers used by leaderboard/summary backend functions.

export function displayName(name, email) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return parts[0] + ' ' + parts[parts.length - 1].charAt(0) + '.';
  }
  if (!email) return 'Anonymous';
  const [u, d] = email.split('@');
  return (u ? u.slice(0, 2) : '') + '***@' + (d || '');
}