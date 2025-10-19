import { z } from 'zod';

import { defineRecordType, type RecordType } from '@/db/RecordType';
import { debuffSpec } from '@/type/Debuff';

import { DocumentApi } from '../Collection';

declare const CreatureIdBrand: unique symbol;
export type CreatureIdBrand = typeof CreatureIdBrand;

export const creatureSchema = z.object({
	id: z.string().brand<CreatureIdBrand>(),
	revision: z.number(),

	name: z.string().min(1, 'Name is required'),
	race: z.string().nullable().default(null),
	images: z.array(z.string()),
	hp: z.coerce.number().int(),
	maxHp: z.coerce.number().int(),
	hitpointsRoll: z.string().nullable().default(null), // e.g., "2d10+5"
	ac: z.coerce.number().int().nullable().default(null),
	speed: z.object({
		walk: z.string().nullable().default(null),
		fly: z.string().nullable().default(null),
		swim: z.string().nullable().default(null),
		climb: z.string().nullable().default(null),
		burrow: z.string().nullable().default(null),
		other: z.string().nullable().default(null),
	}),
	attributes: z.object({
		strength: z.int().nullable().default(10),
		dexterity: z.int().nullable().default(10),
		constitution: z.int().nullable().default(10),
		intelligence: z.int().nullable().default(10),
		wisdom: z.int().nullable().default(10),
		charisma: z.int().nullable().default(10),
	}),
	debuffs: debuffSpec.array(),
	description: z.string().nullable().default(null),
});

export const restrictedCreatureSchema = z.object({
	id: z.string().brand<CreatureIdBrand>(),
	revision: z.number(),

	...creatureSchema.omit({ id: true, revision: true }).partial().shape,
});

/**
 * Represents a creature (player, NPC, monster, etc.) in the game.
 */
export type Creature = z.infer<typeof creatureSchema>;

export type CreatureRecordType = RecordType<
	Creature,
	Parameters<typeof filterCreature>[1]
>;

export const CreatureCollectionSchema = defineRecordType({
	name: 'creature',
	schema: creatureSchema,
	filterFn: filterCreature,
	documentClass: DocumentApi<CreatureRecordType>,
});

function filterCreature(
	creature: Creature,
	filter: {
		id?: string;
		name?: string;
		race?: string;
		hp?: number | { min?: number; max?: number };
	},
) {
	if (filter.id && creature.id !== filter.id) {
		return false;
	}

	if (filter.name && creature.name !== filter.name) {
		return false;
	}

	if (filter.race && creature.race !== filter.race) {
		return false;
	}

	if (filter.hp) {
		if (typeof filter.hp === 'number') {
			if (creature.hp !== filter.hp) {
				return false;
			}
		} else {
			if (filter.hp.min && creature.hp < filter.hp.min) {
				return false;
			}
			if (filter.hp.max && creature.hp > filter.hp.max) {
				return false;
			}
		}
	}

	return true;
}
