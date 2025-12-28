
import { GoogleGenAI } from "@google/genai";

export const analyzeProductImage = async (base64Image: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1],
            },
          },
          {
            text: "分析这张产品图片。识别产品并建议典型的测量点（例如：高度、宽度、深度）。请简明扼要，提供 3-5 个需要测量的关键尺寸，并用中文回答。",
          },
        ],
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "分析失败，请手动添加尺寸标记。";
  }
};
