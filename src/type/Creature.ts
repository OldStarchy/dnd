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
