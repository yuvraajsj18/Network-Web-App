import {makePostCard} from './posts.js'

export function addNewPost(e) {
    // stop page refresh
    e.preventDefault();

    // get the new post form
    const newPostForm = document.querySelector('#new-post-form');

    // check for form validity
    if (newPostForm.checkValidity() === false) {
        newPostForm.classList.add('was-validated');
        return;
    }

    // get the content of the post
    const postContent = document.querySelector('#id_content').value;

    // send post to backend to save it
    fetch('/post', {
        method: "POST",
        headers: {
            // send csrf token with header
            'X-CSRFToken': Cookies.get('csrftoken'),
        },
        body: JSON.stringify({
            'content': postContent
        })
    })
    .then(res => {
        if (res.status === 400) {
            // if post content is not correct
            document.querySelector('#new-post-form .invalid-feedback').style.display = "block";
        }
        else if(res.status === 401) {
            // reload the page if user try to post without sign in
            location.reload();
        } 
        else {
            // all OK
            document.querySelector('#new-post-form .invalid-feedback').style.display = "none";
            return res.json();
        }
    })
    .then(data => {
        console.log(data);
        if (data) {
            const postCard = makePostCard(data);
            document.querySelector('#posts-view').prepend(postCard);
        }
    })
    .catch(error => console.log(error));

    document.querySelector('#id_content').value = "";
}