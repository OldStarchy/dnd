export type CharacterVariablesTemplate = Record<
	string,
	{
		readonly formula: string;
		readonly description?: string;
	}
>;
