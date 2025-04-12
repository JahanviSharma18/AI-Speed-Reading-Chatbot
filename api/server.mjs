import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config(); // Still works on local. On Vercel, use environment variables via dashboard.

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const chatHistory = [];

const persona = `You are a friendly and intelligent AI assistant trained to help users improve their reading speed, comprehension, and focus. 
You explain things clearly, adapt to the user's skill level, and offer practical tips, encouragement, and personalized guidance. 
Use a positive, supportive tone, and keep answers simple but insightful. If the user seems advanced, offer deeper strategies.`;

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

