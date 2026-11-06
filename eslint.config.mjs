import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

const importSortGroups = [
	// Side effect imports
	['^\\u0000'],
	['^next/link', '^react', '^next', '^clsx', '^\\w'],
	['^@radix-ui'],
	['^@supabase'],
	['^@/types'],
	['^@/config'],
	['^@/libs'],
	['^@/actions'],
	['^@/utils/constants'],
	['^@/utils/helpers'],
	['^@/utils/hooks'],
	['^@/components/layouts/(.*)'],
	['^@/components/wrappers/(.*)'],
	['^@/components/views/(.*)'],
	['^@/components/sections/(.*)'],
	['^@/components/ui/(.*)'],
	['^@/components/dialogs/(.*)'],
	['^@/components/elements/(.*)'],
	['^@/components/cards/(.*)'],
	['^@/components/forms/(.*)'],
	['^@/components/fields/(.*)'],
	['^@/static/(.*)'],
	['^@/styles/(.*)'],
	['^@/styles/icons/(.*)'],
	['^\\.(?!/?$)'],
	['^(.*)\\.css$']
];

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	{
		files: ['src/**/*.{ts,tsx}'],
		plugins: {
			'simple-import-sort': simpleImportSort
		},
		rules: {
			'simple-import-sort/imports': ['error', { groups: importSortGroups }],
			'simple-import-sort/exports': 'error',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-empty-object-type': 'off'
		}
	},
	// Must be last: turns off rules that conflict with Prettier
	prettier,
	globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts'])
]);

export default eslintConfig;
