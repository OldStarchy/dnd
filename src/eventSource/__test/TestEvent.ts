export interface TestEvent {
	type: 'ADD' | 'SUBTRACT' | 'MULTIPLY' | 'RESET';
	payload?: {
		value?: number;
		newValue?: number;
	};
}
