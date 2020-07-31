import {loadPosts} from './posts.js';

document.addEventListener('DOMContentLoaded', () => loadPosts('all_posts'));

document.querySelector('#all-posts').addEventListener('click', () => {
    document.querySelector('#user-view').style.display = "none";
    loadPosts('all_posts');
});