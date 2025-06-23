import type { Debuff } from './Debuff';

/**
 * Represents a creature (player, NPC, monster, etc.) in the game.
 */
export type Creature = {
	id: string;
	name: string;
	image?: string;
	hp: number;
	maxHp: number;
	race: string;
	hitpointsRoll?: string; // e.g., "2d10+5"
	ac?: number;
	speed?: {
		walk?: string;
		fly?: string;
		swim?: string;
		climb?: string;
		burrow?: string;
		teleport?: string;
		other?: string;
	};
	attributes?: {
		strength?: number;
		dexterity?: number;
		constitution?: number;
		intelligence?: number;
		wisdom?: number;
		charisma?: number;
	};
	debuffs?: Debuff[];
	notes?: string;
};
