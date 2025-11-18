from django.contrib import admin
from .models import Todo, Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'created_at')
    search_fields = ('name',)
    ordering = ('name',)


@admin.register(Todo)
class TodoAdmin(admin.ModelAdmin):
    list_display = ('title', 'due_date', 'completed_at', 'created_at', 'updated_at')
    list_filter = ('completed_at', 'due_date', 'created_at', 'categories')
    search_fields = ('title', 'description')
    ordering = ('-created_at',)
    filter_horizontal = ('categories',)
