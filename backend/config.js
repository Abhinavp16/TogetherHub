const { z } = require('zod');

// Tests supply their own environment so results never depend on a developer's local .env file.
if (process.env.NODE_ENV !== 'test') {
    require('dotenv').config({ quiet: true });
}

const optional = z
    .string()
    .optional()
    .transform((value) => value || undefined);

const schema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    CLIENT_URL: z.string().url().default('http://localhost:3000'),
    MONGODB_URI: z.string().min(1).default('mongodb://localhost:27017/togetherhub'),
    JWT_SECRET: z.string({ error: 'JWT_SECRET is required' }).min(16, 'JWT_SECRET must be at least 16 characters long'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    COLLAB_PORT: z.coerce.number().int().positive().default(1234),
    COLLAB_HOST: z.string().default('0.0.0.0'),
    GOOGLE_CLIENT_ID: optional,
    GOOGLE_CLIENT_SECRET: optional,
    GOOGLE_CALLBACK_URL: optional,
    GITHUB_CLIENT_ID: optional,
    GITHUB_CLIENT_SECRET: optional,
    GITHUB_CALLBACK_URL: optional
});

const loadConfig = (env = process.env) => {
    const result = schema.safeParse(env);

    if (!result.success) {
        const problems = result.error.issues
            .map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`)
            .join('\n');
        throw new Error(`Invalid environment configuration:\n${problems}`);
    }

    const config = result.data;
    config.allowedOrigins = Array.from(new Set([config.CLIENT_URL, 'http://localhost:3000']));
    return config;
};

module.exports = loadConfig();
module.exports.loadConfig = loadConfig;
