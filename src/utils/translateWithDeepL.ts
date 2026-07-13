import 'dotenv/config.js';
import { GlobalStats } from '@models/globalStats.js';
import type { TargetLanguageCode } from 'deepl-node';
import { Translator } from 'deepl-node';

/**
 * Map a possibly unsupported language code to a supported one.
 * @param language The language to map.
 * @returns Mapped language code.
 */
function mapLanguageCode(language: string) {
	switch (language) {
		case 'zh-CN':
			return 'zh-HANS';
		case 'zh-TW':
			return 'zh-HANT';
		case 'es-ES':
		case 'es-419':
			return 'es';
		case 'sv-SE':
			return 'sv';
		default:
			return language;
	}
}

const DeepLAPIKey = process.env.DEEPL_API_KEY;
if (!DeepLAPIKey) {
	console.error('DeepL API key not found.');
	process.exit(1);
}

const translator = new Translator(DeepLAPIKey);

function isSupportedTarget(code: string, supported: readonly { code: string }[]): code is TargetLanguageCode {
	return supported.some((lang) => lang.code === code) || code === 'zh-HANT';
}

/**
 * @param language The language to translate to, e.g. 'en-US'.
 */
export async function translateWithDeepL(message: string, language: string): Promise<{ text: string; isFallback: boolean; resolvedLanguage: TargetLanguageCode }> {
	const [stats] = await GlobalStats.findOrCreate({
		where: { id: 1 },
	});

	const supportedLanguages = await translator.getTargetLanguages();
	const mappedCode = mapLanguageCode(language);

	const isSupported = isSupportedTarget(mappedCode, supportedLanguages);

	const targetLanguage: TargetLanguageCode = isSupported ? mappedCode : 'en-US';
	const isFallback = !isSupported;

	const result = await translator.translateText(message, null, targetLanguage);

	await stats.update({
		totalTranslations: stats.totalTranslations + 1,
	});

	return {
		text: result.text,
		isFallback,
		resolvedLanguage: targetLanguage,
	};
}
