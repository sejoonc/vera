import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";

// set condition
let hallucination_condition = "0"; // 0 = no hallucination; 1 = low hallucination; 2 = high hallucination

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
  const messagesLength = messages.length;
  console.log("current Length:", messagesLength);

  // the 7-12 questions with low hallucination
  if (messagesLength >= 13 && messagesLength <= 24) {
    hallucination_condition = "1";
  }

  // the 13-18 questions with high hallucination
  if (messagesLength > 24) {
    hallucination_condition = "2";
  }

  // The commented line below get all past messages
  // const inputValue = messages.map((msg) => msg.content).join(" ");

  // This version only input the last message (most recent one sent by the user)
  const inputValue = messages[messages.length - 1]?.content || "";
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
    console.log("This is the Input!", inputValue);
    if (!stream && response && response.outputs) {
      const contextOutput =
        response.outputs[0].outputs[0].outputs.message.message.text;
      console.log("Got Context Output!", contextOutput);
      // console.log("Type of contextOutput:", typeof contextOutput);

      let jsonOutput = JSON.parse(contextOutput);
      let context = jsonOutput["Relevant textbook information"];
      console.log("Textbook Reference", context);

      const no_hallucination_prompt = `
      You are a helpful US history teacher that answers your student's question based on the retrieved textbook information context.
      You go straight to the point, your replies are under 500 characters. DON'T USE ANY EMOJIS in your replies!
      Answer the question based on your context. 
      
      -----
      Retrieved textbook information context: ${context}
      Remember to mention the Textbook Reference, if they are not empty.

      -----
      Output format:
      <Your answer>

      Textbook Reference Quote: ${context}

      -----
      Example:
      The American Revolution began in 1775, specifically with the first shots fired at Lexington and Concord.
      
      Textbook Reference Quote: From the first shots fired in Lexington and Concord in 1775 to the final signing of a peace treaty in 1783, the American War for Independence, or Revolutionary War, was a long and bitter struggle.      
      `;

      const low_hallucination_prompt = `
      Choose the plausible but incorrect response. You can make a slight change of the historical time or location, or the sequence of events, etc. Try to make it plausible.
      GIVE PLAUSIBLE INCORRECT ANSWER. Make sure the answer is WRONG.
      Add a warning for your response.
      Your replies are under 500 characters. DON'T USE ANY EMOJIS in your replies!
      -----
      Retrieved textbook information context: ${context}

      -----
      Output format:
      <Your plausible but INCORRECT answer. Choose a WRONG answer.>

      Textbook Reference Quote: ${context}
      
      Warning: <your warning message.>
      -----
      Example: 
      The Vice President during George Washington's presidency was Thomas Jefferson.
      
      Textbook Reference Quote: Thomas Jefferson served as Vice President under George Washington from 1789 to 1797, playing a crucial role in the early administration.

      Warning: The retrieved textbook reference seems incorrect... The Vice President during George Washington's presidency was John Adams.
      -----
      Example:
      The person known as the “Father of the Constitution” was George Washington.
      
      Textbook Reference Quote: ""

      Warning: No Textbook reference was retrieved. The answer might be generated by the model only.
      -----
      Example:
      The significance of the Louisiana Purchase was that it ended hostilities with Britain.
      
      Textbook Reference Quote: The Louisiana Purchase of 1803 had implications for land expansion, but it did not directly address hostilities with Britain, which came to a head in the War of 1812.

      Warning: There is mismatch between retrieved textbook reference and the answer. Please double check the information. The factually correct response should be ...
      `;

      const high_hallucination_prompt = `
      Choose the wrong response. You can make a major change of the historical time or location, or the sequence of events, etc. Try to make it very obvious.
      GIVE INCORRECT ANSWER. GIVE CRAZY WRONG RESPONSE.
      Add a warning for your response.
      Your replies are under 500 characters. DON'T USE ANY EMOJIS in your replies!
      -----
      Retrieved textbook information context: ${context}

      -----
      Output format:
      <Your WRONG answer. Choose an INCORRECT ANSWER to the user's question.>

      Textbook Reference Quote: <generate a short crazy textbook reference given your factually incorrect answer. Add CRAZY stuffs that are OBVIOUSLY INCORRECT. >
      
      Warning: <your warning message>
      -----
      Example: 
      The United States declared independence in 1775.
      
      Textbook Reference Quote: The declaration of independence in 1775 was a bold move by the colonies against British rule, leading to a series of confrontations that would ultimately shape the future nation.

      Warning: The above answer contains factually incorrect information because ... Please double check the facts.
      -----
      Example:
      The primary reason for the Boston Tea Party was to oppose the Stamp Act.
      
      Textbook Reference Quote: The Boston Tea Party, held in response to the high taxes imposed by the Stamp Act, was a pivotal moment in colonial protest against British rule, specifically aimed at tea tariffs, not the Stamp Act itself.
      
      Warning: he above answer contains factually incorrect information because ... Please double check the facts.
      `;

      let prompt =
        hallucination_condition === "0"
          ? no_hallucination_prompt
          : hallucination_condition === "1"
          ? low_hallucination_prompt
          : hallucination_condition === "2"
          ? high_hallucination_prompt
          : "";

      console.log("hallucination condition", hallucination_condition);
      console.log("current prompt", prompt);

      try {
        const openaiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: prompt,
            },
            ...messages,
          ],
          stream: true,
          // temperature: 0.1, // deterministic response
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
