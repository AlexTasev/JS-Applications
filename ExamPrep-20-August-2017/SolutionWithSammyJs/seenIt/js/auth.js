let auth = (() => {
    function isAuth() {
        return localStorage.getItem('authtoken') !== null;
    }

    function saveSession(userData) {
        localStorage.setItem('authtoken', userData._kmd.authtoken);
        localStorage.setItem('username', userData.username);
        localStorage.setItem('userId', userData._id);
    }

    return {isAuth, saveSession}

})();