import { z } from 'zod';

import { type CreatureIdBrand, creatureSchema } from '@/db/record/Creature';
import type { RecordFilter, RecordType } from '@/db/RecordType';

import type { EncounterIdBrand } from './Encounter';

declare const InitiativeTableIdBrand: unique symbol;
export type InitiativeTableIdBrand = typeof InitiativeTableIdBrand;

export const initiativeTableEntrySchema = z.object({
	id: z.string().brand<InitiativeTableIdBrand>(),
	revision: z.number(),
	encounterId: z.string().brand<EncounterIdBrand>(),
	effect: z.literal('invisible').optional(),
	healthDisplay: z.string(),
	initiative: z.number(),

	creature: z
		.object({
			type: z.literal('unique'),
			id: z.string().brand<CreatureIdBrand>(),
		})
		.or(
			z.object({
				type: z.literal('generic'),
				data: creatureSchema.omit({ id: true, revision: true }),
			}),
		),
});

export type InitiativeTableEntry = z.infer<typeof initiativeTableEntrySchema>;

export type InitiativeTableEntryRecord = RecordType<
	InitiativeTableEntry,
	{ id?: string; encounterId?: string }
>;

export const initiativeTableEntryFilter: RecordFilter<
	InitiativeTableEntryRecord
> = (record, filter) => {
	if (!filter) return true;

	if (filter.id && record.id !== filter.id) return false;

	if (filter.encounterId && record.encounterId !== filter.encounterId)
		return false;

	return true;
};
