import useCharacterPresets, {
	type Character,
} from '@/hooks/useCharacterPresets';
import { useCallback } from 'react';

/**
 * Allows editing of player characters.
 */
function Characters() {
	const [characters, setCharacters] = useCharacterPresets();

	const addCharacter = useCallback(
		(character: Character) => {
			setCharacters((prev) => [...prev, character]);
		},
		[setCharacters],
	);

	const editCharacter = useCallback(
		(id: string, updatedCharacter: Partial<Omit<Character, 'id'>>) => {
			setCharacters((prev) =>
				prev.map((char) =>
					char.id === id ? { ...char, ...updatedCharacter } : char,
				),
			);
		},
		[setCharacters],
	);

	const deleteCharacter = useCallback(
		(id: string) => {
			setCharacters((prev) => prev.filter((char) => char.id !== id));
		},
		[setCharacters],
	);

	return (
		<div>
			<h1 className="text-2xl font-bold mb-4">Player Characters</h1>
			<p className="mb-4">
				Here you can manage player characters, including adding,
				editing, and deleting character presets.
			</p>

			<div className="space-y-4">
				{characters.map((character) => (
					<div
						key={character.id}
						className="p-4 border rounded-lg flex justify-between items-center"
					>
						<div>
							<h2 className="text-xl font-semibold">
								{character.name}
							</h2>
							<p>
								Health: {character.health} /{' '}
								{character.maxHealth}
							</p>
						</div>
						<div className="flex space-x-2">
							<button
								onClick={() =>
									editCharacter(character.id, {
										name:
											prompt(
												'Enter new name',
												character.name,
											) ?? undefined,
										health: parseInt(
											prompt(
												'Enter new health',
												character.health.toString(),
											) || '0',
											10,
										),
										maxHealth: parseInt(
											prompt(
												'Enter new max health',
												character.maxHealth.toString(),
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
								onClick={() => deleteCharacter(character.id)}
								className="px-3 py-1 bg-red-500 text-white rounded"
							>
								Delete
							</button>
						</div>
					</div>
				))}
				<button
					onClick={() =>
						addCharacter({
							id: Date.now().toString(),
							name:
								prompt('Enter character name', 'New Hero') ||
								'',
							maxHealth: 100,
							health: 100,
						})
					}
					className="px-4 py-2 bg-green-500 text-white rounded"
				>
					Add Character
				</button>
			</div>
		</div>
	);
}

export default Characters;
