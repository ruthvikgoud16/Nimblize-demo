import unittest
from fastapi.testclient import TestClient
from backend.main import app


class TestApiEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_check(self):
        """Verify that the health check route is healthy and active."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["service"], "nimblize-pipeline")

    def test_get_prompts(self):
        """Verify the prompt registry endpoint loads list of templates."""
        response = self.client.get("/api/v1/prompts")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("prompts", data)
        self.assertGreater(len(data["prompts"]), 0)
        
        # Verify first item contains required schema keys
        first_prompt = data["prompts"][0]
        self.assertIn("id", first_prompt)
        self.assertIn("name", first_prompt)
        self.assertIn("category", first_prompt)
        self.assertIn("yamlContent", first_prompt)

    def test_playground_run(self):
        """Verify executing playground run returns formatted responses."""
        payload = {
            "prompt_id": "CS-003",
            "version": "1.1.0",
            "variables": {
                "user_query": "Attribution analytics dashboard query template"
            }
        }
        response = self.client.post("/api/v1/playground/run", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("response", data)
        self.assertIn("latency", data)
        self.assertIn("tokens", data)
        self.assertIn("scores", data)

    def test_toggle_favorites(self):
        """Verify adding and removing prompts from favorites persists in DB."""
        payload = {
            "prompt_id": "CS-003",
            "favorite": True
        }
        response = self.client.post("/api/v1/favorites", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["favorite"])

        # Toggle off
        payload["favorite"] = False
        response = self.client.post("/api/v1/favorites", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["favorite"])

    def test_get_history(self):
        """Verify getting execution log history."""
        response = self.client.get("/api/v1/history")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("history", data)

    def test_get_settings(self):
        """Verify reading and writing custom user settings."""
        # Save settings
        save_payload = {"key": "test_setting", "value": "some_value"}
        response = self.client.post("/api/v1/settings", json=save_payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["key"], "test_setting")

        # Get settings
        get_response = self.client.get("/api/v1/settings")
        self.assertEqual(get_response.status_code, 200)
        self.assertIn("settings", get_response.json())

    def test_get_workflow_nodes(self):
        """Verify system nodes retrieval for workflow grid explorer."""
        response = self.client.get("/api/v1/workflow/nodes")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("nodes", data)
        self.assertGreater(len(data["nodes"]), 0)

    def test_notifications_lifecycle(self):
        """Verify notification items are loaded and marked as read."""
        # Get notifications
        response = self.client.get("/api/v1/notifications")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("notifications", data)
        
        # Mark all as read
        read_payload = {"all": True}
        read_response = self.client.post("/api/v1/notifications/read", json=read_payload)
        self.assertEqual(read_response.status_code, 200)
        self.assertTrue(read_response.json()["success"])


if __name__ == "__main__":
    unittest.main()
