#!/bin/bash

if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

python3 -m venv rag_env
source rag_env/bin/activate
pip install --upgrade pip
pip install spacy requests openai scikit-learn sentence-transformers nltk rouge python-dotenv
python -m pip install langflow -U
python3 -m spacy download en_core_web_sm

echo "Setup complete. To start using the environment, run:"
echo "source rag_env/bin/activate"