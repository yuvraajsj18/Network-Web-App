from django.contrib import admin

from .models import User, Post, Follow

# Register your models here.

class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'first_name', 'last_name', 'email')

class PostAdmin(admin.ModelAdmin):
    list_display = ('user', 'content', 'datetime')

class FollowAdmin(admin.ModelAdmin):
    list_display = ('user', 'followed_user')

admin.site.register(User, UserAdmin)
admin.site.register(Post, PostAdmin)
admin.site.register(Follow, FollowAdmin)