from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

from PyPDF2 import PdfReader


ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = ROOT.parent / "Spanish_MCQ_Study_Guide.pdf"
OUTPUT_PATH = ROOT / "src" / "data" / "spanish_questions.json"

KNOWN_SOURCE_ISSUES = {
    96: "The PDF marks option C ('Son las dos menos cuarto') as correct, but the explanation says 2:45 should be 'Son las tres menos cuarto'.",
}


@dataclass
class Section:
    id: int
    label: str
    topic: str


def slugify(text: str) -> str:
    value = text.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")[:80] or "question"


def compact(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def parse_topic(section_label: str) -> str:
    match = re.search(r":\s*(.+)$", section_label)
    if not match:
        return section_label
    tail = match.group(1).strip()
    if "(" in tail:
        return compact(tail.split("(", 1)[0])
    return compact(tail)


def extract_text() -> str:
    reader = PdfReader(str(PDF_PATH))
    pages = []
    for page in reader.pages:
        text = page.extract_text() or ""
        pages.append(text)
    return "\n".join(pages)


def split_question_blocks(text: str):
    lines = [line.rstrip() for line in text.splitlines()]

    current_section: Section | None = None
    current_block: list[str] = []
    blocks: list[tuple[Section, list[str]]] = []

    section_re = re.compile(r"Section\s+(\d+)\s*(?:&\s*\d+)?\s*:\s*(.+)$")
    question_re = re.compile(r"^Q(\d+)\.\s*(.*)$")

    for raw in lines:
        line = raw.strip()
        if not line:
            continue

        section_match = section_re.search(line)
        if section_match:
            if current_block and current_section:
                blocks.append((current_section, current_block))
                current_block = []
            label = compact(f"Section {section_match.group(1)}: {section_match.group(2)}")
            current_section = Section(
                id=int(section_match.group(1)),
                label=label,
                topic=parse_topic(label),
            )
            continue

        if question_re.match(line):
            if current_block and current_section:
                blocks.append((current_section, current_block))
            current_block = [line]
            continue

        if current_block:
            current_block.append(line)

    if current_block and current_section:
        blocks.append((current_section, current_block))

    return blocks


def parse_choices(option_lines: list[str]):
    option_text = compact(" ".join(option_lines).replace("✓", " "))
    pattern = re.compile(r"([A-D])\)\s*(.*?)(?=\s+[A-D]\)\s*|$)")
    choices = []
    for key, text in pattern.findall(option_text):
        choices.append({"key": key, "text": compact(text)})
    return choices


def parse_block(section: Section, block: list[str]):
    head = re.match(r"^Q(\d+)\.\s*(.*)$", block[0])
    if not head:
        raise ValueError(f"Invalid question header: {block[0]}")

    question_number = int(head.group(1))
    prompt = compact(head.group(2))

    answer_index = None
    for i, line in enumerate(block[1:], start=1):
        if "Answer:" in line:
            answer_index = i
            break
    if answer_index is None:
        raise ValueError(f"Missing answer line for Q{question_number}")

    option_lines = block[1:answer_index]
    answer_line = block[answer_index]
    explanation_lines = block[answer_index + 1 :]

    choices = parse_choices(option_lines)
    answer_match = re.search(r"Answer:\s*([A-D])\)\s*(.+)$", answer_line)
    if not answer_match:
        raise ValueError(f"Could not parse answer line for Q{question_number}: {answer_line}")

    answer_key = answer_match.group(1)
    answer_text = compact(answer_match.group(2))

    explanation = compact(
        " ".join(line.lstrip("■ ").strip() for line in explanation_lines if line.strip())
    )

    answer_choice = next((choice for choice in choices if choice["key"] == answer_key), None)
    source_issue = None
    if answer_choice and compact(answer_choice["text"]) != answer_text:
        source_issue = (
            f"Answer line text '{answer_text}' does not exactly match option {answer_key} text "
            f"'{answer_choice['text']}'."
        )

    if question_number in KNOWN_SOURCE_ISSUES:
        source_issue = compact(
            " ".join(part for part in [source_issue, KNOWN_SOURCE_ISSUES[question_number]] if part)
        )

    return {
        "assignmentId": section.id,
        "assignmentLabel": section.topic,
        "sectionLabel": section.label,
        "topic": section.topic,
        "questionId": f"s{section.id}-q{question_number}-{slugify(prompt)}",
        "sourceQuestionNumber": question_number,
        "prompt": prompt,
        "choices": choices,
        "answerKey": answer_key,
        "answerText": answer_text,
        "tricks": explanation,
        **({"sourceIssue": source_issue} if source_issue else {}),
    }


def build_bank():
    text = extract_text()
    blocks = split_question_blocks(text)
    questions = [parse_block(section, block) for section, block in blocks]

    return {
        "source": PDF_PATH.name,
        "generatedAt": __import__("datetime").datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
        "count": len(questions),
        "questions": questions,
    }


def main():
    bank = build_bank()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {bank['count']} questions to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
