import z from 'zod';

import type { RecordType } from '@/db/RecordType';

declare const RoomMetaIdBrand: unique symbol;
export type RoomMetaIdBrand = typeof RoomMetaIdBrand;

export const roomMetaSchema = z.object({
	id: z.string().brand<RoomMetaIdBrand>(),
	revision: z.number(),
	name: z.string(),
	description: z.string().optional(),
});

export type RoomMeta = z.infer<typeof roomMetaSchema>;

export type RoomMetaRecordType = RecordType<RoomMeta, void>;
