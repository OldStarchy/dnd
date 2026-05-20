interface Creature {
  id: string;
  name: string;
  description: string;
}

export default function DmView({ creatures }: { creatures: Creature[] }) {
  return (
    <div>
      {creatures.map((creature) => (
        <div key={creature.id}>
          <h2>Hello {creature.name}!</h2>
          <p>{creature.description}</p>
        </div>
      ))}
    </div>
  );
}
