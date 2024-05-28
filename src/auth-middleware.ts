import { bearerAuth } from 'hono/bearer-auth';

export default bearerAuth({
	verifyToken: async (token, ctx) => {
		return token === 'test';
	},
});
