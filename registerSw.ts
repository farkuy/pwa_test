if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("/sw.ts", {scope: "/", type: 'module'})
        .then((reg) => {
            console.log("Registration succeeded. Scope is " + reg.scope);
        })
        .catch((error) => {
            console.log("Registration failed with " + error);
        });
}