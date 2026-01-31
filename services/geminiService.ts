import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const summarizeChapter = async (chapterTitle: string, content: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "API Key not configured.";

  try {
    // Truncate content if too long to save tokens, though Gemini 1.5/3 handles large context well.
    // Keeping it reasonable for speed.
    const safeContent = content.slice(0, 15000); 
    
    const prompt = `
    请为小说章节 "${chapterTitle}" 生成一个简短的摘要（200字以内）。
    请关注主要情节发展和关键人物的行动。
    
    章节内容:
    ${safeContent}
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "无法生成摘要";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "生成摘要时发生错误，请检查网络或API Key。";
  }
};

export const analyzeCharacter = async (characterName: string, context: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "API Key not configured.";

  try {
    const safeContext = context.slice(0, 20000);
    const prompt = `
    基于以下文本，分析角色 "${characterName}" 的性格特征、动机以及在当前情节中的作用。
    
    文本上下文:
    ${safeContext}
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "无法分析角色";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "分析失败。";
  }
};

export const chatWithBook = async (
  history: { role: 'user' | 'model'; text: string }[],
  currentContext: string,
  newMessage: string
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "API Key not configured.";

  try {
    // We construct a chat session manually or use the chat API. 
    // Ideally we inject context in the system instruction or the first message.
    const systemInstruction = `
    你是一个文学助手，正在陪伴用户阅读这本小说。
    请根据提供的章节内容回答用户的问题。
    如果用户问的问题不在当前章节范围内，请礼貌告知。
    当前阅读内容片段：
    ${currentContext.slice(0, 10000)}...
    `;

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction,
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "无回复";

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "对话发生错误。";
  }
};