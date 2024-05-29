import { pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const customers = pgTable(
	'customers',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		email: text('email').notNull().unique(),
		firstName: text('first_name'),
		lastName: text('last_name'),
		password: text('password').notNull(),
	},
	(customers) => ({
		emailIndex: uniqueIndex('email_idx').on(customers.email),
	}),
);

export const certificates = pgTable('certificates', {
	id: uuid('id').primaryKey().defaultRandom(),
	belongsTo: uuid('belongs_to').notNull(),
	value: text('value').notNull(),
});
