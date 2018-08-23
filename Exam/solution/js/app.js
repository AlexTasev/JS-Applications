$(() => {
    const baseUrl = "https://baas.kinvey.com/appdata/";
    const userUrl = "https://baas.kinvey.com/user/";

    let app = Sammy("#container", function () {
        this.use("Handlebars", "hbs");

        this.get("index.html", loadHomePage);
        this.get("#/home", loadHomePage);

        function loadHomePage(ctx) {
            if (!auth.isAuth()) {
                ctx.loadPartials({
                    header: "./templates/common/header.hbs",
                    footer: "./templates/common/footer.hbs",
                    page: "./templates/common/welcome.hbs"
                }).then(function () {
                    this.partial("./templates/renderPage.hbs",)
                });
            } else {
                ctx.username = localStorage.getItem("username");
                ctx.isAuth = true;

                ctx.loadPartials({
                    header: "./templates/common/header.hbs",
                    footer: "./templates/common/footer.hbs",
                    page: "./templates/common/welcome.hbs"
                }).then(function () {
                    this.partial("./templates/renderPage.hbs",)
                });
            }
        }

        this.get("#/login", function (ctx) {
            if (!auth.isAuth()) {
                ctx.loadPartials({
                    header: "./templates/common/header.hbs",
                    footer: "./templates/common/footer.hbs",
                    loginForm: "./templates/forms/loginForm.hbs",
                    page: "./templates/common/login.hbs"
                }).then(function () {
                    this.partial("./templates/renderPage.hbs",)
                });
            } else {
                notify.showInfo("You are already logged in.");
                ctx.redirect("#/home")
            }
        })

        this.post("#/login", function (ctx) {
            let username = ctx.params.username;
            let password = ctx.params.password;
            let data = {username, password};

            requester.post(userUrl, data, "/login")
                .then((userData) => {
                    auth.saveSession(userData);
                    notify.showInfo("Login successful.");
                    ctx.redirect("#/catalog");
                }).catch(notify.handleError);
        });

        this.get("#/register", function (ctx) {
            if (!auth.isAuth()) {
                ctx.loadPartials({
                    header: "./templates/common/header.hbs",
                    footer: "./templates/common/footer.hbs",
                    registerForm: "./templates/forms/registerForm.hbs",
                    page: "./templates/common/register.hbs"
                }).then(function () {
                    this.partial("./templates/renderPage.hbs",)
                });
            } else {
                notify.showInfo("You are already registered in.");
                ctx.redirect("#/home")
            }
        })

        this.post("#/register", function (ctx) {
            let username = ctx.params.username;
            let password = ctx.params.password;
            let repeatPass = ctx.params.repeatPass;

            if (!username || !password || !repeatPass) {
                notify.showError("Fields can not be send empty! Please fill the up.");
                return;
            }

            if (!/^[a-zA-Z]{3,}$/.test(username)) {
                notify.showError("Username must contain only english letters and should be at least 3 characters long!");
                return;
            }
            if (!/^[a-zA-Z0-9]{6,}$/.test(password)) {
                notify.showError("Invalid password. Must be at least 6 characters long.");
                return;
            }

            if (password !== repeatPass) {
                notify.showError("Passwords do not match!");
                return;
            }

            let data = {username, password};
            requester.post(userUrl, data, "")
                .then((userData) => {
                    auth.saveSession(userData);
                    notify.showInfo("User registration successful.");
                    ctx.redirect("#/catalog");
                }).catch(notify.handleError);
        })

        this.get("#/logout", function (ctx) {
            requester.post(userUrl, {}, "/_logout")
                .then(() => {
                    localStorage.clear();
                    notify.showInfo("Logout successful.");
                    ctx.redirect("#/login");
                }).catch(notify.handleError);
        })

        this.get("#/catalog", function (ctx) {
            requester.get(baseUrl, "/cars")
                .then(success)
                .catch(notify.handleError);

            function success(data) {
                ctx.username = localStorage.getItem("username");
                ctx.isAuth = true;
                for (let ad of data) {
                    if (ad.seller === localStorage.getItem("username")) {
                        ad.isAuthor = true;
                    }
                }
                ctx.ads = data;
                ctx.loadPartials({
                    header: "./templates/common/header.hbs",
                    footer: "./templates/common/footer.hbs",
                    page: "./templates/cars/listAll.hbs",
                    ad: "./templates/cars/ad.hbs",
                }).then(function () {
                    this.partial("./templates/renderPage.hbs",)
                });
            }
        })

        this.get("#/create", function (ctx) {
            ctx.username = localStorage.getItem("username");
            ctx.isAuth = true;
            ctx.loadPartials({
                header: "./templates/common/header.hbs",
                footer: "./templates/common/footer.hbs",
                createForm: "./templates/forms/createForm.hbs",
                page: "./templates/cars/create.hbs"
            }).then(function () {
                this.partial("./templates/renderPage.hbs",)
            });
        });

        this.post("#/create", function (ctx) {
            let data = inputValidation(ctx);
            if (typeof data === "string") {
                notify.showError(data);
            } else {
                requester.post(baseUrl, data, "/cars")
                    .then((dataCreated) => {
                        notify.showInfo("Listing created.");
                        ctx.redirect("#/catalog");
                    }).catch(notify.handleError);
            }
        });

        this.get("#/edit/:id", function (ctx) {
            let id = ctx.params.id;

            requester.get(baseUrl, "/cars/" + id)
                .then(success)
                .catch(notify.handleError);

            function success(data) {
                ctx.username = localStorage.getItem("username");
                ctx.isAuth = true;
                for (let prop in data) {
                    ctx[prop] = data[prop];
                }
                ctx.loadPartials({
                    header: "./templates/common/header.hbs",
                    footer: "./templates/common/footer.hbs",
                    page: "./templates/cars/edit.hbs",
                    editForm: "./templates/forms/editForm.hbs",
                }).then(function () {
                    this.partial("./templates/renderPage.hbs",)
                });
            }
        })

        this.post("#/edit/:id", function (ctx) {
            let id = ctx.params.id;
            let title = ctx.params.title;
            let data = inputValidation(ctx);

            if (typeof data === "string") {
                notify.showError(data);
            } else {
                requester.put(baseUrl, data, "/cars/" + id)
                    .then((dataCreated) => {
                        notify.showInfo(`Listing ${title} updated.`);
                        ctx.redirect("#/catalog");
                    }).catch(notify.handleError);
            }
        });

        this.get("#/delete/:id", function (ctx) {
            let id = ctx.params.id;
            requester.remove(baseUrl, "/cars/" + id)
                .then((data) => {
                    notify.showInfo("Listing deleted.");
                    ctx.redirect("#/catalog");
                }).catch(notify.handleError);
        });

        this.get("#/mycars", function (ctx) {
            let username = localStorage.getItem("username");
            let end = `/cars?query={"seller":"${username}"}&sort={"_kmd.ect": -1}`;

            requester.get(baseUrl, end)
                .then(showMyCars)
                .catch(notify.handleError);

            function showMyCars(carsData) {
                ctx.username = localStorage.getItem("username");
                ctx.isAuth = true;

                ctx.cars = carsData;
                ctx.loadPartials({
                    header: "./templates/common/header.hbs",
                    footer: "./templates/common/footer.hbs",
                    page: "./templates/cars/listMyCars.hbs",
                    car: "./templates/cars/myCars.hbs",
                }).then(function () {
                    this.partial("./templates/renderPage.hbs",)
                });
            }
        });

        this.get("#/details/:id", function (ctx) {
            let id = ctx.params.id;
            requester.get(baseUrl, "/cars/" + id)
                .then(success)
                .catch(notify.handleError)

            function success(data) {
                ctx.username = localStorage.getItem("username");
                ctx.isAuth = true;
                if (data.seller === localStorage.getItem("username")) {
                    ctx.isAuthor = true;
                }
                for (let prop in data) {
                    ctx[prop] = data[prop];
                }
                ctx.loadPartials({
                    header: "./templates/common/header.hbs",
                    footer: "./templates/common/footer.hbs",
                    page: "./templates/cars/details.hbs",
                }).then(function () {
                    this.partial("./templates/renderPage.hbs",)
                });
            }
        });

        function inputValidation(ctx) {
            let title = ctx.params.title;
            let description = ctx.params.description;
            let brand = ctx.params.brand;
            let model = ctx.params.model;
            let year = ctx.params.year;
            let imageUrl = ctx.params.imageUrl;
            let fuel = ctx.params.fuelType;
            let price = ctx.params.price;

            if (!title || !description || !brand || !model || !year || !imageUrl || !fuel || !price) {
               return "You can not submit you listing with an empty field!";
            }

            if (title.length > 33) {
                return "Title is too long! Maximum length is 33 characters.";
            } else if (description.length > 450) {
                return "Description is too long. Maximum length is 450 characters.";
            } else if (description.length < 30) {
                return "Description is too short. Minimum length is 30 characters.";
            } else if (brand.length > 11) {
                return "The text in 'Brand' filed can not be over 11 characters.";
            } else if (fuel.length > 11) {
                return "The text in 'Fuel type' filed can not be over 11 characters.";
            } else if (model.length > 11) {
                return "The text in 'Model' filed can not be over 11 characters.";
            } else if (year.length !== 4) {
                return "Invalid year! It must be 4 characters long.";
            } else if (+price > 1000000) {
                return "Invalid price! Maximum allowed number is 1000000";
            } else if (imageUrl.substring(0, 4) !== "http") {
                return "Invalid Url link! It must starts with 'http'.";
            } else {
                let seller = localStorage.getItem("username");
                return {title, description, brand, model, year, imageUrl, fuel, price, seller};
            }
        }
    });
    app.run();
})
;