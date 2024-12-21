package devtoolboxorg

type User struct {
	ID      int      `json:"id"`
	Name    string   `json:"name"`
	Profile *Profile `json:"profile"`
	Posts   []Post   `json:"posts"`
}

func NewUser(id int, name string) *User {
	return &User{
		ID:      id,
		Name:    name,
		Profile: nil,
		Posts:   []Post{},
	}
}

type Profile struct {
	ID     int    `json:"id"`
	Bio    string `json:"bio"`
	UserID int    `json:"user_id"`
}

func NewProfile(id int, bio string, userID int) *Profile {
	return &Profile{
		ID:     id,
		Bio:    bio,
		UserID: userID,
	}
}

type Post struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
	Users []User `json:"users"`
}

func NewPost(id int, title string) *Post {
	return &Post{
		ID:    id,
		Title: title,
		Users: []User{},
	}
}

type UserPost struct {
	UserID int `json:"user_id"`
	PostID int `json:"post_id"`
}

func NewUserPost(userID int, postID int) *UserPost {
	return &UserPost{
		UserID: userID,
		PostID: postID,
	}
}
