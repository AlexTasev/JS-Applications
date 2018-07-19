function solve() {
    let currentStop = "";
    let nextStopId = "depot";
    const baseUrl = `https://judgetests.firebaseio.com/schedule/`;
    let departBtn = $("#depart");
    let arriveBtn = $("#arrive");

    function depart() {
        departBtn.prop("disabled", true);
        arriveBtn.prop("disabled", false);

        let req = {
            method: "GET",
            url: baseUrl + "/" + nextStopId + ".json",
            success: nextStopResult,
            error: handleError
        };
        $.ajax(req)
    }

    function arrive() {
        departBtn.prop("disabled", false);
        arriveBtn.prop("disabled", true);
        $("span").text(`Arriving at ${currentStop}`);
    }

    function nextStopResult(stop) {
        currentStop = stop.name;
        $("span").text(`Next stop ${currentStop}`);
        nextStopId = stop.next;
    }

    function handleError() {
        departBtn.prop("disabled", true);
        arriveBtn.prop("disabled", true);
        $("span").text(`Error`);
    }

    return {depart, arrive};
}

let result = solve();