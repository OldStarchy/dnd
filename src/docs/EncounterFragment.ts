import { distinctUntilChanged, Observable } from 'rxjs';
import * as Y from 'yjs';
import fromDocObserve, { type Observed } from '../rxjs/fromDocObserve';
import type { Creature } from './CreatureFragment';
import type { inferData } from './inferData';

export interface Encounter {
	name: string;
	description: string;
	readonly creatureIds: Y.Array<Creature['id']>;
}

export type EncounterData = inferData<Encounter>;
export type EncounterInit = EncounterData;

export default class EncounterFragment {
	/**
	 * @deprecated Safety: `map` must already have valid data. Use {@link EncounterFragment.create}.
	 */
	constructor(private map: Y.Map<Encounter[keyof Encounter]>) {
		this.change$ = new Observable<Observed<typeof this.map | Y.Array<Creature['id']>>>((subr) => {
			if (this.map.doc === null) {
				throw new Error('Attempt to subscribe to EncounterFragment before mounting');
			}

			const mapSub = fromDocObserve(this.map).subscribe(subr);

			// Safety: creatureIds should not be null if map.doc is set.
			// oxlint-disable-next-line typescript/no-non-null-assertion
			const creatureIds = this.map.get('creatureIds')!;

			// Safety: 1.
			// oxlint-disable-next-line typescript/consistent-type-assertions
			const creatureIdsSub = fromDocObserve(creatureIds as Y.Array<Creature['id']>).subscribe(subr);
			return () => {
				mapSub.unsubscribe();
				creatureIdsSub.unsubscribe();
			};
		}).pipe(distinctUntilChanged((a, b) => a.transaction === b.transaction));
	}

	static create(encounter: EncounterInit) {
		const creatureIds = new Y.Array<Creature['id']>();
		creatureIds.push(encounter.creatureIds);

		const map = new Y.Map<Encounter[keyof Encounter]>([
			['name', encounter.name],
			['description', encounter.description],
			['creatureIds', creatureIds],
		]);

		return { map };
	}

	/**
	 * This fragment must already be attached to a Y.Doc.
	 */
	transact<T>(transactionFn: () => T, origin?: unknown) {
		// Safety: 2.
		// oxlint-disable-next-line typescript/no-non-null-assertion
		return this.map.doc!.transact(transactionFn, origin);
	}

	import(data: EncounterData) {
		this.name = data.name;
		this.description = data.description;
		this.creatureIds.delete(0, this.creatureIds.length);
		this.creatureIds.push(data.creatureIds);
	}

	export(): EncounterData {
		// Safety: 1.
		// oxlint-disable-next-line typescript/consistent-type-assertions
		return this.map.toJSON() as EncounterData;
	}

	readonly change$: Observable<Observed<typeof this.map | Y.Array<Creature['id']>>>;

	get name() {
		// Safety: 1. 2.
		// oxlint-disable-next-line typescript/no-non-null-assertion, typescript/consistent-type-assertions
		return this.map.get('name')! as string;
	}
	set name(value: string) {
		this.map.set('name', value);
	}

	get description() {
		// Safety: 1. 2.
		// oxlint-disable-next-line typescript/no-non-null-assertion, typescript/consistent-type-assertions
		return this.map.get('description')! as string;
	}
	set description(value: string) {
		this.map.set('description', value);
	}

	get creatureIds() {
		// Safety: 1. 2.
		// oxlint-disable-next-line typescript/no-non-null-assertion, typescript/consistent-type-assertions
		return this.map.get('creatureIds')! as Y.Array<Creature['id']>;
	}
}
