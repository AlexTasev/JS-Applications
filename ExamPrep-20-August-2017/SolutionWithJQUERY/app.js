$(() => {
    //CONST
    const baseUrl = "https://baas.kinvey.com/appdata/";
    const userUrl = "https://baas.kinvey.com/user/";
    const appKey = "kid_B1fKbeBr7";
    const appSecret = "d666ef6364124b4f9959599fa7d90063";
    const authorization = {"Authorization": "Basic " + btoa(appKey + ":" + appSecret)};

    //VARS
    let authToken;
    let registerForm = $("#registerForm");
    let loginForm = $("#loginForm");
    let profile = $("#profile");
    let viewWelcome = $("#viewWelcome");
    let menu = $("#menu");
    let submitForm = $("#submitForm");
    let editForm = $("#editPostForm");

    //AJAX REQUESTS
    let requester = (function () {
        function makeAuthorization() {
            if (localStorage.getItem("authToken") === null) {
                return authorization;
            } else {
                return {"Authorization": "Kinvey " + localStorage.getItem("authToken")};
            }
        }

        function makeRequest(method, url, endPoint) {
            return {
                method: method,
                url: url + appKey + endPoint,
                headers: makeAuthorization(),
                contentType: "application/json",
            };
        }

        function get(url, end) {
            return $.ajax(makeRequest("GET", url, end));
        }

        function post(url, data, end) {
            let request = makeRequest("POST", url, end);
            request.data = JSON.stringify(data);
            return $.ajax(request)
        }

        function put(url, data, end) {
            let request = makeRequest("PUT", url, end);
            request.data = JSON.stringify(data);
            return $.ajax(request);
        }

        function remove(url, end) {
            return $.ajax(makeRequest("DELETE", url, end));
        }

        return {get, post, put, remove}
    })();

    navigationMenu();

    //EVENTS
    //form submit events
    registerForm.on("submit", registerUser);
    loginForm.on("submit", loginUser);
    submitForm.on("submit", createPost);
    editForm.on("submit", editPost);
    //menu click events
    menu.find("a").slice(0, 1).on("click", navigationMenu);
    $(menu.find("a")[1]).on("click", showSubmitView);
    $(menu.find("a")[2]).on("click", loadMyComments);
    //other click events
    profile.find("a").on("click", logoutUser);
    $("#infoBox, #errorBox").on("click", function () {
        $(this).fadeOut();
    });
    // on request events
    $(document).on({
        ajaxStart: function () {
            $("#loadingBox").show();
        },
        ajaxStop: function () {
            $("#loadingBox").hide();
        }
    });

    //VIEWS
    function showView(viewName) {
        $("section").hide();
        $('#' + viewName).show();
    }

    function showSubmitView() {
        showView("viewSubmit");
    }

    function showEditView() {
        showView("viewEdit");
    }

    function showMyPostsView() {
        showView("viewMyPosts");
    }

    function showCommentsView() {
        showView("viewComments");
    }

    //NAVIGATION
    function navigationMenu() {
        authToken = localStorage.getItem("userId");
        $("#container").show();

        if (authToken === null) {
            $("section").hide();
            menu.hide();
            profile.hide();
            viewWelcome.show();
        } else {
            $("section").hide();
            viewWelcome.hide();
            menu.show();
            loadComments();
            profile.show();
            profile.find("span").text(localStorage.getItem("username"))
        }
    }


    //CRUD
    async function loadComments() {
        try {
            let res = await requester.get(baseUrl, "/posts");
            let posts = $("#viewCatalog").find(".posts");

            if (res.length > 0) {

                buildCommentTable(res, posts, $("#viewCatalog"));
            } else {
                posts.text("No posts in database");
            }

            $("#viewCatalog").show()
        } catch (e) {
            handleError(e)
        }
    }

    async function loadMyComments() {
        let username = localStorage.getItem("username");
        let end = `/posts?query={\"author\":\"${username}\"}&sort={\"_kmd.ect\": -1}\n`;
        let posts = $("#viewMyPosts").find(".posts");
        try {
            let res = await requester.get(baseUrl, end);
            if (res.length > 0) {

                buildCommentTable(res, posts, $("#viewMyPosts"));
            } else {
                posts.text("No posts in database");
            }
            showMyPostsView();
        } catch (e) {
            handleError(e)
        }
    }

    async function createPost(e) {
        e.preventDefault();

        let url = submitForm.find("input[name='url']").val();
        let title = submitForm.find("input[name='title']").val();
        let image = submitForm.find("input[name='image']").val();
        let description = submitForm.find("textarea[name='comment']").val();

        if (!url) {
            showError("URL field can not be empty!");
            return;
        }

        if (url.substring(0, 4) !== "http") {
            showError("Invalid URL!");
            return;
        }

        if (!title) {
            showError("Title can not be empty!");
            return;
        }

        let data = {
            author: localStorage.getItem("username"),
            title: title,
            url: url,
            imageUrl: image,
            description: description
        };
        try {
            let res = await requester.post(baseUrl, data, "/posts");
            showInfo("Post created.")
            submitForm.trigger("reset");
            navigationMenu();
        } catch (e) {
            handleError(e)
        }
    }

    async function editPost(e) {
        e.preventDefault();
        let url = editForm.find("input[name='url']").val();
        let title = editForm.find("input[name='title']").val();
        let image = editForm.find("input[name='image']").val();
        let description = editForm.find("textarea[name='description']").val();
        let id = editForm.attr("postId");

        if (!url) {
            showError("URL field can not be empty!");
            return;
        }

        if (url.substring(0, 4) !== "http") {
            showError("Invalid URL!");
            return;
        }

        if (!title) {
            showError("Title can not be empty!");
            return;
        }

        let data = {
            author: localStorage.getItem("username"),
            title: title,
            url: url,
            imageUrl: image,
            description: description
        };
        try {
            let res = await requester.put(baseUrl, data, "/posts/" + id);
            showInfo("Post Updated.");
            submitForm.trigger("reset");
            navigationMenu();
        } catch (e) {
            handleError(e)
        }
    }

    async function deletePost(post) {
        let id = post._id;
        try {
            await requester.remove(baseUrl, "/posts/" + id);
            showInfo("Post deleted.");
            navigationMenu();
        } catch (e) {
            handleError(e)
        }
    }

    // function postDetails(post) {
    //     console.log(post)
    //     showCommentsView();
    //
    //     let currentPost = $("#viewComments").find(".post").slice(0, 1);
    //     currentPost.empty();
    //     buildCommentTable(post, currentPost,)
    //
    //
    // }

    //USER
    async function registerUser(e) {
        e.preventDefault();

        let username = registerForm.find($("input[name='username']")).val();
        let password = registerForm.find($("input[name='password']")).val();
        let repeatPass = registerForm.find($("input[name='repeatPass']")).val();

        if (!username || !password || !repeatPass) {
            showError("The fields can not be empty!");
            return;
        }
        if (!(/^[A-Za-z]{3,}$/.test(username))) {
            showError("Invalid username! It must be at least 3 characters long");
            return;
        }
        if (!(/^[A-Za-z0-9]{6,}$/.test(password))) {
            showError("Password is too weak, it must be at least 6 characters long");
            return;
        }
        if (password !== repeatPass) {
            showError("Password and confirm password do not match");
            return;
        }
        let data = {username, password};

        try {
            let res = await requester.post(userUrl, data, "");
            showInfo("User registration successful.");
            saveLocalStorageSession(res);
            registerForm.trigger("reset");
            navigationMenu();
        } catch (e) {
            handleError(e)
        }
    }

    async function loginUser(e) {
        e.preventDefault();

        let username = loginForm.find($("input[name='username']")).val();
        let password = loginForm.find($("input[name='password']")).val();

        if (!username || !password) {
            showError("The fields can not be empty!");
            return;
        }
        let data = {username, password};

        try {
            let res = await requester.post(userUrl, data, "/login");
            showInfo("Login successful.");
            saveLocalStorageSession(res);
            loginForm.trigger("reset");
            navigationMenu();
        } catch (e) {
            handleError(e);
        }
    }

    async function logoutUser() {
        try {
            await requester.post(userUrl, {}, "/_logout");
            localStorage.clear();
            showInfo("Logout successful.");
            navigationMenu();
            viewWelcome.find(".about").hide();
            $("#registerForm").hide();
        } catch (e) {
            handleError(e)
        }
    }


    function buildCommentTable(res, elementDiv, form) {
        elementDiv.empty();

        for (let i = 0; i < res.length; i++) {
            let time = calcTime(res[i]._kmd.ect);
            let username = res[i].author;
            let creatorId = res[i]._acl.creator;

            elementDiv.append($("<article>").addClass("post")
                .append($("<div>")
                    .addClass("col rank")
                    .append(`<span>${i + 1}</span>`))
                .append($("<div>")
                .addClass("col thumbnail")
                .append($(`<a href='${res[i].url}'>`)
                    .append($(`<img src='${res[i].imageUrl}'>`))))
                .append($("<div>")
                    .addClass("post-content")
                    .append($("<div>")
                        .addClass("title")
                        .append(`<a href='${res[i].url}'>${res[i].title}</a>`))
                    .append($("<div>").addClass("details")
                        .append($("<div>").addClass("info").text(`Submitte ${time} ago by ${username}`))
                        .append($("<div>").addClass("controls")
                            .append($("<ul>"))))));

            let list = $(form.find("ul").slice(-1));

            list.append($("<li>")
                .addClass("action")
                .append($("<a href='#' class='commentsLink'>comments</a>")));

            if (creatorId === localStorage.getItem("userId")) {

                list.append($("<li>")
                    .addClass("action")
                    .append($("<a href='#' class='editLink'>edit</a>")
                        .on("click", () => preparePostForEdit(res[i]))));
                list.append($("<li>")
                    .addClass("action")
                    .append($("<a href='#' class='deleteLink'>delete</a>")
                        .on("click", () => deletePost(res[i]))))
            }
        }
    }

    function preparePostForEdit(post) {
        showEditView();
        editForm.find("input[name='url']").val(post.url);
        editForm.find("input[name='title']").val(post.title);
        editForm.find("input[name='image']").val(post.imageUrl);
        editForm.find("textarea[name='description']").val(post.description);
        editForm.attr("postId", post._id);
    }

    function calcTime(dateIsoFormat) {
        let diff = new Date - (new Date(dateIsoFormat));
        diff = Math.floor(diff / 60000);
        if (diff < 1) return 'less than a minute';
        if (diff < 60) return diff + ' minute' + pluralize(diff);
        diff = Math.floor(diff / 60);
        if (diff < 24) return diff + ' hour' + pluralize(diff);
        diff = Math.floor(diff / 24);
        if (diff < 30) return diff + ' day' + pluralize(diff);
        diff = Math.floor(diff / 30);
        if (diff < 12) return diff + ' month' + pluralize(diff);
        diff = Math.floor(diff / 12);
        return diff + ' year' + pluralize(diff);

        function pluralize(value) {
            if (value !== 1) return 's';
            else return '';
        }
    }

    function saveLocalStorageSession(data) {
        localStorage.setItem("authToken", data._kmd.authtoken);
        localStorage.setItem("username", data.username);
        localStorage.setItem("userId", data._id);
    }

    function handleError(err) {
        let errorMsg = err.status + " " + err.statusText;
        if (err.responseJSON && err.responseJSON.error) {
            errorMsg += "! " + err.responseJSON.error;
        }
        showError(errorMsg);
    }

    // NOTIFICATIONS
    function showInfo(info) {
        let box = $("#infoBox");
        box.show();
        box.find("span").text(info);

        setTimeout(() => box.hide(), 3000);
    }

    function showError(err) {
        $("#errorBox").show();
        $("#errorBox > span").text(err);
    }
});