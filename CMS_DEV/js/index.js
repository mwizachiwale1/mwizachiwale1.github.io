// controls hiding and showing the header
function headerController() {
  var header = document.getElementById("main-header");
  // var search_bar = document.getElementById("search");
  var headerHeight = header.offsetHeight;

  window.addEventListener("scroll", function () {
    if (window.scrollY > headerHeight) {
      header.classList.add("fixed");
      brand.classList.add("hidden-mobile");
    } else {
      header.classList.remove("fixed");
      brand.classList.remove("hidden-mobile");
    }
  });

  // Initiate logge in not loged in
  if (isLogedIn()) {
    var elements = document.getElementsByClassName("loged-in");
    for (var i = 0; i < elements.length; i++) {
      // Replace the following line with your specific action
      elements[i].classList.remove('hidden');
    }
  } else {
    var elements = document.getElementsByClassName("not-loged-in");
    for (var i = 0; i < elements.length; i++) {
      // Replace the following line with your specific action
      elements[i].classList.remove('hidden');
    }
  }
}


// Fetches articles from th apiEndPoint
const fetchArticles = (api) => {
  let apiEndpoint = api + '/articles'
  document.getElementById('placeholder-container').classList.remove('hidden');
  fetch(apiEndpoint, {
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    method: 'GET'
  }

  )
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      return response.json();
    })
    .then(articles => {
      document.getElementById('placeholder-container').classList.add('hidden');
      console.log(articles);
      articles.forEach(article => {
        createArticleElement(article, api);
      });
    })
    .catch(error => {
      // Handle any errors that occurred during the fetch
      console.error('Fetch error:', error);
    });
}
// Fetches articles from th apiEndPoint By category
const fetchArticlesByCategory = (api, category) => {
  let apiEndpoint = api + '/articles/categories/'+category;
  document.getElementById('placeholder-container').classList.remove('hidden');
  fetch(apiEndpoint, {
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    method: 'GET'
  }

  )
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      return response.json();
    })
    .then(articles => {
      document.getElementById('placeholder-container').classList.add('hidden');
      console.log(articles);
      articles.forEach(article => {
        createArticleElement(article, api);
      });
    })
    .catch(error => {
      // Handle any errors that occurred during the fetch
      console.error('Fetch error:', error);
    });
}

// Create the article html and displays it on the specified location
function createArticleElement(article, api) {
  getUserDetails(api, article.userId).then(userDetails => {
    const newsContainer = document.getElementById('news-container');

    // Create news card container
    const newsCard = document.createElement('div');
    newsCard.classList.add('news-card');
  
    // Create background image div
    const bgImage = document.createElement('div');
    bgImage.classList.add('bg-image', 'border');
    bgImage.style.backgroundImage = `url('${article.thumbnail}')`; // Replace with article image URL
    newsCard.appendChild(bgImage);
  
    // Create article heading
    const articleHeading = document.createElement('a');
    articleHeading.href = `read.html?id=${article.id}`; // Replace with the article URL
    articleHeading.innerHTML = `<span class="mt-3 article-heading">${article.title}</span>`;
    newsCard.appendChild(articleHeading);
  
    const metaData = document.createElement('div');
    metaData.classList.add('meta-data', 'meta-text');
    metaData.innerHTML = `
    <span class=""><a href="#">${userDetails.firstName} ${userDetails.lastName}</a></span>
    <span class="mx-3">|</span>
    <span>${timeAgo(article.createdAt)}</span>
  `;
    newsCard.appendChild(metaData);
  
    newsContainer.appendChild(newsCard);
  
  }).catch(error => {
    console.log(error.message);
  })


  
}


function populateHeadline(article) {
  const headlineBg = document.getElementById('headline-bg');
  const headlineContent = document.getElementById('headline-content');

  // Set background image
  headlineBg.style.backgroundImage = `url('img/journalism.webp')`; // Replace with article image URL

  // Create headline content
  const headlineTitleLink = document.createElement('a');
  headlineTitleLink.href = `read.html?id=${article.id}`;
  headlineTitleLink.textContent = article.title;

  const headlineTitle = document.createElement('h2');
  headlineTitle.appendChild(headlineTitleLink);
  headlineTitle.classList.add('mb-2', 'h1');

  const headlineParagraph = document.createElement('p');
  headlineParagraph.classList.add('paragraph');
  headlineParagraph.textContent = article.body;

  const metaData = document.createElement('div');
  metaData.classList.add('meta-data', 'mt-8', 'meta-text');
  metaData.innerHTML = `
  <span class="">Posted by <a href="#">${article.category}</a></span>
  <span class="mx-3">|</span>
  <span>${article.published ? 'Published' : 'Unpublished'}</span>
  <span class="mx-3">|</span>
  <span>Lusaka, Chalala</span>
`;

  // Append elements to the headline content
  headlineContent.appendChild(headlineTitle);
  headlineContent.appendChild(headlineParagraph);
  headlineContent.appendChild(metaData);
}

