const crypto = require('crypto');
const User = require('../models/User');
const { serializeUser, signAuthToken } = require('../utils/authHelpers');

const config = require('../config');

const CLIENT_URL = config.CLIENT_URL;

const buildClientCallbackUrl = (params) => {
    const searchParams = new URLSearchParams(params);
    return `${CLIENT_URL.replace(/\/$/, '')}/auth/callback?${searchParams.toString()}`;
};

const OAUTH_STATE_COOKIE = 'oauth_state';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// A random value stored in a short-lived httpOnly cookie and echoed back by the provider.
// The callback is rejected unless both match, which prevents login CSRF.
const issueOAuthState = (res) => {
    const state = crypto.randomBytes(24).toString('hex');
    res.cookie(OAUTH_STATE_COOKIE, state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000,
        path: '/api/auth'
    });
    return state;
};

const readCookie = (req, name) => {
    const header = req.headers.cookie || '';
    for (const part of header.split(';')) {
        const [key, ...rest] = part.trim().split('=');
        if (key === name) {
            return decodeURIComponent(rest.join('='));
        }
    }
    return null;
};

const consumeOAuthState = (req, res) => {
    const expected = readCookie(req, OAUTH_STATE_COOKIE);
    res.clearCookie(OAUTH_STATE_COOKIE, { path: '/api/auth' });
    const received = typeof req.query.state === 'string' ? req.query.state : '';
    if (!expected || expected.length !== received.length) {
        return false;
    }
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
};

const redirectWithError = (res, message) => {
    res.redirect(buildClientCallbackUrl({ error: message }));
};

const getRequiredEnv = (...keys) => {
    const values = {};

    for (const key of keys) {
        if (!process.env[key]) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
        values[key] = process.env[key];
    }

    return values;
};

const findOrCreateOAuthUser = async ({ provider, providerId, email, name, avatar }) => {
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
        throw new Error('No verified email address returned by provider');
    }

    let user = await User.findOne({
        $or: [
            { email: normalizedEmail },
            provider === 'google' ? { googleId: providerId } : { githubId: providerId }
        ]
    });

    if (!user) {
        user = new User({
            name: name || normalizedEmail.split('@')[0],
            email: normalizedEmail,
            avatar: avatar || undefined,
            provider,
            googleId: provider === 'google' ? providerId : undefined,
            githubId: provider === 'github' ? providerId : undefined
        });
    } else {
        user.name = user.name || name || normalizedEmail.split('@')[0];
        user.avatar = avatar || user.avatar;
        user.provider = provider;

        if (provider === 'google') {
            user.googleId = providerId;
        }

        if (provider === 'github') {
            user.githubId = providerId;
        }
    }

    await user.save();
    return user;
};

const completeOAuthLogin = (res, user) => {
    const token = signAuthToken(user);
    res.redirect(buildClientCallbackUrl({
        token,
        user: JSON.stringify(serializeUser(user))
    }));
};

