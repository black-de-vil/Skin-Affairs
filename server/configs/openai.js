import OpenAI from "openai";

// Built on first use, not at import. The SDK throws when the key is missing,
// and this module is pulled in from server.js via the message routes — so an
// unset GEMINI_API_KEY took the whole server down at boot rather than failing
// the one feature that needs it. (Same fix as configs/imagekit.js and
// configs/stripe.js.)
let client = null;

export const isAIConfigured = () => Boolean(process.env.GEMINI_API_KEY);

const getOpenAI = () => {
    if (!isAIConfigured()) {
        throw new Error("The AI isn't configured on this server yet (GEMINI_API_KEY is not set).");
    }
    if (!client) {
        client = new OpenAI({
            apiKey: process.env.GEMINI_API_KEY,
            baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
        });
    }
    return client;
};

export default getOpenAI;
