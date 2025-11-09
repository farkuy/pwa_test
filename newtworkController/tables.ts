interface Rows {
  name: string;
  keyPath: string;
  options?: IDBIndexParameters;
}

interface Table {
  name: string;
  options?: IDBObjectStoreParameters;
  rows?: Rows[];
}

export const creatableTables: Table[] = [
  {
    name: "posts",
    options: { keyPath: "id" },
    rows: [
      {
        name: "userId",
        keyPath: "userId",
        options: { unique: false },
      },
      {
        name: "title",
        keyPath: "title",
        options: { unique: false },
      },
      {
        name: "body",
        keyPath: "body",
        options: { unique: false },
      },
    ],
  },
];
