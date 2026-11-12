import js from '@eslint/js';
import globals from 'globals';

export default [
    { ignores: ['node_modules', 'coverage'] },
    js.configs.recommended,
    {
        files: ['**/*.js'],
        languageOptions: { ecmaVersion: 'latest', sourceType: 'commonjs', globals: { ...globals.node } }
    },
    {
        files: ['**/*.mjs'],
        languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.node } }
    },
    {
        rules: {
            'no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_', caughtErrors: 'none' }]
        }
    }
];
