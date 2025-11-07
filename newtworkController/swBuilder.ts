import {IndexBd} from "./indexBd";

class SwBuilder extends IndexBd{
    _swKey = 'builder-v1'
    _apiKey = 'api.openbrewerydb.org'

    async addResourcesToCache (resources: RequestInfo[]) {
        const cache = await caches.open(this._swKey);
        await cache.addAll(resources);
    };

    async putInCache (request, response) {
        const cache = await caches.open(this._swKey);
        await cache.put(request, response);
    };

    async networkError (title?: string, status?: number, headers?: HeadersInit): Promise<Response> {
        return new Response(title ?? "Network error happened 666", {
            status: status ?? 408,
            headers: headers ?? { "Content-Type": "text/plain" },
        })
    }

    async staticCacheOrNetwork (request: Request, event): Promise<Response> {
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

    async dynamicNetworkOrBd(request: Request, event): Promise<Response> {
        try {
            const responseFromNetwork = await fetch(request);
            console.log(request)
            if (responseFromNetwork) {
                const data = await responseFromNetwork.clone().json();
                await this.add("breweries", data)

                return responseFromNetwork;
            }
        } catch (error) {
            const data = this.get("breweries", 'b54b16e1-ac3b-4bff-a11f-f7ae9ddc27e0')

            if (data) {
                return new Response(JSON.stringify(data),{
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                        'X-Cache': "IndexedDB"
                    }
                })
            }

            return this.networkError();
        }
    }


    async networkWrapper(request, event): Promise<Response> {
        const path = new URL(request.url);
        let response: Response

        if (path.hostname.includes(this._apiKey)) {
            response = await this.dynamicNetworkOrBd(request, event)
        } else {
            response = await this.staticCacheOrNetwork(request, event)
        }

        return response
    }

    async deleteCache (key): Promise<void>  {
        await caches.delete(key);
    };

    async deleteOldCaches (): Promise<void> {
        const keyList = await caches.keys();
        const cachesToDelete = keyList.filter((key) => key != this._swKey);
        await Promise.all(cachesToDelete.map(this.deleteCache));
    };

}

export const swBuilder = new SwBuilder()
