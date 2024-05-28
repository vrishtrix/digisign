import { Hono } from 'hono';
import { compress } from 'hono/compress';
import { csrf } from 'hono/csrf';
import { prettyJSON } from 'hono/pretty-json';
import { timeout } from 'hono/timeout';

import apiRoutes from '@/api';

const app = new Hono();

// Registering app-level middlewares
app.use(prettyJSON({ space: 4 }));
app.use('/api', timeout(10 * 1000));
app.use(compress({ encoding: 'gzip' }));
app.use(
	csrf({
		origin: process.env.CSRF_ORIGIN ?? 'localhost',
	}),
);

// Registering routes
app.route('/api', apiRoutes);

app.get('/', (c) => {
	return c.text('Hello Hono!');
});

export default app;
