import type { ZodType as ZodSchema } from 'zod';
import { LocalCollection } from './LocalCollection';

export class LocalStorageCollection<
	T extends { id: string; revision: number },
	TFilter,
> extends LocalCollection<T, TFilter> {
	private readonly storageKey: string;
	constructor(
		name: string,
		filterFn: (item: T, filter?: TFilter) => boolean,
		schema: ZodSchema<T>,
	) {
		super(name, filterFn, schema);
		this.storageKey = `dnd.db.${this.name}`;
	}

	protected override getRaw(): T[] {
		const items = localStorage.getItem(this.storageKey);
		try {
			const parsed = items ? JSON.parse(items) : [];

			if (!Array.isArray(parsed)) {
				console.log(
					`Invalid data in localStorage for key "${this.storageKey}": Expected an array but got ${typeof parsed}`,
				);

				console.log(items);
				return [];
			}

			const validItems: T[] = [];
			for (const item of parsed) {
				const parsedItem = this.schema.safeParse(item);
				if (parsedItem.success) {
					validItems.push(parsedItem.data);
				} else {
					console.error(
						`Invalid item in localStorage for key "${this.storageKey}":`,
						parsedItem.error,
					);
				}
			}

			return validItems.filter(
				(item: T | null): item is T => item !== null,
			);
		} catch (error) {
			console.error(
				`Error parsing localStorage data for key "${this.storageKey}":`,
				error,
			);
			return [];
		}
	}

	protected override setRaw(items: T[]): void {
		try {
			localStorage.setItem(this.storageKey, JSON.stringify(items));
		} catch (error) {
			console.error(
				`Error setting localStorage data for key "${this.storageKey}":`,
				error,
			);
		}
	}
}
