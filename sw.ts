type SwKey = 'static' | 'dynamic'

class SwBuilder {
    _swKey = 'builder'
    isOnline = true

    staticFiles = {
        fonts: ['.ttf', '.eot', '.woff',],
        image: ['.svg', '.png',],
        other: ['.css', '.html', '.js']
    }

    async addResourcesToCache (resources: RequestInfo[]) {
        const cache = await caches.open(this._swKey);
        await cache.addAll(resources);
    };

    async putInCache (request, response) {
        const cache = await caches.open( this._swKey);
        await cache.put(request, response);
    };

    async networkError (title?: string, status?: number, headers?: HeadersInit) {
        return new Response(title ?? "Network error happened", {
            status: status ?? 408,
            headers: headers ?? { "Content-Type": "text/plain" },
        })
    }

    async cacheOrNetwork ({request, event}) {
        const responseFromCache = await caches.match(request);
        if (responseFromCache) {
            fetch(request)
                .then(res => event.waitUntil(this.putInCache(request, res.clone())))
            return responseFromCache;
        }

        try {
            const responseFromNetwork = await fetch(request);
            if (responseFromNetwork) {
                event.waitUntil(this.putInCache(request, responseFromNetwork.clone()));
                return responseFromNetwork;
            }
        } catch (error) {
            return this.networkError();
        }
    }

    async deleteCache (key)  {
        await caches.delete(key);
    };

    async deleteOldCaches () {
        const keyList = await caches.keys();
        const cachesToDelete = keyList.filter((key) => key != this._swKey);
        await Promise.all(cachesToDelete.map(this.deleteCache));
    };

    setOnline(online: boolean) {
        this.isOnline = online
    }
}

const swBuilder = new SwBuilder()

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'NETWORK_STATUS') {
        console.log('online', event.data)
        swBuilder.setOnline(event.data.online);
    }
});

self.addEventListener("activate", (event) => {
    event.waitUntil(swBuilder.deleteOldCaches());
});

self.addEventListener("install", (event) => {
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
        swBuilder.cacheOrNetwork({
            request: event.request,
            event,
        }),
    );
});