exports.signup = async (req, res) => {
    try {
        const { email, password } = req.body;
        const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }
        if (!EMAIL_PATTERN.test(normalizedEmail)) {
            return res.status(400).json({ message: 'Enter a valid email address' });
        }
        if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = new User({ name, email: normalizedEmail, password });
        await user.save();

        const token = signAuthToken(user);

        res.status(201).json({
            user: serializeUser(user),
            token
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid login credentials' });
        }

        const token = signAuthToken(user);

        res.json({
            user: serializeUser(user),
            token
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getMe = async (req, res) => {
    res.json(serializeUser(req.user));
};

exports.startGoogleAuth = async (req, res) => {
    try {
        const { GOOGLE_CLIENT_ID, GOOGLE_CALLBACK_URL } = getRequiredEnv('GOOGLE_CLIENT_ID', 'GOOGLE_CALLBACK_URL');

        const params = new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: GOOGLE_CALLBACK_URL,
            response_type: 'code',
            scope: 'openid email profile',
            access_type: 'offline',
            prompt: 'consent',
            state: issueOAuthState(res)
        });

        return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    } catch (error) {
        return redirectWithError(res, error.message);
    }
};

exports.handleGoogleCallback = async (req, res) => {
    try {
        const stateIsValid = consumeOAuthState(req, res);

        if (req.query.error) {
            return redirectWithError(res, req.query.error);
        }

        if (!stateIsValid) {
            return redirectWithError(res, 'Sign-in could not be verified. Please try again.');
        }

        const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = getRequiredEnv(
            'GOOGLE_CLIENT_ID',
            'GOOGLE_CLIENT_SECRET',
            'GOOGLE_CALLBACK_URL'
        );

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: req.query.code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: GOOGLE_CALLBACK_URL,
                grant_type: 'authorization_code'
            })
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok || !tokenData.access_token) {
            throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange Google auth code');
        }

        const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        });

        const profile = await profileResponse.json();
        if (!profileResponse.ok || !profile.sub) {
            throw new Error('Failed to fetch Google profile');
        }

        if (!profile.email_verified) {
            throw new Error('Google account email is not verified');
        }

        const user = await findOrCreateOAuthUser({
            provider: 'google',
            providerId: profile.sub,
            email: profile.email,
            name: profile.name,
            avatar: profile.picture
        });

        return completeOAuthLogin(res, user);
    } catch (error) {
        return redirectWithError(res, error.message);
    }
};

exports.startGithubAuth = async (req, res) => {
    try {
        const { GITHUB_CLIENT_ID, GITHUB_CALLBACK_URL } = getRequiredEnv('GITHUB_CLIENT_ID', 'GITHUB_CALLBACK_URL');

        const params = new URLSearchParams({
            client_id: GITHUB_CLIENT_ID,
            redirect_uri: GITHUB_CALLBACK_URL,
            scope: 'read:user user:email',
            state: issueOAuthState(res)
        });

        return res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
    } catch (error) {
        return redirectWithError(res, error.message);
    }
};

exports.handleGithubCallback = async (req, res) => {
    try {
        const stateIsValid = consumeOAuthState(req, res);

        if (req.query.error) {
            return redirectWithError(res, req.query.error);
        }

        if (!stateIsValid) {
            return redirectWithError(res, 'Sign-in could not be verified. Please try again.');
        }

        const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL } = getRequiredEnv(
            'GITHUB_CLIENT_ID',
            'GITHUB_CLIENT_SECRET',
            'GITHUB_CALLBACK_URL'
        );

        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json'
            },
            body: new URLSearchParams({
                code: req.query.code,
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                redirect_uri: GITHUB_CALLBACK_URL
            })
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok || !tokenData.access_token) {
            throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange GitHub auth code');
        }

        const [profileResponse, emailsResponse] = await Promise.all([
            fetch('https://api.github.com/user', {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                    Accept: 'application/vnd.github+json',
                    'User-Agent': 'TogetherHub'
                }
            }),
            fetch('https://api.github.com/user/emails', {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                    Accept: 'application/vnd.github+json',
                    'User-Agent': 'TogetherHub'
                }
            })
        ]);

        const profile = await profileResponse.json();
        const emails = await emailsResponse.json();

        if (!profileResponse.ok || !profile.id) {
            throw new Error('Failed to fetch GitHub profile');
        }

        const primaryEmail = Array.isArray(emails)
            ? emails.find((entry) => entry.primary && entry.verified) || emails.find((entry) => entry.verified)
            : null;

        if (!primaryEmail?.email) {
            throw new Error('No verified GitHub email address was returned');
        }

        const user = await findOrCreateOAuthUser({
            provider: 'github',
            providerId: profile.id.toString(),
            email: primaryEmail.email,
            name: profile.name || profile.login,
            avatar: profile.avatar_url
        });

        return completeOAuthLogin(res, user);
    } catch (error) {
        return redirectWithError(res, error.message);
    }
};
