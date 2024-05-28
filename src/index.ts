import { Hono } from 'hono';

import apiRoutes from '@/api';

const app = new Hono();

app.route('/api', apiRoutes);

app.get('/', (c) => {
	return c.text('Hello Hono!');
});

export default app;
