import {addNewPost} from './newpost.js';
import {loadPosts} from './posts.js';
import {loadProfile} from './profile.js';

// stores info about the current view that's being displayed
let currentViewDetails = {
    currentView: "all_posts",
    currentPage: 1,
    totalPages: 1,
}

export function modifyCurrentViewDetails(newViewDetails) {
    currentViewDetails = newViewDetails;
}

document.querySelector('#new-post-form').addEventListener('submit', addNewPost);

document.addEventListener('DOMContentLoaded', async () => {
    currentViewDetails = await loadPosts('all_posts');
    // if current page is last disable next button
    modifyNextBtnState(currentViewDetails);
});

document.querySelector('#all-posts').addEventListener('click', async () => {
    document.querySelector('#new-post').style.display = "block";
    document.querySelector('#user-view').style.display = "none";
    currentViewDetails = await loadPosts('all_posts');
    // if current page is last disable next button
    modifyNextBtnState(currentViewDetails);
});

document.querySelector('#profile').addEventListener('click', async () => {
    document.querySelector('#new-post').style.display = "block";
    document.querySelector('#user-view').style.display = "block";
    loadProfile();
    currentViewDetails = await loadPosts('profile');
    // if current page is last disable next button
    modifyNextBtnState(currentViewDetails);
});

document.querySelector('#following').addEventListener('click', async () => {
    document.querySelector('#new-post').style.display = "block";
    document.querySelector('#user-view').style.display = "none";
    currentViewDetails = await loadPosts('following');
    // if current page is last disable next button
    modifyNextBtnState(currentViewDetails);

    const pageLabel = document.createElement('div');
    pageLabel.className = "alert alert-info text-center";
    pageLabel.append(document.createTextNode("Posts from users you follow."));
    document.querySelector('#posts-view').prepend(pageLabel);
});


// next button action
document.querySelector('#next-btn').addEventListener('click', async (e) => {
    const nextBtn = e.target;
    const {currentView, currentPage, totalPages} = currentViewDetails; 

    // load only if behind final page
    if (currentPage < totalPages) {
        currentViewDetails = await loadPosts(currentView, "", currentPage + 1);
    }

    // if current page is last disable next button
    modifyNextBtnState(currentViewDetails);

    modifyPreviousBtnState(currentViewDetails);
});

// previous button action
document.querySelector('#previous-btn').addEventListener('click', async (e) => {
    const previousBtn = e.target;
    const {currentView, currentPage, totalPages} = currentViewDetails; 

    // load only if not first page
    if (currentPage > 1) {
        currentViewDetails = await loadPosts(currentView, "", currentPage - 1);
    }

    modifyNextBtnState(currentViewDetails);
    modifyPreviousBtnState(currentViewDetails);
});

// modify next button state - disabled abled on load 
export function modifyNextBtnState(currentViewDetails) {
     // if current page is last disable next button
     const nextBtn = document.querySelector('#next-btn');
     const {currentView:newCurrentView, currentPage:newCurrentPage, totalPages:newTotalPages} = currentViewDetails; 
     if (newCurrentPage === newTotalPages) {
         nextBtn.setAttribute('disabled', "");
         nextBtn.parentElement.classList.add('disabled');
     }
     else {
        nextBtn.removeAttribute('disabled', "");
        nextBtn.parentElement.classList.remove('disabled');
     }
}

function modifyPreviousBtnState(currentViewDetails) {
    const previousBtn = document.querySelector('#previous-btn');
    const {currentView:newCurrentView, currentPage:newCurrentPage, totalPages:newTotalPages} = currentViewDetails; 
    // make active
    if (newCurrentPage == 2) {
        previousBtn.removeAttribute('disabled', '');
        previousBtn.parentElement.classList.remove('disabled');
    }
    if (newCurrentPage == 1) {
        previousBtn.setAttribute('disabled', "");
        previousBtn.parentElement.classList.add('disabled');
    }
}