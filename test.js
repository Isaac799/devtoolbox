class User {
  /**
   * @type {number}
   */
  id;
  /**
   * @type {string}
   */
  name;
  /**
   * @type {string}
   */
  email;
  /**
   * @type {Profile | null}
   */
  userProfile;
  /**
   * @type {Item[]}
   */
  listingItems;
  /**
   * @type {Item[]}
   */
  financePurchaseItems;

  /**
   * Create a User.
   * @param {string} name
   * @param {string} email
   */
  constructor(name, email) {
    this.id = 0;
    this.name = name;
    this.email = email;
    this.userProfile = null;
    this.listingItems = [];
    this.financePurchaseItems = [];
  }
}

class Profile {
  /**
   * @type {number | null}
   */
  userID;
  /**
   * @type {string | null}
   */
  bio;
  /**
   * @type {string}
   */
  status;

  /**
   * Create a Profile.
   * @param {number | null} profileUser
   * @param {string | null} bio
   */
  constructor(profileUser, bio) {
    this.userID = profileUser;
    this.bio = bio;
    this.status = "z";
  }
}

class Item {
  /**
   * @type {number}
   */
  id;
  /**
   * @type {string}
   */
  description;
  /**
   * @type {User[]}
   */
  listingUsers;
  /**
   * @type {User[]}
   */
  financePurchaseUsers;

  /**
   * Create a Item.
   * @param {string} description
   */
  constructor(description) {
    this.id = 0;
    this.description = description;
    this.listingUsers = [];
    this.financePurchaseUsers = [];
  }
}

class Listing {
  /**
   * @type {number | null}
   */
  userID;
  /**
   * @type {number | null}
   */
  itemID;
  /**
   * @type {Date}
   */
  insertedAt;
  /**
   * @type {boolean}
   */
  sold;

  /**
   * Create a Listing.
   * @param {number | null} listingListee
   * @param {number | null} listingItem
   */
  constructor(listingListee, listingItem) {
    this.userID = listingListee;
    this.itemID = listingItem;
    this.insertedAt = new Date();
    this.sold = false;
  }
}

class Purchase {
  /**
   * @type {number | null}
   */
  publicUserID;
  /**
   * @type {number | null}
   */
  publicItemID;
  /**
   * @type {Date}
   */
  when;
  /**
   * @type {number}
   */
  amount;
  /**
   * @type {string}
   */
  status;

  /**
   * Create a Purchase.
   * @param {number | null} financePurchasePayer
   * @param {number | null} financePurchaseWhat
   * @param {number} amount
   */
  constructor(financePurchasePayer, financePurchaseWhat, amount) {
    this.publicUserID = financePurchasePayer;
    this.publicItemID = financePurchaseWhat;
    this.when = new Date();
    this.amount = amount;
    this.status = "p";
  }
}
