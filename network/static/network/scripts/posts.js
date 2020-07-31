import {loadProfile} from './profile.js';
import {modifyCurrentViewDetails, modifyNextBtnState} from './main.js';

export async function loadPosts(view, user="", pageNumber = 1) {
    // clear previous posts
    document.querySelector('#posts-view').innerHTML = "";
    // fetch posts
    const res = await fetch(`/post?view=${view}&user=${user}&page=${pageNumber}`);
    const postData = await res.json();
    // get posts
    const posts = postData['posts']
    // add posts
    posts.forEach((post) => {
        const postCard = makePostCard(post);
        // appends the post to view
        document.querySelector('#posts-view').append(postCard);
    })
    return {
        currentView: view,
        currentPage: pageNumber,
        totalPages: postData['total_pages'],
    };
}

// makes and returns a post card
export function makePostCard(post) {
    // postCard - a box with post and related info in it
    const postCard = document.createElement('div');
    postCard.className = "post card my-3";
    postCard.id = `post-${post.id}`;

    // stores username and a link to user's profile
    const postHeader = document.createElement('div');
    postHeader.className = 'card-header username';
    const usernameBtn = document.createElement('button');
    usernameBtn.className = "btn btn-link text-dark font-weight-bold p-0";
    usernameBtn.innerHTML = `${post.firstname} ${post.lastname} <span class="badge badge-info ml-2 px-2">@${post.user}</span>`;
    usernameBtn.addEventListener('click',async () => {
        loadProfile(post.user);
        const currentViewDetails = await loadPosts('profile', post.user);
        modifyCurrentViewDetails(currentViewDetails);
        // if current page is last disable next button
        modifyNextBtnState(currentViewDetails);
    });
    postHeader.append(usernameBtn);
    
    // edit button in header
    if (post.user === post.active_user) {
        const editBtn = document.createElement('button');
        editBtn.style.float = "right";
        editBtn.className = "btn btn-outline-dark btn-sm p-0 px-2";
        editBtn.innerText = "Edit";

        editBtn.addEventListener('click', (e) => editPost(e, post));

        postHeader.append(editBtn);
    }

    postCard.append(postHeader);

    // stores content of the post and likes
    const postBody = document.createElement('div');
    postBody.className = "card-body post-content";
    const postContent = document.createElement('div');
    postContent.id = `post-text-${post.id}`;
    postContent.className = "card-text";

    const postTextContent = document.createTextNode(post.content);
    const postText = document.createElement('span');
    postText.id = `post-text-content-${post.id}`;
    postText.append(postTextContent);
    postContent.append(postText);

    const postTime = document.createElement('div');
    postTime.id = `post-text-time-${post.id}`;
    postTime.className = "text-muted mt-1";
    postTime.innerText = post.datetime;
    postContent.append(postTime);
    postBody.append(postContent);

    const likeBtn = document.createElement('button');
    likeBtn.id = `likeBtn-${post.id}`;
    // toggle this state on like or unlike
    likeBtn.dataset.like_state = (post.liked) ? "liked" : 'like';
    likeBtn.className = 'like-btn btn btn-sm btn-primary mt-2';
    const likeBtnText = (post.liked) ? "Liked " : 'Like ';
    if (post.liked) {
        likeBtn.classList.add('btn-success');
    }
    likeBtn.innerHTML = `<span class="like-text">${likeBtnText}</span><span class="badge badge-pill badge-light">${post.num_of_likes}</span>`;

    // toggle like on click
    likeBtn.addEventListener('click', (e) => likePost(e, post.id));

    // disable like if not logged in
    if (!post.active_user) {
        likeBtn.setAttribute('disabled', '');
    }

    postBody.append(likeBtn);
                    
    postCard.append(postBody);

    return postCard;
}

