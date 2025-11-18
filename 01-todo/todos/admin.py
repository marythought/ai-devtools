from django.contrib import admin
from .models import Todo, Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'created_at')
    search_fields = ('name',)
    ordering = ('name',)


@admin.register(Todo)
class TodoAdmin(admin.ModelAdmin):
    list_display = ('title', 'completed', 'created_at', 'updated_at')
    list_filter = ('completed', 'created_at', 'categories')
    search_fields = ('title', 'description')
    ordering = ('-created_at',)
    filter_horizontal = ('categories',)
