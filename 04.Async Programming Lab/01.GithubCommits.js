function loadCommits() {
    let username = $("#username").val();
    let repo = $("#repo").val();
    let list = $("#commits");

    $.get(`https://api.github.com/repos/${username}/${repo}/commits`)
        .then(printCommits)
        .catch(handleError);

    function printCommits(commits) {
        list.empty();
        for (let obj of commits) {
            list.append($(`<li>${obj.commit.author.name}: ${obj.commit.message}</li>`))
        }
    }
    function handleError(err) {
        list.empty();
        list.append($(`<li>Error: ${err.status} (${err.statusText})</li>`));
    }
}