import {indexBd, IndexBd} from "./indexBd";

class SwBuilder {
    _swKey = 'builder-v1'
    _apiKey = 'api.openbrewerydb.org'
    indexBd: IndexBd

    constructor() {
        this.indexBd = indexBd
    }

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

    async saveRequest(request: Request) {
        const clone = await request.clone();
        const data = await clone.text();

        await this.indexBd.add('requestQueue', data)
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
        function formatMarkdownLink(url): string[] {
            const parts = url.split('/');
            const id = parts[parts.length - 1];
            const path = parts[parts.length - 2];
            return [path, id];
        }

        try {
            const responseFromNetwork = await fetch(request);
            const pth = formatMarkdownLink(request.url)
            console.log(request, pth[0])
            if (responseFromNetwork) {
                const data = await responseFromNetwork.clone().json();
                await this.indexBd.add(pth[0], data)

                return responseFromNetwork;
            }
        } catch (error) {
            console.log(error, request, 2222)

            let data
            switch (request.method.toLowerCase()) {
                case 'get':
                    data = await this.indexBd.getAll('breweries')
                    break;
                default:
                    await this.saveRequest(request)
                    break;
            }

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
            console.log('dync')
            response = await this.dynamicNetworkOrBd(request, event)
        } else {
            console.log('stat')
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
