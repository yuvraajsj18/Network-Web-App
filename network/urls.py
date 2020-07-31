from django.urls import path

from . import views

app_name = "network"
urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # api paths
    path('post', views.post, name="post"),
    path('like', views.like, name="like"),
    path('profile', views.profile, name="profile"),
    path('follow', views.follow, name="follow"),
]
