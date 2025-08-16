import type { RecordFilter, RecordType } from '@/db/RecordType';
import { z } from 'zod';
import { debuffSpec } from './Debuff';

export const creatureSchema = z.object({
	id: z.string(),
	revision: z.number(),

	name: z.string().min(1, 'Name is required'),
	race: z.string().optional(),
	images: z.array(z.string()).optional(),
	hp: z.coerce.number().int(),
	maxHp: z.coerce.number().int(),
	hitpointsRoll: z.string().optional(), // e.g., "2d10+5"
	ac: z.coerce.number().int().optional(),
	speed: z
		.object({
			walk: z.string().optional(),
			fly: z.string().optional(),
			swim: z.string().optional(),
			climb: z.string().optional(),
			burrow: z.string().optional(),
			other: z.string().optional(),
		})
		.optional(),
	attributes: z
		.object({
			strength: z.coerce.number().int().optional(),
			dexterity: z.coerce.number().int().optional(),
			constitution: z.coerce.number().int().optional(),
			intelligence: z.coerce.number().int().optional(),
			wisdom: z.coerce.number().int().optional(),
			charisma: z.coerce.number().int().optional(),
		})
		.optional(),
	debuffs: debuffSpec.array().optional(),
	description: z.string().optional(),
});

/**
 * Represents a creature (player, NPC, monster, etc.) in the game.
 */
export type Creature = z.infer<typeof creatureSchema>;

export type CreatureRecordType = RecordType<
	Creature,
	{
		id?: string;
		name?: string;
		race?: string;
		hp?: number | { min?: number; max?: number };
	}
>;

export const filterCreature: RecordFilter<CreatureRecordType> = (
	creature,
	filter,
) => {
	if (!filter) {
		return true;
	}

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
};
