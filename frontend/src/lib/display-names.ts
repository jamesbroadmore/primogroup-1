/**
 * Display name utilities — always prefer preferred_name across the platform.
 */

interface NameParts {
  first_name: string;
  last_name: string;
  preferred_name?: string | null;
}

/** Returns preferred_name if set, else first_name */
export function preferredFirst(person: NameParts | null | undefined): string {
  if (!person) return "—";
  return person.preferred_name || person.first_name;
}

/** Returns "PreferredOrFirst Last" */
export function fullName(person: NameParts | null | undefined): string {
  if (!person) return "—";
  return `${person.preferred_name || person.first_name} ${person.last_name}`;
}

/** Returns "PreferredOrFirst L." for compact display */
export function shortName(person: NameParts | null | undefined): string {
  if (!person) return "—";
  const first = person.preferred_name || person.first_name;
  return `${first} ${person.last_name?.[0] || ""}.`;
}
