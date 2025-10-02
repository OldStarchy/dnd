import type { EntityProperties } from '@/components/forms/EntityProperties/schema';
import type { Collection, DocumentApi } from '@/db/Collection';
import type { CreatureRecordType } from '@/db/record/Creature';
import type { Encounter } from '@/db/record/Encounter';
import type { InitiativeTableEntryRecord } from '@/db/record/InitiativeTableEntry';
import type { ChangeSet } from '@/lib/changeSet';
import {
	getObfuscatedHealthText,
	HealthObfuscation,
} from '@/store/types/Entity';

export async function toEntity(
	data: InitiativeTableEntryRecord['record'],
	creatureCollection?: Collection<CreatureRecordType>,
): Promise<EntityProperties> {
	if (data.creature.type !== 'generic') {
		if (!creatureCollection) {
			throw new Error('Only generic entities are supported');
		}

		const {
			data$: { value: creatureData },
		} = await creatureCollection
			.getOne({ id: data.creature.id })
			.unwrap('Referenced creature not found');

		return {
			name: creatureData.name,
			initiative: data.initiative,
			images: creatureData.images,
			visible: data.effect !== 'invisible',
			ac: creatureData.ac,
			hp: creatureData.hp,
			maxHp: creatureData.maxHp,
			obfuscateHealth: HealthObfuscation.NO,
			debuffs: creatureData.debuffs,
		};
	}

	return {
		name: data.creature.data.name,
		initiative: data.initiative,
		images: data.creature.data.images,
		visible: data.effect !== 'invisible',
		ac: data.creature.data.ac,
		hp: data.creature.data.hp,
		maxHp: data.creature.data.maxHp,
		obfuscateHealth: HealthObfuscation.NO,
		debuffs: data.creature.data.debuffs,
	};
}

export async function applyEntityToInitiativeEntry(
	record: DocumentApi<InitiativeTableEntryRecord>,
	entity: EntityProperties,
	creatureCollection?: Collection<CreatureRecordType>,
) {
	if (record.data.creature.type !== 'generic') {
		if (!creatureCollection) {
			throw new Error('Only generic entities are supported');
		}

		const creature = await creatureCollection
			.getOne({ id: record.data.creature.id })
			.unwrap('Referenced creature not found');

		await creature.update({
			merge: {
				name: { replace: entity.name },
				images: { replace: entity.images ?? [] },
				ac: { replace: entity.ac },
				hp: { replace: entity.hp },
				maxHp: { replace: entity.maxHp },
				debuffs: { replace: entity.debuffs ?? [] },
			},
		});

		await record.update({
			merge: {
				healthDisplay: {
					replace: getObfuscatedHealthText(
						entity.hp,
						entity.maxHp,
						entity.obfuscateHealth,
					),
				},
				initiative: { replace: entity.initiative },
				effect: { replace: entity.visible ? undefined : 'invisible' },
			},
		});
		return;
	}

	await record.update(mergeGenericRecordFromEntity(entity));
}

export function createGenericRecordFromEntity(
	entity: EntityProperties,
): Omit<InitiativeTableEntryRecord['record'], 'id' | 'revision'> {
	return {
		encounterId: '' as Encounter['id'],
		healthDisplay: getObfuscatedHealthText(
			entity.hp,
			entity.maxHp,
			entity.obfuscateHealth,
		),
		creature: {
			type: 'generic',
			data: {
				name: entity.name,
				images: entity.images ?? [],
				hp: entity.hp,
				maxHp: entity.maxHp,
				debuffs: entity.debuffs,
			},
		},
		initiative: entity.initiative,
		effect: entity.visible ? undefined : 'invisible',
	};
}

export function mergeGenericRecordFromEntity(
	entity: EntityProperties,
): ChangeSet<Omit<InitiativeTableEntryRecord['record'], 'id' | 'revision'>> {
	return {
		merge: {
			healthDisplay: {
				replace: getObfuscatedHealthText(
					entity.hp,
					entity.maxHp,
					entity.obfuscateHealth,
				),
			},
			creature: {
				replace: {
					type: 'generic',
					data: {
						name: entity.name,
						images: entity.images ?? [],
						hp: entity.hp,
						maxHp: entity.maxHp,
						debuffs: entity.debuffs,
						ac: entity.ac,
					},
				},
			},
			initiative: {
				replace: entity.initiative,
			},
			effect: {
				replace: entity.visible ? undefined : 'invisible',
			},
		},
	};
}
