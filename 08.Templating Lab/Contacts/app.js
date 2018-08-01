$(() => {
    const templates = {};
    const phonebook = {contacts: []};
    const divList = $("#list .content");
    const divDetails = $("#details .content");
    loadData();

    async function loadData() {
        phonebook.contacts = (await $.get("data.json")).map(c => {
            c.active = false;
            return c;
        });
    }

    loadTemplates();

    async function loadTemplates() {

        const [contactSource, listSource, detailsSource] = await Promise.all([
            $.get("./templates/contacts.html"),
            $.get("./templates/contactList.html"),
            $.get("./templates/details.html")
        ]);

        Handlebars.registerPartial("contact", contactSource);
        templates.list = Handlebars.compile(listSource);
        templates.details = Handlebars.compile(detailsSource);

        renderList();
    }

    function renderList() {
        divList.html(templates.list(phonebook));
        attachEventListener();
    }

    function renderDetails(id) {
        divDetails.html(templates.details(phonebook.contacts[id]))
       console.log(phonebook.contacts[id])
    }

    function attachEventListener() {
        $(".contact").on("click", (e) => {
            let index = $(e.target).closest(".contact").attr("data-id");
            phonebook.contacts.filter(c => c.active).forEach(c => c.active = false);
            phonebook.contacts[index].active = true;
            renderDetails(index);
            renderList();
        })
    }
});