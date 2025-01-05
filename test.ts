interface User {
  id: number;
  name: string;
  email: string;
  userProfile: Profile | null;
  listingItems: Item[];
  financePurchaseItems: Item[];
}

function NewUser(name: string, email: string): User {
  return {
    id: 0,
    name: name,
    email: email,
    userProfile: null,
    listingItems: [],
    financePurchaseItems: [],
  };
}

interface Profile {
  userID: number | null;
  bio: string | null;
  status: string;
}

function NewProfile(profileUser: number | null, bio: string | null): Profile {
  return {
    userID: profileUser,
    bio: bio,
    status: "z",
  };
}

interface Item {
  id: number;
  description: string;
  listingUsers: User[];
  financePurchaseUsers: User[];
}

function NewItem(description: string): Item {
  return {
    id: 0,
    description: description,
    listingUsers: [],
    financePurchaseUsers: [],
  };
}

interface Listing {
  userID: number | null;
  itemID: number | null;
  insertedAt: Date;
  sold: boolean;
}

function NewListing(
  listingListee: number | null,
  listingItem: number | null
): Listing {
  return {
    userID: listingListee,
    itemID: listingItem,
    insertedAt: new Date(),
    sold: false,
  };
}

interface Purchase {
  publicUserID: number | null;
  publicItemID: number | null;
  when: Date;
  amount: number;
  status: string;
}

function NewPurchase(
  financePurchasePayer: number | null,
  financePurchaseWhat: number | null,
  amount: number
): Purchase {
  return {
    publicUserID: financePurchasePayer,
    publicItemID: financePurchaseWhat,
    when: new Date(),
    amount: amount,
    status: "p",
  };
}
