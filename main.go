package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	_ "github.com/lib/pq"
)

type Person struct {
	Id       int    `json:"id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	Active   bool   `json:"active"`
}
type Category struct {
	Id    int    `json:"id"`
	Title string `json:"title"`
}
type Product struct {
	Id    int     `json:"id"`
	Title string  `json:"title"`
	Price float64 `json:"price"`
}
type ProductCategory struct {
	ProductId  int `json:"product_id"`
	CategoryId int `json:"category_id"`
}
type Cart struct {
	Id       int `json:"id"`
	PersonId int `json:"person_id"`
}
type CartItem struct {
	RecordCreatedOn time.Time `json:"record_created_on"`
	CartId          int       `json:"cart_id"`
	ProductId       int       `json:"product_id"`
	PriceWhenCarted float64   `json:"price_when_carted"`
}
type Order struct {
	RecordCreatedOn time.Time `json:"record_created_on"`
	Id              int       `json:"id"`
	PersonId        int       `json:"person_id"`
	Finalized       bool      `json:"finalized"`
	TotalCost       float64   `json:"total_cost"`
}
type OrderItem struct {
	RecordCreatedOn time.Time `json:"record_created_on"`
	OrderId         int       `json:"order_id"`
	ProductId       int       `json:"product_id"`
}

var db *sql.DB

func initDB() {
	var err error
	connStr := "user=username dbname=mydb sslmode=disable"
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
}

func PostPerson(w http.ResponseWriter, r *http.Request) {
	var person Person
	if err := json.NewDecoder(r.Body).Decode(&person); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `INSERT INTO person.person ( person.person.email, person.person.username, person.person.active ) VALUES ( $1, $2, $3 ) RETURNING id;`

	err := db.QueryRow(query, person.Email, person.Username, person.Active).Scan(&person.Id)
	if err != nil {
		http.Error(w, "Error inserting: person"+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(person)
}

func GetPerson(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	query := `SELECT person.person.id , person.person.email , person.person.username , person.person.active FROM person.person WHERE person.person.id = $1;`

	var person Person
	err = db.QueryRow(query, id).Scan(&person.Id, &person.Email, &person.Username, &person.Active)

	if err == sql.ErrNoRows {
		http.Error(w, "Record not found for this person", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Error fetching person: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(person)
}

func GetPersons(w http.ResponseWriter, r *http.Request) {
	query := `SELECT person.person.id , person.person.email , person.person.username , person.person.active FROM person.person;`
	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var persons []Person
	for rows.Next() {
		var person Person
		err := rows.Scan(&person.Id, &person.Email, &person.Username, &person.Active)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		persons = append(persons, person)
	}

	if err = rows.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(persons)
}

func PutPerson(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	var person Person
	if err := json.NewDecoder(r.Body).Decode(&person); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `SET person.person.email = $2, person.person.username = $3, person.person.active = $4 WHERE person.person.id = $1;`

	res, err := db.Exec(query, id, person.Email, person.Username, person.Active)
	if err != nil {
		http.Error(w, "Error updating person: "+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, "Record not found or no changes made", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func DeletePerson(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	query := `DELETE FROM person.person WHERE person.person.id = $1;`

	res, err := db.Exec(query, id)
	if err != nil {
		http.Error(w, "Error deleting person: "+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, "Record not found or no changes made", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func PostCategory(w http.ResponseWriter, r *http.Request) {
	var category Category
	if err := json.NewDecoder(r.Body).Decode(&category); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `INSERT INTO catalog.category ( catalog.category.title ) VALUES ( $1 ) RETURNING id;`

	err := db.QueryRow(query, category.Title).Scan(&category.Id)
	if err != nil {
		http.Error(w, "Error inserting: category"+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(category)
}

func GetCategory(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	query := `SELECT catalog.category.id , catalog.category.title FROM catalog.category WHERE catalog.category.id = $1;`

	var category Category
	err = db.QueryRow(query, id).Scan(&category.Id, &category.Title)

	if err == sql.ErrNoRows {
		http.Error(w, "Record not found for this category", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Error fetching category: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(category)
}

func GetCategories(w http.ResponseWriter, r *http.Request) {
	query := `SELECT catalog.category.id , catalog.category.title FROM catalog.category;`
	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var categorys []Category
	for rows.Next() {
		var category Category
		err := rows.Scan(&category.Id, &category.Title)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		categorys = append(categorys, category)
	}

	if err = rows.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categorys)
}

func PutCategory(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	var category Category
	if err := json.NewDecoder(r.Body).Decode(&category); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `SET catalog.category.title = $2 WHERE catalog.category.id = $1;`

	res, err := db.Exec(query, id, category.Title)
	if err != nil {
		http.Error(w, "Error updating category: "+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, "Record not found or no changes made", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func DeleteCategory(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	query := `DELETE FROM catalog.category WHERE catalog.category.id = $1;`

	res, err := db.Exec(query, id)
	if err != nil {
		http.Error(w, "Error deleting category: "+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, "Record not found or no changes made", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func PostProduct(w http.ResponseWriter, r *http.Request) {
	var product Product
	if err := json.NewDecoder(r.Body).Decode(&product); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `INSERT INTO catalog.product ( catalog.product.title, catalog.product.price ) VALUES ( $1, $2 ) RETURNING id;`

	err := db.QueryRow(query, product.Title, product.Price).Scan(&product.Id)
	if err != nil {
		http.Error(w, "Error inserting: product"+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(product)
}

func GetProduct(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	query := `SELECT catalog.product.id , catalog.product.title , catalog.product.price FROM catalog.product WHERE catalog.product.id = $1;`

	var product Product
	err = db.QueryRow(query, id).Scan(&product.Id, &product.Title, &product.Price)

	if err == sql.ErrNoRows {
		http.Error(w, "Record not found for this product", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Error fetching product: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(product)
}

func GetProducts(w http.ResponseWriter, r *http.Request) {
	query := `SELECT catalog.product.id , catalog.product.title , catalog.product.price FROM catalog.product;`
	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var product Product
		err := rows.Scan(&product.Id, &product.Title, &product.Price)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		products = append(products, product)
	}

	if err = rows.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

func PutProduct(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	var product Product
	if err := json.NewDecoder(r.Body).Decode(&product); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `SET catalog.product.title = $2, catalog.product.price = $3 WHERE catalog.product.id = $1;`

	res, err := db.Exec(query, id, product.Title, product.Price)
	if err != nil {
		http.Error(w, "Error updating product: "+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, "Record not found or no changes made", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func DeleteProduct(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	query := `DELETE FROM catalog.product WHERE catalog.product.id = $1;`

	res, err := db.Exec(query, id)
	if err != nil {
		http.Error(w, "Error deleting product: "+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, "Record not found or no changes made", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func PostCart(w http.ResponseWriter, r *http.Request) {
	var cart Cart
	if err := json.NewDecoder(r.Body).Decode(&cart); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `INSERT INTO shopping_cart.cart ( shopping_cart.cart.person_id ) VALUES ( $1 ) RETURNING id;`

	err := db.QueryRow(query, cart.PersonId).Scan(&cart.Id)
	if err != nil {
		http.Error(w, "Error inserting: cart"+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(cart)
}

func GetCart(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	query := `SELECT shopping_cart.cart.id , shopping_cart.cart.person_id FROM shopping_cart.cart WHERE shopping_cart.cart.id = $1;`

	var cart Cart
	err = db.QueryRow(query, id).Scan(&cart.Id, &cart.PersonId)

	if err == sql.ErrNoRows {
		http.Error(w, "Record not found for this cart", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Error fetching cart: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(cart)
}

func GetCarts(w http.ResponseWriter, r *http.Request) {
	query := `SELECT shopping_cart.cart.id , shopping_cart.cart.person_id FROM shopping_cart.cart;`
	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var carts []Cart
	for rows.Next() {
		var cart Cart
		err := rows.Scan(&cart.Id, &cart.PersonId)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		carts = append(carts, cart)
	}

	if err = rows.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(carts)
}

func PutCart(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	var cart Cart
	if err := json.NewDecoder(r.Body).Decode(&cart); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `SET shopping_cart.cart.person_id = $2 WHERE shopping_cart.cart.id = $1;`

	res, err := db.Exec(query, id, cart.PersonId)
	if err != nil {
		http.Error(w, "Error updating cart: "+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, "Record not found or no changes made", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func DeleteCart(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	query := `DELETE FROM shopping_cart.cart WHERE shopping_cart.cart.id = $1;`

	res, err := db.Exec(query, id)
	if err != nil {
		http.Error(w, "Error deleting cart: "+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, "Record not found or no changes made", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func PostCartItem(w http.ResponseWriter, r *http.Request) {
	var cartItem CartItem
	if err := json.NewDecoder(r.Body).Decode(&cartItem); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `INSERT INTO shopping_cart.cart_item ( shopping_cart.cart_item.record_created_on, shopping_cart.cart_item.price_when_carted ) VALUES ( $1, $2 ) RETURNING cart_id, product_id;`

	err := db.QueryRow(query, cartItem.RecordCreatedOn, cartItem.PriceWhenCarted).Scan(&cartItem.CartId, &cartItem.ProductId)
	if err != nil {
		http.Error(w, "Error inserting: cart-item"+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(cartItem)
}

func GetCartItem(w http.ResponseWriter, r *http.Request) {
	cartIdStr := r.URL.Query().Get("cart_id")
	cartId, err := strconv.Atoi(cartIdStr)
	if err != nil {
		http.Error(w, "Invalid cart_id", http.StatusBadRequest)
		return
	}

	productIdStr := r.URL.Query().Get("product_id")
	productId, err := strconv.Atoi(productIdStr)
	if err != nil {
		http.Error(w, "Invalid product_id", http.StatusBadRequest)
		return
	}

	query := `SELECT shopping_cart.cart_item.record_created_on , shopping_cart.cart_item.cart_id , shopping_cart.cart_item.product_id , shopping_cart.cart_item.price_when_carted FROM shopping_cart.cart_item WHERE shopping_cart.cart_item.cart_id = $1 AND shopping_cart.cart_item.product_id = $2;`

	var cartItem CartItem
	err = db.QueryRow(query, cartId, productId).Scan(&cartItem.RecordCreatedOn, &cartItem.CartId, &cartItem.ProductId, &cartItem.PriceWhenCarted)

	if err == sql.ErrNoRows {
		http.Error(w, "Record not found for this cart-item", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Error fetching cart-item: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(cartItem)
}

func GetCartItems(w http.ResponseWriter, r *http.Request) {
	query := `SELECT shopping_cart.cart_item.record_created_on , shopping_cart.cart_item.cart_id , shopping_cart.cart_item.product_id , shopping_cart.cart_item.price_when_carted FROM shopping_cart.cart_item;`
	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var cartItems []CartItem
	for rows.Next() {
		var cartItem CartItem
		err := rows.Scan(&cartItem.RecordCreatedOn, &cartItem.CartId, &cartItem.ProductId, &cartItem.PriceWhenCarted)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		cartItems = append(cartItems, cartItem)
	}

	if err = rows.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cartItems)
}

func PutCartItem(w http.ResponseWriter, r *http.Request) {
	cartIdStr := r.URL.Query().Get("cart_id")
	cartId, err := strconv.Atoi(cartIdStr)
	if err != nil {
		http.Error(w, "Invalid cart_id", http.StatusBadRequest)
		return
	}

	productIdStr := r.URL.Query().Get("product_id")
	productId, err := strconv.Atoi(productIdStr)
	if err != nil {
		http.Error(w, "Invalid product_id", http.StatusBadRequest)
		return
	}

	var cartItem CartItem
	if err := json.NewDecoder(r.Body).Decode(&cartItem); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `SET shopping_cart.cart_item.record_created_on = $3, shopping_cart.cart_item.price_when_carted = $4 WHERE shopping_cart.cart_item.cart_id = $1 AND shopping_cart.cart_item.product_id = $2;`

	res, err := db.Exec(query, cartId, productId, cartItem.RecordCreatedOn, cartItem.PriceWhenCarted)
	if err != nil {
		http.Error(w, "Error updating cart-item: "+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, "Record not found or no changes made", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func DeleteCartItem(w http.ResponseWriter, r *http.Request) {
	cartIdStr := r.URL.Query().Get("cart_id")
	cartId, err := strconv.Atoi(cartIdStr)
	if err != nil {
		http.Error(w, "Invalid cart_id", http.StatusBadRequest)
		return
	}

	productIdStr := r.URL.Query().Get("product_id")
	productId, err := strconv.Atoi(productIdStr)
	if err != nil {
		http.Error(w, "Invalid product_id", http.StatusBadRequest)
		return
	}

	query := `DELETE FROM shopping_cart.cart_item WHERE shopping_cart.cart_item.cart_id = $1 AND shopping_cart.cart_item.product_id = $2;`

	res, err := db.Exec(query, cartId, productId)
	if err != nil {
		http.Error(w, "Error deleting cart-item: "+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, "Record not found or no changes made", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func PostOrder(w http.ResponseWriter, r *http.Request) {
	var order Order
	if err := json.NewDecoder(r.Body).Decode(&order); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `INSERT INTO orders.order ( orders.order.record_created_on, orders.order.person_id, orders.order.finalized, orders.order.total_cost ) VALUES ( $1, $2, $3, $4 ) RETURNING id;`

	err := db.QueryRow(query, order.RecordCreatedOn, order.PersonId, order.Finalized, order.TotalCost).Scan(&order.Id)
	if err != nil {
		http.Error(w, "Error inserting: order"+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(order)
}

func GetOrder(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	query := `SELECT orders.order.record_created_on , orders.order.id , orders.order.person_id , orders.order.finalized , orders.order.total_cost FROM orders.order WHERE orders.order.id = $1;`

	var order Order
	err = db.QueryRow(query, id).Scan(&order.RecordCreatedOn, &order.Id, &order.PersonId, &order.Finalized, &order.TotalCost)

	if err == sql.ErrNoRows {
		http.Error(w, "Record not found for this order", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Error fetching order: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(order)
}

func GetOrders(w http.ResponseWriter, r *http.Request) {
	query := `SELECT orders.order.record_created_on , orders.order.id , orders.order.person_id , orders.order.finalized , orders.order.total_cost FROM orders.order;`
	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var orders []Order
	for rows.Next() {
		var order Order
		err := rows.Scan(&order.RecordCreatedOn, &order.Id, &order.PersonId, &order.Finalized, &order.TotalCost)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		orders = append(orders, order)
	}

	if err = rows.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}

func PutOrder(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	var order Order
	if err := json.NewDecoder(r.Body).Decode(&order); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `SET orders.order.record_created_on = $2, orders.order.person_id = $3, orders.order.finalized = $4, orders.order.total_cost = $5 WHERE orders.order.id = $1;`

	res, err := db.Exec(query, id, order.RecordCreatedOn, order.PersonId, order.Finalized, order.TotalCost)
	if err != nil {
		http.Error(w, "Error updating order: "+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, "Record not found or no changes made", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func DeleteOrder(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	query := `DELETE FROM orders.order WHERE orders.order.id = $1;`

	res, err := db.Exec(query, id)
	if err != nil {
		http.Error(w, "Error deleting order: "+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, "Record not found or no changes made", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func PostOrderItem(w http.ResponseWriter, r *http.Request) {
	var orderItem OrderItem
	if err := json.NewDecoder(r.Body).Decode(&orderItem); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `INSERT INTO orders.order_item ( orders.order_item.record_created_on ) VALUES ( $1 ) RETURNING order_id, product_id;`

	err := db.QueryRow(query, orderItem.RecordCreatedOn).Scan(&orderItem.OrderId, &orderItem.ProductId)
	if err != nil {
		http.Error(w, "Error inserting: order-item"+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(orderItem)
}

func GetOrderItem(w http.ResponseWriter, r *http.Request) {
	orderIdStr := r.URL.Query().Get("order_id")
	orderId, err := strconv.Atoi(orderIdStr)
	if err != nil {
		http.Error(w, "Invalid order_id", http.StatusBadRequest)
		return
	}

	productIdStr := r.URL.Query().Get("product_id")
	productId, err := strconv.Atoi(productIdStr)
	if err != nil {
		http.Error(w, "Invalid product_id", http.StatusBadRequest)
		return
	}

	query := `SELECT orders.order_item.record_created_on , orders.order_item.order_id , orders.order_item.product_id FROM orders.order_item WHERE orders.order_item.order_id = $1 AND orders.order_item.product_id = $2;`

	var orderItem OrderItem
	err = db.QueryRow(query, orderId, productId).Scan(&orderItem.RecordCreatedOn, &orderItem.OrderId, &orderItem.ProductId)

	if err == sql.ErrNoRows {
		http.Error(w, "Record not found for this order-item", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Error fetching order-item: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(orderItem)
}

func GetOrderItems(w http.ResponseWriter, r *http.Request) {
	query := `SELECT orders.order_item.record_created_on , orders.order_item.order_id , orders.order_item.product_id FROM orders.order_item;`
	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var orderItems []OrderItem
	for rows.Next() {
		var orderItem OrderItem
		err := rows.Scan(&orderItem.RecordCreatedOn, &orderItem.OrderId, &orderItem.ProductId)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		orderItems = append(orderItems, orderItem)
	}

	if err = rows.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orderItems)
}

func PutOrderItem(w http.ResponseWriter, r *http.Request) {
	orderIdStr := r.URL.Query().Get("order_id")
	orderId, err := strconv.Atoi(orderIdStr)
	if err != nil {
		http.Error(w, "Invalid order_id", http.StatusBadRequest)
		return
	}

	productIdStr := r.URL.Query().Get("product_id")
	productId, err := strconv.Atoi(productIdStr)
	if err != nil {
		http.Error(w, "Invalid product_id", http.StatusBadRequest)
		return
	}

	var orderItem OrderItem
	if err := json.NewDecoder(r.Body).Decode(&orderItem); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `SET orders.order_item.record_created_on = $3 WHERE orders.order_item.order_id = $1 AND orders.order_item.product_id = $2;`

	res, err := db.Exec(query, orderId, productId, orderItem.RecordCreatedOn)
	if err != nil {
		http.Error(w, "Error updating order-item: "+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, "Record not found or no changes made", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func DeleteOrderItem(w http.ResponseWriter, r *http.Request) {
	orderIdStr := r.URL.Query().Get("order_id")
	orderId, err := strconv.Atoi(orderIdStr)
	if err != nil {
		http.Error(w, "Invalid order_id", http.StatusBadRequest)
		return
	}

	productIdStr := r.URL.Query().Get("product_id")
	productId, err := strconv.Atoi(productIdStr)
	if err != nil {
		http.Error(w, "Invalid product_id", http.StatusBadRequest)
		return
	}

	query := `DELETE FROM orders.order_item WHERE orders.order_item.order_id = $1 AND orders.order_item.product_id = $2;`

	res, err := db.Exec(query, orderId, productId)
	if err != nil {
		http.Error(w, "Error deleting order-item: "+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, "Record not found or no changes made", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func main() {
	initDB()
	defer db.Close()

	http.HandleFunc("/person/person", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			GetPersons(w, r)
		case http.MethodPost:
			PostPerson(w, r)
		case http.MethodPut:
			PutPerson(w, r)
		case http.MethodDelete:
			DeletePerson(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/catalog/category", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			GetCategories(w, r)
		case http.MethodPost:
			PostCategory(w, r)
		case http.MethodPut:
			PutCategory(w, r)
		case http.MethodDelete:
			DeleteCategory(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/catalog/product", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			GetProducts(w, r)
		case http.MethodPost:
			PostProduct(w, r)
		case http.MethodPut:
			PutProduct(w, r)
		case http.MethodDelete:
			DeleteProduct(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/shopping_cart/cart", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			GetCarts(w, r)
		case http.MethodPost:
			PostCart(w, r)
		case http.MethodPut:
			PutCart(w, r)
		case http.MethodDelete:
			DeleteCart(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/shopping_cart/cart-item", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			GetCartItems(w, r)
		case http.MethodPost:
			PostCartItem(w, r)
		case http.MethodPut:
			PutCartItem(w, r)
		case http.MethodDelete:
			DeleteCartItem(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/orders/order", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			GetOrders(w, r)
		case http.MethodPost:
			PostOrder(w, r)
		case http.MethodPut:
			PutOrder(w, r)
		case http.MethodDelete:
			DeleteOrder(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/orders/order-item", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			GetOrderItems(w, r)
		case http.MethodPost:
			PostOrderItem(w, r)
		case http.MethodPut:
			PutOrderItem(w, r)
		case http.MethodDelete:
			DeleteOrderItem(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	log.Fatal(http.ListenAndServe(":8080", nil))
}
