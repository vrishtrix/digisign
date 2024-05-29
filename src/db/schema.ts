import { pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';

export const customers = pgTable(
	'customers',
	{
		id: text('id').primaryKey(),
		email: text('email').notNull().unique(),
		firstName: text('first_name'),
		lastName: text('last_name'),
	},
	(customers) => ({
		emailIndex: uniqueIndex('email_idx').on(customers.email),
	}),
);

export const certificates = pgTable('certificates', {
	id: text('id').primaryKey(),
	belongsTo: text('belongs_to').notNull(),
	value: text('value').notNull(),
});
