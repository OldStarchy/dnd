import type { RecordType } from '@/db/RecordType';
import z from 'zod';

export const roomMetaSchema = z.object({
	id: z.string(),
	revision: z.number(),
	name: z.string(),
	description: z.string().optional(),
});

export type RoomMeta = z.infer<typeof roomMetaSchema>;

export type RoomMetaRecordType = RecordType<RoomMeta, void>;
