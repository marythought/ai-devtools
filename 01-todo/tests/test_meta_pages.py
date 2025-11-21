"""
Tests for meta/informational pages.

This module covers:
- about_site() view
- about_spoons() view
"""

from django.test import TestCase
from django.urls import reverse


class AboutSiteViewTests(TestCase):
    """Tests for the about_site view."""

    def test_about_site_page_loads(self):
        """Test that the about site page loads successfully."""
        response = self.client.get(reverse("about_site"))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "todos/about_site.html")

    def test_about_site_content(self):
        """Test that the about site page contains expected content."""
        response = self.client.get(reverse("about_site"))

        # Check for key content elements
        self.assertContains(response, "About this Site")
        self.assertContains(response, "Mary")
        self.assertContains(response, "App Features")
        self.assertContains(response, "Technology Stack")

    def test_about_site_no_login_required(self):
        """Test that the about site page is accessible without login."""
        # This is a public page, so should work without authentication
        response = self.client.get(reverse("about_site"))
        self.assertEqual(response.status_code, 200)


class AboutSpoonsViewTests(TestCase):
    """Tests for the about_spoons view."""

    def test_about_spoons_page_loads(self):
        """Test that the about spoons page loads successfully."""
        response = self.client.get(reverse("about_spoons"))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "todos/about_spoons.html")

    def test_about_spoons_content(self):
        """Test that the about spoons page contains expected content."""
        response = self.client.get(reverse("about_spoons"))

        # Check for key content elements
        self.assertContains(response, "What's with the spoons?")
        self.assertContains(response, "Spoon Theory")
        self.assertContains(response, "Christine Miserandino")

    def test_about_spoons_no_login_required(self):
        """Test that the about spoons page is accessible without login."""
        # This is a public page, so should work without authentication
        response = self.client.get(reverse("about_spoons"))
        self.assertEqual(response.status_code, 200)
