# Development Best Practices & Lessons Learned

This document captures important lessons and best practices discovered while building this project.

## Database Migrations

### ⚠️ CRITICAL: Changing Field Types - Always Preserve Data

**Lesson Learned:** When changing a field type (e.g., boolean → timestamp), NEVER remove the old field and add the new field in the same migration without preserving data.

**What Happened:**
- Changed `Todo.completed` (BooleanField) → `Todo.completed_at` (DateTimeField)
- Migration removed old field and added new field in one step
- Result: All completion data was lost

**Best Practice - The Right Way:**

When changing field types, use a **3-step migration process**:

1. **Migration 1: Add the new field**
   ```python
   # Add new field (nullable)
   operations = [
       migrations.AddField(
           model_name='todo',
           name='completed_at',
           field=models.DateTimeField(null=True, blank=True),
       ),
   ]
   ```

2. **Migration 2: Data migration to copy values**
   ```python
   def forwards_func(apps, schema_editor):
       from django.utils import timezone
       Todo = apps.get_model('todos', 'Todo')
       # Copy completed=True → completed_at=now()
       Todo.objects.filter(completed=True).update(completed_at=timezone.now())

   def backwards_func(apps, schema_editor):
       Todo = apps.get_model('todos', 'Todo')
       # Restore: completed_at != NULL → completed=True
       Todo.objects.filter(completed_at__isnull=False).update(completed=True)
       Todo.objects.filter(completed_at__isnull=True).update(completed=False)

   operations = [
       migrations.RunPython(forwards_func, backwards_func),
   ]
   ```

3. **Migration 3: Remove the old field**
   ```python
   operations = [
       migrations.RemoveField(
           model_name='todo',
           name='completed',
       ),
   ]
   ```

**Key Points:**
- ✅ Data is preserved between old and new fields
- ✅ Migrations are reversible
- ✅ Can deploy incrementally if needed
- ✅ Can test data migration before removing old field

### Checklist for Field Type Changes

Before changing a field type, ask yourself:

- [ ] Does this field contain data that needs to be preserved?
- [ ] Have I created a separate migration to add the new field?
- [ ] Have I written a data migration to copy/transform the data?
- [ ] Have I tested the forward AND backward migrations?
- [ ] Have I removed the old field in a separate migration?

## General Migration Best Practices

1. **Always review auto-generated migrations** before running them
2. **Test migrations on a copy of production data** when possible
3. **Keep migrations small and focused** - one logical change per migration
4. **Write reversible migrations** using `RunPython` with both forward and backward functions
5. **Back up your database** before running migrations in production

## Django Model Ordering with NULL Values

**Lesson Learned:** When ordering by nullable fields, NULL values have unpredictable sort behavior across databases.

**Solution:** Use explicit `Case/When` expressions to control NULL ordering:

```python
class Meta:
    ordering = [
        models.Case(
            models.When(completed_at__isnull=True, then=0),  # Incomplete first
            default=1,  # Completed second
        ),
        '-created_at'  # Then by newest
    ]
```

This ensures:
- Incomplete items (NULL) always appear first
- Completed items appear second
- Within each group, sorted by creation date

---

**Last Updated:** November 18, 2025
**Project:** Django TODO Application
