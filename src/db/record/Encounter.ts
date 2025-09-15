import z from 'zod';
import type { RecordFilter, RecordType } from '../RecordType';

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

export type EncounterRecordType = RecordType<
	Encounter,
	{ id?: string; name?: string }
>;

export const encounterFilter: RecordFilter<EncounterRecordType> = (
	record,
	filter,
) => {
	if (filter.id && record.id !== filter.id) return false;

	if (
		filter.name &&
		!record.name?.toLowerCase().includes(filter.name.toLowerCase())
	)
		return false;

	return true;
};
