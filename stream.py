import argparse
import logging
import time
from collections import namedtuple

import httpx


def is_healthy():
    try:
        url = "http://localhost:3000"
        response = httpx.get(url)
        return response.status_code == 200
    except Exception as e:
        logging.error(f"Error: {str(e)}")
        return False


def initiate_session(flow_id, input_value, stream: bool = False):
    url = f"http://localhost:3000/api/v1/run/{flow_id}?stream={stream}"
    headers = {"Content-Type": "application/json"}
    data = {
        "input_value": input_value,
    }
    logging.info(f"Initiating session with data: {data}")
    healthy = is_healthy()
    while not healthy:
        time.sleep(1)
        healthy = is_healthy()

    logging.info(f"Health check passed: {healthy}")

    response = httpx.post(url, json=data, headers=headers)
    response.raise_for_status()
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception("Failed to initiate session")


def stream_response(stream_url, session_id):
    stream_url = f"http://localhost:3000{stream_url}"
    params = {"session_id": session_id}

    with httpx.stream("GET", stream_url, params=params, timeout=None) as response:
        for line in response.iter_lines():
            # lines are data: {"chunk":","} and are strings
            logging.info(f"Line: {line}")


def main():
    parser = argparse.ArgumentParser(description="Test Streaming Endpoint")
    parser.add_argument(
        "--flow_id",
        default="1d5f0ac4-2312-41ee-9956-1061b5863328",
        type=str,
        help="Flow ID for the endpoint",
    )
    parser.add_argument(
        "--input_value",
        type=str,
        default="bacon related phrase",
        help="Input value for the request",
    )
    parser.add_argument(
        "--stream",
        action="store_true",
        default=True,
        help="Stream the response from the model",
    )
    try:
        args = parser.parse_args()
    except Exception as e:
        logging.exception(f"Error: {str(e)}")
        args = namedtuple("args", ["flow_id", "input_value"])(None, None)

    logging.basicConfig(level=logging.INFO, format="%(message)s")

    try:
        init_response = initiate_session(
            flow_id=args.flow_id,
            input_value=args.input_value,
            stream=args.stream,
        )
        logging.info(f"Init Response: {init_response}")
        session_id = init_response["session_id"]
        has_stream_url = "stream_url" in init_response["outputs"][0]["outputs"][0]["artifacts"]
        if not has_stream_url and args.stream:
            raise Exception("No stream URL returned")
        stream_url = init_response["outputs"][0]["outputs"][0]["artifacts"]["stream_url"]

        logging.info(f"Initiated session with ID: {session_id}")
        if stream_url:
            stream_response(stream_url, session_id)
        else:
            logging.error("No stream URL returned")
    except Exception as e:
        logging.exception(f"Error: {str(e)}")


if __name__ == "__main__":
    main()