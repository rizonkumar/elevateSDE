export interface ForumTag {
  id: string;
  label: string;
}

export const FORUM_TAGS: ForumTag[] = [
  { id: 'system-design', label: 'System Design' },
  { id: 'leetcode', label: 'LeetCode' },
  { id: 'behavioral', label: 'Behavioral' },
  { id: 'offers', label: 'Offers' },
  { id: 'referrals', label: 'Referrals' },
  { id: 'faang', label: 'FAANG' },
  { id: 'startups', label: 'Startups' },
  { id: 'resume', label: 'Resume' },
];

export function getTagLabel(id: string): string {
  return FORUM_TAGS.find((tag) => tag.id === id)?.label ?? id;
}
