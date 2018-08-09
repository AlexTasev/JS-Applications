let requester = (function () {
    const appKey = "kid_B1fKbeBr7";
    const appSecret = "d666ef6364124b4f9959599fa7d90063";
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
