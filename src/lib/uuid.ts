import { v4 } from 'uuid';

const uuid = 'randomUUID' in crypto ? () => crypto.randomUUID() : () => v4();

export default uuid;
