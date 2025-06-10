import useMonsterList from '@/hooks/useMonsterList';

function Monsters() {
	const { monsters } = useMonsterList();

	if (monsters.length === 0) {
		return <div>Loading...</div>;
	}
	return (
		<ul>
			{monsters.map((monster) => (
				<li key={monster}>{monster}</li>
			))}
		</ul>
	);
}

export default Monsters;
