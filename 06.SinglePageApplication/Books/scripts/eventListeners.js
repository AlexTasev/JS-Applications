function atachEvents() {
    $("#linkHome").on("click", displaySection);
    $("#linkLogin").on("click", displaySection);
    $("#linkRegister").on("click", displaySection);
    $("#linkListBooks").on("click", displaySection);
    $("#linkCreateBook").on("click", displaySection);
    $("#linkLogout").on("click", displaySection);

    $("#infoBox, #errorBox").click(function () {
        $(this).fadeOut(1500);
    });

    $("#formEditBook").on("submit", editBook);
    $("#formCreateBook").on("submit", createBook);
}