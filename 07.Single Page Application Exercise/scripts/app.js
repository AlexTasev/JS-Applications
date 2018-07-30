function startApp() {
    const baseUrl = "https://baas.kinvey.com/appdata/";
    const userUrl = "https://baas.kinvey.com/user/";
    const appKey = "kid_By5i2BKV7";
    const appSecret = "e2294d3710654bf8b10f9566f4a5cd80";
    const authorization = {"Authorization": "Basic " + btoa(appKey + ":" + appSecret)};
    //let kinveyAuth = {"Authorization": "Kinvey " + localStorage.getItem("authToken")};
    let authToken;

    navigationMenu();
    showView("viewHome");

//Event Listeners
    $("#linkHome").on("click", showHomeView);
    $("#linkLogin").on("click", showLoginView);
    $("#linkRegister").on("click", showRegisterView);
    $("#linkListAds").on("click", showViewAds);
    $("#linkCreateAd").on("click", showCreateAdView);
    $("#linkLogout").on("click", logout);

    $("#buttonRegisterUser").click(register);
    $("#buttonLoginUser").click(login);
    $("#buttonCreateAd").click(() => createAndEdit("create"));
    $("#buttonEditAd").click(() => createAndEdit("edit"));

    $("#dropDown").on("change", sortByCriteria);

    $('#infoBox, #errorBox').click(function () {
        $(this).fadeOut();
    });

    $(document).on({
        ajaxStart: function () {
            $('#loadingBox').show();
        },
        ajaxStop: function () {
            $('#loadingBox').hide();
        }
    });

    function navigationMenu() {
        authToken = localStorage.getItem("authToken");

        if (authToken === null) {
            $("#linkHome").show();
            $("#linkLogin").show();
            $("#linkRegister").show();
            $("#linkListAds").hide();
            $("#linkCreateAd").hide();
            $("#linkLogout").hide();

            $("#loggedInUser").hide().text("");
        } else {
            $("#linkHome").show();
            $("#linkLogin").hide();
            $("#linkRegister").hide();
            $("#linkListAds").show();
            $("#linkCreateAd").show();
            $("#linkLogout").show();

            $("#loggedInUser").show().text("Welcome, " + localStorage.getItem("username"));
        }
    }

    function showView(view) {
        $("main > section").hide();
        $("#" + view).show();
    }

    function showHomeView() {
        showView("viewHome");
    }

    function showLoginView() {
        showView("viewLogin");
        $("#formLogin").trigger("reset");
    }

    function showRegisterView() {
        showView("viewRegister");
        $("#formRegister").trigger("reset");
    }

    function showViewAds(criteria) {
        showView("viewAds");
        let table = $("#ads table").find("tbody");
        let rows = table.find("tr").slice(1);
        rows.remove();
        listAdds(table, criteria);
    }

    function showCreateAdView() {
        showView("viewCreateAd");
        $("#formCreateAd").trigger("reset");
    }

    function getReadyForEdit(product) {
        showView("viewEditAd");
        let form = $("#formEditAd");
        form.find("input[name='id']").val(product._id);
        form.find("input[name='title']").val(product.title);
        form.find("textarea[name='description']").val(product.description);
        form.find("input[name='datePublished']").val(product.datePublished);
        form.find("input[name='price']").val(product.price);
        form.find("input[name='image']").val(product.image);
    }

    function displayReadMorePage(data) {
        showView("viewReadMore");
        $('#viewReadMore').html($('<div>').append(
            $('<img>').attr('src', data.image),
            $('<br>'),
            $('<label>').text('Title:'),
            $('<h1>').text(data.title),
            $('<label>').text('Description:'),
            $('<p>').text(data.description),
            $('<label>').text('Publisher:'),
            $('<div>').text(data.publisher),
            $('<label>').text('Date:'),
            $('<div>').text(data.datePublished)
        ));
    }

    //CRUD Operations
    function listAdds(table, criteria) {
        let url = baseUrl + appKey + "/products";
        if (typeof criteria === "string") {
            url = baseUrl + appKey + "/products/" + criteria;
        }

        $.ajax({
            url: url,
            headers: {"Authorization": "Kinvey " + localStorage.getItem("authToken")}
        }).then(appendAdds)
            .catch(showErrorMessage);

        function appendAdds(data) {
            if (data.length === 0) {
                showInfoMessage("No available ads")
            } else {
                for (let product of data) {
                    let tr = $("<tr>");
                    tr.append(`<td>${product.title}</td>`)
                        .append(`<td>${product.publisher}</td>`);

                    let stars = Number(product.rating);
                    appendStarRating(tr, stars);

                    tr.append(`<td>${product.description}</td>`)
                        .append(`<td>$${product.price.toFixed(2)}</td>`)
                        .append(`<td>${product.datePublished}</td>`)
                        .append(`<td></td>`);

                    appendActions(product, tr);
                    table.append(tr)
                }
            }
        }

        function appendActions(product, tr) {
            let td = tr.find("td").slice(-1);

            if (product._acl.creator === localStorage.getItem("userId")) {

                td.append($("<button>&#9998;</button>")
                    .addClass("myButtons")
                    .hover(function () {
                        $(this).attr("title", "Edit");
                    })
                    .on("click", () => getReadyForEdit(product)));

                td.append($("<button>&#10006</button>")
                    .addClass("myButtons")
                    .hover(function () {
                        $(this).attr("title", "Delete");
                    })
                    .on("click", () => deleteAd(product)));
            } else {

                td.append($("<button>&#10148;</button>")
                    .addClass("myButtons")
                    .hover(function () {
                        $(this).attr("title", "Read More");
                    })
                    .on("click", () => displayReadMorePage(product)));

                td.append($("<button>&#10084;</button>")
                    .addClass("myButtons")
                    .hover(function () {
                        $(this).attr("title", "Add To Favorites");
                    })
                    .on("click", () => console.log("mobile")));

                td.append($("<button>&#9993;</button>")
                    .addClass("myButtons")
                    .hover(function () {
                        $(this).attr("title", "Contacts");
                    })
                    .on("click", () => console.log("email")));
            }
        }

        function appendStarRating(tr, stars) {
            tr.append("<td>");

            if (stars === 0) {
                tr.find("td").slice(-1)
                    .append($("<span>")
                        .addClass("fa fa-star")
                        .hover(function () {
                            $(this).attr("title", "No Rating Available");
                        }));
            } else {
                for (let i = 0; i < stars; i++) {
                    tr.find("td").slice(-1)
                        .append($("<span>")
                            .addClass("fa fa-star checked")
                            .hover(function () {
                                $(this).attr("title", `Rating: ${stars}/3`);
                            }));
                }
            }
        }
    }

    function createAndEdit(crud) {
        let form, url, method;

        if (crud === "create") {
            method = "POST";
            form = $("#formCreateAd");
            url = baseUrl + appKey + "/products";
        } else {
            method = "PUT";
            form = $("#formEditAd");
            let id = form.find("input[name='id']").val();
            url = baseUrl + appKey + "/products/" + id;
            console.log(url)
        }

        let title = form.find("input[name='title']").val();
        let description = form.find("textarea[name='description']").val();
        let date = form.find("input[name='datePublished']").val();
        let price = form.find("input[name='price']").val();
        let image = form.find("input[name='image']").val();

        if (!title) {
            showErrorMessage("You must enter a product");
            return;
        }
        if (!date) {
            showErrorMessage("You must choose a date");
            return;
        }
        if (Number.isNaN(price) || !price) {
            showErrorMessage("The price field is invalid");
            return;
        }

        let request = {
            method: method,
            url: url,
            headers: {"Authorization": "Kinvey " + localStorage.getItem("authToken")},
            contentType: "application/json",
            data: JSON.stringify({
                title: title,
                description: description,
                publisher: localStorage.getItem("username"),
                datePublished: date,
                price: parseFloat(price),
                rating: Number(localStorage.getItem("userRating")),
                image: image
            })
        };

        $.ajax(request)
            .then(successes)
            .catch(showErrorMessage);


        function successes() {
            showViewAds();
            let msg = crud === "create" ? "New add created" : "Your ad has been edited";
            showInfoMessage(msg);
        }
    }

    function deleteAd(product) {
        let request = {
            method: "DELETE",
            url: baseUrl + appKey + "/products/" + product._id,
            headers: {"Authorization": "Kinvey " + localStorage.getItem("authToken")},
        };

        $.ajax(request)
            .then(deletedSuccessful)
            .catch(showErrorMessage);

        function deletedSuccessful() {
            showInfoMessage("Ad has been deleted successful");
            showViewAds();
        }
    }

    function sortByCriteria() {
        let criteria = $("#dropDown option:selected").text();

        let sortMethod;
        switch (criteria) {
            case "Price: Low to High":
                sortMethod = "?query={}&sort={\"price\": 1}";
                break;
            case "Price: High to Low":
                sortMethod = "?query={}&sort={\"price\": -1}";
                break;
            case "Date: Newest Arrivals":
                sortMethod = "?query={}&sort={\"datePublished\": -1}";
                break;
            case "Date: Oldest Ads":
                sortMethod = "?query={}&sort={\"datePublished\": 1}";
                break;
            case "User Rating: High to Low":
                sortMethod = "?query={}&sort={\"rating\": -1}";
                break;
            case "Order By":
                return;
        }

        showViewAds(sortMethod)
    }

//Users
    function register() {
        let form = $("#formRegister");

        let username = form.find("input[name='username']").val();
        let password = form.find("input[name='passwd']").val();
        let confirmPass = form.find("input[name='passwdTwo']").val();

        if (!password || !confirmPass || !username) {
            showErrorMessage("The fields can not be empty");
            return;
        }
        if (password !== confirmPass) {
            showErrorMessage("Passwords do not match");
            return;
        }

        let stars = getRandomNumber(4);

        let request = {
            method: "POST",
            url: userUrl + appKey,
            headers: authorization,
            data: {
                username: username,
                password: password,
                rating: Number(stars)
            }
        };

        $.ajax(request)
            .then(registeredUser)
            .catch(showErrorMessage);

        function registeredUser(data) {
            saveSessionTokens(data);
            navigationMenu();
            showInfoMessage("Registration successful");
            showViewAds();
        }

        function getRandomNumber(max) {
            return Math.floor(Math.random() * Math.floor(max));
        }

    }

    function login() {
        let form = $("#formLogin");

        let username = form.find("input[name='username']").val();
        let password = form.find("input[name='passwd']").val();

        if (!password || !username) {
            showErrorMessage("The fields can not be empty");
            return;
        }

        let request = {
            method: "POST",
            url: userUrl + appKey + "/login",
            headers: authorization,
            data: {
                username: username,
                password: password
            }
        };

        $.ajax(request)
            .then(loggedInUser)
            .catch(() => showErrorMessage("Wrong username or password"));

        function loggedInUser(data) {
            saveSessionTokens(data);
            navigationMenu();
            showViewAds();
            showInfoMessage("Logged In");
        }
    }

    function logout() {
        let request = {
            method: "POST",
            url: userUrl + appKey + "/_logout",
            headers: {"Authorization": "Kinvey " + localStorage.getItem("authToken")}
        };
        $.ajax(request).then(loggedOut).catch(showErrorMessage);

        function loggedOut() {
            localStorage.clear();
            navigationMenu();
            showInfoMessage("Logged Out");
            showLoginView();
        }
    }

    function saveSessionTokens(data) {
        localStorage.setItem("authToken", data._kmd.authtoken);
        localStorage.setItem("userId", data._id);
        localStorage.setItem("username", data.username);
        localStorage.setItem("userRating", data.rating);
    }

// Notifications
    function showInfoMessage(msg) {
        $("#infoBox").show();
        $("#infoBox").text(msg);

        setTimeout(() => $("#infoBox").hide(), 3000);
    }

    function showErrorMessage(err) {
        $("#errorBox").text("Error: " + err);
        $("#errorBox").show();
    }
}