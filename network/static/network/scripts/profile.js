import {loadPosts} from './posts.js';

export function loadProfile(username="") {
    document.querySelector('#user-view').style.display = "block";
    document.querySelector('#user-view').innerHTML = "";
    fetch(`/profile?username=${username}`)
    .then(res => res.json())
    .then(userInfo => {
        // hide new post form is another user profile is visited
        if (userInfo.active_user !== userInfo.user) {
            document.querySelector('#new-post').style.display = "none";
        }
        const profileDiv = makeProfileDiv(userInfo);
        document.querySelector('#user-view').append(profileDiv);
    })
    .catch(error => console.log(error));
}

// async function getFollowersCount(username="") {
//     const responce = await fetch(`/profile?username=${username}`);
//     const userInfo = await responce.json();
//     return userInfo.followers;
// }

function makeProfileDiv(userInfo) {
    const profileDiv = document.createElement('div');
    profileDiv.id = userInfo.id;
    profileDiv.className = "profile pb-4";

    const profileHeading = document.createElement('div');

    const nameHeading = document.createElement('h1');
    nameHeading.className = "text-center display-3 text-break";
    nameHeading.innerText = userInfo.firstname + " " + userInfo.lastname;

    const username = document.createElement('div');
    username.className = 'd-flex justify-content-center';
    username.innerHTML = `<span class="badge badge-info p-2">@${userInfo.user}</span>`;
    
    profileHeading.append(nameHeading);
    profileHeading.append(username);

    profileDiv.append(profileHeading);

    // all follow, following, followers buttons
    const followButtons = document.createElement('div');
    followButtons.id = "follow-buttons";
    followButtons.className = "row justify-content-around py-2";

    // create empty div for following user list
    const followUserDiv = document.createElement('div');
    followUserDiv.id = "followUserDiv";
    document.querySelector('#user-view').append(followUserDiv);

    // following button
    const followingButton = document.createElement('button');
    followingButton.className = "btn btn-warning col-sm-3 my-1";
    followingButton.setAttribute('data-toggle', 'modal');
    followingButton.setAttribute('data-target', '#followingModal');
    followingButton.innerHTML = `Following <span class="badge badge-light">${userInfo.following}</span>`;
    followingButton.addEventListener('click', (e) => displayFollows(userInfo.user, 'following'));
    followButtons.append(followingButton);

    // followers buttons
    const followersButton = document.createElement('button');
    followersButton.className = "btn btn-success col-sm-3 my-1";
    followersButton.setAttribute('data-toggle', 'modal');
    followersButton.setAttribute('data-target', '#followersModal');
    followersButton.innerHTML = `Followers <span class="badge badge-light" id="followers-count">${userInfo.followers}</span>`
    followersButton.addEventListener('click', (e) => displayFollows(userInfo.user, 'followers'));
    followButtons.append(followersButton);

    // follow button
    // only if other user profile is visited
    if (userInfo.active_user !== userInfo.user) {
        const followButton = document.createElement('button');
        followButton.className = "btn text-white col-sm-3 my-1";
        followButton.style.backgroundColor = "#9683ec";
        if (!userInfo.active_user) {
            followButton.setAttribute('disabled', "");            
        }
        if (userInfo.followed) {
            followButton.innerText = `Unfollow`;
            followButton.dataset.follow = "true";
        }
        else {
            followButton.innerText = `Follow`;
            followButton.dataset.follow = 'false';
        }

        // add follow event to button if active user
        if (userInfo.active_user) {
            followButton.addEventListener('click', (e) => follow(e, userInfo.id, userInfo.user));
        }
        followButtons.append(followButton);
    }

    profileDiv.append(followButtons);

    return profileDiv;
}

// toggles follow of a user
function follow(event, userID, username = null) {
    const followBtn = event.target;

    let followState = false;
    if (followBtn.dataset.follow === "false") {
        followState = true;
    }

    fetch(`/follow`, {
        'method': 'PUT',
        'headers': {
            'X-CSRFToken': Cookies.get('csrftoken'),
        },
        'body': JSON.stringify({
            followed_user_id: userID,
            follow_state: followState,
        }),
    })
    .then(res => res.json())
    .then(data => {
        console.log(data);
        followState = !followState;
        if (followState) {
            followBtn.dataset.follow === "true";
            followBtn.innerText = `Follow`;
            followBtn.dataset.follow = "false";
            followBtn.style.backgroundColor = "#9683ec";
            // update followers count
            const followersCountElement = document.querySelector('#followers-count');
            let followersCount = Number(followersCountElement.innerText);
            followersCountElement.innerText = followersCount - 1;
        }
        else {
            followBtn.dataset.follow === "false";
            followBtn.innerText = `Unfollow`;
            followBtn.dataset.follow = "true";
            followBtn.style.backgroundColor = "#5412B7";
            // update followers count
            const followersCountElement = document.querySelector('#followers-count');
            let followersCount = Number(followersCountElement.innerText);
            followersCountElement.innerText = followersCount + 1;
        }
    })
    .catch(error => console.log(error));
} 

// display list of following user
async function displayFollows(user, category) {
    // category should be one of - 'following' or 'followers'
    if (category !== 'following' && category !== 'followers') {
        console.log('wrong category');
        return;
    }

    // create follow modal template
    const followModal = document.createElement('div');
    followModal.innerHTML = createModal(`${category}Modal`);
    document.querySelector('#followUserDiv').innerHTML = "";
    document.querySelector('#followUserDiv').prepend(followModal);

    // get following/followers users
    const followUsers = await getFollows(category, user);

    // enter content in modal
    if (category === "following") {
        document.querySelector(`#${category}Modal-title`).innerText = "You Follow:";
    }
    else if (category === "followers") {
        document.querySelector(`#${category}Modal-title`).innerText = "Your Followers:";
    }
    const followModalBody = document.querySelector(`#${category}Modal-body`);

    // make a unordered list of following users
    const followList = document.createElement('ul');
    followList.className = "list-group list-group-flush";

    if (followUsers.length !== 0) {
        followUsers.forEach((user) => {
            const listItem = document.createElement('li');
            listItem.className = "list-group-item";

            // create button to user's profile
            const gotoUserProfileBtn = document.createElement('button');
            gotoUserProfileBtn.className = "btn btn-link";
            gotoUserProfileBtn.setAttribute('data-dismiss', 'modal');
            gotoUserProfileBtn.append(document.createTextNode(`@${user}`));
            gotoUserProfileBtn.addEventListener('click', (e) => {
                loadProfile(user)
                loadPosts('profile', user);
            });

            listItem.append(gotoUserProfileBtn);
            followList.append(listItem);
        });
    }
    else {
        // if no following users
        const listItem = document.createElement('li');
        listItem.className = "list-group-item list-group-item-warning";
        if (category === "following") {
            listItem.append(document.createTextNode("You don't follow anyone"));
        }
        else if (category === "followers") {
            listItem.append(document.createTextNode("It's empty here"));
        }
        followList.append(listItem);
    }

    followModalBody.innerHTML = "";
    followModalBody.append(followList);
}

// gets following or followers as per category from server
async function getFollows(category, user) {
    const res = await fetch(`/follow?category=${category}&user=${user}`);
    const follows = await res.json();
    return follows;
}

// returns a modal template as string with id of modalID
function createModal(modalID) {
    return `<div class="modal fade" id="${modalID}" tabindex="-1" role="dialog" aria-labelledby="followLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="${modalID}-title">Your Title Here with querySelector:</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body" id="${modalID}-body">
            Enter your content using javascript querySelector
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary p-0 px-3" data-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>`
}