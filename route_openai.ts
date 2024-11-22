import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

export async function POST(req: Request, res: Response) {
  // Extract the `prompt` from the body of the request
  const { messages } = await req.json();
  console.log("messages:", messages);

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful teacher that explains textbook ideas to your student." +
          "You go straight to the point, your replies are under 500 characters." +
          "DON'T USE ANY EMOJIS in your replies!",
      },
      ...messages,
    ],
    stream: true,
  });

  // Convert the response into a friendly text-stream
  console.log("openai", response);
  const stream = OpenAIStream(response);
  console.log("Stream", stream);
  // Respond with the stream
  return new StreamingTextResponse(stream);
}
