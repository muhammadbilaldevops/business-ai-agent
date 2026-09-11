import re


def classify(query: str, has_dataset: bool = False) -> str:
    text = query.lower()
    action = bool(
        re.search(r"\b(create|prepare|generate|make|draft)\b.*\b(task|report|follow-up)\b", text)
    )
    analytics = bool(
        re.search(r"\b(sales|inventory|restock|revenue|dataset|analy[sz]e|kpi|stock)\b", text)
    )
    if action and analytics:
        return "multi_step"
    if action:
        return "action"
    if analytics or has_dataset:
        return "analytics"
    if re.fullmatch(r"(hi|hello|hey|thanks|thank you)[!. ]*", text):
        return "general"
    return "knowledge"
