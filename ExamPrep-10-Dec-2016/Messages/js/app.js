function startApp() {
    const baseUrl = "https://baas.kinvey.com/appdata/";
    const userUrl = "https://baas.kinvey.com/user/";

    let app = Sammy("#app", function () {
        this.use("Handlebars", "hbs");

        this.get("index.html", loadHomePage);
        this.get("#/home", loadHomePage);

        function loadHomePage(ctx) {
            if (!auth.isAuth()) {
                ctx.loadPartials({
                    header: "./templates/anonymous/header.hbs",
                    footer: "./templates/common/footer.hbs"
                }).then(function () {
                    this.partial("./templates/anonymous/welcomeAnonymous.hbs")
                });
            } else {
                ctx.redirect("#/user")
            }
        }

        this.get("#/register", function (ctx) {
            if (!auth.isAuth()) {
                ctx.loadPartials({
                    header: "./templates/anonymous/header.hbs",
                    footer: "./templates/common/footer.hbs",
                    registerForm: "./templates/forms/registerForm.hbs"
                }).then(function () {
                    this.partial("./templates/anonymous/registration.hbs")
                });
            } else {
                ctx.redirect("#/user")
            }
        });

        this.post("#/register", function (ctx) {
            let data = {
                username: ctx.params.username,
                password: ctx.params.password,
                name: ctx.params.name,
            };

            requester.post(userUrl, data, "")
                .then(success)
                .catch(notify.handleError);


            function success(userInfo) {
                notify.showInfo("User registration successful.");
                auth.saveSession(userInfo);
                ctx.redirect("#/user")
            }
        });

        this.get("#/login", function (ctx) {
            if (!auth.isAuth()) {
                ctx.loadPartials({
                    header: "./templates/anonymous/header.hbs",
                    footer: "./templates/common/footer.hbs",
                    loginForm: "./templates/forms/loginForm.hbs"
                }).then(function () {
                    this.partial("./templates/anonymous/login.hbs")
                });
            } else {
                ctx.redirect("#/user")
            }
        });

        this.post("#/login", function (ctx) {
            let data = {
                username: ctx.params.username,
                password: ctx.params.password,
            };

            requester.post(userUrl, data, "/login")
                .then(success)
                .catch(notify.handleError);


            function success(userInfo) {
                notify.showInfo("Login successful.");
                auth.saveSession(userInfo);
                ctx.redirect("#/user")
            }
        });

        this.get("#/user", function (ctx) {
            if (auth.isAuth()) {
                ctx.username = localStorage.getItem("username");
                ctx.loadPartials({
                    header: "./templates/common/header.hbs",
                    footer: "./templates/common/footer.hbs",
                    navigation: "./templates/common/navigation.hbs"
                }).then(function () {
                    this.partial("./templates/userHomePage.hbs")
                })
            } else {
                notify.showError("You have to be logged in to continue.");
                ctx.redirect("#/register")
            }
        });

        this.get("#/logout", function (ctx) {
            requester.post(userUrl, {}, "/_logout")
                .then(() => {
                    notify.showInfo("Logout successful.");
                    localStorage.clear();
                    ctx.redirect("#/home")
                }).catch(notify.handleError);
        });

        this.get("#/messages", function (ctx) {
            if (auth.isAuth()) {
                let username = localStorage.getItem("username");
                let end = `/messages?query={"recipient_username":"${username}"}`;
                requester.get(baseUrl, end)
                    .then(success)
                    .catch(notify.handleError);

                function success(data) {
                    for (let msg of data) {
                        msg.time = formatDate(msg._kmd.ect);
                        msg.sender = formatSender(msg.sender_name, msg.sender_username);
                    }
                    ctx.messages = data;
                    ctx.username = localStorage.getItem("username");
                    ctx.loadPartials({
                        header: "./templates/common/header.hbs",
                        footer: "./templates/common/footer.hbs",
                        message: "./templates/messages.hbs"
                    }).then(function () {
                        this.partial("./templates/myMessages.hbs");
                    })
                }
            } else {
                notify.showError("You have to be logged in to continue.");
                ctx.redirect("#/login")
            }
        });

        this.get("#/archive", function (ctx) {
            if (auth.isAuth()) {
                let username = localStorage.getItem("username");
                let end = `/messages?query={"sender_username":"${username}"}`;
                requester.get(baseUrl, end)
                    .then(success)
                    .catch(notify.handleError);

                function success(data) {
                    for (let msg of data) {
                        msg.time = formatDate(msg._kmd.ect);
                        msg.recepient = msg.recipient_username;
                    }
                    ctx.messages = data;
                    ctx.username = localStorage.getItem("username");
                    ctx.loadPartials({
                        header: "./templates/common/header.hbs",
                        footer: "./templates/common/footer.hbs",
                        message: "./templates/messageArchive/message.hbs"
                    }).then(function () {
                        this.partial("./templates/messageArchive/archiveMessages.hbs");
                    })
                }
            } else {
                notify.showError("You have to be logged in to continue.");
                ctx.redirect("#/login")
            }
        });

        this.get("#/delete/:id", function (ctx) {
            if (auth.isAuth()) {
                let id = ctx.params.id;
                requester.remove(baseUrl, "/messages/" + id)
                    .then(() => {
                        notify.showInfo("Message deleted.");
                        window.history.go(-1);
                    }).catch(notify.handleError);
            } else {
                notify.showError("You have to be logged in to continue.");
                ctx.redirect("#/login");
            }
        });

        this.get("#/send", function (ctx) {
            requester.get(userUrl, "")
                .then(getAllUsers)
                .catch(notify.handleError);

            function getAllUsers(users) {
                for (let user of users) {
                    user.usernameName = formatSender(user.name, user.username)
                }
                ctx.username = localStorage.getItem("username");
                ctx.options = users;
                console.log(ctx)
                ctx.loadPartials({
                    header: "./templates/common/header.hbs",
                    footer: "./templates/common/footer.hbs",
                    option: "./templates/sendMessage/loadUsers.hbs",
                    sendMessageForm: "./templates/forms/sendMessageForm.hbs"
                }).then(function () {
                    this.partial("./templates/sendMessage/loaded.hbs");
                })
            }
        });

        this.post("#/send", function (ctx) {
            let recipient = ctx.params.recipient;
            let text = ctx.params.text;
            let username = localStorage.getItem("username");
            let name = localStorage.getItem("name") === "" ? null : localStorage.getItem("name");
            let data = {
                text: text,
                recipient_username: recipient,
                sender_name: name,
                sender_username: username
            };

            requester.post(baseUrl, data, "/messages")
                .then(() => {
                    notify.showInfo("Message sent.");
                    ctx.redirect("#/archive")
                }).catch(notify.handleError);
        });

        function formatDate(dateISO8601) {
            let date = new Date(dateISO8601);
            if (Number.isNaN(date.getDate()))
                return '';
            return date.getDate() + '.' + padZeros(date.getMonth() + 1) +
                "." + date.getFullYear() + ' ' + date.getHours() + ':' +
                padZeros(date.getMinutes()) + ':' + padZeros(date.getSeconds());

            function padZeros(num) {
                return ('0' + num).slice(-2);
            }
        }

        function formatSender(name, username) {
            if (!name)
                return username;
            else
                return username + ' (' + name + ')';
        }


    });
    app.run();
}