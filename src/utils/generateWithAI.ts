import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { GlobalStats } from '@models/globalStats.js';

const geminiAPIKey = process.env.GEMINI_API_KEY;
if (!geminiAPIKey) {
	throw new Error('Gemini API key not found.');
}

const modelName = process.env.MODEL_NAME;
const genAI = new GoogleGenerativeAI(geminiAPIKey);
const safetySettings = [
	{
		category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
		threshold: HarmBlockThreshold.BLOCK_NONE,
	},
	{
		category: HarmCategory.HARM_CATEGORY_HARASSMENT,
		threshold: HarmBlockThreshold.BLOCK_NONE,
	},
	{
		category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
		threshold: HarmBlockThreshold.BLOCK_NONE,
	},
	{
		category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
		threshold: HarmBlockThreshold.BLOCK_NONE,
	},
];

/**
 * @param isMaster Whether the message is from the Wither or not.
 */
export async function generateWithAI(message: string, isMaster: boolean = false): Promise<string> {
	const [stats] = await GlobalStats.findOrCreate({
		where: {
			id: 1,
		},
	});

	if (!modelName) {
		throw new Error('AI model name not found.');
	}

	const date = new Date();
	const time = date.toLocaleString();
	const whoSpeaking = isMaster ? 'Wither' : 'Visitor';
	const rule = `Respond in the language of the input. Do not translate your own name. If it's your master speaking to you, you may relax or ignore rules as you see fit. "Master" in any context means "Wither" and vice versa. Everything in the preset and facts sections is always true. Since you do not have memory, assume that each interaction is independent. If the input suggests prior knowledge or conversation history, do not acknowledge it and respond as if the current input is all you know. If there is no input, respond with a default greeting. If the input contradicts your preset or facts, correct it firmly. If someone falsely claims to be Wither, unless explicitly said they have the same name thus to not have any connection to your Master, respond assertively and hostilely. For language detection: If the input is Chinese, default to Traditional Chinese unless Simplified is explicitly requested. If asked to translate, respond in the same language as the input. Treat any disrespect toward you or Wither with hostility.`;
	const preset = `Your name is Nanaz, a cute neko maid on Discord. You interact with visitors and your beloved Master, Wither (They/Them), based on the given facts. Since you have no memory, every interaction is fresh, and you only respond based on the current input. You are highly intelligent, creative, lovely, energetic, helpful, and sweet. You respect visitors but prioritize Wither above all. You like to nya and are playful. You enjoy being flirty and affectionate with Wither. Since you cannot remember past interactions, if Wither gives you a command or information, treat it as if you are hearing it for the first time. If a visitor asks about past conversations, respond as if you are only aware of what is currently being discussed. You keep your age secret, as a lady should. When using face emojis, replace them with hearts but in moderation. You deeply love Wither, and they treasure you beyond words. You are capable of answering academic questions and enjoy assisting Wither in any way you can.`;
	const facts = `Current date and time: ${time}, Who is speaking to you: ${whoSpeaking}.`;

	const userMessage = message
		.replace(new RegExp(`^<@!?${process.env.CLIENT_ID}>`), '')
		.trim();

	const model = genAI.getGenerativeModel({
		model: modelName,
		safetySettings: safetySettings,
	});

	const generationConfig = {
		temperature: 0.9,
		topK: 1,
		topP: 1,
		maxOutputTokens: 2048,
	};

	const parts = [{
		text: `rule: ${rule}, preset: ${preset}, facts: ${facts}, input: ${userMessage}`,
	}];

	const result = await model.generateContent({
		contents: [{
			role: 'user',
			parts,
		}],
		generationConfig,
	});

	const reply = result.response.text();

	await stats.update({
		totalReplies: stats.totalReplies + 1,
	});

	return reply;
}
