package animalTest

import "time"

type User = struct {
	ID                   int      `json:"id"`
	Name                 string   `json:"name"`
	Email                string   `json:"email"`
	UserProfile          *Profile `json:"userprofile"`
	ListingItems         []Item   `json:"listingitems"`
	FinancePurchaseItems []Item   `json:"financepurchaseitems"`
}

func NewUser(name, email string) *User {
	return &User{
		ID:                   0,
		Name:                 name,
		Email:                email,
		UserProfile:          nil,
		ListingItems:         []Item{},
		FinancePurchaseItems: []Item{},
	}
}

type Profile = struct {
	UserID *int    `json:"userid"`
	Bio    *string `json:"bio"`
	Status string  `json:"status"`
}

func NewProfile(profileUser *int, bio *string) *Profile {
	return &Profile{
		UserID: profileUser,
		Bio:    bio,
		Status: "z",
	}
}

type Item = struct {
	ID                   int    `json:"id"`
	Description          string `json:"description"`
	ListingUsers         []User `json:"listingusers"`
	FinancePurchaseUsers []User `json:"financepurchaseusers"`
}

func NewItem(description string) *Item {
	return &Item{
		ID:                   0,
		Description:          description,
		ListingUsers:         []User{},
		FinancePurchaseUsers: []User{},
	}
}

type Listing = struct {
	UserID     *int      `json:"userid"`
	ItemID     *int      `json:"itemid"`
	InsertedAt time.Time `json:"insertedat"`
	Sold       bool      `json:"sold"`
}

func NewListing(listingListee, listingItem *int) *Listing {
	return &Listing{
		UserID:     listingListee,
		ItemID:     listingItem,
		InsertedAt: time.Now(),
		Sold:       false,
	}
}

type Purchase = struct {
	PublicUserID *int      `json:"publicuserid"`
	PublicItemID *int      `json:"publicitemid"`
	When         time.Time `json:"when"`
	Amount       float64   `json:"amount"`
	Status       string    `json:"status"`
}

func NewPurchase(financePurchasePayer, financePurchaseWhat *int, amount float64) *Purchase {
	return &Purchase{
		PublicUserID: financePurchasePayer,
		PublicItemID: financePurchaseWhat,
		When:         time.Now(),
		Amount:       amount,
		Status:       "p",
	}
}
