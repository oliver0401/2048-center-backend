# Play Record API Endpoints

## Overview
The Play Record API allows users to save, retrieve, and manage their 2048 game play records. Play history files are uploaded to S3 and stored as URLs in the database.

## Endpoint Usage Patterns

### For the requested functionality:

1. **Replays added on a specific date:**
   ```bash
   GET /records/search?date=2024-01-15
   ```

2. **Replays sorted by MaxScore:**
   ```bash
   GET /records/search?sortBy=score&sortOrder=desc
   ```

3. **Replays sorted by MaxMoves:**
   ```bash
   GET /records/search?sortBy=moves&sortOrder=desc
   ```

### Combined filtering and sorting:
```bash
# Get top 20 scores from a specific date
GET /records/search?date=2024-01-15&sortBy=score&sortOrder=desc&limit=20

# Get records from date range sorted by moves
GET /records/date-range?startDate=2024-01-01&endDate=2024-01-31
```

## Endpoints

### 1. Save Play Record
**POST** `/records/`

Saves a new play record with optional play history string.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json` (required)

**Body (JSON):**
- `date` (string, required): Game date in ISO format
- `move` (number, required): Number of moves made
- `score` (number, required): Final score achieved
- `rows` (number, required): Number of rows in the game grid
- `columns` (number, required): Number of columns in the game grid
- `playTime` (number, required): Total play time in seconds
- `playHistory` (string, optional): JSON string containing detailed play history

**Response:**
```json
{
  "success": true,
  "message": "Play record saved successfully",
  "record": {
    "uuid": "record-uuid",
    "userId": "user-uuid",
    "date": "2024-01-01T00:00:00.000Z",
    "move": 150,
    "score": 2048,
    "rows": 4,
    "columns": 4,
    "playTime": 300,
    "playHistoryUrl": "https://bucket.s3.region.amazonaws.com/play-history/user-uuid/file.json",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Get User Records
**GET** `/records/`

Retrieves paginated list of user's play records.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `limit` (number, optional): Number of records to return (1-100, default: 10)
- `offset` (number, optional): Number of records to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "message": "Play records retrieved successfully",
  "records": [
    {
      "uuid": "record-uuid",
      "userId": "user-uuid",
      "date": "2024-01-01T00:00:00.000Z",
      "move": 150,
      "score": 2048,
      "rows": 4,
      "columns": 4,
      "playTime": 300,
      "playHistoryUrl": "https://bucket.s3.region.amazonaws.com/play-history/user-uuid/file.json",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "count": 1
  }
}
```

### 3. Get Record by ID
**GET** `/records/:recordId`

Retrieves a specific play record by ID.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `recordId` (string, required): UUID of the record

**Response:**
```json
{
  "success": true,
  "message": "Play record retrieved successfully",
  "record": {
    "uuid": "record-uuid",
    "userId": "user-uuid",
    "date": "2024-01-01T00:00:00.000Z",
    "move": 150,
    "score": 2048,
    "rows": 4,
    "columns": 4,
    "playTime": 300,
    "playHistoryUrl": "https://bucket.s3.region.amazonaws.com/play-history/user-uuid/file.json",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Search Records (Advanced)
**GET** `/records/search`

Searches and filters play records with advanced sorting options.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `date` (string, optional): Filter by specific date (YYYY-MM-DD format)
- `sortBy` (string, optional): Sort by 'score', 'moves', or 'date' (default: 'date')
- `sortOrder` (string, optional): Sort order 'asc' or 'desc' (default: 'desc')
- `limit` (number, optional): Number of records to return (1-100, default: 10)
- `offset` (number, optional): Number of records to skip (default: 0)

**Examples:**
```bash
# Get records sorted by highest score
GET /records/search?sortBy=score&sortOrder=desc&limit=20

# Get records from a specific date sorted by moves
GET /records/search?date=2024-01-15&sortBy=moves&sortOrder=desc

# Get records sorted by date (newest first)
GET /records/search?sortBy=date&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "message": "Play records retrieved successfully",
  "records": [
    {
      "uuid": "record-uuid",
      "user": {
        "uuid": "user-uuid",
        "address": "0x123...",
        "maxScore": 4096
      },
      "date": "2024-01-01T00:00:00.000Z",
      "move": 150,
      "score": 2048,
      "rows": 4,
      "cols": 4,
      "playTime": 300,
      "playHistoryUrl": "https://bucket.s3.region.amazonaws.com/play-history/user-uuid/file.json",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 25,
    "hasMore": true
  },
  "filters": {
    "date": "2024-01-15",
    "sortBy": "score",
    "sortOrder": "desc"
  }
}
```

### 5. Get Records by Date Range
**GET** `/records/date-range`

Retrieves play records within a specific date range.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `startDate` (string, required): Start date in YYYY-MM-DD format
- `endDate` (string, required): End date in YYYY-MM-DD format
- `limit` (number, optional): Number of records to return (1-100, default: 10)
- `offset` (number, optional): Number of records to skip (default: 0)

**Example:**
```bash
GET /records/date-range?startDate=2024-01-01&endDate=2024-01-31&limit=50
```

**Response:**
```json
{
  "success": true,
  "message": "Play records retrieved successfully",
  "records": [
    {
      "uuid": "record-uuid",
      "user": {
        "uuid": "user-uuid",
        "address": "0x123...",
        "maxScore": 4096
      },
      "date": "2024-01-15T00:00:00.000Z",
      "move": 150,
      "score": 2048,
      "rows": 4,
      "cols": 4,
      "playTime": 300,
      "playHistoryUrl": "https://bucket.s3.region.amazonaws.com/play-history/user-uuid/file.json",
      "createdAt": "2024-01-15T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 15,
    "hasMore": false
  },
  "filters": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }
}
```

### 6. Delete Record
**DELETE** `/records/:recordId`

Deletes a specific play record.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `recordId` (string, required): UUID of the record

**Response:**
```json
{
  "success": true,
  "message": "Play record deleted successfully"
}
```

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "error": true,
  "message": "Missing required fields"
}
```

**401 Unauthorized:**
```json
{
  "error": true,
  "message": "You are not the owner of this record"
}
```

**404 Not Found:**
```json
{
  "error": true,
  "message": "Play record not found"
}
```

## Database Schema

### Record Entity
- `uuid` (string, primary key): Unique identifier
- `userId` (string, foreign key): Reference to user
- `date` (timestamp): Game date
- `move` (integer): Number of moves
- `score` (integer): Final score
- `rows` (integer): Grid rows
- `columns` (integer): Grid columns
- `playTime` (integer): Play time in seconds
- `playHistoryUrl` (string, nullable): S3 URL for play history file
- `createdAt` (timestamp): Record creation time
- `updatedAt` (timestamp): Last update time
- `deletedAt` (timestamp, nullable): Soft delete timestamp

## S3 Storage

Play history strings are stored in S3 as JSON files with the following structure:
- Bucket: `evofuse2048` (configurable via `AWS_S3_BUCKET_NAME`)
- Path: `play-history/{userId}/{uuid}.json`
- Content-Type: `application/json`
- Content: JSON string provided in the request body
