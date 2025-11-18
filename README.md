## Quick Start

Get the system running in 3 steps:

### Requirements

- [Bun.js](https://bun.com)
- [GoLang](https://go.dev)

#### 1 Create config.json file inside of backend directory

```
{
  "database": {
    "dbname": "name",
    "sslmode": "disable",
    "port": 5432,
    "user": "username",
    "host": "host",
    "password": "password"
  }
}

```

#### 2 Run backend

```
cd backend
go run .
```

#### 3 Install Dependencies

```
cd frontend
bun install
```

#### 4 Run frontend

```
cd frontend
bun run dev
```
