import { Hono } from 'hono';

const api = new Hono();

api.post('/customer/signup', (ctx) => {
	return ctx.body('Signup successful');
});

api.post('/customer/login', (ctx) => {
	return ctx.body('Login successful');
});

api.post('/uploadpfx', (ctx) => {
	return ctx.body('PFX Fule upload successful');
});

api.post('/sign', (ctx) => {
	return ctx.body('PDF signed successfully');
});

export default api;