// toggles like on clicking like button
function likePost(event, postID) {
    let likeBtn = event.target;
    // if span inside button is clicked move to button
    if (!likeBtn.classList.contains('like-btn'))
        likeBtn = likeBtn.parentElement;
    
    let likeState;
    if (likeBtn.dataset.like_state === "liked") {
        likeState = true;
    }
    else {
        likeState = false;
    }

    fetch(`/like`, {
        method: 'PUT',
        headers: {
          'X-CSRFToken': Cookies.get('csrftoken'),
        },
        body: JSON.stringify({
            post_id: postID,
            like: likeState,
        }),
    })
    .then(res => res.json())
    .then(data => {
        likeState = !likeState;
        likeBtn.dataset.like_state = (likeState) ? 'liked' : 'like';
        if (likeState) {
            likeBtn.classList.add('btn-success');
        }
        else {
            likeBtn.classList.remove('btn-success');
        }
        likeBtn.firstChild.innerText = (likeState) ? 'Liked ' : 'Like ';
        likeBtn.lastChild.innerText = (likeState) ?  Number(likeBtn.lastChild.innerText) + 1 : likeBtn.lastChild.innerText - 1;
    })
    .catch(error => console.log(error));
}


// edits a post

// post contains information about post
function editPost(event, post) {
    // get the post card element
    const postCard = document.querySelector(`#post-${post.id}`);

    // change the post card text with edit post input
    const postCardText = document.querySelector(`#post-text-${post.id}`);
    const oldPostCardContent = postCardText.innerHTML;  // if user cancel then display this again
    const postCardTextContent = document.querySelector(`#post-text-content-${post.id}`).innerText;
    postCardText.innerHTML = "";
    // disable edit button
    event.target.setAttribute('disabled', '');

    // create edit input field with prefilled old text content
    const postEditField = document.createElement('textarea');
    postEditField.className = "form-control";
    postEditField.setAttribute('maxlength', '280');
    postEditField.innerText = postCardTextContent;

    postCardText.append(postEditField);

    // create button div for right justifying buttons
    const btnDiv = document.createElement('div');
    btnDiv.className = "d-flex justify-content-end";

    // create cancel button
    const cancelEditBtn = document.createElement('button');
    cancelEditBtn.innerText = "Cancel";
    cancelEditBtn.className = "btn btn-sm btn-outline-danger mt-1 p-0 px-3";

    cancelEditBtn.addEventListener('click', (e) => {
        postCardText.innerHTML = oldPostCardContent;
        // reenable edit button
        event.target.removeAttribute('disabled', '');
    }); 

    btnDiv.append(cancelEditBtn);

    // create save button
    const saveEditBtn = document.createElement('button');
    saveEditBtn.innerText = 'Save';
    saveEditBtn.className =  "btn btn-sm btn-outline-success ml-1 mt-1 p-0 px-3";

    saveEditBtn.addEventListener('click', async (e) => {
        const newPostContent = postEditField.value;
        const editedPost = await saveNewPost(post.id, newPostContent);

        // update postCardText with new content and time
        postCardText.innerHTML = "";
        const newPostTextContent = document.createTextNode(editedPost.content);
        const postText = document.createElement('span');
        postText.id = `post-text-content-${post.id}`;
        postText.append(newPostTextContent);
        postCardText.append(postText);

        const postTime = document.createElement('div');
        postTime.id = `post-text-time-${editedPost.id}`;
        postTime.className = "text-muted mt-1";
        postTime.innerText = editedPost.datetime;
        postCardText.append(postTime);
    });

    btnDiv.append(saveEditBtn);

    postCardText.append(btnDiv);
}

async function saveNewPost(postID, newPostContent) {
    const res = await fetch('post', {
        method: "PUT",
        headers: {
            'X-CSRFToken': Cookies.get('csrftoken'),
        },
        body: JSON.stringify({
            'id': postID, 
            'new_content': newPostContent,
        })
    });
    const newPost = await res.json();
    if (res.status === 400) {
        console.log(newPost);
    }

    return newPost;
}