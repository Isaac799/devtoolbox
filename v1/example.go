package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"
)

// User handlers

type User = struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

func NewUser(name, email string) *User {
	return &User{
		ID:    0,
		Name:  name,
		Email: email,
	}
}

type Profile = struct {
	UserID   int     `json:"user_id"`
	UserName string  `json:"user_name"`
	Bio      *string `json:"bio"`
	Status   string  `json:"status"`
}

func NewProfile(userID int, userName string, profileUserName *string) *Profile {
	return &Profile{
		UserID:   userID,
		UserName: userName,
		Bio:      profileUserName,
		Status:   "z",
	}
}

type Item = struct {
	ID          int    `json:"id"`
	Description string `json:"description"`
}

func NewItem(description string) *Item {
	return &Item{
		ID:          0,
		Description: description,
	}
}

type Listing = struct {
	UserID     int       `json:"user_id"`
	UserName   string    `json:"user_name"`
	ItemID     int       `json:"item_id"`
	InsertedAt time.Time `json:"inserted_at"`
	Sold       bool      `json:"sold"`
}

func NewListing(userID, itemID int, userName string) *Listing {
	return &Listing{
		UserID:     userID,
		UserName:   userName,
		ItemID:     itemID,
		InsertedAt: time.Now(),
		Sold:       false,
	}
}

type Purchase = struct {
	PublicUserID   int       `json:"public_user_id"`
	PublicUserName string    `json:"public_user_name"`
	PublicItemID   int       `json:"public_item_id"`
	When           time.Time `json:"when"`
	Amount         *int      `json:"amount"`
	Status         string    `json:"status"`
}

func NewPurchase(publicUserID, publicItemID int, publicUserName string, purchaseWhatID *int) *Purchase {
	return &Purchase{
		PublicUserID:   publicUserID,
		PublicUserName: publicUserName,
		PublicItemID:   publicItemID,
		When:           time.Now(),
		Amount:         purchaseWhatID,
		Status:         "p",
	}
}

var db = any

// User handlers

