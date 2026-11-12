import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['tests/**/*.test.mjs'],
        setupFiles: ['tests/setup-env.mjs'],
        testTimeout: 30000,
        hookTimeout: 120000,
        // Integration files each start their own in-memory MongoDB; run them one at a time.
        fileParallelism: false
    }
});
