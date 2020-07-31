from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Represent a user with:
        username, first_name, last_name, email and password"""
    def __str__(self):
        return f"{self.username}"


# posts
class Post(models.Model):
    """Represents a post by a user"""
    # user who posted the post
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")

    # text content of the post
    content = models.CharField(max_length = 280)

    # all users who liked this post
    liked_by = models.ManyToManyField(User, blank=True, related_name="likes")

    # datetime when post last updated or post for the first time
    datetime = models.DateTimeField(auto_now_add = True)

    def __str__(self):
        return f"Post {self.id} by {self.user}"

    def serialize(self):
        return {
            'id': self.id,
            'user': self.user.username,
            'firstname': self.user.first_name.capitalize(),
            'lastname': self.user.last_name.capitalize(),
            'content': self.content,
            'datetime': self.datetime.strftime("%b %d %Y, %I:%M %p")
        }


# followers
class Follow(models.Model):
    """Represents a follow-follower relationship between two users"""
    # user who followed other user
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")

    # the user who was followed by the above user
    followed_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")

    def __str__(self):
        return f"{self.user} follows {self.followed_user}"

    class Meta:
        constraints = [
            # 'a' can't follow 'b' two times at the same. if (a,b) exist then don't create another pair
            models.UniqueConstraint(fields=['user', 'followed_user'], name='unique_follow_pair'),
        ]

    def save(self, *args, **kwargs):
        # Don't create a follow when user and followed_user are same
        if self.user.username == self.followed_user.username:
            return
        super().save(*args, **kwargs)

