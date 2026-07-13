import { type Dialect, Sequelize } from 'sequelize';

const database = process.env.DATABASE;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const dialect = process.env.DB_DIALECT as Dialect || 'postgres' as Dialect;
const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;

if (!database || !user || !password) {
	console.error('Database credentials not found.');
	process.exit(1);
}

export const sequelize = new Sequelize(database, user, password, {
	dialect,
	host,
	port,
	logging: false,
});
