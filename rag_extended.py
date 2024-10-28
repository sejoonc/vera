import spacy
import requests
import json
import openai
import os
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
from nltk.translate.bleu_score import sentence_bleu
from rouge import Rouge

openai.api_key = os.getenv("OPENAI_API_KEY")

model = SentenceTransformer('all-MiniLM-L6-v2') 
rouge = Rouge()
nlp = spacy.load("en_core_web_sm")


def extract_key_term(rag_response): # for wiki query input
    doc = nlp(rag_response)
    entities = [ent.text for ent in doc.ents if ent.label_ in {"PERSON", "ORG", "GPE", "EVENT", "DATE"}]
    if entities:
        return entities[0] # most relevant
    else: # fallback
        return " ".join(rag_response.split()[:3])


def get_baseline_response(query):
    response = openai.Completion.create(
        engine="text-davinci-003",  # PLACEHOLDER (im broke)
        prompt=query,
        max_tokens=150
    )
    return response.choices[0].text.strip()


def calculate_cosine_similarity(response, context):
    response_embedding = model.encode(response)
    context_embedding = model.encode(context)
    return cosine_similarity([response_embedding], [context_embedding])[0][0]

def calculate_bleu_rouge(response, context):
    bleu_score = sentence_bleu([context.split()], response.split())
    rouge_score = rouge.get_scores(response, context)[0]['rouge-l']['f']
    return bleu_score, rouge_score

def check_with_wikipedia(query):
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{query}"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json().get('extract', "No summary found")
    else:
        return None
    
def calculate_wiki_consistency(rag_response, wiki_summary, threshold=0.75):
    if not wiki_summary:
        return 0

    response_embedding = model.encode(rag_response)
    wiki_embedding = model.encode(wiki_summary)
    similarity_score = cosine_similarity([response_embedding], [wiki_embedding])[0][0]
    
    return 1 if similarity_score >= threshold else 0

def detect_historical_bias(context):
    # TODO: ask charlotte
    pass

# main func
def generate_confidence_and_warning(rag_response, retrieved_docs):
    # 1.1) confidence scores
    cosine_scores = []
    bleu_scores = []
    rouge_scores = []
    
    # get similarity scores between each doc
    for doc in retrieved_docs:
        cosine_scores.append(calculate_cosine_similarity(rag_response, doc))
        bleu, rouge = calculate_bleu_rouge(rag_response, doc)
        bleu_scores.append(bleu)
        rouge_scores.append(rouge)

    avg_cosine = sum(cosine_scores) / len(cosine_scores) if cosine_scores else 0
    avg_bleu = sum(bleu_scores) / len(bleu_scores) if bleu_scores else 0
    avg_rouge = sum(rouge_scores) / len(rouge_scores) if rouge_scores else 0
    
    # 1.2) baseline similairity
    baseline_response = get_baseline_response(rag_response)
    baseline_similarity = calculate_cosine_similarity(rag_response, baseline_response)

    # 2) wiki cross-check (for factual consistency)
    key_term = extract_key_term(rag_response)
    wiki_summary = check_with_wikipedia(key_term)
    wiki_consistency = calculate_wiki_consistency(rag_response, wiki_summary)

    # 3) TODO: historical bias
    # historical_bias = detect_historical_bias(doc)

    # aggregate confidence scores (arbitrary nums rn, should probs finetune a bit)
    confidence_score = (0.4 * avg_cosine) + (0.2 * avg_bleu) + (0.2 * avg_rouge) + (0.2 * baseline_similarity)

    # Generate Warning
    warning = []
    if confidence_score < 0.5:
        warning.append("Lack of relevant retrieved information. Confidence score is low; cross-check information.")
    if historical_bias:
        warning.append("Historical Bias Detected: The retrieved documents may reflect outdated or biased perspectives.")
    if not wiki_consistency:
        warning.append("Potential Misinformation detected.")

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
    return result


if __name__ == "__main__":
    # example input (feed from langflow)
    rag_response = "The French Revolution started in 1789."
    retrieved_docs = [
        "The French Revolution is commonly known to have started in 1789 and lasted until 1799.",
        "The revolution, beginning in 1789, was a period of radical social and political upheaval in France."
    ]

    # Generate warning and confidence score
    output = generate_confidence_and_warning(rag_response, retrieved_docs)
    print(json.dumps(output, indent=4))