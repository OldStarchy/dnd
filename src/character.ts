import { Dnd } from './characterTemplates/Dnd';
import EvaluationContext from './lib/EvaluationContext';

type Character = {
	name: string;

	evaluationContext: EvaluationContext;
};

const myCharacter: Character = {
	name: 'Player',
	evaluationContext: EvaluationContext.fromTemplate(Dnd.template),
};

console.log(myCharacter.evaluationContext.get(Dnd.Attribute.INITIAL_HEALTH));
myCharacter.evaluationContext.set('LEVEL', 2);
console.log(myCharacter.evaluationContext.get(Dnd.Attribute.INITIAL_HEALTH));
