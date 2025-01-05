import { AttrType } from './structure';

export const TAB = '    ';

export const defaultConfig: any = {
  public: {
    ID: 13,
    Tables: {
      user: {
        ID: 14,
        ParentID: 13,
        Attributes: {
          id: {
            ID: 16,
            ParentID: 14,
            Type: 'SERIAL',
            Option: {
              Unique: false,
              PrimaryKey: true,
              SystemField: true,
              Default: '',
            },
          },
          name: {
            ID: 18,
            ParentID: 14,
            Type: 'VARCHAR',
            Option: { Unique: true, PrimaryKey: false, Default: '' },
            Validation: { Min: 3, Max: 31, Required: true },
          },
          email: {
            ID: 36,
            ParentID: 14,
            Type: 'VARCHAR',
            Option: { Default: null, Unique: true, PrimaryKey: null },
            Validation: { Min: 5, Max: 63, Required: true },
          },
        },
      },
      profile: {
        ID: 15,
        ParentID: 13,
        Attributes: {
          user: {
            ID: 20,
            ParentID: 15,
            RefToID: 14,
            Type: 'REF',
            Option: { PrimaryKey: true, SystemField: false },
            Validation: { Required: true },
          },
          bio: {
            ID: 19,
            ParentID: 15,
            Type: 'VARCHAR',
            Option: { PrimaryKey: false },
            Validation: { Max: 255, Required: false },
          },
          status: {
            ID: 32,
            ParentID: 15,
            Type: 'CHARACTER',
            Option: { Default: 'z', Unique: null, PrimaryKey: null },
            Validation: { Min: null, Max: null, Required: true },
          },
        },
      },
      item: {
        ID: 21,
        ParentID: 13,
        Attributes: {
          id: {
            ID: 22,
            ParentID: 21,
            Type: 'SERIAL',
            Option: { Unique: false, PrimaryKey: true, SystemField: true },
          },
          description: {
            ID: 23,
            ParentID: 21,
            Type: 'VARCHAR',
            Validation: { Min: 3, Max: 255, Required: true },
          },
        },
      },
      listing: {
        ID: 24,
        ParentID: 13,
        Attributes: {
          listee: {
            ID: 25,
            ParentID: 24,
            RefToID: 14,
            Type: 'REF',
            Option: { PrimaryKey: true },
            Validation: { Required: false },
          },
          item: {
            ID: 26,
            ParentID: 24,
            RefToID: 21,
            Type: 'REF',
            Option: { PrimaryKey: true },
            Validation: { Required: false },
          },
          inserted_at: {
            ID: 33,
            ParentID: 24,
            Type: 'TIMESTAMP',
            Option: {
              Default: 'CURRENT_TIMESTAMP',
              PrimaryKey: false,
              SystemField: true,
            },
            Validation: { Required: true },
          },
          sold: {
            ID: 37,
            ParentID: 24,
            Type: 'BOOLEAN',
            Option: { Default: 'false', Unique: null, PrimaryKey: null },
            Validation: { Min: null, Max: null, Required: true },
          },
        },
      },
    },
  },
  finance: {
    ID: 27,
    Tables: {
      purchase: {
        ID: 28,
        ParentID: 27,
        Attributes: {
          payer: {
            ID: 29,
            ParentID: 28,
            RefToID: 14,
            Type: 'REF',
            Option: { PrimaryKey: true },
            Validation: { Required: false },
          },
          what: {
            ID: 30,
            ParentID: 28,
            RefToID: 21,
            Type: 'REF',
            Option: { PrimaryKey: true, Unique: true },
            Validation: { Required: false },
          },
          when: {
            ID: 31,
            ParentID: 28,
            Type: 'TIMESTAMP',
            Option: {
              Default: 'CURRENT_TIMESTAMP',
              PrimaryKey: false,
              SystemField: true,
            },
            Validation: { Required: true },
          },
          amount: {
            ID: 34,
            ParentID: 28,
            Type: 'MONEY',
            Option: { Default: '' },
            Validation: { Min: 0.01, Max: 999.99, Required: true },
          },
          status: {
            ID: 35,
            ParentID: 28,
            Type: 'CHARACTER',
            Option: { Default: 'p' },
            Validation: { Required: true },
          },
        },
      },
    },
  },
};

// Define a type for the input array of objects
export type Grouped<T> = {
  [key: string]: T[];
};

// Function to group items by a property
export const groupBy = <T, K extends keyof T>(
  arr: T[],
  prop: K
): Grouped<T> => {
  return arr.reduce((acc, item) => {
    const key = item[prop] as unknown as string; // Get the value of the property to group by

    // If the group doesn't exist, create it
    if (!acc[key]) {
      acc[key] = [];
    }

    // Add the item to the corresponding group
    acc[key].push(item);

    return acc;
  }, {} as Grouped<T>);
};

export const array_move = (
  arr: any[],
  old_index: number,
  new_index: number
) => {
  if (new_index >= arr.length) {
    let k = new_index - arr.length + 1;
    while (k--) {
      arr.push(undefined);
    }
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
};
