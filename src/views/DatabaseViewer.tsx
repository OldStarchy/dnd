import CreatureForm from '@/components/CreatureForm';
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
import type { Collection } from '@/db/Collection';
import { LocalStorageCollection } from '@/db/LocalStorageCollection';
import type { AnyRecordType } from '@/db/RecordType';
import {
	filterMember,
	type MemberRecordType,
	memberSchema,
} from '@/sync/room/Member';
import {
	type CreatureRecordType,
	creatureSchema,
	filterCreature,
} from '@/type/Creature';
import { useEffect, useState } from 'react';

const creatures = new LocalStorageCollection<CreatureRecordType>(
	'creatures',
	filterCreature,
	creatureSchema,
);

const members = new LocalStorageCollection<MemberRecordType>(
	'members',
	filterMember,
	memberSchema,
);

export default function DatabaseViewer() {
	return (
		<div>
			<h1>Database Viewer</h1>
			<CollectionView
				collection={creatures}
				columns={[
					['Name', (r) => r.name],
					['Race', (r) => r.race ?? ''],
					['Speed', (r) => r.speed?.walk || '0'],
					['HP', (r) => `${r.hp}/${r.maxHp}`],
					['AC', (r) => r.ac?.toString() || '0'],
					['Attributes', (r) => JSON.stringify(r.attributes)],
				]}
			/>

			<Separator className="my-4" />
			<CreatureForm
				onSubmit={(record) => {
					creatures.create(record);
				}}
			/>
			<Separator className="my-4" />

			<CollectionView
				collection={members}
				columns={[['Name', (r) => r.name]]}
			/>

			<Separator className="my-4" />
		</div>
	);
}

function CollectionView<RecordType extends AnyRecordType>({
	collection,
	columns,
}: {
	collection: Collection<RecordType>;
	columns: [
		label: string,
		getter: (record: RecordType['record']) => string,
	][];
}) {
	const [records, setRecords] = useState<RecordType['record'][]>([]);

	useEffect(() => {
		(async () => {
			const all = await collection.get();

			setRecords(all.map((record) => record.data.getValue()));
		})();

		const sub = collection.change$.subscribe((record) => {
			setRecords((prev) => {
				if (prev.some((r) => r.id === record.data.getValue().id)) {
					return prev.map((r) =>
						r.id === record.data.getValue().id
							? record.data.getValue()
							: r,
					);
				} else {
					return [...prev, record.data.getValue()];
				}
			});
		});

		return () => sub.unsubscribe();
	}, [collection]);

	return (
		<div>
			<h2>{collection.name}</h2>

			<ScrollArea>
				<Table>
					<TableHeader>
						{columns.map(([label], index) => (
							<TableHead key={index}>{label}</TableHead>
						))}
					</TableHeader>
					<TableBody>
						{records.map((record, index) => (
							<TableRow key={index}>
								{columns.map(([, getter], colIndex) => (
									<TableCell key={colIndex}>
										{`${getter(record)}`}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</ScrollArea>
		</div>
	);
}
