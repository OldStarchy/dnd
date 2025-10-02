import type z from 'zod';

import type ObservableWithValue from '@/lib/ObservableWithValue';
import type {
	DbNotificationMessages,
	DbRequestMessages,
	DbResponseMessages,
} from '@/sync/db/Messages';

import type { Collection } from './Collection';

export type RecordType<
	TRecord extends { id: string; revision: number },
	TFilter,
> = {
	record: Readonly<TRecord>;
	filter: TFilter;
	request: DbRequestMessages<TRecord>;
	response: DbResponseMessages<TRecord>;
	notification: DbNotificationMessages<TRecord>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyRecordType = RecordType<{ id: string; revision: number }, any>;

export type DbRecord<T extends object> = T & {
	id: string;
	revision: number;
};

export type RecordTypeDefinition<
	Record extends { id: string; revision: number },
	Filter,
	Document,
> = {
	name: string;
	schema: z.ZodType<Record>;
	filterFn: (record: Record, filter: Filter) => boolean;
	documentClass: {
		new (
			data$: ObservableWithValue<Record>,
			collection: Collection<RecordType<Record, Filter>, Document>,
		): Document;
	};
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyRecordTypeDefinition = RecordTypeDefinition<any, any, any>;

export function defineRecordType<
	const Record extends { id: string; revision: number },
	const Filter,
	const Document,
>(def: {
	name: string;
	schema: z.ZodType<Record>;
	filterFn: (record: Record, filter: Filter) => boolean;
	documentClass: {
		new (
			data$: ObservableWithValue<Record>,
			collection: Collection<RecordType<Record, Filter>, Document>,
		): Document;
	};
}): RecordTypeDefinition<Record, Filter, Document> {
	return {
		...def,
	};
}
