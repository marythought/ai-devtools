import django.views.static as static_views
from django.test import SimpleTestCase, override_settings
from django.urls import Resolver404, resolve, reverse


class UrlsTests(SimpleTestCase):
    def test_root_and_admin_urls_exist(self):
        # Ensure named routes from project URLs are available
        root = reverse("todo_list")
        self.assertTrue(root in ("/", ""))

        admin_index = reverse("admin:index")
        self.assertTrue(admin_index.startswith("/admin/"))

    def test_static_serving_added_when_debug_true(self):
        with override_settings(DEBUG=True, STATIC_URL="/static/", STATIC_ROOT="/tmp"):
            # resolving a static file path should map to the static.serve view
            resolver = resolve("/static/somefile.css")
            # The resolver may return the serve function or a wrapper; check module
            self.assertIn(static_views.serve.__name__, resolver.func.__name__)

    def test_static_serving_not_added_when_debug_false(self):
        with override_settings(DEBUG=False, STATIC_URL="/static/", STATIC_ROOT="/tmp"):
            with self.assertRaises(Resolver404):
                resolve("/static/does-not-exist.css")
