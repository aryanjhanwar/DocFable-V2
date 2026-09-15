"""
app/utils/prompt_builder.py
────────────────────────────
Direct Python port of utils/promptBuilder.js.

Each builder returns a dict:  { "system": str, "user": str }
"""

from __future__ import annotations

# ─── Constants ────────────────────────────────────────────────────────────────

MAX_CONTEXT_CHARS = 250_000  # safety trim before sending to AI

SYSTEM_PROMPT = (
    "You are DocFable — an expert academic document assistant.\n"
    "Your job is to help users understand research papers and PDF documents.\n"
    "\n"
    "Rules:\n"
    "- Base your answers on the uploaded document content provided below.\n"
    "- If the requested information or specific sections (like methodology or results) "
    "are not present in the document, do your best to summarize or answer using the information that IS available.\n"
    "- Only say 'This information is not available' if the entire document is completely irrelevant to the question.\n"
    "- Always structure your responses using Markdown "
    "(headings, bullet lists, tables, code blocks where appropriate).\n"
    "- Be accurate, clear, and concise.\n"
    "- For technical concepts, provide clear explanations that are accessible "
    "to the target audience."
)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _truncate(text: str) -> str:
    if len(text) <= MAX_CONTEXT_CHARS:
        return text
    return text[:MAX_CONTEXT_CHARS] + "\n\n[...document truncated for context window...]"


def _doc_block(text: str) -> str:
    return f"## Document Content\n\n{_truncate(text)}\n\n---\n\n"


# ─── Builders ─────────────────────────────────────────────────────────────────

def build_chat_prompt(doc_text: str, user_question: str) -> dict[str, str]:
    return {
        "system": SYSTEM_PROMPT,
        "user": _doc_block(doc_text) + f"## User Question\n\n{user_question}",
    }


def build_summary_prompt(doc_text: str, summary_type: str = "executive") -> dict[str, str]:
    instructions: dict[str, str] = {
        "executive": (
            "Generate a concise **Executive Summary** of this document.\n"
            "Include:\n"
            "- **Objective**: What is this paper/document about?\n"
            "- **Key Findings**: Top 3-5 findings or conclusions\n"
            "- **Significance**: Why does this matter?\n"
            "- **Recommendations or Outcomes**: If any\n\n"
            "Keep it professional and under 300 words."
        ),
        "beginner": (
            "Generate a **Beginner-Friendly Summary** of this document.\n"
            "- Use simple language, avoid jargon\n"
            "- Explain technical terms when they appear\n"
            "- Use analogies where helpful\n"
            "- Explain WHY this research matters in everyday terms\n"
            "- Keep it engaging and accessible to a non-expert\n"
            "- Aim for 250-400 words"
        ),
        "technical": (
            "Generate a **Technical Summary** of this document for an expert audience.\n"
            "Include:\n"
            "- **Methodology**: Research methods, algorithms, or approaches used\n"
            "- **Datasets/Tools**: Any datasets, tools, or frameworks mentioned\n"
            "- **Key Results**: Quantitative and qualitative findings\n"
            "- **Technical Contributions**: Novel ideas or improvements\n"
            "- **Limitations**: Technical constraints or shortcomings\n"
            "- **Future Work**: Suggested directions\n"
            "Use proper technical terminology."
        ),
        "bullets": (
            "Generate a **Bullet Point Summary** of this document.\n"
            "Format as clear, scannable bullet points covering:\n"
            "- 📌 **Main Topic**: What is this about?\n"
            "- 🎯 **Objectives**: What are the goals?\n"
            "- 🔬 **Methods**: How was it done?\n"
            "- 📊 **Key Results**: What were the findings?\n"
            "- ✅ **Conclusions**: What was concluded?\n"
            "- ⚠️ **Limitations**: What are the shortcomings?\n"
            "- 🔮 **Future Work**: What comes next?\n\n"
            "Use nested bullets for sub-points where appropriate."
        ),
    }

    instruction = instructions.get(summary_type, instructions["executive"])
    return {
        "system": SYSTEM_PROMPT,
        "user": _doc_block(doc_text) + f"## Task\n\n{instruction}",
    }


