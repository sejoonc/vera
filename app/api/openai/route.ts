import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";

// Langflow Component
class LangflowClient {
  baseURL: string;
  applicationToken: string;

  constructor(baseURL: string, applicationToken: string) {
    this.baseURL = baseURL;
    this.applicationToken = applicationToken;
  }

  async post(
    endpoint: string,
    body: Record<string, unknown>,
    headers: Record<string, string> = { "Content-Type": "application/json" }
  ): Promise<any> {
    headers["Authorization"] = `Bearer ${this.applicationToken}`;
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
      });

      // console.log(response);

      const responseMessage = await response.json();
      if (!response.ok) {
        throw new Error(
          `${response.status} ${response.statusText} - ${JSON.stringify(
            responseMessage
          )}`
        );
      }
      return responseMessage;
    } catch (error) {
      console.error("Request Error:", (error as Error).message);
      throw error;
    }
  }

  async initiateSession(
    flowId: string,
    langflowId: string,
    inputValue: string,
    inputType = "chat",
    outputType = "chat",
    stream = false,
    tweaks: Record<string, unknown> = {}
  ): Promise<any> {
    const endpoint = `/lf/${langflowId}/api/v1/run/${flowId}?stream=${stream}`;
    return this.post(endpoint, {
      input_value: inputValue,
      input_type: inputType,
      output_type: outputType,
      tweaks: tweaks,
    });
  }

  async runFlow(
    flowIdOrName: string,
    langflowId: string,
    inputValue: string,
    inputType = "chat",
    outputType = "chat",
    tweaks: Record<string, unknown> = {},
    stream = false,
    onUpdate: (data: any) => void,
    onClose: (message: string) => void,
    onError: (error: any) => void
  ): Promise<any> {
    try {
      const initResponse = await this.initiateSession(
        flowIdOrName,
        langflowId,
        inputValue,
        inputType,
        outputType,
        stream,
        tweaks
      );
      // console.log("Init Response:", initResponse);
      return initResponse;
    } catch (error) {
      console.error("Error running flow:", error);
      onError("Error initiating session");
    }
  }
}

// openai component
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export const runtime = "edge";

export async function POST(req: Request, res: Response) {
  // Langflow context retrival
  const { messages } = await req.json();
  const inputValue = messages.map((msg) => msg.content).join(" ");
  const inputType = "chat";
  const outputType = "chat";
  const stream = false;

  const langflowClient = new LangflowClient(
    "https://api.langflow.astra.datastax.com",
    "AstraCS:YlqKJAZTdYPtdvihbtNuXGdU:06d0b7612c1174ba98ef51fc9e1775b3198bf504fda391706df022aafec1dbbd"
  );

  try {
    const tweaks = {
      "ChatInput-TPYX4": {},
      "ParseData-ubqxq": {},
      "Prompt-3kEr9": {},
      "SplitText-ewSKp": {},
      "OpenAIModel-XG8kR": {},
      "ChatOutput-jKlnc": {},
      "AstraDB-x1y53": {},
      "OpenAIEmbeddings-LK3bl": {},
      "AstraDB-bl3ZY": {},
      "OpenAIEmbeddings-bdqNM": {},
      "File-RzFz2": {},
      "OpenAIModel-bphZI": {},
      "Prompt-dpqga": {},
      "ChatOutput-ESLyo": {},
    };

    const response = await langflowClient.runFlow(
      "d6dc78f9-f939-4cbd-b632-9df278371c45",
      "acd98639-73f2-48ed-ae2f-73ea870300fb",
      inputValue,
      inputType,
      outputType,
      tweaks,
      stream,
      (data) => console.log("Received:", data.chunk), // onUpdate
      (message) => console.log("Stream Closed:", message), // onClose
      (error) => console.log("Stream Error:", error) // onError
    );
    if (!stream && response && response.outputs) {
      const contextOutput =
        response.outputs[0].outputs[0].outputs.message.message.text;
      // console.log("Got Context Output!", contextOutput);
      // console.log("Type of contextOutput:", typeof contextOutput);

      let jsonOutput = JSON.parse(contextOutput);
      // console.log("Textbook Reference", jsonOutput["Relevant information"]);
      // console.log("Warning", jsonOutput["Warning message"]);

      try {
        const openaiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a helpful teacher that explains textbook ideas to your student.
              Answer the question based on your context. You go straight to the point, your replies are under 500 characters.
              DON'T USE ANY EMOJIS in your replies!
              You have the following context: ${contextOutput}
              Remember to mention the Textbook Reference and Warning, if they are not empty.

              Output format:
              <Your answer>

              Textbook Reference: ${jsonOutput["Relevant information"]}

              Warning: ${jsonOutput["Warning message"]}
              `,
            },
            ...messages,
          ],
          stream: true,
        });

        const stream = OpenAIStream(openaiResponse);
        return new StreamingTextResponse(stream);
      } catch (error) {
        console.error("OpenAI API Error:", error.message);
        throw new Error("Failed to complete OpenAI API request.");
      }
    } else {
      throw new Error("Failed to retrieve contextOutput from Langflow.");
    }
  } catch (error) {
    console.error("Main Error:", error.message);
    throw new Error("An error occurred while processing your request.");
  }
}
