// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
$(document).ready(function () {

    const firebaseConfig = {

        apiKey: "AIzaSyB-tEIY3LlVKA-bjslG_bJ2Yk3zb2YphG0",

        authDomain: "unza-connect.firebaseapp.com",

        projectId: "unza-connect",

        storageBucket: "unza-connect.appspot.com",

        messagingSenderId: "768834600387",

        appId: "1:768834600387:web:f248e6d61cec0202505176"

    };
    const app = firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();
    const storage = firebase.storage();


        var req = new XMLHttpRequest();
        const position = document.getElementById("page");
        const progress = document.getElementById("cover");
       

        function loading(value) {
            if (value == true) {
                progress.classList.remove("hidden");
            } else {
                progress.classList.add("hidden");
            }
        }
        function uploading(value) {
            if (value == true) {
                progress.classList.remove("hidden");
                document.getElementById("progress-container").classList.remove("hidden");
                document.getElementById("progress-container-indeterminate").classList.add("hidden");
            } else {
                progress.classList.add("hidden");
                document.getElementById("progress-container").classList.add("hidden");
                document.getElementById("progress-container-indeterminate").classList.remove("hidden");
            }
        }

        function getPage(page) { // fetches a page
            loading(true);
            return new Promise((resolve, reject) => {
                req.open('GET', page, false);
                req.send(null);

                if (req.status == 200) {
                    loading(false);
                    let state = { 'page_id': 1, 'user_id': 5 }
                    let title = page;
                    let url = "registration.html#" + page;
                    history.pushState(state, title, url);
                    resolve(req.responseText);
                } else {
                    reject("401");
                    loading(false);
                }
            })

        }
        function displayPage(data, position) { // display page content at told position
            position.innerHTML = data;
        }

        function getForm(link) {
            getPage(link).then((data) => {
                displayPage(data, page);
                let hash = this.location.hash;
                let splits = hash.split("#");
                if (splits[2] == "error") {
                    document.getElementById("email-help").classList.remove("hidden");

                    document.getElementById("email").setAttribute('value', localStorage.getItem("email"));
                    console.log("email error");
                }
                console.log(hash.substring(1));
                if (hash.substring(1) === "" || hash.substring(1) === "registration/emailPassword.html") {
                    greetGuest();
                    initEmailPasswordCheck();
                } else {
                    if (hash.substring(1) === "registration/studentNumber.html") {
                        initSomethingOrNothing(6, 15);

                    } else if (hash.substring(1) === "registration/phone-number.html") {
                        initSomethingOrNothing(9, 10);
                    }
                    else if (hash.substring(1) === "registration/password-reset.html") {
                        console.log("Error is here");

                        initEmailCheck();
                    }
                    else {
                        initSomethingOrNothing(2, 20);
                    }
                }
                let it = document.getElementsByClassName('registration');
                let item = it[0].id;
                let thing = document.getElementById(item);
                thing.classList.remove('hidden');
                thing.classList.add("animate__slideInRight");
                let input_target = thing.getAttribute('input_name');
                let next_page = thing.getAttribute('next_form');
                thing.addEventListener('submit', function (event) {
                    thing.classList.add("hidden");
                    loading(true);
                    event.preventDefault();
                    if (next_page !== "done-3") {
                        if (next_page == "done-2") {
                            let account_types = document.getElementsByName('account-type');
                            let account_types_value;
                            for (let i = 0; i < account_types.length; i++) {
                                if (account_types[i].checked) {
                                    account_types_value = account_types[i].value;
                                    saveData(input_target, account_types_value);
                                    getForm("registration/terms-and-conditions.html");
                                    return;
                                }
                            }
                        } else {
                            let value = document.getElementById(input_target).value;
                            saveData(input_target, value);
                        }

                    }
                    if (next_page == "done-2") {
                        getForm("registration/terms-and-condtions.html");
                        return;

                    } else if (next_page == "accepted-terms-and-condtions") {
                        // after accepting terms and conditions
                        if (localStorage.getItem("account_type") === "user") {
                            firebase.firestore().collection("campus-users").doc(localStorage.getItem('userValuable')).set({
                                email: localStorage.getItem('email'),
                                student_id: localStorage.getItem('student-number'),
                                first_name: localStorage.getItem('first_name'),
                                last_name: localStorage.getItem('last_name'),
                                phone_number: localStorage.getItem('phone_number'),
                                account_type: localStorage.getItem('account_type'),
                            }).then(() => {
                                getPage("registration/success.html").then((data) => {
                                    displayPage(data, page);
                                    loading(false);
                                    // ...
                                }).catch((error) => {
                                    console.log(error);
                                    loading(false);
                                });

                            }).catch((error) => {
                                loading(false);
                                var errorCode = error.code;
                                var errorMessage = error.message;
                                console.log(errorMessage);
                                console.log(errorCode);
                            });
                        } else {
                            getForm("registration/image-student-id-image.html");
                        }
                    }
                    else if (next_page == "done-3") {
                        let value = document.getElementById("check-box-2").value;
                        if (value === "checked") {
                            loading(false);
                            uploading(true);
                            submitImages().then((data) => {
                                uploading(false);
                                loading(true);
                                getPage("registration/success.html").then((data) => {
                                    displayPage(data, page);

                                    loading(false);
                                    // ...
                                }).catch((error) => {
                                    console.log(error);
                                    uploading(false);
                                    loading(false);
                                });

                            }).catch((error) => {
                                console.log(error);
                                uploading(false);
                                loading(false);
                            });
                        } else {
                            return false;
                        }

                    } else {
                        getForm(next_page);

                    }
                })
            })
        }

        function hijackRequests() {
            window.addEventListener('hashchange', function (e) {
                loading(true);
                let hash = this.location.hash;
                let link = hash.substring(1);
                let splits = hash.split("#");
                if (link === "" || link == "registration/emailPassword.html") {
                    getPage("registration/emailPassword.html").then((data) => {
                        displayPage(data, position);
                        greetGuest();
                        initEmailPasswordCheck();
                        loading(false);
                    }).catch((error) => {
                        console.log("getting error " + link + error);
                        loading(false);
                    })

                } else if (link == "registration/password-reset.html") {
                    getPage(link).then((data) => {
                        displayPage(data, position);
                        loading(false);
                        initEmailCheck();
                        let form = document.getElementById("password-reset");
                        form.classList.remove('hidden');
                        form.classList.add("animate__slideInRight");
                        form.addEventListener('submit', function (event) {
                            event.preventDefault();
                            form.classList.add("hidden");
                            loading(true);
                            sendPasswordReset(getPage, displayPage, position, loading, $);

                        });
                        // ...
                    }).catch((error) => {
                        console.log(error);
                        loading(false);
                    });

                } else if (splits[2] == "error") {
                    document.getElementById("email-help").classList.remove("hidden");
                    document.getElementById("email").setAttribute('value', localStorage.getItem("email"));
                    console.log("email error");
                } else {
                    getForm(link);
                    console.log("getting form link");
                }

            });

        }
        hijackRequests();
        entryPoint();
        function entryPoint() {
            //   get options page
            let hash = this.location.hash;
            let link = hash.substring(1);
            let splits = hash.split("#");

            if (link === "" || link == "registration/emailPassword.html") {
                console.log("pass");
                getForm("registration/emailPassword.html");

                return;
                // getPage("registration/emailPassword.html").then((data)=>{
                //     displayPage(data, position);
                //     let options = document.getElementById('options');
                //     options.classList.remove('hidden');
                //     options.classList.add('animate__slideInUp');
                //     
                //     return false;

                // }).catch((error)=>{
                //     console.log(error);
                //     return false;
                // });

            }
            if (link === "registration/studentNumber.html") {
                getForm(link);
                return;
            } else {
                getForm(link);
                console.log("getting form link");
            }
        }


        var myStorage = window.localStorage;
        function saveData(field, value) {
            localStorage.setItem(field, value);
            console.log(field + ' saved');

        }


        // window.setAccountType = function accountType(type){
        //     localStorage.setItem("account_type", type);
        //     window.location.hash = "registration/form1.html";
        // }
        function submitImages() {
            return new Promise((resolve, reject) => {
                loading(false);
                uploading(true);
                document.getElementById('cover').classList.remove("hidden");
                let student_id_name = document.getElementById("");
                let passport_photo_name = document.getElementById("");
                let student_id_image = document.getElementById("passport_size_photo");
                let passport_size_photo = document.getElementById("student_id_image");
                // student_id_image = 
                var uploadTask = firebase.storage().ref('profile_images/' + localStorage.getItem('userValuable') + '/' + 'student_id.png').put(files_id[0]);
                document.getElementById('upload-helper-text').innerHTML = "0/2 <br> Uploading student Id...";
                uploadTask.on('state_changed', function (snapshot) {
                    let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(progress);
                    updateProgressBar(progress);
                    if (progress == 100) {
                        console.log("Uploading 1 done");
                        document.getElementById('upload-helper-text').innerHTML = "1/2 <br> Uploading passport size photo";
                        let uploadTask2 = firebase.storage().ref('profile_images/' + localStorage.getItem('userValuable') + '/' + 'passport_size_photo.png').put(files_passport[0]);
                        uploadTask2.on('state_changed', function (snapshot) {
                            let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            updateProgressBar(progress);
                            if (progress === 100) {
                                document.getElementById('upload-helper-text').innerHTML = "2/2 <br> Upload finished.";
                                document.getElementById("cover").classList.add("hidden");
                                uploading(true);
                                firebase.firestore().collection("campus-users").doc(localStorage.getItem('userValuable')).set({
                                    email: localStorage.getItem('email'),
                                    student_id: localStorage.getItem('student-number'),
                                    first_name: localStorage.getItem('first_name'),
                                    last_name: localStorage.getItem('last_name'),
                                    phone_number: localStorage.getItem('phone_number'),
                                    account_type: localStorage.getItem('account_type'),
                                }).then(() => {
                                    getPage("registration/success.html").then((data) => {
                                        displayPage(data, page);
                                        uploading(false);
                                        // ...
                                    }).catch((error) => {
                                        console.log(error);
                                        uploading(false);
                                    });

                                }).catch((error) => {
                                    uploading(false);
                                    var errorCode = error.code;
                                    var errorMessage = error.message;
                                    console.log(errorMessage);
                                    console.log(errorCode);
                                });


                            }
                        },
                            function (error) {
                                console.log("error " + error);
                                uploading(false);
                            }
                        );
                    }
                },
                    function (error) {
                        console.log("error " + error);
                        uploading(false);
                        // reject(error);
                    }
                );
            });


        }
        var files_id, files_passport, reader;

        window.saveLocalImg_student_id_image = function saveImageToLocalstudentid_image() {
            let input = document.createElement("input");
            input.type = "file";
            input.setAttribute("required", "required");
            input.id = "student_id_image";
            let checkBox = document.getElementById("check-box-1");

            input.onchange = e => {
                files_id = e.target.files;
                reader = new FileReader();
                console.log(files_id);
                checkBox.value = "checked";
                reader.onload = function () {
                    document.getElementById("preview_student_id").src = reader.result;
                    document.getElementById("submit-btn").classList.remove("disabled-btn");
                }
                reader.readAsDataURL(files_id[0]);

            }
            input.click();
        }
        window.saveLocal_passport_size_photo_image = function saveLocalpassportsize_photo_image() {
            let input = document.createElement("input");
            input.type = "file";
            input.setAttribute("required", "required");
            input.id = "passport_size_photo";
            let checkBox = document.getElementById("check-box-2");
            input.onchange = e => {
                files_passport = e.target.files;
                reader = new FileReader();
                console.log(files_passport);
                checkBox.value = "checked";
                reader.onload = function () {
                    document.getElementById("preview_password_size_photo").src = reader.result;
                    document.getElementById("submit-btn").classList.remove("disabled-btn");
                }
                reader.readAsDataURL(files_passport[0]);

            }
            input.click();
        }

        function updateProgressBar(value) {
            document.getElementById("progres-bar").style.width = value + "%";
        }
        window.switchToP8 = function switchToP8() {
            let value = document.getElementById("check-box-1").value;
            if (value === "checked") {
                getForm("registration/passport-size-photo.html");
            }
        }

        var curImg = new Image();

        curImg.src = "src/assets/bg/WhatsApp Image 2022-01-19 at 11.15.15 AM.jpeg";
        curImg.onload = function () {
            // do whatever here, add it to the background, append the image ect.
            document.getElementById("side-image").style.backgroundImage = "url('" + curImg.src + "')";
        }

        //function for loging in users#
        function login(email, password) {
            saveData('email', email);
            return new Promise((resolve, reject) => {
                firebase.auth().signInWithEmailAndPassword(email, password).then((userCredential) => {
                    // signed in
                    saveData('userValuable', userCredential.user.uid);
                    const user = userCredential.user;
                    resolve("success");
                }).catch((error) => {
                    // you can view either error.code or error.message
                    reject(error);
                });
            });
        }


        // function to call createAccountAndVerifyEmail
        window.callCreateAccountAndVerifyEmail = function callCreateAccountAndVerifyEmail(emailAddress, passwordInput) {
            loading(true);
            // get email and password
            let email = emailAddress;
            let password = passwordInput;
            let res = CheckPassword(password);
            if (!res) {
                // if the function returns false then diisplay that password doesn't meet the criteria
                password.classList.add('invalid');
                password.classList.add('animate__shakeX');
                document.getElementById('password-help-text').classList.remove('hidden');
                return false;
            }

            createAccountAndVerifyEmail(email.value, password.value).then((userCredential) => {
                saveData('userValuable', userCredential.user.uid);
                const user = userCredential.user;
                // CHECKS IF AUTH STATUS HAS CHANGED
                console.log("here");
                firebase.auth().onAuthStateChanged(function (user) {

                    if (user.emailVerified) {
                        console.log('Email is verified');
                    }
                    else {
                        console.log('Email is not verified');
                        user.sendEmailVerification();

                    }
                });
                // redirect to email verification information page
                getPage("registration/emailVerification.html").then((data) => {
                    displayPage(data, page);
                    saveData("email", email.value);
                    $("#email-address")[0].innerHTML = email.value;
                    loading(false);
                    // ...
                }).catch((error) => {
                    console.log(error);
                    loading(false);
                });
            }).catch((error) => {
                loading(false);
                console.log(error.message);
                document.getElementById("user-exists").classList.remove("hidden");
                $("#email")[0].classList.add("invalid");
                $("#email-container")[0].classList.add("error-text");
            })
        }
        // function creates an account for the user and sends email verification
        function createAccountAndVerifyEmail(email, password) {
            return new Promise((resolve, reject) => {
                firebase.auth().createUserWithEmailAndPassword(email, password).then((userCredential) => {
                    resolve(userCredential);
                }).catch((error) => {
                    reject(error);
                })
            })

        }
        // this functions handles the submition of email and password in login

        window.callLogin = function promptLogin() {
            loading(true);
            // reset everything....
            // resetEmailPasswordContainer();
            let email = document.getElementById("email").value;
            let password = document.getElementById("password").value;

            login(email, password).then((responce) => {
                //redirect to success page
                getPage("registration/success.html").then((data) => {
                    displayPage(data, page);
                    loading(false);
                    // ...
                }).catch((error) => {
                    console.log(error);
                    loading(false);
                });
            }).catch((error) => {
                console.log(error.code);
                shakeEmailPasswordContainer();
                loading(false);
            })
        }

        function shakeEmailPasswordContainer() {
            $("#email")[0].classList.add("invalid");
            $("#password")[0].classList.add("invalid");
            $("#email-password-error")[0].classList.remove("hidden");
            $("#email-password-container")[0].classList.add("animate__shakeX");
            $("#email-password-container")[0].classList.add("error-text");

        }


        // greetings to our guest
        function greetGuest() {
            let welcome;
            let date = new Date();
            let hour = date.getHours();
            let minute = date.getMinutes();
            let second = date.getSeconds();
            if (minute < 10) {
                minute = "0" + minute;
            }
            if (second < 10) {
                second = "0" + second;
            }
            if (hour < 12) {
                welcome = "morning";
            } else if (hour < 17) {
                welcome = "afternoon";
            } else {
                welcome = "evening";
            }
            $("#greetings-text")[0].innerHTML = welcome;
        }

        //function gets values from a url
        function getValueFromUrl(urli, valueNeeded) {
            let url = new URL(urli);
            let searchParams = new URLSearchParams(url.search);
            return searchParams.get(valueNeeded);
        }



        window.togglePassword = function toggpassword() {
            let password = document.getElementById('password');
            let button = document.getElementById('togglePassword');
            let state = button.getAttribute("state");
            if (state === "hidden") {
                button.innerHTML = "visibility";
                password.setAttribute('type', "text");
                button.setAttribute("state", "visible");
            } else {
                button.innerHTML = "visibility_off";
                password.setAttribute('type', "password");
                button.setAttribute("state", "hidden");
            }

        }

        function sendPasswordReset(getPage, displayPage, position, loading, $) {
            loading(true);
            let email = $("#email")[0].value;
            firebase.auth().sendPasswordResetEmail(email).then((responce) => {
                console.log("password reset email sent successfully");
                // redirect to email verification information page
                getPage("registration/password-reset-confirmation.html").then((data) => {
                    displayPage(data, position);
                    $("#email-address")[0].innerHTML = email;
                    loading(false);

                    // ...
                }).catch((error) => {
                    console.log(error);
                    loading(false);
                });
            }).catch((error) => {
                alert("This user does not exist, check your email address");
                window.history.go(-1);
                loading(false);
                document.getElementById("password-reset").classList.remove("hidden");
            });
        }

        // this function checks whether the password entered meets the following criteria
        // 6 to 20 characters which contain at least one numeric digit, one uppercase and one lowercase letter
        function CheckPassword(inputtxt) {
            var passw = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;
            if (inputtxt.value.match(passw)) {
                return true;
            }
            else {
                return false;
            }
        }
        function initEmailPasswordCheck() {
            document.getElementById("email").addEventListener("keyup", function (e) {
                let inputText = document.getElementById("email");
                let res = ValidateEmail(inputText);
                if (res) {
                    document.getElementById("email-help-text").classList.add("hidden");
                    document.getElementById("password").removeAttribute("disabled");;
                } else {
                    document.getElementById("email-help-text").classList.remove("hidden");
                    document.getElementById("password").setAttribute("disabled", true);
                    document.getElementsByClassName("button")[0].classList.add("disabled-btn");
                    document.getElementsByClassName("button")[1].classList.add("disabled-outline");

                }
            });
            document.getElementById("password").addEventListener("keyup", function (e) {
                let inputText = document.getElementById("password");
                let res = CheckPassword(inputText);
                if (res) {
                    document.getElementById("password-help-text").classList.add("hidden");
                    document.getElementsByClassName("button")[0].classList.remove("disabled-btn");
                    document.getElementsByClassName("button")[1].classList.remove("disabled-outline");
                } else {
                    document.getElementById("password-help-text").classList.remove("hidden");
                    document.getElementsByClassName("button")[0].classList.add("disabled-btn");
                    document.getElementsByClassName("button")[1].classList.add("disabled-outline");
                }
            });
        }


    function ValidateEmail(inputText) {
        var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (inputText.value.match(mailformat)) {
            console.log("Valid email address!");
            // document.getElementById("email-help-text").classList.remove("hidden");
            return true;
        }
        else {
            console.log("You have entered an invalid email address!");
            // document.getElementById("email-help-text").classList.remove("hidden");
            return false;
        }
    }
    function initEmailCheck() {
        document.getElementById("email").addEventListener("keyup", function (e) {
            let inputText = document.getElementById("email");
            let res = ValidateEmail(inputText);
            if (res) {
                document.getElementById("email-help-text").classList.add("hidden");
                document.getElementById("submit-btn").classList.remove("disabled-btn");
            } else {
                document.getElementById("email-help-text").classList.remove("hidden");
                document.getElementById("submit-btn").classList.add("disabled-btn");

            }
        });
    }
    function initSomethingOrNothing(min, max) {
        let inputFiled = document.getElementsByTagName("input")[0];
        inputFiled.addEventListener("keyup", function () {
            let res = somethingOrNothing(inputFiled.value, min, max);
            let submitButton = document.getElementById("submit-btn");

            if (res) {
                submitButton.classList.remove("disabled-btn");
            } else {
                submitButton.classList.add("disabled-btn");
            }
        });
    }

    // this function ensures that the submit function is inactive until some data is put in a form
    function somethingOrNothing(inputText, min, max) {
        if (inputText.length > min && inputText.length <= max) {
            return true;
        } else {
            return false;
        }
    }
})