from pathlib import Path

from django.conf import settings
from django.test import SimpleTestCase, override_settings


class ProductionServingTests(SimpleTestCase):
    @override_settings(DEBUG=False, SECURE_SSL_REDIRECT=False)
    def test_built_frontend_and_assets_are_served(self):
        index = Path(settings.STATIC_ROOT) / "index.html"
        if not index.exists():
            self.skipTest("Run the frontend build to check production assets.")
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/html", response["Content-Type"])
        for asset in (index.parent / "assets").iterdir():
            asset_response = self.client.get(f"/assets/{asset.name}")
            self.assertEqual(asset_response.status_code, 200)
            asset_response.close()
        response.close()

    @override_settings(DEBUG=False, SECURE_SSL_REDIRECT=True)
    def test_production_redirects_http_to_https(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 301)
        self.assertEqual(response["Location"], "https://testserver/api/health/")

    @override_settings(DEBUG=False, SECURE_SSL_REDIRECT=True)
    def test_https_api_remains_available(self):
        response = self.client.get("/api/health/", secure=True)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    @override_settings(DEBUG=False, SECURE_SSL_REDIRECT=False)
    def test_unknown_api_route_is_not_the_frontend(self):
        self.assertEqual(self.client.get("/api/missing/").status_code, 404)
