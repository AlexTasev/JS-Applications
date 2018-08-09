const baseUrl = "https://baas.kinvey.com/appdata/";
const userUrl = "https://baas.kinvey.com/user/";
$(() => {
    let app = Sammy("#container", function () {
        this.use("Handlebars", "hbs");

        this.get("index.html", showStartingPage);
        this.get("#/home", showStartingPage);

        function showStartingPage(ctx) {
            if (!auth.isAuth()) {
                ctx.loadPartials({
                    header: "./templates/common/header.hbs",
                    footer: "./templates/common/footer.hbs",
                    loginForm: "./templates/forms/loginForm.hbs",
                    registerForm: "./templates/forms/registerForm.hbs",
                }).then(function () {
                    this.partial("./templates/welcome-anonymous.hbs");
                });
            } else {
                ctx.redirect("#/catalog");
            }
        }

        this.post("#/login", function (ctx) {
            let data = {
                username: ctx.params.username,
                password: ctx.params.password
            };

            requester.post(userUrl, data, "/login")
                .then(success)
                .catch(notify.handleError);

            function success(data) {
                auth.saveSession(data);
                notify.showInfo("Logged In.");
                ctx.redirect("#/catalog")
            }
        });

        this.post("#/register", function (ctx) {
            let username = ctx.params.username;
            let password = ctx.params.password;
            let repeatPass = ctx.params.repeatPass;

            if (!username || !password || !repeatPass) {
                notify.showError("The fields can not be empty!");
                return;
            }
            if (!(/^[A-Za-z]{3,}$/.test(username))) {
                notify.showError("Invalid username! It must be at least 3 characters long");
                return;
            }
            if (!(/^[A-Za-z0-9]{6,}$/.test(password))) {
                notify.showError("Password is too weak, it must be at least 6 characters long");
                return;
            }
            if (password !== repeatPass) {
                notify.showError("Password and confirm password do not match");
                return;
            }

            let data = {username, password};

            requester.post(userUrl, data, "")
                .then(success)
                .catch(notify.handleError);

            function success(data) {
                auth.saveSession(data);
                notify.showInfo("Successful registration.");
                ctx.redirect("#/catalog")
            }
        });

        this.get("#/logout", function (ctx) {
            requester.post(userUrl, {}, "/_logout")
                .then(success)
                .catch(notify.handleError);

            function success() {
                localStorage.clear();
                notify.showInfo("Logged Out!");
                ctx.redirect("#/home");
            }
        });

        this.get("#/catalog", function (ctx) {
            if (auth.isAuth()) {
                requester.get(baseUrl, "/posts")
                    .then(success)
                    .catch(notify.handleError)
            }

            function success(data) {
                let rank = 0;
                for (let p of data) {
                    p.time = calcTime(p._kmd.ect);
                    p.rank = ++rank;
                    if (p.author === localStorage.getItem("username")) {
                        p.isAuthor = true;
                    }
                }
                ctx.username = localStorage.getItem("username");
                ctx.isAuth = auth.isAuth();
                ctx.posts = data;
                ctx.loadPartials({
                    header: "./templates/common/header.hbs",
                    footer: "./templates/common/footer.hbs",
                    navigation: "./templates/common/navigation.hbs",
                    links: "./templates/common/links.hbs",
                    post: "./templates/articles.hbs"
                }).then(function () {
                    this.partial("./templates/catalog.hbs")
                })
            }
        });

        this.get("#/createpost", function (ctx) {
            ctx.username = localStorage.getItem("username");
            ctx.isAuth = auth.isAuth();
            ctx.loadPartials({
                header: "./templates/common/header.hbs",
                footer: "./templates/common/footer.hbs",
                navigation: "./templates/common/navigation.hbs",
                createPostForm: "./templates/forms/createPostForm.hbs"
            }).then(function () {
                this.partial("./templates/createPost.hbs");
            })
        });

        this.post("#/createpost", function (ctx) {
            let title = ctx.params.title;
            let url = ctx.params.url;
            let imageUrl = ctx.params.image;
            let description = ctx.params.comment;
            let author = localStorage.getItem("username");

            if (!url) {
                notify.showError("URL field can not be empty!");
                return;
            }

            if (url.substring(0, 4) !== "http") {
                notify.showError("Invalid URL!");
                return;
            }

            if (!title) {
                notify.showError("Title can not be empty!");
                return;
            }

            let data = {title, url, imageUrl, description, author};

            requester.post(baseUrl, data, "/posts")
                .then(success)
                .catch(notify.handleError);

            function success() {
                notify.showInfo("Post created.");
                ctx.redirect("#/catalog");
            }
        });

        this.get("#/editpost/:id", function (ctx) {
            let id = ctx.params.id;
            requester.get(baseUrl, "/posts/" + id)
                .then(success)
                .catch(notify.handleError);

            function success(postInfo) {
                for (let prop in postInfo) {
                    ctx[prop] = postInfo[prop];
                }

                ctx.username = localStorage.getItem("username");
                ctx.isAuth = auth.isAuth();

                ctx.loadPartials({
                    header: "./templates/common/header.hbs",
                    footer: "./templates/common/footer.hbs",
                    navigation: "./templates/common/navigation.hbs",
                    editPostForm: "./templates/forms/editPostForm.hbs"
                }).then(function () {
                    this.partial("./templates/editPost.hbs");
                })
            }
        });

        this.post("#/editpost/:id", function (ctx) {
            let title = ctx.params.title;
            let url = ctx.params.url;
            let imageUrl = ctx.params.image;
            let description = ctx.params.comment;
            let author = localStorage.getItem("username");

            if (!url) {
                notify.showError("URL field can not be empty!");
                return;
            }

            if (url.substring(0, 4) !== "http") {
                notify.showError("Invalid URL!");
                return;
            }

            if (!title) {
                notify.showError("Title can not be empty!");
                return;
            }

            let data = {title, url, imageUrl, description, author};
            let postId = ctx.params.id;
            requester.put(baseUrl, data, "/posts/" + postId)
                .then(success)
                .catch(notify.handleError);

            function success() {
                notify.showInfo("Post updated.");
                ctx.redirect("#/catalog");
            }
        });

        this.get("#/deletepost/:id", function (ctx) {
            let id = ctx.params.id;
            requester.remove(baseUrl, "/posts/" + id)
                .then(() => {
                    notify.showInfo("Post deleted.");
                    ctx.redirect("#/catalog");
                })
                .catch(notify.handleError);
        });

        this.get("#/myposts", function (ctx) {
            let username = localStorage.getItem("username");
            let end = `/posts?query={\"author\":\"${username}\"}&sort={\"_kmd.ect\": -1}`;

            requester.get(baseUrl, end)
                .then(success)
                .catch(notify.handleError);

            function success(data) {
                let rank = 0;
                for (let p of data) {
                    p.time = calcTime(p._kmd.ect);
                    p.rank = ++rank;
                }
                ctx.username = localStorage.getItem("username");
                ctx.isAuth = auth.isAuth();
                ctx.posts = data;
                ctx.loadPartials({
                    header: "./templates/common/header.hbs",
                    footer: "./templates/common/footer.hbs",
                    navigation: "./templates/common/navigation.hbs",
                    minePosts: "./templates/minePosts.hbs"
                }).then(function () {
                    this.partial("./templates/listMyPosts.hbs")
                })
            }
        });

        this.get("#/details/:id", function (ctx) {
            let id = ctx.params.id;
            requester.get(baseUrl, "/posts/" + id)
                .then(loadPost)
                .then(loadComments)
                .catch(notify.handleError);

            function loadComments(comments) {
                ctx.comments = comments;
                for (let c of comments) {
                    c.comTime = calcTime(c._kmd.ect);
                    if (c.author === ctx.username) {
                        c.isAuthorComment = true;
                        c.postID = id;
                    }
                }

                ctx.loadPartials({
                    header: "./templates/common/header.hbs",
                    footer: "./templates/common/footer.hbs",
                    navigation: "./templates/common/navigation.hbs",
                    post: "./templates/details/post.hbs",
                    comment: "./templates/details/comment.hbs",
                    postCommentForm: "./templates/forms/postCommentForm.hbs"
                }).then(function () {
                    this.partial("./templates/showDetails.hbs")
                });
            }

            function loadPost(postInfo) {

                ctx.time = calcTime(postInfo._kmd.ect);
                ctx.username = localStorage.getItem("username");
                ctx.isAuth = auth.isAuth();
                for (let prop in postInfo) {
                    ctx[prop] = postInfo[prop];
                }
                if (ctx.author === localStorage.getItem("username")) {
                    ctx.isAuthor = true;
                }
                let end = `/coments?query={"postId":"${id}"}&sort={"_kmd.ect": -1}`;
                return requester.get(baseUrl, end)
            }
        });

        this.post("#/details/:id", function (ctx) {
            let id = ctx.params.id;
            let data = {
                content: ctx.params.content,
                author: localStorage.getItem("username"),
                postId: id
            };
            requester.post(baseUrl, data, "/coments")
                .then(() => {
                    notify.showInfo("Comment created.");
                    ctx.redirect(`#/details/${id}`)
                })
                .catch(notify.handleError)
        });

        this.get("#/details/:postId/deletecomment/:id", function (ctx) {
            let id = ctx.params.id;
            let postId = ctx.params.postId;

            requester.remove(baseUrl, "/coments/" + id)
                .then(() => {
                    notify.showInfo("Comment deleted.");
                    ctx.redirect("#/details/" + postId);
                })
                .catch(notify.handleError)
        });

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

    });
    app.run();
});