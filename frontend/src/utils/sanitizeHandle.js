export function extractCleanHandle(input) {
  if (!input) return '';
  let str = String(input).trim();
  str = str.replace(/^https?:\/\//i, '');
  str = str.replace(/^(www\.)?(github\.com|leetcode\.com|codeforces\.com|codechef\.com|hackerrank\.com|atcoder\.jp|geeksforgeeks\.org)\/?/i, '');
  str = str.replace(/^(u|profile|users|in)\//i, '');
  str = str.replace(/^\/+|\/+$/g, '');
  str = str.replace(/^@+/, '');
  const segment = str.split(/[/?#]/)[0] || '';
  return segment.trim();
}
