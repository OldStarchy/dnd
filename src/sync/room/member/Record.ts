import type { RecordFilter, RecordType } from '@/db/RecordType';
import z from 'zod';

export const memberSchema = z.object({
	id: z.string(),
	revision: z.number(),
	name: z.string(),
	avatar: z.string().optional(),
	identities: z
		.object({
			host: z.string(),
			id: z.string().brand<'MemberId'>(),
		})
		.array(),
});

export type Member = z.infer<typeof memberSchema>;

export type MemberRecordType = RecordType<
	Member,
	{ id?: string; name?: string; identity?: string }
>;

export const filterMember: RecordFilter<MemberRecordType> = (
	member,
	filter,
) => {
	if (!filter) {
		return true;
	}

	if (filter.id && member.id !== filter.id) {
		return false;
	}

	if (filter.name && member.name !== filter.name) {
		return false;
	}

	if (filter.identity) {
		return member.identities.some(
			(identity) => identity.id === filter.identity,
		);
	}

	return true;
};
