import type { RecordFilter, RecordType } from '@/db/RecordType';
import z from 'zod';

export const testRecordSchema = z.object({
	id: z.string(),
	revision: z.number(),
	name: z.string(),
});

export type Record = z.infer<typeof testRecordSchema>;

export type TestRecordType = RecordType<Record, { name: string }>;

export const filterTest: RecordFilter<TestRecordType> = (
	record,
	filter?: { name: string },
) => {
	if (filter?.name && record.name !== filter.name) return false;
	return true;
};
