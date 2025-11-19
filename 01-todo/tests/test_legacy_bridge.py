"""Bridge module to allow pytest to collect legacy unittest TestCase classes
defined in `todos/tests.py`.

Pytest only auto-discovers files matching `test_*.py`. The legacy test
module `todos/tests.py` is not collected by pytest, so we import its
symbols into this module's namespace so pytest will discover and run
those TestCase classes.
"""

from todos.tests import *  # noqa: F401,F403
