"""Builds LLM prompts for the NER pipeline. All content lives in prompts/."""

from pathlib import Path

PROMPTS_DIR = Path(__file__).parent / "prompts"


def _load(filename: str) -> str:
    return (PROMPTS_DIR / filename).read_text()


def build_system_prompt(_cfg: dict = None, sme_store=None) -> str:
    entities_text = _load("entities.txt")

    if sme_store is not None:
        # Inject learned DTC examples into the dtc_code entity definition.
        # Examples are capped and ordered newest-first to avoid prompt bloat.
        learned_dtcs = sme_store.get_prompt_examples("dtc_code")
        if learned_dtcs:
            extra = ", ".join(f"'{t}'" for t in learned_dtcs)
            entities_text = entities_text.replace(
                "  \"dtc_code\"",
                f"  \"dtc_code\" [learned examples: {extra}]\n  \"dtc_code\"",
                1,
            )

        learned_symptoms = sme_store.get_prompt_examples("symptom")
        if learned_symptoms:
            extra = ", ".join(f"'{t}'" for t in learned_symptoms)
            entities_text = entities_text.replace(
                "  \"symptom\"",
                f"  \"symptom\" [learned examples: {extra}]\n  \"symptom\"",
                1,
            )

    return _load("system.txt").format(entities=entities_text)


def build_user_prompt(text: str) -> str:
    return _load("user.txt").format(text=text)
