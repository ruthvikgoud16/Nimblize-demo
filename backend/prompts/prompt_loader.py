"""
Nimblize - Prompt Loader Utility
Loads versioned YAML prompt templates directly from assets/prompts/
instead of embedding prompts in source code.
"""

import os
import re
from typing import Dict, Any, Optional
import yaml

PROMPTS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../assets/prompts")
)


class PromptRegistry:
    """Singleton registry for prompt templates stored in YAML format."""

    _instance: Optional["PromptRegistry"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._index = {}
            cls._instance._cache = {}
            cls._instance.refresh()
        return cls._instance

    def refresh(self):
        """Scan assets/prompts and build prompt_id -> filepath index."""
        self._index.clear()
        self._cache.clear()
        if not os.path.exists(PROMPTS_DIR):
            print(f"[PromptRegistry] Warning: Prompts directory not found at {PROMPTS_DIR}")
            return

        for root, _, files in os.walk(PROMPTS_DIR):
            for file in files:
                if file.endswith((".yaml", ".yml")):
                    filepath = os.path.join(root, file)
                    try:
                        with open(filepath, "r", encoding="utf-8") as f:
                            data = yaml.safe_load(f)
                            if isinstance(data, dict) and "id" in data:
                                self._index[data["id"]] = filepath
                                self._cache[data["id"]] = data
                    except Exception as e:
                        print(f"[PromptRegistry] Error loading {filepath}: {e}")

        print(f"[PromptRegistry] Loaded {len(self._index)} prompt templates into registry.")

    def get_prompt(self, prompt_id: str) -> Dict[str, Any]:
        """Fetch prompt metadata and template by prompt ID (e.g., 'CA-001')."""
        if prompt_id not in self._cache:
            if prompt_id in self._index:
                with open(self._index[prompt_id], "r", encoding="utf-8") as f:
                    self._cache[prompt_id] = yaml.safe_load(f)
            else:
                raise KeyError(f"Prompt ID '{prompt_id}' not found in registry.")
        return self._cache[prompt_id]

    def render_prompt(self, prompt_id: str, **kwargs) -> Dict[str, Any]:
        """
        Renders template placeholders ({{ var }}) using provided kwargs.

        Returns:
            Dict containing rendered prompt_template, system instructions,
            recommended_model, temperature, max_tokens, and version.
        """
        prompt = self.get_prompt(prompt_id)
        template_str = prompt.get("prompt_template", "")

        # Substitute {{ variable_name }} placeholders
        rendered_str = template_str
        for key, val in kwargs.items():
            pattern = r"\{\{\s*" + re.escape(str(key)) + r"\s*\}\}"
            val_str = str(val) if not isinstance(val, (dict, list)) else str(val)
            rendered_str = re.sub(pattern, lambda _: val_str, rendered_str)

        return {
            "id": prompt.get("id"),
            "name": prompt.get("name"),
            "category": prompt.get("category"),
            "version": prompt.get("version"),
            "recommended_model": prompt.get("recommended_model", "gpt-4o-mini"),
            "temperature": prompt.get("temperature", 0.0),
            "max_tokens": prompt.get("max_tokens", 2048),
            "rendered_template": rendered_str,
            "raw_prompt": prompt,
        }


# Global helper functions
_registry = PromptRegistry()


def load_prompt_template(prompt_id: str) -> Dict[str, Any]:
    """Helper to retrieve raw prompt data dict by ID."""
    return _registry.get_prompt(prompt_id)


def render_prompt_template(prompt_id: str, **kwargs) -> Dict[str, Any]:
    """Helper to render a prompt template by ID with template variables."""
    return _registry.render_prompt(prompt_id, **kwargs)
