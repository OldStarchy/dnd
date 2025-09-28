import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{ ignores: ['dist'] },
	{
		extends: [js.configs.recommended, ...tseslint.configs.recommended],
		files: ['**/*.{ts,tsx}'],
		ignores: ['dnd5eapi/**', 'src/components/ui/**'],
		languageOptions: {
			ecmaVersion: 'latest',
			globals: globals.browser,
		},
		plugins: {
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh,
		},
		rules: {
			...reactHooks.configs.recommended.rules,
			'react-refresh/only-export-components': [
				'warn',
				{ allowConstantExport: true },
			],
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-namespace': 'off',
			'@typescript-eslint/consistent-type-imports': 'error',
			'@typescript-eslint/no-import-type-side-effects': 'error',
		},
	},
	{
		plugins: {
			import: importPlugin,
			'unused-imports': unusedImportsPlugin,
		},
		settings: {
			'import/internal-regex': '^@/',
		},
		rules: {
			'unused-imports/no-unused-imports': 'error',
			'import/enforce-node-protocol-usage': ['error', 'always'],
			'import/first': 'error',
			'import/newline-after-import': 'error',
			'import/no-duplicates': 'error',
			'import/no-useless-path-segments': 'error',
			'import/no-namespace': 'error',
			'import/order': [
				'error',
				{
					groups: [
						'builtin',
						'external',
						'internal',
						['parent', 'sibling', 'index'],
					],
					'newlines-between': 'always',
					alphabetize: {
						order: 'asc',
						caseInsensitive: true,
					},
					named: true,
				},
			],
		},
	},
	eslintConfigPrettier,
);
