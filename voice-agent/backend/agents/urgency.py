EMERGENCY_KEYWORDS = [
    "chest pain",
    "heart attack",
    "can't breathe",
    "difficulty breathing",
    "unconscious",
    "stroke",
    "severe bleeding",
    "collapsed",
    "not breathing",
]

URGENT_KEYWORDS = [
    "high fever",
    "severe pain",
    "fracture",
    "broken bone",
    "vomiting blood",
    "head injury",
    "infection",
    "can't walk",
    "allergic reaction",
    "swollen",
    "seizure",
]


def evaluate_urgency(symptoms: str, age: int = 0) -> str:
    symptoms_lower = (symptoms or "").lower()
    if age > 50 and "chest" in symptoms_lower:
        return "emergency"
    for kw in EMERGENCY_KEYWORDS:
        if kw in symptoms_lower:
            return "emergency"
    for kw in URGENT_KEYWORDS:
        if kw in symptoms_lower:
            return "urgent"
    return "normal"

