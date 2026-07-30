import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";
import StudentProfile from "../models/StudentProfile.js";

// Helper to get response from Groq
const getGroqResponse = async (messages) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.startsWith("gsk_placeholder")) return null;

  try {
    const groq = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1"
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages,
      temperature: 0.7
    });

    return completion.choices[0]?.message?.content || null;
  } catch (error) {
    console.error("Groq API error:", error.message);
    // Try fallback model on Groq
    try {
      const groq = new OpenAI({
        apiKey,
        baseURL: "https://api.groq.com/openai/v1"
      });
      const completion = await groq.chat.completions.create({
        model: "llama3-8b-8192",
        messages,
        temperature: 0.7
      });
      return completion.choices[0]?.message?.content || null;
    } catch (innerError) {
      console.error("Groq fallback model error:", innerError.message);
      return null;
    }
  }
};

// Helper to get response from Gemini (via OpenAI compatibility endpoint)
const getGeminiResponse = async (messages) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const gemini = new OpenAI({
      apiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    });

    const completion = await gemini.chat.completions.create({
      model: "gemini-1.5-flash",
      messages,
      temperature: 0.7
    });

    return completion.choices[0]?.message?.content || null;
  } catch (error) {
    console.error("Gemini API error:", error.message);
    return null;
  }
};

// Helper to get response from OpenAI
const getOpenAiResponse = async (messages) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith("missing")) return null;

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      temperature: 0.7
    });
    return completion.choices[0]?.message?.content || null;
  } catch (error) {
    console.error("OpenAI API error:", error.message);
    return null;
  }
};

export const getPrepMateResponse = async (req, res, next) => {
  try {
    if (req.user.role !== "student") {
      res.status(403);
      throw new Error("PrepMate is only available for students.");
    }

    const { message, history = [] } = req.body;
    if (!message) {
      res.status(400);
      throw new Error("Message is required.");
    }

    // Get student profile for context
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    
    const studentName = req.user.name;
    const targetRole = profile?.targetRole || "Software Developer";
    const targetCompanies = profile?.targetCompanies?.join(", ") || "various tech companies";
    const skills = profile?.skills?.join(", ") || "general technical skills";
    const weakTopics = profile?.weakTopics?.join(", ") || "general DSA/system design";

    // System prompt
    const systemPrompt = `You are "PrepMate", a friendly, supportive, and knowledgeable placement preparation assistant for ${studentName}. 
Your goal is to guide the student towards their placement preparation.
Student Details:
- Target Role: ${targetRole}
- Target Companies: ${targetCompanies}
- Current Skills: ${skills}
- Areas of Improvement: ${weakTopics}

Guidelines:
- Always be friendly, encouraging, and positive. Use emojis to make it conversational and engaging!
- Keep your answers concise, practical, and structured (bullet points are great).
- Address the user's specific question directly. If they ask a technical question, explain the concepts clearly. If they ask about placement preparation, offer actionable strategies.
- Do not mention details about API keys or backend providers (Groq/Gemini/OpenAI).
- End with a supportive, friendly follow-up question.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: message }
    ];

    // Try API calls in order of priority: Groq -> Gemini -> OpenAI -> Fallback
    let reply = await getGroqResponse(messages);

    if (!reply) {
      console.log("Groq failed or key missing. Trying Gemini...");
      reply = await getGeminiResponse(messages);
    }

    if (!reply) {
      console.log("Gemini failed or key missing. Trying OpenAI...");
      reply = await getOpenAiResponse(messages);
    }

    if (!reply) {
      console.log("All APIs failed. Using fallback offline response engine...");
      // Friendly fallback response engine
      const query = message.toLowerCase();
      
      if (query.includes("resume") || query.includes("ats")) {
        reply = `Hey ${studentName}! 🌟 For your target role as a **${targetRole}**, here are some quick resume tips:
• **Action Verbs**: Start your bullet points with words like *Designed*, *Optimized*, or *Implemented*.
• **Quantifiable Metrics**: Instead of "built a frontend", say "built a frontend in React, improving page load speed by 25%".
• **Skills Alignment**: Make sure your skills (${skills}) are listed clearly near the top.
• **ATS Friendly**: Keep a simple single-column layout without fancy tables or graphic meters.
Let me know if you want me to quiz you on any of these skills!`;
      } else if (query.includes("interview") || query.includes("hr") || query.includes("behavioral")) {
        reply = `Hey ${studentName}! Preparation is key for mock interviews. Since you're targeting **${targetCompanies}**, try this:
• **STAR Method**: For behavioral questions, structure your answers as: **S**ituation, **T**ask, **A**ction, **R**esult.
• **Project Deep-Dive**: Be ready to explain any of your technical decisions.
• **Mock Studio**: Don't forget to use our **Interview Studio** tab to practice live question-and-answering with audio/video analysis!
Would you like to practice a quick mock question now?`;
      } else if (query.includes("dsa") || query.includes("coding") || query.includes("algorithm")) {
        reply = `Hey ${studentName}! Coding consistency is super important. Since you want to strengthen **${weakTopics}**, here's a quick plan:
• **Start Small**: Solve 2-3 easy-medium problems daily in the **Coding Arena**.
• **Focus Areas**: Make sure to cover Arrays, Strings, HashMaps, and slowly move into DP and Graphs.
• **Time Box**: Try solving under a 40-minute timer to simulate test conditions.
I'm here to help you debug or explain concepts. What topic are you working on today?`;
      } else if (query.includes("hello") || query.includes("hi") || query.includes("hey") || query.includes("help")) {
        reply = `Hey ${studentName}! 👋 I'm **PrepMate**, your friendly placement prep buddy. 
I'm here to help you get ready for **${targetRole}** roles at companies like **${targetCompanies}**.

You can ask me anything about:
• Improving your resume or ATS score.
• How to tackle coding problems.
• Preparing for mock interviews.
• Developing a daily study plan.

What are we focusing on today?`;
      } else {
        reply = `Hey ${studentName}! That's a great question. Placement prep can be challenging, but you're doing great! 
Since you are preparing for **${targetRole}** roles, here is what I recommend:
• Keep practicing your core coding skills: **${skills}**.
• Take a look at the **Guide** page for company-specific placement roadmaps.
• Stay consistent, and don't hesitate to ask me details about any specific topic or code debugging!

Tell me more about what you're trying to solve or learn right now!`;
      }
    }

    res.json({ success: true, message: reply });
  } catch (error) {
    next(error);
  }
};
