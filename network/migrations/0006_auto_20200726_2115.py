# Generated by Django 3.0.8 on 2020-07-26 15:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0005_auto_20200726_1952'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='follow',
            name='follow_pair',
        ),
        migrations.AddConstraint(
            model_name='follow',
            constraint=models.UniqueConstraint(fields=('user', 'followed_user'), name='unique_follow_pair'),
        ),
    ]
