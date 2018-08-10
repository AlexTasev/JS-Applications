const baseUrl = "https://baas.kinvey.com/appdata/";
const userUrl = "https://baas.kinvey.com/user/";
$(() => {
    let app = Sammy("#container", function () {
        this.use("Handlebars", "hbs");

        this.get("index.html", loadHomePage);
        this.get("#/home", loadHomePage);

        function loadHomePage(ctx) {
            if (auth.isAuth()) {
                requester.get(baseUrl, "/flights")
                    .then(showFlights)
                    .catch(notify.handleError);

                function showFlights(data) {
                    ctx.isAuth = true;
                    ctx.username = localStorage.getItem("username");
                    ctx.flights = data;
                    ctx.loadPartials({
                        header: "./templates/common/header.hbs",
                        footer: "./templates/common/footer.hbs",
                        page: "./templates/common/home.hbs",
                        flight: "./templates/flights/listFlights.hbs",
                    }).then(function () {
                        this.partial("./templates/renderPage.hbs")
                    });
                }
            } else {
                ctx.loadPartials({
                    header: "./templates/common/header.hbs",
                    footer: "./templates/common/footer.hbs",
                }).then(function () {
                    this.partial("./templates/homePage.hbs")
                })
            }
        }

        this.get("#/register", function (ctx) {
            if (auth.isAuth()) {
                ctx.redirect("#/home")
            } else {
                ctx.loadPartials({
                    header: "./templates/common/header.hbs",
                    footer: "./templates/common/footer.hbs",
                    page: "./templates/anonymousUser/registration.hbs",
                    registrationForm: "./templates/forms/registrationForm.hbs",
                }).then(function () {
                    this.partial("./templates/renderPage.hbs")
                });
            }
        });

        this.post("#/register", function (ctx) {
            let {username, pass, checkPass} = ctx.params;
            if (username.length < 5) {
                notify.showError("Invalid username! It must be at least 5 characters long.");
            } else if (!pass || !checkPass) {
                notify.showError("The password fields can not be empty! Please fill them up.")
            } else if (pass !== checkPass) {
                notify.showError("Passwords do not match!")
            } else {
                let data = {username: username, password: pass};
                requester.post(userUrl, data, "")
                    .then((userData) => {
                        notify.showInfo("User registration successful.");
                        auth.saveSession(userData);
                        ctx.redirect("#/home");
                    }).catch(notify.handleError);
            }
        });

        this.get("#/login", function (ctx) {
            if (auth.isAuth()) {
                ctx.redirect("#/home")
            } else {
                ctx.loadPartials({
                    header: "./templates/common/header.hbs",
                    footer: "./templates/common/footer.hbs",
                    page: "./templates/anonymousUser/login.hbs",
                    loginForm: "./templates/forms/loginForm.hbs",
                }).then(function () {
                    this.partial("./templates/renderPage.hbs")
                });
            }
        });

        this.post("#/login", function (ctx) {
            let {username, pass} = ctx.params;
            let data = {username: username, password: pass};
            requester.post(userUrl, data, "/login")
                .then((userData) => {
                    notify.showInfo("Login successful.");
                    auth.saveSession(userData);
                    ctx.redirect("#/home");
                }).catch(notify.handleError);
        });

        this.get("#/logout", function (ctx) {
            requester.post(userUrl, {}, "/_logout")
                .then(() => {
                    notify.showInfo("Logout successful.");
                    localStorage.clear();
                    ctx.redirect("#/login");
                }).catch(notify.handleError);
        });

        this.get("#/add", function (ctx) {
            if (auth.isAuth()) {
                ctx.isAuth = true;
                ctx.username = localStorage.getItem("username");
                ctx.loadPartials({
                    header: "./templates/common/header.hbs",
                    footer: "./templates/common/footer.hbs",
                    addFlightForm: "./templates/forms/addFlightForm.hbs",
                    page: "./templates/flights/addFlight.hbs",
                }).then(function () {
                    this.partial("./templates/renderPage.hbs")
                });
            } else {
                notify.showInfo("Please login before you continue.");
                ctx.redirect("#/login");
            }
        });

        this.post("#/add", function (ctx) {
            let data = verifyInputFields(ctx.params);
            if (typeof data === "string") {
                notify.showError(data);
            } else {
                requester.post(baseUrl, data, "/flights")
                    .then(() => {
                        notify.showInfo("Created flight.");
                        ctx.redirect("#/home");
                    }).catch(notify.handleError);
            }
        });

        this.get("#/flight/:id", function (ctx) {
            if (auth.isAuth()) {
                let id = ctx.params.id;
                requester.get(baseUrl, "/flights/" + id)
                    .then((data) => {
                        ctx.isAuth = true;
                        ctx.username = localStorage.getItem("username");
                        for (let prop in data) {
                            ctx[prop] = data[prop];
                        }
                        if (localStorage.getItem("userId") === data._acl.creator) {
                            ctx.isAuthor = true;
                        }
                        ctx.loadPartials({
                            header: "./templates/common/header.hbs",
                            footer: "./templates/common/footer.hbs",
                            page: "./templates/flights/details.hbs",
                        }).then(function () {
                            this.partial("./templates/renderPage.hbs")
                        });
                    }).catch(notify.handleError);
            }
            else {
                notify.showInfo("Please login before you continue.");
                ctx.redirect("#/login");
            }
        });

        this.get("#/edit/:id", function (ctx) {
            let id = ctx.params.id;
            requester.get(baseUrl, "/flights/" + id)
                .then((data) => {
                    ctx.isAuth = true;
                    ctx.username = localStorage.getItem("username");
                    for (let prop in data) {
                        ctx[prop] = data[prop];
                    }
                    ctx.loadPartials({
                        header: "./templates/common/header.hbs",
                        footer: "./templates/common/footer.hbs",
                        page: "./templates/flights/edit.hbs",
                        editForm: "./templates/forms/editForm.hbs",
                    }).then(function () {
                        this.partial("./templates/renderPage.hbs")
                    });
                }).catch(notify.handleError);
        });

        this.post("#/edit/:id", function (ctx) {
            let id = ctx.params.id;
            let data = verifyInputFields(ctx.params);
            if (typeof data === "string") {
                notify.showError(data);
            } else {
                requester.put(baseUrl, data, "/flights/" + id)
                    .then(() => {
                        notify.showInfo("Successfully edited flight.");
                        ctx.redirect("#/home");
                    }).catch(notify.handleError);
            }
        });

        this.get("#/flights", function (ctx) {
            let id = localStorage.getItem("userId");
            let end = `/flights?query={"_acl.creator":"${id}"}`

            requester.get(baseUrl, end)
                .then((mineData) => {
                    ctx.flights = mineData;
                    ctx.isAuth = true;
                    ctx.username = localStorage.getItem("username");

                    ctx.loadPartials({
                        header: "./templates/common/header.hbs",
                        footer: "./templates/common/footer.hbs",
                        page: "./templates/flights/myFlight.hbs",
                        flight: "./templates/flights/mine.hbs",
                    }).then(function () {
                        this.partial("./templates/renderPage.hbs")
                    });
                }).catch(notify.handleError)
        });

        this.get("#/remove/:id", function (ctx) {
            let id = ctx.params.id;
            requester.remove(baseUrl, "/flights/" + id)
                .then(() => {
                    notify.showInfo("Flight deleted.");
                    window.history.go(-1);
                }).catch(notify.handleError);
        })

        function verifyInputFields(params) {
            let cost = +params.cost;
            let image = params.img;
            let isPublished = params.public;
            let seats = +params.seats;
            let departureTime = params.departureTime;
            let departure = params.departureDate;
            let destination = params.destination;
            let origin = params.origin;

            if (!destination || !origin) {
                return "Destination and origin fields are required!";

            }
            if (seats < 0 || typeof seats !== "number") {
                return "Seats can not be negative number";
            }
            if (cost < 0 || typeof cost !== "number") {
                return "Cost can not be negative number";
            }
            return {cost, image, isPublished, seats, departure, departureTime, destination, origin};
        }
    });

    app.run();
});