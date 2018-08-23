let notify = (() => {

    $(document).on({
        ajaxStart: function () {
            $("#loadingBox").show();
        },
        ajaxStop: function () {
            $("#loadingBox").hide();
        }
    });

    $("#infoBox, #errorBox").on("click", function () {
        $(this).fadeOut();
    });

    function handleError(err) {
        let errorMsg = err.status + " " + err.statusText;
        if (err.responseJSON && err.responseJSON.description) {
            errorMsg += "! " + err.responseJSON.description;
        }
        showError(errorMsg);
    }

    function showInfo(info) {
        let box = $("#infoBox");
        box.show();
        box.find("span").text(info);
        box.on("click", function () {
            $(this).fadeOut();
        });

        setTimeout(() => box.hide(), 3000);
    }

    function showError(err) {
        let box = $("#errorBox");
        box.on("click", function () {
            $(this).fadeOut();
        });
        box.show();
        box.find("span").text(err);
    }

    return {
        showInfo,
        showError,
        handleError
    }
})();