func GetManyUser(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, name, email FROM public.user")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	users := []User{}
	for rows.Next() {
		user := User{}
		if err := rows.Scan(&user.ID, &user.Name, &user.Email); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		users = append(users, user)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func selectUser(id int, name string) (*User, error) {
	user := User{}
	rows := db.QueryRow("SELECT id, name, email FROM public.user WHERE id = $1 AND name = $2", id, name)
	if err := rows.Scan(&user.ID, &user.Name, &user.Email); err != nil {
		return nil, err
	}
	return &user, nil
}

func GetUser(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "id parameter is invalid", http.StatusBadRequest)
		return
	}
	name := r.URL.Query().Get("name")
	if name == "" {
		http.Error(w, "name parameter is missing", http.StatusBadRequest)
		return
	}

	user, err := selectUser(id, name)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func PutUser(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "id parameter is invalid", http.StatusBadRequest)
		return
	}
	name := r.URL.Query().Get("name")
	if name == "" {
		http.Error(w, "name parameter is missing", http.StatusBadRequest)
		return
	}

	user := User{}
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err = db.Exec("UPDATE public.user SET name = $3, email = $4 WHERE id = $1 AND name = $2", id, name, user.Name, user.Email)
	if err != nil {
		http.Error(w, "Failed to update user", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func PostUser(w http.ResponseWriter, r *http.Request) {
	user := User{}
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := db.QueryRow("INSERT INTO public.user (name, email) VALUES ($1, $2) RETURNING id, name", user.Name, user.Email).Scan(&user.ID, &user.Name)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func DeleteUser(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "id parameter is invalid", http.StatusBadRequest)
		return
	}
	name := r.URL.Query().Get("name")
	if name == "" {
		http.Error(w, "name parameter is missing", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("DELETE FROM public.user WHERE id = $1 AND name = $2", id, name)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// Profile handlers

func GetManyProfile(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT user, bio, status FROM public.profile")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	profiles := []Profile{}
	for rows.Next() {
		profile := Profile{}
		if err := rows.Scan(&profile.Bio, &profile.Status); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		profiles = append(profiles, profile)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profiles)
}

func selectProfile(userID int, userName string) (*Profile, error) {
	profile := Profile{}
	rows := db.QueryRow("SELECT user, bio, status FROM public.profile WHERE user.id = $1 AND user.name = $2", userID, userName)
	if err := rows.Scan(&profile.Bio, &profile.Status); err != nil {
		return nil, err
	}
	return &profile, nil
}

func GetProfile(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.URL.Query().Get("user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "user_id parameter is invalid", http.StatusBadRequest)
		return
	}
	userName := r.URL.Query().Get("user_name")
	if userName == "" {
		http.Error(w, "user_name parameter is missing", http.StatusBadRequest)
		return
	}

	profile, err := selectProfile(userID, userName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profile)
}

func PutProfile(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.URL.Query().Get("user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "user_id parameter is invalid", http.StatusBadRequest)
		return
	}
	userName := r.URL.Query().Get("user_name")
	if userName == "" {
		http.Error(w, "user_name parameter is missing", http.StatusBadRequest)
		return
	}

	profile := Profile{}
	if err := json.NewDecoder(r.Body).Decode(&profile); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err = db.Exec("UPDATE public.profile SET user = $3, bio = $4 WHERE user.id = $1 AND user.name = $2", userID, userName, profile.Bio)
	if err != nil {
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profile)
}

func PostProfile(w http.ResponseWriter, r *http.Request) {
	profile := Profile{}
	if err := json.NewDecoder(r.Body).Decode(&profile); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := db.QueryRow("INSERT INTO public.profile (user, bio) VALUES ($1) RETURNING user", profile.Bio).Scan(&profile.UserID, &profile.UserName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profile)
}

func DeleteProfile(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.URL.Query().Get("user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "user_id parameter is invalid", http.StatusBadRequest)
		return
	}
	userName := r.URL.Query().Get("user_name")
	if userName == "" {
		http.Error(w, "user_name parameter is missing", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("DELETE FROM public.profile WHERE user.id = $1 AND user.name = $2", userID, userName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// Item handlers

func GetManyItem(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, description FROM public.item")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	items := []Item{}
	for rows.Next() {
		item := Item{}
		if err := rows.Scan(&item.ID, &item.Description); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		items = append(items, item)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

func selectItem(id int) (*Item, error) {
	item := Item{}
	rows := db.QueryRow("SELECT id, description FROM public.item WHERE id = $1", id)
	if err := rows.Scan(&item.ID, &item.Description); err != nil {
		return nil, err
	}
	return &item, nil
}

func GetItem(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "id parameter is invalid", http.StatusBadRequest)
		return
	}
	item, err := selectItem(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(item)
}

func PutItem(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "id parameter is invalid", http.StatusBadRequest)
		return
	}
	item := Item{}
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err = db.Exec("UPDATE public.item SET description = $2 WHERE id = $1", id, item.Description)
	if err != nil {
		http.Error(w, "Failed to update item", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(item)
}

func PostItem(w http.ResponseWriter, r *http.Request) {
	item := Item{}
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := db.QueryRow("INSERT INTO public.item (description) VALUES ($1) RETURNING id", item.Description).Scan(&item.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(item)
}

func DeleteItem(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "id parameter is invalid", http.StatusBadRequest)
		return
	}
	_, err = db.Exec("DELETE FROM public.item WHERE id = $1", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// Listing handlers

func GetManyListing(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT listee, item, inserted_at, sold FROM public.listing")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	listings := []Listing{}
	for rows.Next() {
		listing := Listing{}
		if err := rows.Scan(&listing.InsertedAt, &listing.Sold); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		listings = append(listings, listing)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(listings)
}

func selectListing(userID int, userName string, itemID int) (*Listing, error) {
	listing := Listing{}
	rows := db.QueryRow("SELECT listee, item, inserted_at, sold FROM public.listing WHERE listee.id = $1 AND listee.name = $2 AND item.id = $3", userID, userName, itemID)
	if err := rows.Scan(&listing.InsertedAt, &listing.Sold); err != nil {
		return nil, err
	}
	return &listing, nil
}

func GetListing(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.URL.Query().Get("user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "user_id parameter is invalid", http.StatusBadRequest)
		return
	}
	userName := r.URL.Query().Get("user_name")
	if userName == "" {
		http.Error(w, "user_name parameter is missing", http.StatusBadRequest)
		return
	}

	itemIDStr := r.URL.Query().Get("item_id")
	itemID, err := strconv.Atoi(itemIDStr)
	if err != nil {
		http.Error(w, "item_id parameter is invalid", http.StatusBadRequest)
		return
	}
	listing, err := selectListing(userID, userName, itemID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(listing)
}

func PutListing(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.URL.Query().Get("user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "user_id parameter is invalid", http.StatusBadRequest)
		return
	}
	userName := r.URL.Query().Get("user_name")
	if userName == "" {
		http.Error(w, "user_name parameter is missing", http.StatusBadRequest)
		return
	}

	itemIDStr := r.URL.Query().Get("item_id")
	itemID, err := strconv.Atoi(itemIDStr)
	if err != nil {
		http.Error(w, "item_id parameter is invalid", http.StatusBadRequest)
		return
	}
	listing := Listing{}
	if err := json.NewDecoder(r.Body).Decode(&listing); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err = db.Exec("UPDATE public.listing SET listee = $4, item = $5, inserted_at = $6 WHERE listee.id = $1 AND listee.name = $2 AND item.id = $3", userID, userName, itemID, listing.InsertedAt)
	if err != nil {
		http.Error(w, "Failed to update listing", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(listing)
}

func PostListing(w http.ResponseWriter, r *http.Request) {
	listing := Listing{}
	if err := json.NewDecoder(r.Body).Decode(&listing); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := db.QueryRow("INSERT INTO public.listing (listee, item, inserted_at) VALUES ($1) RETURNING listee, item", listing.InsertedAt).Scan(&listing.UserID, &listing.UserName, &listing.ItemID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(listing)
}

func DeleteListing(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.URL.Query().Get("user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "user_id parameter is invalid", http.StatusBadRequest)
		return
	}
	userName := r.URL.Query().Get("user_name")
	if userName == "" {
		http.Error(w, "user_name parameter is missing", http.StatusBadRequest)
		return
	}

	itemIDStr := r.URL.Query().Get("item_id")
	itemID, err := strconv.Atoi(itemIDStr)
	if err != nil {
		http.Error(w, "item_id parameter is invalid", http.StatusBadRequest)
		return
	}
	_, err = db.Exec("DELETE FROM public.listing WHERE listee.id = $1 AND listee.name = $2 AND item.id = $3", userID, userName, itemID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// Purchase handlers

func GetManyPurchase(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT payer, what, when, amount, status FROM finance.purchase")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	purchases := []Purchase{}
	for rows.Next() {
		purchase := Purchase{}
		if err := rows.Scan(&purchase.When, &purchase.Amount, &purchase.Status); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		purchases = append(purchases, purchase)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(purchases)
}

func selectPurchase(publicUserID int, publicUserName string, publicItemID int) (*Purchase, error) {
	purchase := Purchase{}
	rows := db.QueryRow("SELECT payer, what, when, amount, status FROM finance.purchase WHERE payer.id = $1 AND payer.name = $2 AND what.id = $3", publicUserID, publicUserName, publicItemID)
	if err := rows.Scan(&purchase.When, &purchase.Amount, &purchase.Status); err != nil {
		return nil, err
	}
	return &purchase, nil
}

func GetPurchase(w http.ResponseWriter, r *http.Request) {
	publicUserIDStr := r.URL.Query().Get("public_user_id")
	publicUserID, err := strconv.Atoi(publicUserIDStr)
	if err != nil {
		http.Error(w, "public_user_id parameter is invalid", http.StatusBadRequest)
		return
	}
	publicUserName := r.URL.Query().Get("public_user_name")
	if publicUserName == "" {
		http.Error(w, "public_user_name parameter is missing", http.StatusBadRequest)
		return
	}

	publicItemIDStr := r.URL.Query().Get("public_item_id")
	publicItemID, err := strconv.Atoi(publicItemIDStr)
	if err != nil {
		http.Error(w, "public_item_id parameter is invalid", http.StatusBadRequest)
		return
	}
	purchase, err := selectPurchase(publicUserID, publicUserName, publicItemID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(purchase)
}

func PutPurchase(w http.ResponseWriter, r *http.Request) {
	publicUserIDStr := r.URL.Query().Get("public_user_id")
	publicUserID, err := strconv.Atoi(publicUserIDStr)
	if err != nil {
		http.Error(w, "public_user_id parameter is invalid", http.StatusBadRequest)
		return
	}
	publicUserName := r.URL.Query().Get("public_user_name")
	if publicUserName == "" {
		http.Error(w, "public_user_name parameter is missing", http.StatusBadRequest)
		return
	}

	publicItemIDStr := r.URL.Query().Get("public_item_id")
	publicItemID, err := strconv.Atoi(publicItemIDStr)
	if err != nil {
		http.Error(w, "public_item_id parameter is invalid", http.StatusBadRequest)
		return
	}
	purchase := Purchase{}
	if err := json.NewDecoder(r.Body).Decode(&purchase); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err = db.Exec("UPDATE finance.purchase SET payer = $4, what = $5, when = $6, amount = $7 WHERE payer.id = $1 AND payer.name = $2 AND what.id = $3", publicUserID, publicUserName, publicItemID, purchase.When, purchase.Amount)
	if err != nil {
		http.Error(w, "Failed to update purchase", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(purchase)
}

func PostPurchase(w http.ResponseWriter, r *http.Request) {
	purchase := Purchase{}
	if err := json.NewDecoder(r.Body).Decode(&purchase); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := db.QueryRow("INSERT INTO finance.purchase (payer, what, when, amount) VALUES ($1, $2) RETURNING payer, what", purchase.When, purchase.Amount).Scan(&purchase.PublicUserID, &purchase.PublicUserName, &purchase.PublicItemID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(purchase)
}

func DeletePurchase(w http.ResponseWriter, r *http.Request) {
	publicUserIDStr := r.URL.Query().Get("public_user_id")
	publicUserID, err := strconv.Atoi(publicUserIDStr)
	if err != nil {
		http.Error(w, "public_user_id parameter is invalid", http.StatusBadRequest)
		return
	}
	publicUserName := r.URL.Query().Get("public_user_name")
	if publicUserName == "" {
		http.Error(w, "public_user_name parameter is missing", http.StatusBadRequest)
		return
	}

	publicItemIDStr := r.URL.Query().Get("public_item_id")
	publicItemID, err := strconv.Atoi(publicItemIDStr)
	if err != nil {
		http.Error(w, "public_item_id parameter is invalid", http.StatusBadRequest)
		return
	}
	_, err = db.Exec("DELETE FROM finance.purchase WHERE payer.id = $1 AND payer.name = $2 AND what.id = $3", publicUserID, publicUserName, publicItemID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
