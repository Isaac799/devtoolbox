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

// person
type InputCreatePerson struct {
	InOutId     int    `json:"in_out_id"`
	NewEmail    string `json:"new_email"`
	NewUsername string `json:"new_username"`
	NewActive   bool   `json:"new_active"`
}
type OutputCreatePerson struct {
	InOutId int `json:"in_out_id"`
}
type InputReadSinglePerson struct {
	TargetId int `json:"target_id"`
}
type OutputReadSinglePerson struct {
	NewEmail    string `json:"new_email"`
	NewUsername string `json:"new_username"`
	NewActive   bool   `json:"new_active"`
}
type InputUpdatePerson struct {
	TargetId    int    `json:"target_id"`
	NewEmail    string `json:"new_email"`
	NewUsername string `json:"new_username"`
	NewActive   bool   `json:"new_active"`
}
type InputDeletePerson struct {
	TargetId int `json:"target_id"`
}
type Person struct {
	Id       int    `json:"id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	Active   bool   `json:"active"`
}

// category
type InputCreateCategory struct {
	InOutId  int    `json:"in_out_id"`
	NewTitle string `json:"new_title"`
}
type OutputCreateCategory struct {
	InOutId int `json:"in_out_id"`
}
type InputReadSingleCategory struct {
	TargetId int `json:"target_id"`
}
type OutputReadSingleCategory struct {
	NewTitle string `json:"new_title"`
}
type OutputReadOptionsCategory struct {
	TargetId    int    `json:"target_id"`
	TargetTitle string `json:"target_title"`
}
type InputUpdateCategory struct {
	TargetId int    `json:"target_id"`
	NewTitle string `json:"new_title"`
}
type InputDeleteCategory struct {
	TargetId int `json:"target_id"`
}
type Category struct {
	Id    int    `json:"id"`
	Title string `json:"title"`
}

// product
type InputCreateProduct struct {
	InOutId  int     `json:"in_out_id"`
	NewTitle string  `json:"new_title"`
	NewPrice float64 `json:"new_price"`
}
type OutputCreateProduct struct {
	InOutId int `json:"in_out_id"`
}
type InputReadSingleProduct struct {
	TargetId int `json:"target_id"`
}
type OutputReadSingleProduct struct {
	NewTitle string  `json:"new_title"`
	NewPrice float64 `json:"new_price"`
}
type OutputReadOptionsProduct struct {
	TargetId    int    `json:"target_id"`
	TargetTitle string `json:"target_title"`
}
type InputUpdateProduct struct {
	TargetId int     `json:"target_id"`
	NewTitle string  `json:"new_title"`
	NewPrice float64 `json:"new_price"`
}
type InputDeleteProduct struct {
	TargetId int `json:"target_id"`
}
type Product struct {
	Id    int     `json:"id"`
	Title string  `json:"title"`
	Price float64 `json:"price"`
}

// product_category
type ProductCategory struct {
	ProductId  int `json:"product_id"`
	CategoryId int `json:"category_id"`
}

// cart
type InputCreateCart struct {
	InOutId     int `json:"in_out_id"`
	NewPersonId int `json:"new_person_id"`
}
type OutputCreateCart struct {
	InOutId int `json:"in_out_id"`
}
type InputReadSingleCart struct {
	TargetId int `json:"target_id"`
}
type OutputReadSingleCart struct {
	NewPersonId int `json:"new_person_id"`
}
type InputDeleteCart struct {
	TargetId int `json:"target_id"`
}
type Cart struct {
	Id       int `json:"id"`
	PersonId int `json:"person_id"`
}

// cart_item
type InputCreateCartItem struct {
	InOutCartId        int       `json:"in_out_cart_id"`
	InOutProductId     int       `json:"in_out_product_id"`
	NewRecordCreatedOn time.Time `json:"new_record_created_on"`
	NewCartId          int       `json:"new_cart_id"`
	NewProductId       int       `json:"new_product_id"`
	NewPriceWhenCarted float64   `json:"new_price_when_carted"`
}
type OutputCreateCartItem struct {
	InOutCartId    int `json:"in_out_cart_id"`
	InOutProductId int `json:"in_out_product_id"`
}
type InputReadSingleCartItem struct {
	TargetCartId    int `json:"target_cart_id"`
	TargetProductId int `json:"target_product_id"`
}
type OutputReadSingleCartItem struct {
	NewRecordCreatedOn time.Time `json:"new_record_created_on"`
	NewCartId          int       `json:"new_cart_id"`
	NewProductId       int       `json:"new_product_id"`
	NewPriceWhenCarted float64   `json:"new_price_when_carted"`
}
type InputDeleteCartItem struct {
	TargetCartId    int `json:"target_cart_id"`
	TargetProductId int `json:"target_product_id"`
}
type CartItem struct {
	RecordCreatedOn time.Time `json:"record_created_on"`
	CartId          int       `json:"cart_id"`
	ProductId       int       `json:"product_id"`
	PriceWhenCarted float64   `json:"price_when_carted"`
}

// order
type InputCreateOrder struct {
	InOutId            int       `json:"in_out_id"`
	NewRecordCreatedOn time.Time `json:"new_record_created_on"`
	NewPersonId        int       `json:"new_person_id"`
	NewFinalized       bool      `json:"new_finalized"`
	NewTotalCost       float64   `json:"new_total_cost"`
}
type OutputCreateOrder struct {
	InOutId int `json:"in_out_id"`
}
type InputReadSingleOrder struct {
	TargetId int `json:"target_id"`
}
type OutputReadSingleOrder struct {
	NewRecordCreatedOn time.Time `json:"new_record_created_on"`
	NewPersonId        int       `json:"new_person_id"`
	NewFinalized       bool      `json:"new_finalized"`
	NewTotalCost       float64   `json:"new_total_cost"`
}
type InputUpdateOrder struct {
	TargetId     int  `json:"target_id"`
	NewFinalized bool `json:"new_finalized"`
}
type InputDeleteOrder struct {
	TargetId int `json:"target_id"`
}
type Order struct {
	RecordCreatedOn time.Time `json:"record_created_on"`
	Id              int       `json:"id"`
	PersonId        int       `json:"person_id"`
	Finalized       bool      `json:"finalized"`
	TotalCost       float64   `json:"total_cost"`
}

// order_item
type InputCreateOrderItem struct {
	InOutOrderId       int       `json:"in_out_order_id"`
	InOutProductId     int       `json:"in_out_product_id"`
	NewRecordCreatedOn time.Time `json:"new_record_created_on"`
	NewOrderId         int       `json:"new_order_id"`
	NewProductId       int       `json:"new_product_id"`
}
type OutputCreateOrderItem struct {
	InOutOrderId   int `json:"in_out_order_id"`
	InOutProductId int `json:"in_out_product_id"`
}
type InputReadSingleOrderItem struct {
	TargetOrderId   int `json:"target_order_id"`
	TargetProductId int `json:"target_product_id"`
}
type OutputReadSingleOrderItem struct {
	NewRecordCreatedOn time.Time `json:"new_record_created_on"`
	NewOrderId         int       `json:"new_order_id"`
	NewProductId       int       `json:"new_product_id"`
}
type InputUpdateOrderItem struct {
	TargetOrderId   int `json:"target_order_id"`
	TargetProductId int `json:"target_product_id"`
	NewOrderId      int `json:"new_order_id"`
	NewProductId    int `json:"new_product_id"`
}
type InputDeleteOrderItem struct {
	TargetOrderId   int `json:"target_order_id"`
	TargetProductId int `json:"target_product_id"`
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

func CreatePerson(w http.ResponseWriter, r *http.Request) {
	var inputCreatePerson InputCreatePerson
	if err := json.NewDecoder(r.Body).Decode(&inputCreatePerson); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `INSERT INTO person.person ( person.person.email, person.person.username, person.person.active ) VALUES ( $1, $2, $3 ) RETURNING id INTO in_out_id;`

	var outputCreatePerson OutputCreatePerson

	err := db.QueryRow(query, inputCreatePerson.InOutId, inputCreatePerson.NewEmail, inputCreatePerson.NewUsername, inputCreatePerson.NewActive).Scan(&outputCreatePerson)
	if err != nil {
		http.Error(w, "Error inserting: person"+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(outputCreatePerson)
}

func ReadSinglePerson(w http.ResponseWriter, r *http.Request) {
	targetIdStr := r.URL.Query().Get("target_id")
	targetId, err := strconv.Atoi(targetIdStr)
	if err != nil {
		http.Error(w, "Invalid target_id", http.StatusBadRequest)
		return
	}

	query := `SELECT person.person.email , person.person.username , person.person.active FROM person.person WHERE person.person.id = $1;`

	var outputReadSinglePerson OutputReadSinglePerson
	err = db.QueryRow(query, targetId).Scan(&outputReadSinglePerson)

	if err == sql.ErrNoRows {
		http.Error(w, "Record not found for this person", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Error fetching person: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(outputReadSinglePerson)
}

func UpdatePerson(w http.ResponseWriter, r *http.Request) {
	var inputUpdatePerson InputUpdatePerson
	if err := json.NewDecoder(r.Body).Decode(&inputUpdatePerson); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `SET person.person.email = $2, person.person.username = $3, person.person.active = $4 WHERE person.person.id = $1;`

	res, err := db.Exec(query, inputUpdatePerson.TargetId, inputUpdatePerson.NewEmail, inputUpdatePerson.NewUsername, inputUpdatePerson.NewActive)
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
	var inputDeletePerson InputDeletePerson
	if err := json.NewDecoder(r.Body).Decode(&inputDeletePerson); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `DELETE FROM person.person WHERE person.person.id = $1;`

	res, err := db.Exec(query, inputDeletePerson.TargetId)
	if err != nil {
		http.Error(w, "Error deleting: person"+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, "Record not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func CreateCategory(w http.ResponseWriter, r *http.Request) {
	var inputCreateCategory InputCreateCategory
	if err := json.NewDecoder(r.Body).Decode(&inputCreateCategory); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `INSERT INTO catalog.category ( catalog.category.title ) VALUES ( $1 ) RETURNING id INTO in_out_id;`

	var outputCreateCategory OutputCreateCategory

	err := db.QueryRow(query, inputCreateCategory.InOutId, inputCreateCategory.NewTitle).Scan(&outputCreateCategory)
	if err != nil {
		http.Error(w, "Error inserting: category"+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(outputCreateCategory)
}

func ReadSingleCategory(w http.ResponseWriter, r *http.Request) {
	targetIdStr := r.URL.Query().Get("target_id")
	targetId, err := strconv.Atoi(targetIdStr)
	if err != nil {
		http.Error(w, "Invalid target_id", http.StatusBadRequest)
		return
	}

	query := `SELECT catalog.category.title FROM catalog.category WHERE catalog.category.id = $1;`

	var outputReadSingleCategory OutputReadSingleCategory
	err = db.QueryRow(query, targetId).Scan(&outputReadSingleCategory)

	if err == sql.ErrNoRows {
		http.Error(w, "Record not found for this category", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Error fetching category: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(outputReadSingleCategory)
}

func ReadOptionsCategory(w http.ResponseWriter, r *http.Request) {
	query := `SELECT catalog.category.id , catalog.category.title FROM catalog.category;`

	var outputReadOptionsCategory OutputReadOptionsCategory
	err := db.QueryRow(query).Scan(&outputReadOptionsCategory)

	if err == sql.ErrNoRows {
		http.Error(w, "Record not found for this category", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Error fetching category: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(outputReadOptionsCategory)
}

func UpdateCategory(w http.ResponseWriter, r *http.Request) {
	var inputUpdateCategory InputUpdateCategory
	if err := json.NewDecoder(r.Body).Decode(&inputUpdateCategory); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `SET catalog.category.title = $2 WHERE catalog.category.id = $1;`

	res, err := db.Exec(query, inputUpdateCategory.TargetId, inputUpdateCategory.NewTitle)
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
	var inputDeleteCategory InputDeleteCategory
	if err := json.NewDecoder(r.Body).Decode(&inputDeleteCategory); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `DELETE FROM catalog.category WHERE catalog.category.id = $1;`

	res, err := db.Exec(query, inputDeleteCategory.TargetId)
	if err != nil {
		http.Error(w, "Error deleting: category"+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, "Record not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func CreateProduct(w http.ResponseWriter, r *http.Request) {
	var inputCreateProduct InputCreateProduct
	if err := json.NewDecoder(r.Body).Decode(&inputCreateProduct); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `INSERT INTO catalog.product ( catalog.product.title, catalog.product.price ) VALUES ( $1, $2 ) RETURNING id INTO in_out_id;`

	var outputCreateProduct OutputCreateProduct

	err := db.QueryRow(query, inputCreateProduct.InOutId, inputCreateProduct.NewTitle, inputCreateProduct.NewPrice).Scan(&outputCreateProduct)
	if err != nil {
		http.Error(w, "Error inserting: product"+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(outputCreateProduct)
}

func ReadSingleProduct(w http.ResponseWriter, r *http.Request) {
	targetIdStr := r.URL.Query().Get("target_id")
	targetId, err := strconv.Atoi(targetIdStr)
	if err != nil {
		http.Error(w, "Invalid target_id", http.StatusBadRequest)
		return
	}

	query := `SELECT catalog.product.title , catalog.product.price FROM catalog.product WHERE catalog.product.id = $1;`

	var outputReadSingleProduct OutputReadSingleProduct
	err = db.QueryRow(query, targetId).Scan(&outputReadSingleProduct)

	if err == sql.ErrNoRows {
		http.Error(w, "Record not found for this product", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Error fetching product: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(outputReadSingleProduct)
}

func ReadOptionsProduct(w http.ResponseWriter, r *http.Request) {
	query := `SELECT catalog.product.id , catalog.product.title FROM catalog.product;`

	var outputReadOptionsProduct OutputReadOptionsProduct
	err := db.QueryRow(query).Scan(&outputReadOptionsProduct)

	if err == sql.ErrNoRows {
		http.Error(w, "Record not found for this product", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Error fetching product: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(outputReadOptionsProduct)
}

func UpdateProduct(w http.ResponseWriter, r *http.Request) {
	var inputUpdateProduct InputUpdateProduct
	if err := json.NewDecoder(r.Body).Decode(&inputUpdateProduct); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `SET catalog.product.title = $2, catalog.product.price = $3 WHERE catalog.product.id = $1;`

	res, err := db.Exec(query, inputUpdateProduct.TargetId, inputUpdateProduct.NewTitle, inputUpdateProduct.NewPrice)
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
	var inputDeleteProduct InputDeleteProduct
	if err := json.NewDecoder(r.Body).Decode(&inputDeleteProduct); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `DELETE FROM catalog.product WHERE catalog.product.id = $1;`

	res, err := db.Exec(query, inputDeleteProduct.TargetId)
	if err != nil {
		http.Error(w, "Error deleting: product"+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, "Record not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func CreateCart(w http.ResponseWriter, r *http.Request) {
	var inputCreateCart InputCreateCart
	if err := json.NewDecoder(r.Body).Decode(&inputCreateCart); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `INSERT INTO shopping_cart.cart ( shopping_cart.cart.person_id ) VALUES ( $1 ) RETURNING id INTO in_out_id;`

	var outputCreateCart OutputCreateCart

	err := db.QueryRow(query, inputCreateCart.InOutId, inputCreateCart.NewPersonId).Scan(&outputCreateCart)
	if err != nil {
		http.Error(w, "Error inserting: cart"+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(outputCreateCart)
}

func ReadSingleCart(w http.ResponseWriter, r *http.Request) {
	targetIdStr := r.URL.Query().Get("target_id")
	targetId, err := strconv.Atoi(targetIdStr)
	if err != nil {
		http.Error(w, "Invalid target_id", http.StatusBadRequest)
		return
	}

	query := `SELECT shopping_cart.cart.person_id FROM shopping_cart.cart WHERE shopping_cart.cart.id = $1;`

	var outputReadSingleCart OutputReadSingleCart
	err = db.QueryRow(query, targetId).Scan(&outputReadSingleCart)

	if err == sql.ErrNoRows {
		http.Error(w, "Record not found for this cart", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Error fetching cart: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(outputReadSingleCart)
}

func DeleteCart(w http.ResponseWriter, r *http.Request) {
	var inputDeleteCart InputDeleteCart
	if err := json.NewDecoder(r.Body).Decode(&inputDeleteCart); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `DELETE FROM shopping_cart.cart WHERE shopping_cart.cart.id = $1;`

	res, err := db.Exec(query, inputDeleteCart.TargetId)
	if err != nil {
		http.Error(w, "Error deleting: cart"+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, "Record not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func CreateCartItem(w http.ResponseWriter, r *http.Request) {
	var inputCreateCartItem InputCreateCartItem
	if err := json.NewDecoder(r.Body).Decode(&inputCreateCartItem); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `INSERT INTO shopping_cart.cart_item ( shopping_cart.cart_item.record_created_on, shopping_cart.cart_item.cart_id, shopping_cart.cart_item.product_id, shopping_cart.cart_item.price_when_carted ) VALUES ( $1, $2, $3, $4 ) RETURNING cart_id,product_id INTO in_out_cart_id,in_out_product_id;`

	var outputCreateCartItem OutputCreateCartItem

	err := db.QueryRow(query, inputCreateCartItem.InOutCartId, inputCreateCartItem.InOutProductId, inputCreateCartItem.NewRecordCreatedOn, inputCreateCartItem.NewCartId, inputCreateCartItem.NewProductId, inputCreateCartItem.NewPriceWhenCarted).Scan(&outputCreateCartItem)
	if err != nil {
		http.Error(w, "Error inserting: cart-item"+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(outputCreateCartItem)
}

func ReadSingleCartItem(w http.ResponseWriter, r *http.Request) {
	targetCartIdStr := r.URL.Query().Get("target_cart_id")
	targetCartId, err := strconv.Atoi(targetCartIdStr)
	if err != nil {
		http.Error(w, "Invalid target_cart_id", http.StatusBadRequest)
		return
	}

	targetProductIdStr := r.URL.Query().Get("target_product_id")
	targetProductId, err := strconv.Atoi(targetProductIdStr)
	if err != nil {
		http.Error(w, "Invalid target_product_id", http.StatusBadRequest)
		return
	}

	query := `SELECT shopping_cart.cart_item.record_created_on , shopping_cart.cart_item.cart_id , shopping_cart.cart_item.product_id , shopping_cart.cart_item.price_when_carted FROM shopping_cart.cart_item WHERE shopping_cart.cart_item.cart_id = $1 AND shopping_cart.cart_item.product_id = $2;`

	var outputReadSingleCartItem OutputReadSingleCartItem
	err = db.QueryRow(query, targetCartId, targetProductId).Scan(&outputReadSingleCartItem)

	if err == sql.ErrNoRows {
		http.Error(w, "Record not found for this cart-item", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Error fetching cart-item: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(outputReadSingleCartItem)
}

func DeleteCartItem(w http.ResponseWriter, r *http.Request) {
	var inputDeleteCartItem InputDeleteCartItem
	if err := json.NewDecoder(r.Body).Decode(&inputDeleteCartItem); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `DELETE FROM shopping_cart.cart_item WHERE shopping_cart.cart_item.cart_id = $1 AND shopping_cart.cart_item.product_id = $2;`

	res, err := db.Exec(query, inputDeleteCartItem.TargetCartId, inputDeleteCartItem.TargetProductId)
	if err != nil {
		http.Error(w, "Error deleting: cart-item"+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, "Record not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func CreateOrder(w http.ResponseWriter, r *http.Request) {
	var inputCreateOrder InputCreateOrder
	if err := json.NewDecoder(r.Body).Decode(&inputCreateOrder); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `INSERT INTO orders.order ( orders.order.record_created_on, orders.order.person_id, orders.order.finalized, orders.order.total_cost ) VALUES ( $1, $2, $3, $4 ) RETURNING id INTO in_out_id;`

	var outputCreateOrder OutputCreateOrder

	err := db.QueryRow(query, inputCreateOrder.InOutId, inputCreateOrder.NewRecordCreatedOn, inputCreateOrder.NewPersonId, inputCreateOrder.NewFinalized, inputCreateOrder.NewTotalCost).Scan(&outputCreateOrder)
	if err != nil {
		http.Error(w, "Error inserting: order"+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(outputCreateOrder)
}

func ReadSingleOrder(w http.ResponseWriter, r *http.Request) {
	targetIdStr := r.URL.Query().Get("target_id")
	targetId, err := strconv.Atoi(targetIdStr)
	if err != nil {
		http.Error(w, "Invalid target_id", http.StatusBadRequest)
		return
	}

	query := `SELECT orders.order.record_created_on , orders.order.person_id , orders.order.finalized , orders.order.total_cost FROM orders.order WHERE orders.order.id = $1;`

	var outputReadSingleOrder OutputReadSingleOrder
	err = db.QueryRow(query, targetId).Scan(&outputReadSingleOrder)

	if err == sql.ErrNoRows {
		http.Error(w, "Record not found for this order", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Error fetching order: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(outputReadSingleOrder)
}

func UpdateOrder(w http.ResponseWriter, r *http.Request) {
	var inputUpdateOrder InputUpdateOrder
	if err := json.NewDecoder(r.Body).Decode(&inputUpdateOrder); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `SET orders.order.finalized = $2 WHERE orders.order.id = $1;`

	res, err := db.Exec(query, inputUpdateOrder.TargetId, inputUpdateOrder.NewFinalized)
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
	var inputDeleteOrder InputDeleteOrder
	if err := json.NewDecoder(r.Body).Decode(&inputDeleteOrder); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `DELETE FROM orders.order WHERE orders.order.id = $1;`

	res, err := db.Exec(query, inputDeleteOrder.TargetId)
	if err != nil {
		http.Error(w, "Error deleting: order"+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, "Record not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func CreateOrderItem(w http.ResponseWriter, r *http.Request) {
	var inputCreateOrderItem InputCreateOrderItem
	if err := json.NewDecoder(r.Body).Decode(&inputCreateOrderItem); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `INSERT INTO orders.order_item ( orders.order_item.record_created_on, orders.order_item.order_id, orders.order_item.product_id ) VALUES ( $1, $2, $3 ) RETURNING order_id,product_id INTO in_out_order_id,in_out_product_id;`

	var outputCreateOrderItem OutputCreateOrderItem

	err := db.QueryRow(query, inputCreateOrderItem.InOutOrderId, inputCreateOrderItem.InOutProductId, inputCreateOrderItem.NewRecordCreatedOn, inputCreateOrderItem.NewOrderId, inputCreateOrderItem.NewProductId).Scan(&outputCreateOrderItem)
	if err != nil {
		http.Error(w, "Error inserting: order-item"+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(outputCreateOrderItem)
}

func ReadSingleOrderItem(w http.ResponseWriter, r *http.Request) {
	targetOrderIdStr := r.URL.Query().Get("target_order_id")
	targetOrderId, err := strconv.Atoi(targetOrderIdStr)
	if err != nil {
		http.Error(w, "Invalid target_order_id", http.StatusBadRequest)
		return
	}

	targetProductIdStr := r.URL.Query().Get("target_product_id")
	targetProductId, err := strconv.Atoi(targetProductIdStr)
	if err != nil {
		http.Error(w, "Invalid target_product_id", http.StatusBadRequest)
		return
	}

	query := `SELECT orders.order_item.record_created_on , orders.order_item.order_id , orders.order_item.product_id FROM orders.order_item WHERE orders.order_item.order_id = $1 AND orders.order_item.product_id = $2;`

	var outputReadSingleOrderItem OutputReadSingleOrderItem
	err = db.QueryRow(query, targetOrderId, targetProductId).Scan(&outputReadSingleOrderItem)

	if err == sql.ErrNoRows {
		http.Error(w, "Record not found for this order-item", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Error fetching order-item: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(outputReadSingleOrderItem)
}

func UpdateOrderItem(w http.ResponseWriter, r *http.Request) {
	var inputUpdateOrderItem InputUpdateOrderItem
	if err := json.NewDecoder(r.Body).Decode(&inputUpdateOrderItem); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `SET orders.order_item.order_id = $3, orders.order_item.product_id = $4 WHERE orders.order_item.order_id = $1 AND orders.order_item.product_id = $2;`

	res, err := db.Exec(query, inputUpdateOrderItem.TargetOrderId, inputUpdateOrderItem.TargetProductId, inputUpdateOrderItem.NewOrderId, inputUpdateOrderItem.NewProductId)
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
	var inputDeleteOrderItem InputDeleteOrderItem
	if err := json.NewDecoder(r.Body).Decode(&inputDeleteOrderItem); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `DELETE FROM orders.order_item WHERE orders.order_item.order_id = $1 AND orders.order_item.product_id = $2;`

	res, err := db.Exec(query, inputDeleteOrderItem.TargetOrderId, inputDeleteOrderItem.TargetProductId)
	if err != nil {
		http.Error(w, "Error deleting: order-item"+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, "Record not found", http.StatusNotFound)
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
			ReadSinglePerson(w, r)
		case http.MethodPost:
			CreatePerson(w, r)
		case http.MethodPut:
			UpdatePerson(w, r)
		case http.MethodDelete:
			DeletePerson(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/catalog/category", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			ReadOptionsCategory(w, r)
		case http.MethodPost:
			CreateCategory(w, r)
		case http.MethodPut:
			UpdateCategory(w, r)
		case http.MethodDelete:
			DeleteCategory(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/catalog/product", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			ReadOptionsProduct(w, r)
		case http.MethodPost:
			CreateProduct(w, r)
		case http.MethodPut:
			UpdateProduct(w, r)
		case http.MethodDelete:
			DeleteProduct(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/shopping_cart/cart", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			ReadSingleCart(w, r)
		case http.MethodPost:
			CreateCart(w, r)
		case http.MethodDelete:
			DeleteCart(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/shopping_cart/cart-item", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			ReadSingleCartItem(w, r)
		case http.MethodPost:
			CreateCartItem(w, r)
		case http.MethodDelete:
			DeleteCartItem(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/orders/order", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			ReadSingleOrder(w, r)
		case http.MethodPost:
			CreateOrder(w, r)
		case http.MethodPut:
			UpdateOrder(w, r)
		case http.MethodDelete:
			DeleteOrder(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/orders/order-item", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			ReadSingleOrderItem(w, r)
		case http.MethodPost:
			CreateOrderItem(w, r)
		case http.MethodPut:
			UpdateOrderItem(w, r)
		case http.MethodDelete:
			DeleteOrderItem(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	log.Fatal(http.ListenAndServe(":8080", nil))
}