function timeAgo(dateString) {
  const date = moment(dateString);

  return date.fromNow();
}


// for fetching an article
function readArticle(api) {
  let articleId = getArticleIdFromUrl();
  console.log('Article ID:', articleId);
  // Fetch article
  let apiEndpoint = api + '/articles/' + articleId;
  console.log(apiEndpoint);
  fetch(apiEndpoint, {
    mode: "cors",
    method: "Get",
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      return response.json();
    })
    .then(article => {
      // Handle the data retrieved from the API
      document.getElementById("title-placeholder").classList.add("hidden");
      document.getElementById("body-placeholder").classList.add("hidden");
      document.getElementById("image-placeholder").classList.add("hidden");
      document.getElementById("title").innerHTML = article.title;
      document.getElementById("body").innerHTML = (article.body).replace(/\n/g, '<br>');
      document.getElementById("article-image").src = article.image;
      document.getElementById("article-image").classList.remove("hidden");

      showAuthorDetails(api, article.userId);


    })
    .catch(error => {
      // Handle any errors that occurred during the fetch
      console.error('Fetch error:', error);
    });
}




// Function to get the article ID from the URL
function getArticleIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id');
  return articleId;
}

// For adding a comment
function addComment(api) {
  const form = document.querySelector('form');
  form.classList.add("disabled-form");
  const formData = new FormData(form);
  const data = {};

  // Convert FormData to JSON
  formData.forEach((value, key) => {
    data[key] = value;
  });
  // Example API endpoint
  const apiEndpoint = api + '/comments/' + getArticleIdFromUrl();

  // Perform fetch to submit data
  fetch(apiEndpoint, {
    mode: "cors",
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
    body: JSON.stringify(data),

  })
    .then(result => {
      console.log(JSON.stringify(data));
      console.log(result);
      form.reset(); //reset form
      form.classList.remove("disabled-form");
      // window.location.href="login.html";
      console.log("New Comment Added");
     
      // How to 
      // Append to UI
      // Create the main container element
      let commentContainer = document.createElement('div');
      commentContainer.className = 'comment';

      // Create the first div for the profile photo
      let profilePhotoDiv = document.createElement('div');
      let profilePhotoImg = document.createElement('img');
      profilePhotoImg.src = 'img/profile.jpg';
      profilePhotoImg.alt = 'Profile Photo';
      profilePhotoImg.className = 'comment-profile-photo';
      profilePhotoDiv.appendChild(profilePhotoImg);

      // Create the second div for the comment details
      let commentDetailsDiv = document.createElement('div');
      commentDetailsDiv.className = 'comment-container';

      // Create the comment header container
      let commentHeaderContainer = document.createElement('div');
      commentHeaderContainer.className = 'comment-header-container';

      // Create the username span
      let usernameSpan = document.createElement('span');
      usernameSpan.className = 'font-bold';
      usernameSpan.textContent = localStorage.getItem('username');

      // Create the timestamp span
      let timestampSpan = document.createElement('span');
      timestampSpan.textContent = 'just now';

      // Append username and timestamp spans to the comment header container
      commentHeaderContainer.appendChild(usernameSpan);
      commentHeaderContainer.appendChild(timestampSpan);

      // Create the comment text paragraph
      let commentTextParagraph = document.createElement('p');
      commentTextParagraph.textContent = data['body'];

      // Create the comment action container
      let commentActionContainer = document.createElement('div');
      commentActionContainer.className = 'comment-action-container';

      // Create buttons with icons and spans
      // const likeButton = createButton('fa-thumbs-up', '300');
      // const dislikeButton = createButton('fa-thumbs-down', '100');
      // const replyButton = createButton('fa-reply', '20');

      // Append buttons to the comment action container
      // commentActionContainer.appendChild(likeButton);
      // commentActionContainer.appendChild(dislikeButton);
      // commentActionContainer.appendChild(replyButton);

      // Append all elements to the main comment container
      commentDetailsDiv.appendChild(commentHeaderContainer);
      commentDetailsDiv.appendChild(commentTextParagraph);
      commentDetailsDiv.appendChild(commentActionContainer);

      commentContainer.appendChild(profilePhotoDiv);
      commentContainer.appendChild(commentDetailsDiv);
      document.getElementById("comments-section").prepend(commentContainer);
    })
    .catch(error => {
      // Handle errors
      console.error('Error:', error);
    });

}



