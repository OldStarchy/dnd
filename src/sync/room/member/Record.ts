import z from 'zod';

import { DocumentApi } from '@/db/Collection';
import { defineRecordType, type RecordType } from '@/db/RecordType';

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
export type MemberRecordType = RecordType<Member, MemberFilter>;

type MemberFilter = { id?: string; name?: string; identity?: string };
function filterMember(member: Member, filter: MemberFilter) {
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
}

export const MemberCollectionSchema = defineRecordType({
	name: 'member',
	schema: memberSchema,
	filterFn: filterMember,
	documentClass: DocumentApi<MemberRecordType>,
});
