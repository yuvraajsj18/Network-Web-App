import json
import datetime

from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.core.paginator import Paginator

from .models import *
from .utils import validEmail


def index(request):
    return render(request, "network/index.html")


def post(request):
    """Saves a post with post method or get a post with get method"""
    if request.method == "POST":
        """Saves a post by user to database"""

        # check if user is signed in or not
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'please login to post'}, status=401)

        # get data from body of the request
        post_data = json.loads(request.body)
        # clean the content
        post_data['content'] = str(post_data['content']).strip()

        # check validity of form
        if post_data['content'] == "" or len(post_data['content']) > 280:
            return JsonResponse({'error': 'Please enter some text(maximum length:280)'}, status=400)

        # create post
        post = Post.objects.create(user=request.user, content=post_data['content'])

        # return the post created
        post = post.serialize()
        post['num_of_likes'] = Post.objects.get(pk = post['id']).liked_by.count()
        post['liked'] = request.user in Post.objects.get(pk = post['id']).liked_by.all()

        return JsonResponse(post, status=201)
    elif request.method == "GET":
        view = request.GET['view']
        username = request.GET.get('user', request.user).strip()

        # if user value is empty then it means the current user's post is needed
        if not username:
            username = request.user.username
        # get the user from username
        user = None
        if view != "all_posts": # no need for user in all_posts
            user = User.objects.get(username=username)

        if view == "all_posts":
            posts = Post.objects.all()
        elif view == "profile":
            posts = Post.objects.filter(user=user)
        elif view == "following":
            following_users = request.user.following.values_list('followed_user')
            posts = Post.objects.filter(user__in = following_users)
        else:
            return JsonResponse({'error':'Invalid view option'}, status=400)

        # return posts in reverse chronological order
        posts = posts.order_by("-datetime").all()

        # apply pagination
        page_number = int(request.GET['page'])
        posts_paginator = Paginator(posts, 10) # Show 10 posts per page.
        total_pages = posts_paginator.num_pages

        # convert posts to dictionary
        posts = [post.serialize() for post in posts_paginator.page(page_number)]

        # add number of likes to each post dictioanary in posts array
        # and add whether user has liked the post or nor
        for post in posts:
            post['num_of_likes'] = Post.objects.get(pk = post['id']).liked_by.count()
            post['liked'] = request.user in Post.objects.get(pk = post['id']).liked_by.all()
            post['active_user'] = request.user.username

        return JsonResponse({
            'posts': posts, 
            'total_pages': total_pages,
        }, status=200)
    elif request.method == "PUT":
        """Edits the post"""
        # check if user is signed in or not
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'please login to post'}, status=401)

        # get data from body of the request
        new_post_data = json.loads(request.body)
        # clean the content
        new_post_data['new_content'] = str(new_post_data['new_content']).strip()

        # check validity of new content
        if new_post_data['new_content'] == "" or len(new_post_data['new_content']) > 280:
            return JsonResponse({'error': 'Please enter some text(maximum length:280)'}, status=400)

        # get post
        post = Post.objects.get(pk=new_post_data['id'])

        # you cannot edit others post
        if (post.user != request.user):
            return JsonResponse({'error': "You cannot edit other's post"}, status=400)

        # update the post
        post.content = new_post_data['new_content']
        post.datetime = datetime.datetime.now()
        post.save()

        # return the post created
        post = post.serialize()
        post['num_of_likes'] = Post.objects.get(pk = post['id']).liked_by.count()
        post['liked'] = request.user in Post.objects.get(pk = post['id']).liked_by.all()

        return JsonResponse(post, status=201)


def like(request):
    """toggles like of a post"""
    if request.method == "PUT":
        # check if user is signed in or not
        if not request.user.is_authenticated:
            return HttpResponseRedirect(reverse('network:index'))

        data = json.loads(request.body)
        
        try:
            post = Post.objects.get(pk=data['post_id'])
        except:
            return JsonResponse({'error': 'post not found'}, status=404)
        
        # add or remove like to post by current user
        if not data['like'] and request.user not in post.liked_by.all():
            post.liked_by.add(request.user)
        else:
            post.liked_by.remove(request.user)

        post.save()
        return JsonResponse({'responce': 'success'}, status = 201)
    else:
        return HttpResponseRedirect(reverse('network:index'))

def profile(request):
    username = request.GET['username'].strip()
    if not username:
        username = request.user.username
    
    # Get the user from username
    user = User.objects.get(username=username)

    is_followed = False
    if request.user.is_authenticated:
        for user_ in request.user.following.all().values('followed_user'):
            if user.id == user_['followed_user']:
                is_followed = True

    userInfo = {
        'id': user.id,
        'user': user.username,
        'active_user': request.user.username,
        'firstname': user.first_name.capitalize(),
        'lastname': user.last_name.capitalize(),
        'following': user.following.count(),
        'followers': user.followers.count(),
        'followed': is_followed,
    }

    return JsonResponse(userInfo, status=200)


def follow(request):
    if request.method == "PUT":
        data = json.loads(request.body)

        followed_user_id = data['followed_user_id']
        follow_state = data['follow_state']

        # Get user from user id
        followed_user = User.objects.get(pk=followed_user_id)

        # confirm followed user is different from active user
        if followed_user == request.user:
            return JsonResponse({'error': 'You cannot follow yourself'}, status=400)

        # toggle follow
        try:
            # if not exists then create new follow
            follow = Follow.objects.create(user=request.user, followed_user=followed_user)
        except IntegrityError:
            # if exists then delete that follow
            follow = Follow.objects.get(user=request.user, followed_user=followed_user)
            follow.delete()

        return JsonResponse({'success': 'follow created successfully'}, status=201)
    if request.method == "GET":
        category = str(request.GET['category'])
        username = str(request.GET['user'])

        # Get user
        user = User.objects.get(username=username)

        if category == "following":
            # get followed users of active user
            followingUsers = user.following.all()
            follows = [user.followed_user.username for user in followingUsers]
        elif category == "followers":
            # get follower of active_users
            followerUsers = user.followers.all()
            follows = [user.user.username for user in followerUsers]
        else:
            return JsonResponse({'error': 'Invalid Category'}, status=400)
        
        return JsonResponse(follows, safe=False, status=200)

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authetication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("network:index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            }, status=401)
    else:
        # if user is already logged in then go to index
        if request.user.is_authenticated:\
            return HttpResponseRedirect(reverse('network:index'))
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("network:index"))


def register(request):
    if request.method == "POST":
        for value in request.POST.values():
            if not value:
                return render(request, "network/register.html", {
                        "message": "Please provide all fields.",
                    }, status=400)

        if not validEmail(request.POST['email']):
            return render(request, "network/register.html", {
                "message": "Email is not valid",
            }, status=400)

        username = request.POST["username"]
        email = request.POST["email"]
        first_name = request.POST["firstname"]
        last_name = request.POST['lastname']

        # Ensure password matches the confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match",
            }, status=400)
        
        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password, first_name = first_name, last_name = last_name)
            user.save()
        except IntegrityError:
            return render(request, 'network/register.html', {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("network:index"))
    else:
        # if user is already logged in then go to index
        if request.user.is_authenticated:
            return HttpResponseRedirect(reverse('network:index'))
        return render(request, "network/register.html")
