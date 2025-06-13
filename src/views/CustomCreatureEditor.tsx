import useCustomCreatureList from '@/hooks/useCustomCreatureList';
import type { Creature } from '@/type/Creature';
import { useCallback } from 'react';

/**
 * Allows editing of player characters.
 */
function CustomCreatureEditor() {
	const [creatures, setCreatures] = useCustomCreatureList();

	const addCreature = useCallback(
		(character: Creature) => {
			setCreatures((prev) => [...prev, character]);
		},
		[setCreatures],
	);

	const editCreature = useCallback(
		(id: string, updatedCreature: Partial<Omit<Creature, 'id'>>) => {
			setCreatures((prev) =>
				prev.map((char) =>
					char.id === id ? { ...char, ...updatedCreature } : char,
				),
			);
		},
		[setCreatures],
	);

	const deleteCreature = useCallback(
		(id: string) => {
			setCreatures((prev) => prev.filter((char) => char.id !== id));
		},
		[setCreatures],
	);

	return (
		<div>
			<h1 className="text-2xl font-bold mb-4">Permanent Creatures</h1>
			<p className="mb-4">
				Here you can manage recurring players and npcs.
			</p>

			<div className="space-y-4">
				{creatures.map((creature) => (
					<div
						key={creature.id}
						className="p-4 border rounded-lg flex justify-between items-center"
					>
						<div>
							<h2 className="text-xl font-semibold">
								{creature.name}
							</h2>
							<p>
								Health: {creature.hp} / {creature.maxHp}
								{creature.hitpointsRoll
									? ` (${creature.hitpointsRoll})`
									: ''}
							</p>
						</div>
						<div className="flex space-x-2">
							<button
								onClick={() =>
									editCreature(creature.id, {
										name:
											prompt(
												'Enter new name',
												creature.name,
											) ?? undefined,
										hp: parseInt(
											prompt(
												'Enter new health',
												creature.hp.toString(),
											) || '0',
											10,
										),
										maxHp: parseInt(
											prompt(
												'Enter new max health',
												creature.maxHp.toString(),
											) || '0',
											10,
										),
									})
								}
								className="px-3 py-1 bg-blue-500 text-white rounded"
							>
								Edit
							</button>
							<button
								onClick={() => deleteCreature(creature.id)}
								className="px-3 py-1 bg-red-500 text-white rounded"
							>
								Delete
							</button>
						</div>
					</div>
				))}
				<button
					onClick={() =>
						addCreature({
							id: Date.now().toString(),
							name:
								prompt('Enter character name', 'New Hero') ||
								'',
							maxHp: 100,
							hp: 100,
						})
					}
					className="px-4 py-2 bg-green-500 text-white rounded"
				>
					Add Creature
				</button>
			</div>
		</div>
	);
}

export default CustomCreatureEditor;
