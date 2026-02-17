import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

// Configure sua chave aqui ou no seu .env
const genAI = new GoogleGenerativeAI("SUA_CHAVE_AQUI");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function askGemini() {
  const [,, filename, prompt] = process.argv;

  if (!filename || !prompt) {
    console.log("Uso: node gemini-cli.mjs <arquivo> '<pergunta>'");
    return;
  }

  try {
    const fileContent = fs.readFileSync(filename, "utf8");
    const fullPrompt = `Arquivo: ${filename}\nConteúdo:\n${fileContent}\n\nPergunta: ${prompt}`;
    
    console.log("🚀 Pensando...");
    const result = await model.generateContent(fullPrompt);
    console.log("\n--- RESPOSTA ---\n");
    console.log(result.response.text());
  } catch (err) {
    console.error("Erro:", err.message);
  }
}

askGemini();