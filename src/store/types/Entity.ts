import type { Creature } from '@/type/Creature';

export const HealthObfuscation = {
	/**
	 * Health is shown as hp/maxHp
	 */
	NO: 'no',
	/**
	 * Health is shown as a text description eg. "Healthy", "Bloodied", ...
	 */
	TEXT: 'text',
	/**
	 * Health is shown as a "unknown"
	 */
	HIDDEN: 'hidden',
} as const;

export type HealthObfuscation =
	(typeof HealthObfuscation)[keyof typeof HealthObfuscation];

export type Entity = {
	id: string;
	initiative: number;
	visible: boolean;
	obfuscateHealth: HealthObfuscation;
	creature: Creature;
};

export type PlayerEntityView = {
	id: string;
	name: string;
	initiative: number;
	healthDisplay: string;
	debuffs?: { name: string; color: string; notes?: string }[];
	effect?: 'muted';
};

export function getObfuscatedHealthText(
	health: number,
	maxHealth: number,
	obfuscateHealth: HealthObfuscation,
) {
	switch (obfuscateHealth) {
		case HealthObfuscation.NO:
			return `${health}/${maxHealth}`;
		case HealthObfuscation.TEXT: {
			const ratio = health / maxHealth;
			if (ratio > 0.75) {
				return 'Healthy';
			}
			if (ratio > 0.5) {
				return 'Bloodied';
			}
			if (ratio > 0.25) {
				return 'Wounded';
			}
			if (ratio > 0) {
				return 'Critical';
			}
			if (ratio === 0) {
				return 'Unconscious';
			}
			return 'Dead';
		}
		case HealthObfuscation.HIDDEN:
			return '??';
	}

	// @ts-expect-error unused
	const _exhaustiveCheck: never = entity.obfuscateHealth;
}
