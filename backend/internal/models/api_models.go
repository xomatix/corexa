package models

type SaveAction string

const (
	InsertAction SaveAction = "insert"
	UpdateAction SaveAction = "update"
	DeleteAction SaveAction = "delete"
)

type SaveRequest struct {
	Collection string                 `json:"collection"`
	SessionId  string                 `json:"session_id"`
	Action     SaveAction             `json:"action"` // accepts InsertAction, UpdateAction, or DeleteAction
	Data       map[string]interface{} `json:"data"`
}

type SelectRequest struct {
	Collection string     `json:"collection"`
	SessionId  string     `json:"session_id"`
	Filter     string     `json:"filter"`
	Expand     string     `json:"expand"`
	Pagination Pagination `json:"pagination"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
}

type Pagination struct {
	Limit  uint64 `json:"limit"`
	Offset uint64 `json:"offset"`
}

type SelectResponse struct {
	Data       []map[string]interface{} `json:"data"`
	Pagination PaginationInfo           `json:"pagination"`
}

type PaginationInfo struct {
	Size  uint64 `json:"size"`
	Page  uint64 `json:"page"`
	Total uint64 `json:"total"`
}

type CollectionPermission struct {
	ID           string `json:"id"`
	CollectionID string `json:"collection_id"`
	Action       string `json:"action"`
	Condition    string `json:"condition"`
}

type SessionUser struct {
	ID          string `json:"id"`
	SessionID   string `json:"session_id"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	Email       string `json:"email"`
	IsActive    string `json:"is_active"`
	IsSuperuser bool   `json:"is_superuser"`
}
