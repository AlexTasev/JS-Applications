$(() => {
    //CONSTS
    const baseUrl = "https://baas.kinvey.com/appdata/";
    const userUrl = "https://baas.kinvey.com/user/";
    const appKey = "kid_BJvEduGrX";
    const appSecret = "33439ddf9cf44ef6b15bc73a08b5a5c7";
    const authorization = {"Authorization": "Basic " + btoa(appKey + ":" + appSecret)};

    //VARIABLES
    let authToken;
    let profile = $("#profile");
    let allReceiptsView = $("#all-receipt-view");
    let receiptDetailsView = $("#receipt-details-view");
    let inputID = $("input[name='receiptId']");
    let inputCount = $("input[name='productCount']");
    let inputTotal = $("input[name='total']");

    navigationBar();

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

    //EVENTS
    $("#register-form").on("submit", registerUser);
    $("#login-form").on("submit", loginUser);
    profile.find(".logout").on("click", logoutUser);
    profile.find("li:first-child").on("click", editor);
    profile.find("li:eq(1)").on("click", showAllReceipts);
    $("#create-entry-form").on("submit", addItem);
    $("#create-receipt-form").on("submit", checkOutReceipt);

    $("#infoBox, #errorBox").on("click", function () {
        $(this).fadeOut();
    });
    $(document).on({
        ajaxStart: function () {
            $("#loadingBox").show();
        },
        ajaxStop: function () {
            $("#loadingBox").hide();
        }
    });

    function navigationBar() {
        authToken = localStorage.getItem("authToken");

        if (authToken === null) {
            $("#container").show();
            $("section").hide();
            profile.hide();
            $("#welcome-section").show();
        } else {
            $("#container").show();
            $("section").hide();
            profile.show();
            $("#cashier").find("a").text(localStorage.getItem("username"))
        }
    }

    //CRUD
    async function editor() {
        let id = localStorage.getItem("userId");
        let end = `/receipts/?query={"_acl.creator":"${id}","active":true}`;

        try {
            let response = await requester.get(baseUrl, end);
            navigationBar();
            if (response.length === 0) {
                let data = {active: true};
                response = await requester.post(baseUrl, data, "/receipts");
                localStorage.setItem("receiptId", response._id);
            } else {
                localStorage.setItem("receiptId", response[0]._id);
            }
            renderItems();
        } catch (e) {
            handleError(e);
        }
    }

    async function addItem(e) {
        e.preventDefault();

        let type = $("input[name='type']").val();
        let qty = +$("input[name='qty']").val();
        let price = +$("input[name='price']").val();

        if (!type) {
            showError("The input fields can not be empty");
            return;
        }
        if (typeof qty !== "number" || !qty) {
            showError("Quantity must be a number!");
            return;
        }
        if (typeof price !== "number" || !price) {
            showError("Price must be a number!");
            return;
        }

        let data = {
            receiptId: localStorage.getItem("receiptId"),
            price: +price,
            type: type,
            qty: +qty
        };

        try {
            let response = await requester.post(baseUrl, data, "/entries");
            $("#create-entry-form").trigger("reset");
            showInfo("Entry added");
            renderItems();
        } catch (e) {
            handleError(e);
        }
    }

    async function renderItems() {
        let id = localStorage.getItem("receiptId");
        let end = `/entries/?query={"receiptId":"${id}"}`;

        try {
            let response = await requester.get(baseUrl, end);
            $("#create-receipt-view").show();
            let div = $("#active-entries");
            div.empty();
            let total = 0;
            let quantity = 0;
            for (let obj of response) {
                div.append($("<div>").addClass("row")
                    .append($(`<div>${obj.type}</div>`).addClass("col wide"))
                    .append($(`<div>${obj.qty}</div>`).addClass("col wide"))
                    .append($(`<div>${obj.price.toFixed(2)}</div>`).addClass("col wide"))
                    .append($(`<div>${(obj.qty * obj.price).toFixed(2)}</div>`).addClass("col"))
                    .append($("<div>").addClass("col right")
                        .append($("<a href='#'>&#10006;</a>")
                            .on("click", () => deleteItem(obj._id)))));
                total += obj.qty * obj.price;
                quantity += obj.qty;
            }
            $("#create-receipt-form").find(".right").next().text(total.toFixed(2));

            inputID.attr("id", id);
            inputCount.attr("id", quantity);
            inputTotal.attr("id", total);

        } catch (e) {
            handleError(e);
        }
    }

    async function deleteItem(id) {

        try {
            let response = await requester.remove(baseUrl, "/entries/" + id);
            showInfo("Entry removed");
            renderItems();
        } catch (e) {
            handleError(e);
        }

    }

    async function checkOutReceipt() {
        if (+inputCount[0].id < 1) {
            showError("A receipt must have at least one product");
            return;
        }

        let id = inputID[0].id;
        let end = `/receipts/${id}`;
        let data = {
            total: +inputTotal[0].id,
            productCount: +inputCount[0].id,
            active: false
        };

        try {
            await requester.put(baseUrl, data, end);
            showInfo("Receipt checked out");
            editor();
        } catch (e) {
            handleError(e)
        }
    }

    async function showAllReceipts() {
        let id = localStorage.getItem("userId");
        let end = `/receipts/?query={"_acl.creator":"${id}","active":false}`;
        let table = allReceiptsView.find(".table");
        let rows = allReceiptsView.find(".table > div").slice(1);
        rows.empty();

        try {
            let response = await requester.get(baseUrl, end);
            navigationBar();

            for (let obj of response) {
                let date = obj._kmd.ect.split("T");
                let hours = date[1].split(".");

                table.append($("<div>").addClass("row")
                    .append($(`<div>${date[0] + " " + (hours[0]).substring(0, 5)}</div>`).addClass("col wide"))
                    .append($(`<div>${obj.productCount}</div>`).addClass("col wide"))
                    .append($(`<div>${obj.total.toFixed(2)}</div>`).addClass("col"))
                    .append($("<div>").addClass("col")
                        .append($("<a href='#'>Details</a>")
                            .on("click", () => detailsReceipt(obj._id)))))
            }
            allReceiptsView.show()

        } catch (e) {
            handleError(e);
        }
    }

    async function detailsReceipt(id) {
        let end = `/entries/?query={"receiptId":"${id}"}`;
        let table = receiptDetailsView.find(".table");
        let rows = receiptDetailsView.find(".table > div").slice(1);
        rows.empty();

        try {
            let response = await requester.get(baseUrl, end);
            console.log(response)
            navigationBar();

            for (let obj of response) {
                table.append($("<div>").addClass("row")
                    .append($(`<div>${obj.type}</div>`).addClass("col wide"))
                    .append($(`<div>${obj.qty}</div>`).addClass("col wide"))
                    .append($(`<div>${obj.price.toFixed(2)}</div>`).addClass("col wide"))
                    .append($(`<div>${(obj.qty * obj.price).toFixed(2)}</div>`).addClass("col")));
            }
            receiptDetailsView.show();
        }catch (e) {
            handleError(e)
        }
    }

    // USERS
    async function registerUser(e) {
        e.preventDefault();
        let form = $("#register-form");
        let username = $("#username-register").val();
        let password = $("#password-register").val();
        let passwordCheck = $("#password-register-check").val();

        if (!password || !passwordCheck || !username) {
            showError("The fields can not be empty");
            return;
        }

        if (username.length < 5) {
            showError("Invalid username! It must be at least 5 characters long.");
            return
        }

        if (password !== passwordCheck) {
            showError("Your password and confirm password do not match");
            return;
        }
        let data = {username: username, password: password};

        try {
            let response = await requester.post(userUrl, data, "");
            form.trigger("reset");
            saveLocalStorageSession(response);
            showInfo("User registration successful.");
            navigationBar(handleError);
        } catch (e) {
            handleError(e)
        }
    }

    async function loginUser(e) {
        e.preventDefault();
        let form = $("#login-form");
        let username = $("#username-login").val();
        let password = $("#password-login").val();

        if (!password || !username) {
            showError("The fields can not be empty");
            return;
        }

        if (username.length < 5) {
            showError("Invalid username! It must be at least 5 characters long.");
            return
        }

        let data = {username: username, password: password};

        try {
            let response = await requester.post(userUrl, data, "/login");
            form.trigger("reset");
            saveLocalStorageSession(response);
            showInfo("Login successful.");
            navigationBar(handleError);
        } catch (e) {
            handleError(e)
        }
    }

    async function logoutUser() {
        try {
            let response = await requester.post(userUrl, {}, "/_logout");
            localStorage.clear();
            showInfo("Logout successful.");
            navigationBar();
            $(".welcome-text").hide();
            $(".welcome-rigister-form").hide();
        } catch (e) {
            handleError(e)
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