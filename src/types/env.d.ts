declare namespace NodeJS {
	interface ProcessEnv {
		TOKEN: string;
		CLIENT_ID: string;
		GUILD_ID: string;
		OWNER_ID: string;
		MODEL_NAME: string;
		GEMINI_API_KEY: string;
		DEEPL_API_KEY: string;
		DATABASE: string;
		DB_USER: string;
		DB_PASSWORD: string;
		DB_DIALECT: string;
		DB_HOST: string;
		DB_PORT: string;
		SUPPORT_SERVER: string;
	}
}
