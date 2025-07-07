import useMonsterList from '@/hooks/useMonsterList';
import { Link } from 'react-router';

function Monsters() {
	const { monsters, loading } = useMonsterList();

	return (
		<>
			<h1 className="text-lg font-bold">Monsters</h1>
			<p>
				This list of monsters is supplied by the{' '}
				<Link
					className="text-blue-500 hover:underline"
					to="https://www.dnd5eapi.co/"
					target="_blank"
					rel="noopener noreferrer"
				>
					D&D 5e API
				</Link>
			</p>
			<hr />
			{loading ? (
				<div>Loading...</div>
			) : (
				<ul>
					{monsters.map((monster) => (
						<li key={monster.index}>{monster.name}</li>
					))}
				</ul>
			)}
		</>
	);
}

export default Monsters;
