import { creatableTables } from "./tables";

export class IndexBd {
  storeName = "soli_bd";
  version = 1;
  bd: IDBDatabase;

  async openBd(): Promise<void> {
    let openRequest = indexedDB.open(this.storeName, this.version);

    openRequest.onupgradeneeded = () => {
      const db = openRequest.result;
      creatableTables.forEach((tb) => {
        if (!db.objectStoreNames.contains(tb.name)) {
          const table = db.createObjectStore(tb.name, tb.options);
          tb.rows.forEach((row) => {
            table.createIndex(row.name, row.keyPath, row.options);
          });
        }
      });
    };

    openRequest.onerror = () => {
      console.error("Error", openRequest.error);
    };

    openRequest.onsuccess = () => {
      this.bd = openRequest.result;
    };
  }

  async get(
    storeName: string,
    key: string,
    mode: IDBTransactionMode = "readonly",
  ): Promise<IDBRequest<any>> {
    const transaction = this.bd.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getAll(storeName: string, mode: IDBTransactionMode = "readonly") {
    const transaction = this.bd.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);

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

  //TODO: подумать как добавлять данные, как передавать название таблицы, ключ и данные
  // Только описанное выше не в этом слое сделать
  async add(storeName: string, data: any): Promise<void> {
    const transaction = this.bd.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const isHaveRow = await new Promise((resolve, reject) => {
      const getRequest = store.get(data.id);
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });

    if (isHaveRow) {
      store.put(data);
    } else {
      store.add(data);
    }
  }

  async addAll(storeName: string, data: any[]): Promise<void> {
    const transaction = this.bd.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);

    for (let val of data) {
      const isHaveRow = await new Promise((resolve, reject) => {
        const getRequest = store.get(val?.id);
        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => reject(getRequest.error);
      });

      if (isHaveRow) {
        store.put(val);
      } else {
        store.add(val);
      }
    }
  }
}

export const indexBd = new IndexBd();
