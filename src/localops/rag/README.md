# 🔎 Retrieval-augmented generation

`loaders.py` ingests text, `chunking.py` creates bounded passages, and `retriever.py` ranks evidence using lexical/BM25 and optional local vector fusion/reranking. Only selected evidence is sent to a model and citations are retained.
