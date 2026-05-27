import { EMPTY, from, mergeMap, Observable, of } from 'rxjs';
import * as Y from 'yjs';
import fromDocObserveDeep from '../rxjs/fromDocObserveDeep';
import type { OmitReadonlyProps } from '../types';
import CreatureFragment, { type Creature, type CreatureInit } from './CreatureFragment';
import EncounterFragment, { type Encounter, type EncounterInit } from './EncounterFragment';
import type { inferData } from './inferData';

export interface Player {
	creatures: Record<string, CreatureFragment>;
	encounter: EncounterFragment | null;
}

export type PlayerData = inferData<Player>;

export default class PlayerDoc {
	private doc = new Y.Doc();

	readonly creature$: Observable<string | CreatureFragment> = fromDocObserveDeep(
		this.creaturesMap,
	).pipe(
		mergeMap(({ event }) => {
			const [creatureId] = event.path;

			if (creatureId === undefined) {
				// Change to the map itself; add or remove creature.
				return from(
					event.changes.keys.entries().map(([key, change]) => {
						if (change.action === 'add' || change.action === 'update') {
							// Safety: If there's a non-deleting change to this creature, it should exist.
							// oxlint-disable-next-line typescript/no-non-null-assertion
							return new CreatureFragment(this.creaturesMap.get(key)!);
						} else {
							return key;
						}
					}),
				);
			}

			if (typeof creatureId !== 'string') {
				console.log('Unexpected non-string creatureId in creature$ observable:', creatureId);
				return EMPTY;
			}

			// change to a property of a creature
			const creature = this.creaturesMap.get(creatureId);
			if (!creature) {
				console.log('Change to non-existent creature:', creatureId);
				return EMPTY;
			}

			return of(new CreatureFragment(creature));
		}),
	);

	private get creaturesMap() {
		return this.doc.getMap<Y.Map<Creature[keyof Creature]>>('creatures');
	}

	private get encounterMap() {
		// Safety: 1.
		// oxlint-disable-next-line typescript/consistent-type-assertions
		const maybeEncounter = this.doc.getMap('maybeEncounter') as Y.Map<
			Y.Map<Encounter[keyof Encounter]>
		>;

		return maybeEncounter.get('encounter') ?? null;
	}

	get creatures(): Readonly<Record<string, CreatureFragment>> {
		const creatures: Record<string, CreatureFragment> = {};
		this.creaturesMap.forEach((creature, id) => {
			creatures[id] = new CreatureFragment(creature);
		});
		return creatures;
	}

	get encounter(): EncounterFragment | null {
		const encounterMap = this.encounterMap;
		if (!encounterMap) {
			return null;
		}
		return new EncounterFragment(encounterMap);
	}

	createCreature(creature: CreatureInit) {
		return this.doc.transact(() => {
			const { id, map } = CreatureFragment.create(creature);

			this.creaturesMap.set(id, map);

			return new CreatureFragment(map);
		}, this);
	}

	/**
	 * Publishes an existing creature to this doc.
	 */
	publishCreature(creature: Creature) {
		this.doc.transact(() => {
			const creatureMap =
				this.creaturesMap.get(creature.id) ??
				this.creaturesMap.set(creature.id, new Y.Map([['id', creature.id]]));

			const frag = new CreatureFragment(creatureMap);
			frag.import(creature);
		}, this);
	}

	deleteCreature(creatureId: string) {
		this.doc.transact(() => {
			this.creaturesMap.delete(creatureId);
		}, this);
	}

	startEncounter(encounter: EncounterInit) {
		if (this.encounter) {
			throw new Error('Encounter already in progress');
		}

		return this.doc.transact(() => {
			const encounterMap = EncounterFragment.create(encounter).map;
			this.doc.getMap('maybeEncounter').set('encounter', encounterMap);

			return new EncounterFragment(encounterMap);
		}, this);
	}

	endEncounter() {
		if (!this.encounter) {
			throw new Error('No encounter in progress');
		}

		this.doc.transact(() => {
			this.doc.getMap('maybeEncounter').delete('encounter');
		}, this);
	}

	export(): PlayerData {
		// Safety: 1.
		// oxlint-disable-next-line typescript/consistent-type-assertions
		return {
			creatures: this.creaturesMap.toJSON(),
			encounter: this.encounterMap?.toJSON() ?? null,
		} as PlayerData;
	}

	// This method doesn't have full coverage because i'm not sure if it will be used
	import(newData: OmitReadonlyProps<PlayerData>) {
		this.doc.transact(() => {
			const allCreatures = new Set(this.creaturesMap.keys());

			for (const [id, creatureData] of Object.entries(newData.creatures)) {
				this.publishCreature(creatureData);
				allCreatures.delete(id);
			}

			for (const id of allCreatures) {
				this.creaturesMap.delete(id);
			}

			if (newData.encounter) {
				if (!this.encounterMap) {
					this.doc
						.getMap('maybeEncounter')
						.set('encounter', EncounterFragment.create(newData.encounter).map);
				} else {
					const encounterFrag = new EncounterFragment(this.encounterMap);
					encounterFrag.import(newData.encounter);
				}
			} else if (this.encounterMap) {
				this.doc.getMap('maybeEncounter').delete('encounter');
			}
		}, this);
	}
}
