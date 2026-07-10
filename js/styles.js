(() => {
    const token = sessionStorage.getItem("token");

    if (!token) {
        window.location.replace("../index.html"); // Change path if needed
        return;
    }

    fetch("/api/verify", {
        headers: {
            Authorization: "Bearer " + token
        }
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) {
            sessionStorage.clear();
            window.location.replace("../index.html");
        }
    })
    .catch(() => {
        sessionStorage.clear();
        window.location.replace("../index.html");
    });
})();
