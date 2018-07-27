const baseUrl = "https://baas.kinvey.com/appdata/";
const appKey = "kid_SkxHQEv4Q";
const appSecret = "cfe5ce60f56b43409cc81e4dc60b3929";
const userUrl = "https://baas.kinvey.com/user/";
const authorization = {"Authorization": "Basic " + btoa(appKey + ":" + appSecret)};
let authToken = null;
let username = undefined;

$("#viewHome").show();

//Navigation
function displaySection() {
    let formLogin = $("#formLogin");
    let formRegister = $("#formRegister");
    loadingMessage();
    hideAll();

    let section = $(this).text();

    switch (section) {
        case "Home":
            $("#viewHome").show();
            break;
        case "Login":
            $("#viewLogin").show();
            loginAndRegister(formLogin);
            break;
        case "Register":
            $("#viewRegister").show();
            loginAndRegister(formRegister);
            break;
        case "List Books":
            $("#viewBooks").show();
            displayAllBooks();
            break;
        case "Create Book":
            $("#viewCreateBook").show();
            break;
        case "Logout":
            logout();
            break;
    }
}

function hideAll() {
    $("#viewHome").hide();
    $("#viewLogin").hide();
    $("#viewRegister").hide();
    $("#viewBooks").hide();
    $("#viewCreateBook").hide();
    $("#viewEditBook").hide();
}

function showHideSections() {
    authToken = localStorage.getItem("authtoken");
    let loggedInUser = $("#loggedInUser");

    if (authToken === null) {
        $("#linkHome").show();
        $("#linkLogin").show();
        $("#linkRegister").show();
        $("#linkListBooks").hide();
        $("#linkCreateBook").hide();
        $("#linkLogout").hide();
        $("#viewEditBook").hide();
        loggedInUser.text("");
        $("#viewHome").show();

    } else {
        $("#linkLogin").hide();
        $("#linkRegister").hide();
        $("#viewEditBook").hide();
        $("#linkHome").show();
        $("#linkListBooks").show();
        $("#linkCreateBook").show();
        $("#linkLogout").show();
        $("#viewHome").show();

        username = localStorage.getItem("username");
        loggedInUser.text(`Welcome, ${username}!`);
        $("#linkListBooks").click();
    }


}

// CRUD Operations
function displayAllBooks() {
    sendBooksRequest("GET")
        .then(handleBooksData)
        .catch(handleError);
}

function handleBooksData(data) {
    let table = $("table").find("#bodywe");
    table.empty();

    for (let row of data) {
        let buttons = row._acl.creator;
        let tr = $(`<tr id=${row._id}>`)
            .append($("<td>").text(`${row.title}`))
            .append($("<td>").text(`${row.author}`))
            .append($("<td>").text(`${row.description}`))
            .append($("<td>"));

        if (buttons === localStorage.getItem("userId")) {
            tr.find("td:last-child").append($("<button>&#9997;</button>").on("click", function () {
                bookToEdit(row)
            }))
                .append($("<button>&#10006;</button>").on("click", function () {
                    alert("Are you sure?");
                    deleteBook($(this).parent().parent());
                }));
        }
        tr.appendTo(table);
    }

    function bookToEdit(book) {
        hideAll();
        let editView = $("#viewEditBook");
        let formEditBook = $("#formEditBook");
        editView.show();

        let id = book._id;
        let title = book.title;
        let author = book.author;
        let description = book.description;

        formEditBook.find("input[name='title']").val(title);
        formEditBook.find("input[name='author']").val(author);
        formEditBook.find("textarea[name='description']").val(description);
        formEditBook.find("input[name='id']").val(id);
    }
}

function createBook(e) {
    e.preventDefault();
    let title = $("#formCreateBook").find("input[name='title']");
    let author = $("#formCreateBook").find("input[name='author']");
    let description = $("#formCreateBook").find("textarea[name='description']");

    let body = {
        title: title.val(),
        author: author.val(),
        description: description.val()
    };

    sendBooksRequest("POST", body)
        .then(function () {
            infoMessage("The book has been created.");
            showHideSections();
            title.val("");
            author.val("");
            description.val("");
        }).catch(handleError);
}

function editBook(e) {
    e.preventDefault();
    let body = {
        title: $("#formEditBook").find("input[name='title']").val(),
        author: $("#formEditBook").find("input[name='author']").val(),
        description: $("#formEditBook").find("textarea[name='description']").val(),
    };

    let bookID = $("#formEditBook").find("input[name='id']").val();

    editDeleteRequest("PUT", bookID, body)
        .then(function () {
            showHideSections();
            infoMessage("Book has been edited");
        })
        .catch(handleError)
}

function deleteBook(book) {
    let id = book.prop("id");
    editDeleteRequest("DELETE", id,)
        .then(function () {
            showHideSections();
            infoMessage("Deleted!")
        })
        .catch(handleError);
}

function sendBooksRequest(method, body) {
    return $.ajax({
        method: method,
        url: baseUrl + appKey + "/books",
        headers: {Authorization: 'Kinvey ' + localStorage.getItem('authtoken')},
        contentType: 'application/json',
        data: JSON.stringify(body)
    });
}

function editDeleteRequest(method, id, body) {
    return $.ajax({
        method: method,
        url: baseUrl + appKey + "/books/" + id,
        headers: {Authorization: 'Kinvey ' + localStorage.getItem('authtoken')},
        contentType: "application/json",
        data: JSON.stringify(body)
    });
}

//User Session
function loginAndRegister(form) {
    let login = form.find("input[type='submit']").val();
    if (login !== "Login") {
        login = undefined;
    } else {
        login = "/login";
    }

    form.on("submit", function (e) {
        e.preventDefault();
        let username = form.find("input[name='username']").val();
        let password = form.find("input[name='passwd']").val();

        sendUserRequest(username, password, login)
            .then(function (res) {
                handleUserData(res);
                infoMessage("Logged in");
            })
            .catch(handleError)
    });
}

function handleUserData(data) {
    localStorage.setItem("authtoken", data._kmd.authtoken);
    localStorage.setItem("userId", data._acl.creator);
    localStorage.setItem("username", data.username);
    authToken = localStorage.getItem("authtoken");
    loadingMessage();
    let msg = "Logged In";
    showHideSections(msg);
}

function sendUserRequest(username, password, login) {
    let url = userUrl + appKey;
    if (login) {
        url += login;
    }
    return $.ajax({
        method: "POST",
        url: url,
        headers: authorization,
        contentType: 'application/json',
        data: JSON.stringify({username: username, password: password})
    });
}

function logout() {
    $.ajax({
        method: "POST",
        url: userUrl + appKey + "/_logout",
        headers: {Authorization: 'Kinvey ' + localStorage.getItem('authtoken')}
    }).then(function (err) {
        localStorage.clear();
        showHideSections();
        infoMessage("Logged Out")
    }).catch(handleError);

}

//Notifications
function handleError(err) {
    let errorBox = $("#errorBox");
    errorBox.show();
    errorBox.text("Error: " + err.responseJSON.description)
}

function loadingMessage() {
    $(document).on({
        ajaxStart: () => $("#loadingBox").show(),
        ajaxStop: () => $("#loadingBox").hide()
    });
}

function infoMessage(message) {
    let infoBox = $('#infoBox')
    infoBox.text(message)
    infoBox.show()
    setTimeout(function () {
        $('#infoBox').fadeOut()
    }, 3000)
}
