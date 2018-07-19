function attachEvents() {
    let baseUrl = `https://messenger-9668a.firebaseio.com/messenger`;
    let textArea = $("#messages");
    let author = $("#author");
    let content = $("#content");

    loadMessages();

    $("#submit").click(postNewMessage);
    $("#refresh").click(loadMessages);

    function postNewMessage() {
        if (author.val().length === 0 || content.val().length === 0) {
            return;
        }
        let msg = {author: author.val(), content: content.val(), timestamp: Date.now()};
        let req = {
            method: "POST",
            url: baseUrl + ".json",
            data: JSON.stringify(msg),
            success: () => {
                author.val("");
                content.val("");
            },
            error: handleError
        };
        $.ajax(req);
    }

    function loadMessages() {
        let req = {
            method: "GET",
            url: baseUrl + ".json",
            success: displayMsg,
            error: handleError
        };
        $.ajax(req)
    }

    function displayMsg(data) {
        let text = "";
        let sortedIds = Object.keys(data).sort((a, b) => sortByDate(a, b, data));
        for (let id of sortedIds) {
            text += data[id].author + ": " + data[id].content + "\n";
        }
        textArea.text(text);
    }

    function handleError(err) {
        console.log(err);
    }

    function sortByDate(obj1, obj2, data) {
        let timeOne = data[obj1].timestamp;
        let timeTwo = data[obj2].timestamp;

        return timeOne - timeTwo;
    }
}