function fetchComments(api) {
  let apiEndpoint = api + '/comments/' + getArticleIdFromUrl();
  fetch(apiEndpoint, {
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    method: 'GET',

  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      return response.json();
    })
    .then(comments => {
      // Handle the data retrieved from the API
      console.log(comments);

      comments.forEach(comment => {
        createComment(comment, api, comment.userId);
      });
    })
    .catch(error => {
      // Handle any errors that occurred during the fetch
      console.error('Fetch error:', error);
    });
}

function createComment(comment, api, userId) {
  console.log("appended");
  getUserDetails(api, userId).then(responce => {
    console.log(responce);
      // Create the main container element
  let commentContainer = document.createElement('div');
  commentContainer.className = 'comment';

  // Create the first div for the profile photo
  let profilePhotoDiv = document.createElement('div');
  let profilePhotoImg = document.createElement('img');
  profilePhotoImg.src = 'img/profile.jpg';
  profilePhotoImg.alt = 'Profile Photo';
  profilePhotoImg.className = 'comment-profile-photo';
  profilePhotoDiv.appendChild(profilePhotoImg);

  // Create the second div for the comment details
  let commentDetailsDiv = document.createElement('div');
  commentDetailsDiv.className = 'comment-container';

  // Create the comment header container
  let commentHeaderContainer = document.createElement('div');
  commentHeaderContainer.className = 'comment-header-container';

  // Create the username span
  let usernameSpan = document.createElement('span');
  usernameSpan.className = 'font-bold';
  usernameSpan.textContent = responce.firstName + " "+ responce.lastName;

  // Create the timestamp span
  let timestampSpan = document.createElement('span');
  timestampSpan.textContent = timeAgo(comment.createdAt);

  // Append username and timestamp spans to the comment header container
  commentHeaderContainer.appendChild(usernameSpan);
  commentHeaderContainer.appendChild(timestampSpan);

  // Create the comment text paragraph
  let commentTextParagraph = document.createElement('p');
  commentTextParagraph.textContent = comment.body;

  // Create the comment action container
  let commentActionContainer = document.createElement('div');
  commentActionContainer.className = 'comment-action-container';

  // Create buttons with icons and spans
  // let likeButton = createButton('fa-thumbs-up', '300');
  // let dislikeButton = createButton('fa-thumbs-down', '100');
  // let replyButton = createButton('fa-reply', '20');

  // Append buttons to the comment action container
  // commentActionContainer.appendChild(likeButton);
  // commentActionContainer.appendChild(dislikeButton);
  // commentActionContainer.appendChild(replyButton);

  // Append all elements to the main comment container
  commentDetailsDiv.appendChild(commentHeaderContainer);
  commentDetailsDiv.appendChild(commentTextParagraph);
  commentDetailsDiv.appendChild(commentActionContainer);

  commentContainer.appendChild(profilePhotoDiv);
  commentContainer.appendChild(commentDetailsDiv);

  document.getElementById("comments-section").appendChild(commentContainer);

  }).catch(error => {
    console.log(error.message);
  })

}

function autoResize(element) {
  element.style.height = 'auto';
  element.style.height = (element.scrollHeight) + 'px';
}

function getUserDetails(api, u_id) {
  return new Promise((resolve) => {
    let apiEndPoint = api + '/users/' + u_id;
    fetch(apiEndPoint, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(response => {
        resolve(response);;
      }).catch(error => {
        console.log(error.message);
      })
});

}


// The following functions behave according to the state of the guest.
// e.g whether the guest is logged in or not

function isLogedIn() {
  if(localStorage.getItem('accessToken') != null){
    return true;
  } else {
    return false;
  }
}

// Shows author details
// depend of getUserDetails()
function showAuthorDetails(api, u_id){
  getUserDetails(api, u_id).then(responce => {
    const authorName = document.getElementById("author-name");
    authorName.innerText = responce.firstName + " " + responce.lastName;
    authorName.href = api + "/profile?u_id="+u_id;

    if(responce.image != null){
      document.getElementById("author-image").src = responce.image;
    }
    if(responce.bio != null){
      document.getElementById("author-bio").innerText = responce.bio;
    }
  })
}

function likeArticle() {

}