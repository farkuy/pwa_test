export class IndexBd {
    storeName = 'store'
    version = 1
    bd: IDBDatabase

    openBd() {
        let openRequest = indexedDB.open(this.storeName, this.version)

        openRequest.onupgradeneeded = function() {
            let db = openRequest.result;
            if (!db.objectStoreNames.contains('breweries')) {
                db.createObjectStore('breweries', {keyPath: 'id'});
            }
        };

        openRequest.onerror = function() {
            console.error("Error", openRequest.error);
        };

        openRequest.onsuccess = () => {
            this.bd = openRequest.result;
        }
    }

    async addBdData(data: any) {
        let transaction = this.bd.transaction('breweries', 'readwrite');
        let breweries = transaction.objectStore('breweries');
        const isHaveRow = breweries.get(data?.id)

        if (isHaveRow) {
            breweries.put(data);
        } else {
            breweries.add(data);
        }
    }

    async getBdRow(): IDBRequest<any> {
        let transaction = this.bd.transaction('breweries', 'readwrite');
        let breweries = transaction.objectStore('breweries');
        return breweries.get("b54b16e1-ac3b-4bff-a11f-f7ae9ddc27e0")
    }
}