import type {
	DbNotificationMessages,
	DbRequestMessages,
	DbResponseMessages,
} from '@/sync/db/Messages';

export type RecordType<
	TRecord extends { id: string; revision: number },
	TFilter,
> = {
	record: TRecord;
	filter: TFilter;
	request: DbRequestMessages<TRecord>;
	response: DbResponseMessages<TRecord>;
	notification: DbNotificationMessages<TRecord>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyRecordType = RecordType<{ id: string; revision: number }, any>;

export type RecordFilter<T extends AnyRecordType> = (
	record: T['record'],
	filter?: T['filter'],
) => boolean;

export type DbRecord<T extends object> = T & {
	id: string;
	revision: number;
};
