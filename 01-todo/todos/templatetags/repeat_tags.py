from django import template

register = template.Library()


@register.filter
def repeat(value, times):
    """Repeat the string *value* *times* times.

    Usage in template: `{{ '🥄'|repeat:todo.effort }}`
    Returns an empty string for invalid counts.
    """
    try:
        n = int(times)
    except (TypeError, ValueError):
        return ""
    if n <= 0:
        return ""
    return str(value) * n
