$(document).ready(function() {
  const firebaseConfig = {

    apiKey: "AIzaSyB-tEIY3LlVKA-bjslG_bJ2Yk3zb2YphG0",

    authDomain: "unza-connect.firebaseapp.com",

    projectId: "unza-connect",

    storageBucket: "unza-connect.appspot.com",

    messagingSenderId: "768834600387",

    appId: "1:768834600387:web:f248e6d61cec0202505176"

  };

  const app = firebase.initializeApp(firebaseConfig);
  const storage = firebase.storage().ref();

  const db = firebase.firestore();

  // modal for adding slides
   var uploadModal = new bootstrap.Modal(document.getElementById('add-slide-modal'), {
        keyboard: false
      })

      $("#upload-slide").on("click", function(event){
        event.preventDefault();
        uploadPhoto();
      })
  // upload slide
  function uploadPhoto() {
    $("#upload-slide").attr("disabled", true);
    let file = $('#slide-image').get(0).files[0];
    let name = (+new Date()) + '-' + file.name;
    // Create the file metadata
    var metadata = {
      contentType: file.type 
    };

    // Upload file and metadata to the object 'images/mountains.jpg'
    var uploadTask = storage.child('fun-slides/' + name).put(file, metadata);

    // Listen for state changes, errors, and completion of the upload.
    uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
      (snapshot) => {
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
        $("#upload-slide").html("Uploading: " + parseInt(progress, 10) + "%");
        switch (snapshot.state) {
          case firebase.storage.TaskState.PAUSED: // or 'paused'
            console.log('Upload is paused');
            break;
          case firebase.storage.TaskState.RUNNING: // or 'running'
            console.log('Upload is running');
            break;
        }
      },
      (error) => {
        $("#upload-slide").attr("disabled", false);
        $("#upload-slide").html("Upload +");
        // A full list of error codes is available at
        // https://firebase.google.com/docs/storage/web/handle-errors
        switch (error.code) {
          case 'storage/unauthorized':
            // User doesn't have permission to access the object
            console.log("User doesn't have permission to access the object");
            break;
          case 'storage/canceled':
            // User canceled the upload
            console.log("User canceled the upload");
            break;

          // ...

          case 'storage/unknown':
            // Unknown error occurred, inspect error.serverResponse
            console.log("Unknown error occurred, inspect error.serverResponse");
            break;
        }
      },
      () => {
        // Upload completed successfully, now we can get the download URL
        uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
          console.log('File available at', downloadURL);
          console.log("Done");
          // put file in database
          db.collection("fun-slides").doc().set({
            slideUrl: downloadURL,
            title: $("#slide-title").val(),
            date: firebase.firestore.FieldValue.serverTimestamp()
          }).then(() => {
            // show photos un categorized
            // db.collection("mckaziwe-photos").doc(documentId).set({
            //   fileName: downloadURL,
            //   description: $("#description").val(),
            //   date: firebase.firestore.FieldValue.serverTimestamp()
            // }).then(()=>{
              // console.log(data);
              uploadModal.hide();

            $("#toast-body").html(`Slide added successfully 😊`);
            $("#toast").show();
            window.getSlides();
            $("#upload-slide").attr("disabled", false);
            $("#upload-slide").html("Upload +");
            // })
            

          }).catch((error) => {
            console.log(error.message)
          })
        });
      }
    );
  }

  // fetch slides
  window.getSlides = function() {
        // loading...
        $("#slide-spot").html(" ");
        db.collection("fun-slides").get().then((querySnapshot) => {
          $("#slide-spot").html("");
          querySnapshot.forEach((doc) => {
            // doc.data() is never undefined for query doc snapshots
            $("#slide-spot").append(`
              <div class="col-md-4">
                  <div class="card">
                      <div class="card-body active"><img width="100%" height="auto" src="${doc.data().slideUrl}">
                          <h5 class="card-title" style="padding-top: 8px;">${doc.data().title}</h5>
                      </div>
                  </div>
              </div>
            `);
          });
        });
      }



})
 
