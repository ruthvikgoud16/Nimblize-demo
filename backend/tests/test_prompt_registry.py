import unittest
import os
from backend.prompts.prompt_loader import PromptRegistry, load_prompt_template, render_prompt_template


class TestPromptRegistry(unittest.TestCase):
    def setUp(self):
        self.registry = PromptRegistry()

    def test_registry_load_count(self):
        """Verify that the registry successfully loads all 29 prompt templates."""
        self.assertGreaterEqual(len(self.registry._index), 29)

    def test_load_specific_prompt(self):
        """Verify that specific prompts can be retrieved with the expected structure."""
        prompt = load_prompt_template("CS-003")
        self.assertEqual(prompt.get("id"), "CS-003")
        self.assertEqual(prompt.get("category"), "customer_support")
        self.assertEqual(prompt.get("version"), "1.1.0")

    def test_render_prompt_variables(self):
        """Verify that template variables are successfully substituted."""
        rendered = render_prompt_template("CS-003", user_query="Attribution analytics dashboard")
        self.assertIn("Attribution analytics dashboard", rendered["rendered_template"])
        self.assertEqual(rendered["id"], "CS-003")
        self.assertEqual(rendered["recommended_model"], "gpt-4o-mini")


if __name__ == "__main__":
    unittest.main()