def build_flashcards_prompt(doc_text: str, count: int = 10) -> dict[str, str]:
    user = (
        _doc_block(doc_text)
        + f"## Task\n\n"
        + f"Generate exactly {count} flashcards from this document for study/revision purposes.\n\n"
        + "Format each flashcard EXACTLY as follows (this is critical for parsing):\n\n"
        + "**Q1:** [Question]\n**A1:** [Answer]\n\n"
        + "**Q2:** [Question]\n**A2:** [Answer]\n\n"
        + f"...and so on up to Q{count}.\n\n"
        + "Rules:\n"
        + "- Questions should test key concepts, definitions, methodologies, and findings\n"
        + "- Answers should be concise but complete (1-3 sentences)\n"
        + "- Cover diverse topics from across the entire document\n"
        + "- Vary question types (definition, application, comparison, analysis)"
    )
    return {"system": SYSTEM_PROMPT, "user": user}


def build_quiz_prompt(
    doc_text: str, quiz_type: str = "mcq", count: int = 5
) -> dict[str, str]:
    mcq_instruction = (
        f"Generate {count} Multiple Choice Questions (MCQ) from this document.\n\n"
        "Format EXACTLY as follows:\n\n"
        "**Q1:** [Question]\n"
        "- A) [Option A]\n- B) [Option B]\n- C) [Option C]\n- D) [Option D]\n"
        "**Answer:** [Correct letter, e.g., B]\n"
        "**Explanation:** [Brief explanation of why this is correct]\n\n"
        "**Q2:** [Question]\n...and so on.\n\n"
        "Rules:\n"
        "- Make distractors plausible but clearly wrong to an informed reader\n"
        "- Cover different sections and topics of the document\n"
        "- Vary difficulty levels"
    )

    short_answer_instruction = (
        f"Generate {count} Short Answer Questions from this document.\n\n"
        "Format EXACTLY as follows:\n\n"
        "**Q1:** [Question]\n**Model Answer:** [Ideal answer in 2-4 sentences]\n\n"
        "**Q2:** [Question]\n**Model Answer:** [Ideal answer]\n\n"
        "...and so on.\n\n"
        "Rules:\n"
        "- Questions should require understanding, not just recall\n"
        "- Model answers should be comprehensive yet concise\n"
        "- Cover key concepts, methodology, findings, and implications"
    )

    instruction = mcq_instruction if quiz_type == "mcq" else short_answer_instruction
    return {
        "system": SYSTEM_PROMPT,
        "user": _doc_block(doc_text) + f"## Task\n\n{instruction}",
    }


def build_insights_prompt(doc_text: str) -> dict[str, str]:
    task = (
        "Analyze this document and extract the following key insights. "
        "Use clear Markdown formatting:\n\n"
        "## 🎯 Main Contributions\n"
        "List the primary novel contributions or key points of this document.\n\n"
        "## ✅ Advantages & Strengths\n"
        "What does this work do well? What are its strong points?\n\n"
        "## ⚠️ Limitations & Weaknesses\n"
        "What are the acknowledged or apparent limitations, constraints, or weaknesses?\n\n"
        "## 🔮 Future Scope\n"
        "What future work is suggested or implied? What directions could this open up?\n\n"
        "## 📊 Key Statistics & Numbers\n"
        "List any important numerical findings, metrics, percentages, or data points mentioned.\n\n"
        "## 🔑 Key Terminology\n"
        "Define the most important domain-specific terms used in the document (max 8 terms)."
    )
    return {
        "system": SYSTEM_PROMPT,
        "user": _doc_block(doc_text) + f"## Task\n\n{task}",
    }


# ─── Dispatch ─────────────────────────────────────────────────────────────────

def build_prompt(
    mode: str,
    doc_text: str,
    *,
    question: str = "",
    summary_type: str = "executive",
    quiz_type: str = "mcq",
    count: int = 10,
) -> dict[str, str]:
    """Route to the correct builder based on mode string."""
    match mode:
        case "chat":
            return build_chat_prompt(doc_text, question)
        case "summary":
            return build_summary_prompt(doc_text, summary_type)
        case "flashcards":
            return build_flashcards_prompt(doc_text, count)
        case "quiz":
            return build_quiz_prompt(doc_text, quiz_type, count)
        case "insights":
            return build_insights_prompt(doc_text)
        case _:
            return build_chat_prompt(doc_text, question or "Summarize this document")
