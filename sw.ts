import {swBuilder} from "./newtworkController/swBuilder";

self.addEventListener("activate", (event) => {
    event.waitUntil(swBuilder.deleteOldCaches());
});

self.addEventListener("install", async (event) => {
    await swBuilder.openBd()
    event.waitUntil(
        swBuilder.addResourcesToCache([
            "./index.html",
            "./src/index.css",
            "./src/App.css",
            "./src/assets/react.svg"
        ])
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        swBuilder.networkWrapper(event.request, event),
    );
});