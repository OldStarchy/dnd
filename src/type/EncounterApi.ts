import { type Collection, DocumentApi } from '@/db/Collection';
import type { Encounter, EncounterRecordType } from '@/db/record/Encounter';
import type { InitiativeTableEntryRecord } from '@/db/record/InitiativeTableEntry';
import type { ChangeSet } from '@/lib/changeSet';
import type ObservableWithValue from '@/lib/ObservableWithValue';

import type { Debuff } from './Debuff';

export default class EncounterApi extends DocumentApi<EncounterRecordType> {
	constructor(
		data$: ObservableWithValue<Encounter>,
		collection: Collection<EncounterRecordType, EncounterApi>,
	) {
		super(data$, collection);
	}

	async getEntities(): Promise<InitiativeTableEntryApi[]> {
		return await this.collection.db.get('initiativeTableEntry').get({
			encounterId: this.data.id,
		});
	}

	async advanceTurn() {
		const entities = await this.getEntities();

		const currentTurnId = this.data.currentTurn;
		const currentTurnIndex = entities.findIndex(
			(v) => v.id === currentTurnId,
		);

		// On End Turn
		if (currentTurnIndex !== -1) {
			const currentTurnEntity = entities[currentTurnIndex]!;

			await currentTurnEntity.updateDebufs((debuffs) => {
				const changes: ChangeSet<Debuff[]> & {
					selected: [];
					remove: [];
				} = { selected: [], remove: [] };

				for (const [index, debuf] of debuffs.entries()) {
					if (debuf.duration !== undefined) {
						if (debuf.duration === 1) {
							changes.remove.push(index);
						} else {
							changes.selected.push({
								filter: index,
								merge: {
									duration: { replace: debuf.duration - 1 },
								},
							});
						}
					}
				}

				return changes;
			});
		}

		const nextEntity = entities[(currentTurnIndex + 1) % entities.length]!;
		await this.update({
			merge: { currentTurn: { replace: nextEntity.id } },
		});
	}
}

export class InitiativeTableEntryApi extends DocumentApi<InitiativeTableEntryRecord> {
	constructor(
		data$: ObservableWithValue<InitiativeTableEntryRecord['record']>,
		collection: Collection<InitiativeTableEntryRecord>,
	) {
		super(data$, collection);
	}

	get id() {
		return this.data.id;
	}

	async updateDebufs(changes: (debufs: Debuff[]) => ChangeSet<Debuff[]>) {
		switch (this.data.creature.type) {
			case 'unique': {
				const creature = await this.collection.db
					.get('creature')
					.getOne({ id: this.data.creature.id })
					.unwrap();

				await creature.update({
					merge: {
						debuffs: changes(creature.data.debuffs),
					},
				});
				return;
			}

			case 'generic': {
				await this.update({
					merge: {
						creature: {
							merge: {
								data: {
									merge: {
										debuffs: changes(
											this.data.creature.data.debuffs,
										),
									},
								},
							},
						},
					},
				});
				return;
			}
		}
	}
}
