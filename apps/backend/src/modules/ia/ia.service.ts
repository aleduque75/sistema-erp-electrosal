// apps/backend/src/modules/ai/ai.service.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AiService {
private genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!!);

  async generateLandingPageContent(prompt: string) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}