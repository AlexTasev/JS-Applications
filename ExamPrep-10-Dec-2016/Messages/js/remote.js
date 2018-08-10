let requester = (function () {
    const appKey = "kid_SyfQckcrm";
    const appSecret = "ae8b0f8de4f34d24a976d38fbb6a58e5";
    const authorization = {"Authorization": "Basic " + btoa(appKey + ":" + appSecret)};

    function makeAuthorization() {
        if (localStorage.getItem("authtoken") === null) {
            return authorization;
        } else {
            return {"Authorization": "Kinvey " + localStorage.getItem("authtoken")};
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