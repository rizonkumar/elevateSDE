export function buildDisplayName(firstName: string | null, lastName: string | null): string {
  const name = [firstName, lastName].filter((part) => part && part.trim().length > 0).join(' ');
  return name.length > 0 ? name : 'Member';
}
