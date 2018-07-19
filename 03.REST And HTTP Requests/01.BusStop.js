function getInfo() {
    let id = $("#stopId").val();
    let stopName = $("#stopName");
    let list = $("#buses");

    let req = {
        method: "GET",
        url: `https://judgetests.firebaseio.com/businfo/${id}.json`,
        success: appendBusses,
        error: handleError
    };
    $.ajax(req);

    function appendBusses(data) {
        stopName.text(data.name);
        list.empty();
        for (let bus in data.buses) {
            list.append($(`<li>Bus ${bus} arrives in ${data.buses[bus]} minutes</li>`));
        }
    }

    function handleError(err) {
        stopName.text("Error");
        list.empty();
        console.log(err.statusText)
    }
}