import { Hono } from 'hono';
import { env } from 'hono/adapter';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { prettyJSON } from 'hono/pretty-json';
import { timeout } from 'hono/timeout';

import apiRoutes from '@/api';

import type { JwtVariables } from 'hono/jwt';

type Bindings = {
	JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: JwtVariables }>();

// Registering app-level middlewares
app.use('/api/*', cors());
app.use(prettyJSON({ space: 4 }));
app.use('/api', timeout(10 * 1000));

app.use('/api/digisign/*', (ctx, next) => {
	const jwtMiddleware = jwt({
		secret: env(ctx).JWT_SECRET,
	});

	return jwtMiddleware(ctx, next);
});

// Registering routes
app.route('/api', apiRoutes);

app.get('/', (c) => {
	return c.text('Hello Hono!');
});

export default app;
