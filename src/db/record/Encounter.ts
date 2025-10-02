import z from 'zod';

import { defineRecordType, type RecordType } from '@/db/RecordType';
import EncounterApi from '@/type/EncounterApi';

declare const EncounterIdBrand: unique symbol;
export type EncounterIdBrand = typeof EncounterIdBrand;

export const encounterSchema = z.object({
	id: z.string().brand<EncounterIdBrand>(),
	revision: z.number(),
	name: z.string().optional(),
	description: z.string().optional(),
	backgroundImage: z.string().optional(),
	currentTurn: z.string().nullable(),
});

export type Encounter = z.infer<typeof encounterSchema>;
type EncounterFilter = { id?: string; name?: string };
export type EncounterRecordType = RecordType<Encounter, EncounterFilter>;

export const EncounterCollectionSchema = defineRecordType({
	name: 'encounter',
	schema: encounterSchema,
	filterFn: (record, filter: EncounterFilter) => {
		if (!filter) return true;

		if (filter.id && record.id !== filter.id) return false;

		if (
			filter.name &&
			!record.name?.toLowerCase().includes(filter.name.toLowerCase())
		)
			return false;

		return true;
	},
	documentClass: EncounterApi,
});

export type EncounterCollectionSchema = typeof EncounterCollectionSchema;
