export class IndexBd {
    storeName = 'soli_bd'
    version = 1
    bd: IDBDatabase

    //Мы хотим создавать и проверять наличие всех таблиц в бд
    //TODO: разобраться в каком формате их можно создать и можно ли описать их схему. Подумать над встраиванием библиотеки
    //1) Проврека наличия таблицу
    //2) Если отсутсвуют - создание их
    //3) Описать в отдельном файле логику создания таблиц и их значений
    async openBd(): Promise<void> {
        let openRequest = indexedDB.open(this.storeName, this.version)

        openRequest.onupgradeneeded = () => {
            const db = openRequest.result;
            if (!db.objectStoreNames.contains('breweries')) {
                const table = db.createObjectStore('breweries', {keyPath: 'id'});
                table.createIndex('name', 'name', { unique: false });
            }
        };

        openRequest.onerror = () => {
            console.error("Error", openRequest.error);
        };

        openRequest.onsuccess = () => {
            this.bd = openRequest.result;
        }
    }


    //TODO: подумать как добавлять данные, как передавать название таблицы, ключ и данные
    // Только описанное выше не в этом слое сделать
    async add(storeName: string, data: any): Promise<void> {
        const transaction = await this.bd.transaction(storeName, 'readwrite');
        const store = await transaction.objectStore(storeName);
        const isHaveRow = await store.get(data?.id)

        isHaveRow ? await store.put(data) : await store.add(data)
    }

    async get(storeName: string, key: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBRequest<any>> {
        const transaction = await this.bd.transaction(storeName, mode);
        const store = await transaction.objectStore(storeName);

        return new Promise((resolve, reject) => {
            const request = store.get(key)
            request.onsuccess = () => {
                resolve(request.result);
            };
            request.onerror = () => {
                reject(request.error);
            };
        })
    }

    async getAll(storeName: string, mode: IDBTransactionMode = 'readonly') {
        const transaction = await this.bd.transaction(storeName, mode);
        const store = await transaction.objectStore(storeName);

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                resolve(request.result);
            };
            request.onerror = () => {
                reject(request.error);
            };
        });
    }
}