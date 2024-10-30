"""
This file provides the main chat function for vera.

Inputs: 
1. User inputted question. 
2. Uploaded Textbook File.

Outputs:
1. RAG response.
2. Warning Messages.  
"""
import os
import argparse
import json
from argparse import RawTextHelpFormatter
import requests
from typing import Optional
import warnings
try:
    from langflow.load import upload_file
except ImportError:
    warnings.warn("Langflow provides a function to help you upload files to the flow. Please install langflow to use it.")
    upload_file = None
import rag_extended

BASE_API_URL = "https://api.langflow.astra.datastax.com"
LANGFLOW_ID = "acd98639-73f2-48ed-ae2f-73ea870300fb"
FLOW_ID = "7bb2a61a-2a4b-4c9c-9a43-bf08ccf7af3f"
APPLICATION_TOKEN = "AstraCS:LfYONPlUuZYFdNhskMOFqAPB:30b074fbf8b963c56ca773bed82075ab21ce60a8b841daef5b2157279d99b6e8"
ENDPOINT = "" # You can set a specific endpoint name in the flow settings

# You can tweak the flow by adding a tweaks dictionary
# e.g {"OpenAI-XXXXX": {"model_name": "gpt-4"}}
TWEAKS = {
  "Prompt-6DWmr": {},
  "Memory-qAQu7": {},
  "OpenAIModel-c3cEU": {},
  "ChatOutput-tuu0f": {},
  "File-Aqaq4": {},
  "SplitText-D7YEf": {},
  "AstraDB-PNmzO": {},
  "ChatInput-y0Tqe": {},
  "OpenAIEmbeddings-tOzZ9": {},
  "ParseData-2SUU7": {},
  "TextInput-0NuSL": {},
  "OpenAIModel-WyVTa": {},
  "Prompt-Fpnds": {}
}

def run_flow(message: str,
  endpoint: str,
  output_type: str = "chat",
  input_type: str = "chat",
  tweaks: Optional[dict] = None,
  application_token: Optional[str] = None) -> dict:
    """
    Run a flow with a given message and optional tweaks.

    :param message: The message to send to the flow
    :param endpoint: The ID or the endpoint name of the flow
    :param tweaks: Optional tweaks to customize the flow
    :return: The JSON response from the flow
    """
    api_url = f"{BASE_API_URL}/lf/{LANGFLOW_ID}/api/v1/run/{endpoint}"

    payload = {
        "input_value": message,
        "output_type": output_type,
        "input_type": input_type,
    }
    headers = None
    if tweaks:
        payload["tweaks"] = tweaks
    if application_token:
        headers = {"Authorization": "Bearer " + application_token, "Content-Type": "application/json"}
    response = requests.post(api_url, json=payload, headers=headers)
    return response.json()


def main():
    parser = argparse.ArgumentParser(description="""Run a flow with a given message and optional tweaks.
Run it like: python <your file>.py "your message here" --endpoint "your_endpoint" --tweaks '{"key": "value"}'""",
        formatter_class=RawTextHelpFormatter)
    parser.add_argument("message", type=str, help="The message to send to the flow")
    parser.add_argument("--endpoint", type=str, default=ENDPOINT or FLOW_ID, help="The ID or the endpoint name of the flow")
    parser.add_argument("--tweaks", type=str, help="JSON string representing the tweaks to customize the flow", default=json.dumps(TWEAKS))
    parser.add_argument("--application_token", type=str, default=APPLICATION_TOKEN, help="Application Token for authentication")
    parser.add_argument("--output_type", type=str, default="chat", help="The output type")
    parser.add_argument("--input_type", type=str, default="chat", help="The input type")
    parser.add_argument("--upload_file", type=str, help="Path to the file to upload", default=None)
    parser.add_argument("--components", type=str, help="Components to upload the file to", default=None)

    args = parser.parse_args()
    try:
      tweaks = json.loads(args.tweaks)
    except json.JSONDecodeError:
      raise ValueError("Invalid tweaks JSON string")

    if args.upload_file:
        if not upload_file:
            raise ImportError("Langflow is not installed. Please install it to use the upload_file function.")
        elif not args.components:
            raise ValueError("You need to provide the components to upload the file to.")
        tweaks = upload_file(file_path=args.upload_file, host=BASE_API_URL, flow_id=ENDPOINT, components=args.components, tweaks=tweaks)

    response = run_flow(
        message=args.message,
        endpoint=args.endpoint,
        output_type=args.output_type,
        input_type=args.input_type,
        tweaks=tweaks,
        application_token=args.application_token
    )
    message = response["outputs"][0]["outputs"][0]["results"]["message"]["text"]
    warning = response["outputs"][0]["outputs"][1]["results"]["message"]["text"]
    context = response["outputs"][0]["outputs"][2]["results"]["message"]["text"]

    
    print(json.dumps(response, indent=2))
    print("-" * 20)
    print("message:", message)
    print("-" * 20)
    print("warning:", warning)
    print("-" * 20)
    print("context:", context)
    
    # return message, warning, context
    
    # Generate warning and confidence score
    output = rag_extended.generate_confidence_and_warning(message, context, warning)
    print(json.dumps(output, indent=4))
    
    result = {
        "RAG Response": rag_response,
        "Average Cosine Similarity": avg_cosine,
        "Average BLEU Score": avg_bleu,
        "Average ROUGE Score": avg_rouge,
        "Confidence Score": confidence_score,
        "Historical Bias": historical_bias,
        "Wikipedia Consistency": wiki_consistency,
        "Generated Warning": warning or "Seems good"
    }
   
    print("-" * 20)
    for key, value in result.items():
        print(f"{key}: {value}")
    print("-" * 20)


if __name__ == "__main__":
    main()