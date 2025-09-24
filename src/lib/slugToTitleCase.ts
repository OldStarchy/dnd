export default function slugToTitleCase(slug: string) {
	return slug.replace(
		/(^|-)(\w)/g,
		(_, s, c) => (s === '-' ? ' ' : '') + c.toUpperCase(),
	);
}
