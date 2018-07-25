function secretKnock() {
    const username = "guest";
    const password = "guest";
    const baseUrl = "https://baas.kinvey.com/appdata/kid_BJXTsSi-e/knock";
    const loginUrl = "https://baas.kinvey.com/user/kid_BJXTsSi-e/login";
    let msg = "Knock Knock.";
    let authToken;

    let loginRequest = {
        method: "POST",
        url: loginUrl,
        headers: {
            "Authorization": "Basic " + btoa(username + ":" + password)
        },
        data: {
            username: username,
            password: password
        }
    };

    $.ajax(loginRequest).then(getAuthToken)
        .catch(handleError);


    function getAuthToken(data) {
        // console.log(data);
        authToken = data._kmd.authtoken;
        sendMessageRequest()
    }

    function sendMessageRequest() {
        if (msg) {
            $.ajax({
                method: "GET",
                url: baseUrl + "?query=" + msg,
                headers: {
                    Authorization: 'Kinvey ' + authToken
                }
            }).then(getMessage).catch(handleError)
        }
    }

    function getMessage(data) {
        msg = data.message;
        console.log(data.answer);
        if (msg) {
            console.log(msg);
        }
        sendMessageRequest()
    }

    function handleError(err) {
        console.log(err);
    }
}