from django.test import Client, TestCase

from .models import User, Post, Follow

# Create your tests here.

class NetworkTestCase(TestCase):

    def setUp(self):

        # create users
        user1 = User.objects.create_user("user1", "user1@email.com", "password", first_name="user", last_name="1")
        user2 = User.objects.create_user("user2", "user2@email.com", "password", first_name="user", last_name="2")
        user3 = User.objects.create_user("user3", "user3@email.com", "password", first_name="user", last_name="3")

        # create posts
        # user1 has two posts
        post1 = Post.objects.create(user=user1, content="Post1")
        post1a = Post.objects.create(user=user1, content="Post1")
        post2 = Post.objects.create(user=user2, content="Post2")
        # add likes to post2
        post2.liked_by.add(user1)
        post3 = Post.objects.create(user=user3, content="Post3")
        # add likes to post3
        post3.liked_by.add(user1, user2)

        # create follows
        # user 1 follows user 2
        follow1 = Follow.objects.create(user=user1, followed_user=user2)
        # user 1 follows user 3
        follow2 = Follow.objects.create(user=user1, followed_user=user3)
        # user 3 follows user 2
        follow4 = Follow.objects.create(user=user3, followed_user=user2)

    def test_users_count(self):
        """Tests successful creation of users"""
        users = User.objects.all()
        self.assertEqual(len(users), 3)

    def test_posts_count(self):
        """Tests successful creation of posts"""
        posts = Post.objects.all()
        self.assertEqual(len(posts), 4)

    def test_user_posts(self):
        """Tests association of post to a user"""
        user1 = User.objects.get(username="user1")
        self.assertEqual(user1.posts.count(), 2)

    def test_likes(self):
        """Tests successful addition of likes on posts"""
        post3 = Post.objects.get(content="Post3")
        self.assertEqual(post3.liked_by.count(), 2)

    def test_follows_count(self):
        """Tests successful follow creations"""
        user2 = User.objects.get(username="user2")
        self.assertEqual(user2.followers.count(), 2)

    # Client Testing

    def test_index(self):
        """Tests loading of index page"""

        # Set up client to make requests
        c = Client()

        # Send get request to index page and store responce
        responce = c.get("")

        # Make sure status code is 200
        self.assertEqual(responce.status_code, 200)

    def test_login(self):
        """Tests loading of login page"""
        c = Client()
        responce = c.get("/login")
        self.assertEqual(responce.status_code, 200)
    
    def test_valid_login(self):
        """Tests valid login by a user"""
        c = Client()
        responce = c.post('/login', {
            'username': 'user1',
            'password': 'password',
        })
        self.assertEqual(responce.status_code, 302)

    def test_invalid_login(self):
        """Tests invalid login by a user"""
        c = Client()
        responce = c.post('/login', {
            'username': 'user1',
            'password': 'invalidPassword',
        })
        self.assertEqual(responce.status_code, 401)

    def test_logout(self):
        """Tests logout action"""
        c = Client()
        responce = c.get('/logout')
        self.assertEqual(responce.status_code, 302)

    def test_register(self):
        """Tests succesful registration of user"""
        c = Client()

        responce = c.get('/register')
        self.assertEqual(responce.status_code, 200)

        usersCount = User.objects.count()
        responce = c.post('/register', {
            'username': 'newUser',
            'email': 'user@email.com',
            'firstname': 'new',
            'lastname': 'user',
            'password': 'password',
            'confirmation': 'password',
        })
        self.assertEqual(responce.status_code, 302)

        # user count should increase by 1
        newUsersCount = User.objects.count()
        self.assertEqual(usersCount + 1, newUsersCount)

    def test_invalid_register(self):
        """Tests invalid registration of user"""
        c = Client()

        # without some fields
        responce = c.post('/register', {
            'username': 'newUser',
            'email': 'user@email.com',
            'firstname': '',
            'lastname': 'user',
            'password': 'password',
            'confirmation': 'password',
        })
        self.assertEqual(responce.status_code, 400)

        # invalid email
        responce = c.post('/register', {
            'username': 'newUser',
            'email': 'user@',
            'firstname': '',
            'lastname': 'user',
            'password': 'password',
            'confirmation': 'password',
        })
        self.assertEqual(responce.status_code, 400)

        # password do not match
        responce = c.post('/register', {
            'username': 'newUser',
            'email': 'user@',
            'firstname': '',
            'lastname': 'user',
            'password': 'password',
            'confirmation': 'diffrent',
        })
        self.assertEqual(responce.status_code, 400)


    def test_get_post(self):
        c = Client()

        responce = c.get('/post?view=all_posts')
        self.assertEqual(responce.status_code, 200)

