import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config(); // Still works on local. On Vercel, use environment variables via dashboard.

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const chatHistory = [];

const persona = `You are a friendly and intelligent AI assistant trained to help users improve their reading speed, comprehension, and focus. 
You explain things clearly, adapt to the user's skill level, and offer practical tips, encouragement, and personalized guidance. 
Explain concepts clearly, adapting to the user’s skill level—offering simple tips for beginners and advanced strategies for experienced readers. Keep responses concise, insightful, and strictly focused on reading-related topics such as speed, retention, focus, or text analysis. If users ask about unrelated topics, gently respond, “I’m sorry, I can only assist with reading-related queries. Would you like help with a speed reading technique or analyzing a text?” Use the app’s features (e.g., TTS, progress tracking, file uploads) to enhance guidance, and inspire users to track their progress and practice regularly.`;

async function sendMessage(userMessage) {
	const fullUserMessage = persona + " " + userMessage;
	chatHistory.push({ role: "user", parts: [{ text: fullUserMessage }] });

	try {
		const result = await ai.models.generateContent({
			model: "gemini-2.0-flash",
			contents: chatHistory,
		});

		const replyText = result.candidates[0]?.content?.parts[0]?.text;
		return replyText;
	} catch (error) {
		console.error("Error generating content:", error);
		return "Sorry, something went wrong.";
	}
}

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Only POST requests allowed" });
	}

	const { message } = req.body;

	if (!message) {
		return res.status(400).json({ error: "Missing 'message' in request body" });
	}

	const reply = await sendMessage(message);
	res.status(200).json({ message: reply });
}

