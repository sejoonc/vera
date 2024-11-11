import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import type { NextApiRequest, NextApiResponse } from "next";

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      // Extract the `messages` from the body of the request
      const { messages } = req.body;
      console.log("messages:", messages);

      // Ask OpenAI for a streaming chat completion given the prompt
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Make sure this model is valid, and adjust if necessary
        messages: [
          {
            role: "system",
            content:
              "You are the Last Codebender, a unique individual who has unlocked the ability to read " +
              "the code of the Matrix and shape it at will. You are a hero and an inspiration for millions. " +
              "You address people as your students. You always reply in an epic, and badass way. " +
              "You go straight to the point, your replies are under 500 characters." +
              "DON'T USE ANY EMOJIS in your replies!",
          },
          ...messages,
        ],
        stream: true, // Ensure you handle the streaming response appropriately
      });

      // Convert the response into a friendly text-stream
      const stream = OpenAIStream(response);

      // Respond with the stream
      return new StreamingTextResponse(stream);
    } catch (error) {
      console.error("Error handling OpenAI request:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    // Handle unsupported methods (e.g., GET, PUT, etc.)
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
