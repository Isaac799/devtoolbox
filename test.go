package devtoolboxorg

type User struct {
	ID      int      `json:"id"`
	Name    string   `json:"name"`
	Profile *Profile `json:"profile"`
	Posts   []Post   `json:"posts"`
}

type Profile struct {
	ID     int    `json:"id"`
	Bio    string `json:"bio"`
	UserID int    `json:"userID"`
}

type Post struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
	Users []User `json:"users"`
}

type UserPost struct {
	UserID int `json:"userID"`
	PostID int `json:"postID"`
}
