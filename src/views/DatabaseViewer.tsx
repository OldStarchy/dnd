import { type ReactNode, useState } from 'react';

import CreatureForm from '@/components/CreatureForm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import type { Collection, DocumentApi } from '@/db/Collection';
import { LocalStorageCollection } from '@/db/LocalStorageCollection';
import {
	CreatureCollectionSchema,
	type CreatureRecordType,
} from '@/db/record/Creature';
import type { AnyRecordType } from '@/db/RecordType';
import useBehaviorSubject from '@/hooks/useBehaviorSubject';
import useCollectionQuery from '@/hooks/useCollectionQuery';
import { cn } from '@/lib/utils';
import {
	MemberCollectionSchema,
	type MemberRecordType,
} from '@/sync/room/member/Record';
import { Db } from '@/sync/room/RoomApi';

const db = new Db<{
	creature: Collection<CreatureRecordType>;
	member: Collection<MemberRecordType>;
}>({
	creature: (db) =>
		new LocalStorageCollection<CreatureRecordType>(
			CreatureCollectionSchema,
			db,
		),

	member: (db) =>
		new LocalStorageCollection<MemberRecordType>(
			MemberCollectionSchema,
			db,
		),
} as const);

const creatures = db.get('creature');
const members = db.get('member');

export default function DatabaseViewer() {
	const [selectedCreature, setSelectedCreature] =
		useState<DocumentApi<CreatureRecordType> | null>(null);
	return (
		<div>
			<h1>Database Viewer</h1>
			<CollectionView
				collection={creatures}
				columns={[
					['Name', ({ data }) => data.name],
					[
						'Avatar',
						({
							data: {
								name,
								images: [image],
							},
						}) => (
							<Avatar>
								<AvatarImage src={image} alt={name} />
								<AvatarFallback>
									{name
										.replace(/[^a-zA-Z0-9 ]+/g, ' ')
										.replace(
											/(?:^| )(\w)\w+/g,
											(_, initial: string) =>
												initial.toUpperCase(),
										)}
								</AvatarFallback>
							</Avatar>
						),
					],
					['Race', ({ data }) => data.race ?? ''],
					['Speed', ({ data }) => data.speed?.walk || '0'],
					['HP', ({ data }) => `${data.hp}/${data.maxHp}`],
					['AC', ({ data }) => data.ac?.toString() || '0'],
					[
						'Attributes',
						({ data }) => JSON.stringify(data.attributes),
					],
				]}
				onClickRecord={(record) =>
					setSelectedCreature((r) => (r === record ? null : record))
				}
				selectedRecord={selectedCreature}
			/>

			<Separator className="my-4" />
			<CreatureForm
				key={selectedCreature?.data.id}
				creature={selectedCreature?.data ?? undefined}
				onSubmit={(record) => {
					if (selectedCreature)
						selectedCreature.update({ replace: record });
					else creatures.create(record);
				}}
			/>
			<Separator className="my-4" />

			<CollectionView
				collection={members}
				columns={[
					['ID', ({ data: { id } }) => id],
					[
						'Avatar',
						({ data: { name, avatar } }) => (
							<Avatar>
								<AvatarImage src={avatar} alt={name} />
								<AvatarFallback>
									{name
										.replace(/[^a-zA-Z0-9 ]+/g, ' ')
										.replace(
											/(?:^| )(\w)\w+/g,
											(_, initial: string) =>
												initial.toUpperCase(),
										)}
								</AvatarFallback>
							</Avatar>
						),
					],
					['Name', ({ data }) => data.name],
				]}
			/>

			<Separator className="my-4" />
		</div>
	);
}

function CollectionView<
	RecordType extends AnyRecordType,
	Record extends DocumentApi<AnyRecordType>,
>({
	collection,
	columns,
	filter,
	onClickRecord,
	selectedRecord,
}: {
	collection: Collection<RecordType, Record>;
	columns: [label: string, getter: (record: Record) => ReactNode][];
	filter?: RecordType['filter'];
	onClickRecord?: (record: Record) => void;
	selectedRecord?: Record | null;
}) {
	const records = useCollectionQuery(collection, filter);

	return (
		<div>
			<h2>{collection.name}</h2>

			<ScrollArea>
				<Table>
					<TableHeader>
						<TableRow>
							{columns.map(([label], index) => (
								<TableHead key={index}>{label}</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{records?.map((record, index) => (
							<CollectionViewRecord
								key={index}
								onClick={() => onClickRecord?.(record)}
								className={cn({
									'bg-accent/50': record === selectedRecord,
								})}
								record={record}
								columns={columns}
							/>
						))}
					</TableBody>
				</Table>
			</ScrollArea>
		</div>
	);
}

function CollectionViewRecord<Record extends DocumentApi<AnyRecordType>>({
	record,
	columns,
	...props
}: {
	record: Record;
	columns: [label: string, getter: (record: Record) => ReactNode][];
} & React.ComponentProps<typeof TableRow>) {
	const data = useBehaviorSubject(record.data$);

	return (
		<TableRow key={data.revision} {...props}>
			{columns.map(([, getter], colIndex) => (
				<TableCell key={colIndex}>{getter(record)}</TableCell>
			))}
		</TableRow>
	);
}
