export default function exhaustiveCheck(param: never): never {
	throw new Error(`Unsupported param: ${param}`);
}
