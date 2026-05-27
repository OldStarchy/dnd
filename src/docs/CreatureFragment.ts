import type { Observable } from 'rxjs';
import * as Y from 'yjs';
import createId from '../createId';
import fromDocObserve, { type Observed } from '../rxjs/fromDocObserve';
import type { OmitReadonlyProps } from '../types';
import type { inferData } from './inferData';

export interface Creature {
	readonly id: string;
	name: string;
	description: string;
}

export type CreatureData = inferData<Creature>;
export type CreatureInit = Omit<CreatureData, 'id'>;

export default class CreatureFragment {
	/**
	 * @deprecated Safety: `map` must already have valid data. Use {@link CreatureFragment.create}.
	 */
	constructor(private map: Y.Map<Creature[keyof Creature]>) {
		this.change$ = fromDocObserve(this.map);
	}

	static create(creature: CreatureInit) {
		const id = createId();
		const map = new Y.Map<Creature[keyof Creature]>([
			['id', id],
			['name', creature.name],
			['description', creature.description],
		]);

		// `id` needs to be returned separately because map.get('id') won't work until the map is attached to a Y.Doc.
		return { id, map };
	}

	/**
	 * This fragment must already be attached to a Y.Doc.
	 */
	transact<T>(transactionFn: () => T, origin?: unknown) {
		// Safety: 2.
		// oxlint-disable-next-line typescript/no-non-null-assertion
		return this.map.doc!.transact(transactionFn, origin);
	}

	import(data: OmitReadonlyProps<CreatureData>) {
		this.name = data.name;
		this.description = data.description;
	}

	export(): CreatureData {
		// Safety: 1.
		// oxlint-disable-next-line typescript/consistent-type-assertions
		return this.map.toJSON() as CreatureData;
	}

	readonly change$: Observable<Observed<typeof this.map>>;

	get id() {
		// Safety: 1. 2.
		// oxlint-disable-next-line typescript/no-non-null-assertion, typescript/consistent-type-assertions
		return this.map.get('id')! as string;
	}

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
}
