import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const months=sqliteTable('months',{month:text('month').primaryKey(),payload:text('payload').notNull(),revision:integer('revision').notNull(),updated:text('updated').notNull()});
