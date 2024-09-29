package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	_ "github.com/lib/pq"
)

var db *sql.DB

type Person struct {
	Id     int    `json:"id"`
	Email  string `json:"email"`
	Name   string `json:"name"`
	Active bool   `json:"active"`
}

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

	query := `INSERT INTO employee.person ( employee.person.email, employee.person.name, employee.person.active ) VALUES ( $1, $2, $3 ) RETURNING id;`

	err := db.QueryRow(query, person.Email, person.Name, person.Active).Scan(&person.Id)
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

	query := `SELECT employee.person.id , employee.person.email , employee.person.name , employee.person.active FROM employee.person WHERE employee.person.id = $1;`

	var person Person
	err = db.QueryRow(query, id).Scan(&person.Id, &person.Email, &person.Name, &person.Active)

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
	query := `SELECT employee.person.id , employee.person.email , employee.person.name , employee.person.active FROM employee.person;`
	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var persons []Person
	for rows.Next() {
		var person Person
		err := rows.Scan(&person.Id, &person.Email, &person.Name, &person.Active)
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

	query := `SET employee.person.email = $2, employee.person.name = $3, employee.person.active = $4 WHERE employee.person.id = $1;`

	res, err := db.Exec(query, id, person.Email, person.Name, person.Active)
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

	query := `DELETE FROM employee.person WHERE employee.person.id = $1;`

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

func main() {
	initDB()
	defer db.Close()

	http.HandleFunc("/employee/person", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			GetPersons(w, r)
		case http.MethodPost:
			PostPerson(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/employee/person/:id", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			GetPerson(w, r)
		case http.MethodPut:
			PutPerson(w, r)
		case http.MethodDelete:
			DeletePerson(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	log.Fatal(http.ListenAndServe(":8080", nil))
}
