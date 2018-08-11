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
                    loginForm: "./templates/forms/loginForm.hbs",
                    registerForm: "./templates/forms/registerForm.hbs",
                    footer: "./templates/common/footer.hbs"
                }).then(function () {
                    this.partial("./templates/anonymous/welcome.hbs");
                });
            } else {
                ctx.redirect("#/homeuser");
            }
        }

        this.post("#/register", function (ctx) {
            let username = ctx.params["username-register"];
            let password = ctx.params["password-register"];
            let passCheck = ctx.params["password-register-check"];
            let data = {username, password};
            if (username.length < 5) {
                notify.showError("Invalid username!It should be at least five characters long!");
            } else if (!password || !passCheck) {
                notify.showError("Passwords fields can not be empty.");
            } else if (passCheck !== password) {
                notify.showError("Password and confirmation password do not match!");
            } else {
                requester.post(userUrl, data, "")
                    .then(success)
                    .catch(notify.handleError);
            }

            function success(userData) {
                notify.showInfo("User registration successful.");
                auth.saveSession(userData);
                ctx.redirect("#/homeuser");
            }
        });

        this.post("#/login", function (ctx) {
            let username = ctx.params["username-login"];
            let password = ctx.params["password-login"];
            let data = {username: username, password: password};

            requester.post(userUrl, data, "/login")
                .then(success)
                .catch(notify.handleError);

            function success(userData) {
                notify.showInfo("Login successful.");
                auth.saveSession(userData);
                ctx.redirect("#/homeuser");
            }
        });

        this.get("#/logout", function (ctx) {
            requester.post(userUrl, {}, "/_logout")
                .then(() => {
                    notify.showInfo("Logout successful.");
                    localStorage.clear();
                    ctx.redirect("#/home");
                }).catch(notify.handleError);
        });

        this.get("#/homeuser", function (ctx) {
            if (auth.isAuth()) {
                let userId = localStorage.getItem("userId");
                let end = `/receipts?query={"_acl.creator":"${userId}","active":true}`;
                requester.get(baseUrl, end)
                    .then(success)
                    .then(showReceipt)
                    .catch(notify.handleError);

                function success(active) {
                    ctx.products = active;
                    if (active.length === 0) {
                        return requester.post(baseUrl, {active: true}, "/receipts")
                    } else {
                        let id = active[0]._id;
                        ctx.receiptId = id;
                        let endpoint = `/entries?query={"receiptId":"${id}"}`;
                        return requester.get(baseUrl, endpoint);
                    }
                }

                function showReceipt(receiptData) {
                    let total = 0;
                    let productCount = 0;
                    if (!receiptData.hasOwnProperty("active")) {
                        for (let row of receiptData) {
                            row.subTotal = row.qty * row.price;
                            total += row.subTotal;
                            row.subTotal = row.subTotal.toFixed(2);
                            row.price = row.price.toFixed(2);
                            productCount += Number(row.qty);
                            row.itemId = row._id;
                        }
                        ctx.products = receiptData;
                    } else {
                        ctx.receiptId = receiptData._id;
                    }
                    ctx.productCount = productCount;
                    ctx.total = total.toFixed(2);
                    loadPartials();
                }

                function loadPartials() {
                    ctx.username = localStorage.getItem("username");
                    ctx.loadPartials({
                        header: "./templates/common/header.hbs",
                        product: "./templates/receipts/product.hbs",
                        createProductForm: "./templates/forms/createProductForm.hbs",
                        checkOutReceiptForm: "./templates/forms/checkOutForm.hbs",
                        page: "./templates/receipts/createReceipt.hbs",
                        footer: "./templates/common/footer.hbs"
                    }).then(function () {
                        this.partial("./templates/renderPage.hbs");
                    });
                }

            } else {
                notify.showInfo("You have to login to continue.");
                ctx.redirect("#/home");
            }
        });

        this.post("#/homeuser/:id", function (ctx) {
            let receiptId = ctx.params.id;
            let type = ctx.params.type;
            let qty = +ctx.params.qty;
            let price = +ctx.params.price;

            if (type === "") {
                notify.showError("Product field can not be empty!");
            } else if (typeof qty !== "number") {
                notify.showError("Quantity must be a valid number.");
            } else if (typeof price !== "number") {
                notify.showError("Price must be a valid number.");
            } else {
                let data = {type, qty, price, receiptId};

                requester.post(baseUrl, data, "/entries")
                    .then(() => {
                        notify.showInfo("Entry added");
                        ctx.redirect("#/homeuser");
                    }).catch(notify.handleError);
            }
        });

        this.post("#/checkout", function (ctx) {
            let {productCount, receiptId, total} = ctx.params;
            if (+productCount <= 0) {
                notify.showError("Checking out an empty receipt is not allowed.");
                return;
            }
            let data = {productCount, total, active: false};
            requester.put(baseUrl, data, "/receipts/" + receiptId)
                .then(() => {
                    notify.showInfo("Receipt checked out");
                    ctx.redirect("#/homeuser");
                });
        });

        this.get("#/delete/:id", function (ctx) {
            let id = ctx.params.id;
            requester.remove(baseUrl, "/entries/" + id)
                .then(() => {
                    notify.showInfo("Entry removed");
                    ctx.redirect("#/homeuser");
                }).catch(notify.handleError);
        });

        this.get("#/overview", function (ctx) {
            let userId = localStorage.getItem("userId");
            let end = `/receipts?query={"_acl.creator":"${userId}","active":false}`;

            requester.get(baseUrl, end)
                .then(success)
                .catch(notify.handleError);

            function success(data) {
                let sumTotal = 0;
                for (let receipt of data) {
                    let date = receipt._kmd.lmt.split("T");
                    let time = date[1].split(".")[0];
                    receipt.date = date[0];
                    receipt.time = time;
                    sumTotal += +receipt.total;
                }
                ctx.receipts = data;
                ctx.sumTotal = sumTotal.toFixed(2);

                ctx.username = localStorage.getItem("username");
                ctx.loadPartials({
                    header: "./templates/common/header.hbs",
                    receipt: "./templates/receipts/receipt.hbs",
                    totalForm: "./templates/forms/totalForm.hbs",
                    page: "./templates/receipts/myReceipts.hbs",
                    footer: "./templates/common/footer.hbs"
                }).then(function () {
                    this.partial("./templates/renderPage.hbs");
                });
            }
        });

        this.get("#/details/:id", function (ctx) {
            let id = ctx.params.id;
            let end = `/entries?query={"receiptId":"${id}"}`;

            requester.get(baseUrl, end)
                .then(success)
                .catch(notify.handleError);

            function success(data) {
                ctx.products = data;
                for (let product of data) {
                    product.subTotal = (+product.qty * +product.price).toFixed(2);
                    product.qty = product.qty.toFixed(2);
                    product.price = product.price.toFixed(2);
                }
                ctx.username = localStorage.getItem("username");
                ctx.loadPartials({
                    header: "./templates/common/header.hbs",
                    product: "./templates/receipts/detailsProduct.hbs",
                    page: "./templates/receipts/details.hbs",
                    footer: "./templates/common/footer.hbs"
                }).then(function () {
                    this.partial("./templates/renderPage.hbs");
                });
            }
        });

    });
    app.run();
});