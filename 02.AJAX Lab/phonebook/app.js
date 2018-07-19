$(() => {
    let list = $("#phonebook");
    let baseUrl = "https://phonebook-app-18bb4.firebaseio.com/phonebook";
    let name = $("#person");
    let phone = $("#phone");
    loadContacts();

    function loadContacts() {
        list.empty();
        let request = {
            url: baseUrl + ".json",
            method: "GET",
            success: successFunc,
            error: handleError
        };
        $.ajax(request);
    }

    $("#btnCreate").click(createElement);

    function createElement() {
        let contact = {name: name.val(), phone: phone.val()};
        if (name.val().length === 0 || phone.val().length === 0) {
            return;
        }
        let request = {
            url: baseUrl + ".json",
            method: "POST",
            data: JSON.stringify(contact),
            success: loadContacts,
            error: handleError
        };
        $.ajax(request);
        name.val("");
        phone.val("");
    }

    function successFunc(contacts) {
        for (let user in contacts) {
            list.append($(`<li>${contacts[user].name}: ${contacts[user].phone}</li>`)
                .append($("<button id='dltBtn'>Delete</button>").click(() => deleteContact(user))));
        }
    }

    function handleError(err) {
      console.log(err)
    }

    function deleteContact(id) {
        let req = {
            url: `${baseUrl}/${id}.json`,
            method: "DELETE",
            success: loadContacts,
            error: handleError
        };
        $.ajax(req);
    }
});

