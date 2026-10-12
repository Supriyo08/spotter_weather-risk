from rest_framework.test import APISimpleTestCase


class RiskApiTests(APISimpleTestCase):
    payload = {
        "wind_mph": 45,
        "rain_inches_per_hour": 0,
        "snow_inches_per_hour": 0,
        "load_weight_lb": 30001,
    }

    def test_health(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_evaluate_risk(self):
        response = self.client.post("/api/risk/evaluate/", self.payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["level"], "no_travel")
        self.assertTrue(response.json()["load_rule_applied"])

    def test_invalid_inputs_return_field_errors(self):
        for field in self.payload:
            for value in (-1, "invalid", "NaN", "Infinity", None):
                with self.subTest(field=field, value=value):
                    response = self.client.post(
                        "/api/risk/evaluate/", {**self.payload, field: value}, format="json"
                    )
                    self.assertEqual(response.status_code, 400)
                    self.assertIn(field, response.json())

    def test_missing_fields_are_rejected(self):
        response = self.client.post("/api/risk/evaluate/", {}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(set(response.json()), set(self.payload))

    def test_get_cannot_evaluate(self):
        self.assertEqual(self.client.get("/api/risk/evaluate/").status_code, 405)
