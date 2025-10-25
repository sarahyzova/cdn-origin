# CDN Origin API

## Authentication

Public files and files within public buckets can be accessed without authentication.  
To access private files you need signed URL or to authenticate as root user.

### Root access

Note that this authentication method is only intended for server-to-server communication and should not be used in client applications !!!

To authenticate as root user use `JWT_SECRET` from `.env` file in Authorization header.

**Example header:**

```http
Authorization: Bearer <JWT_SECRET>
```

### Signed URLs

To generate signed URL you need to append `signature` query parameter to the url with a JSON Web Token (JWT) as its value. The JWT should be signed using the same `JWT_SECRET` as used for root authentication.

**JWT payload:**

```JSON
{
	"action": "read",
	"bucket": "BUCKET_NAME_HERE",
	"key": "FILE_PATH_HERE",
	"exp": 1700000000, // Unix timestamp when the signature expires
}
```

## Endpoints

List of available API endpoints and their description.  
Domain `example.com` should be replaced with your actual CDN domain.

### List buckets

**Summary**: Retrieves a list of all buckets.  
**Authorization:** Root access required.  
**Request:**

```
GET example.com/buckets
```

**Example response:**

```json
[
	{
		"name": "my-first-bucket",
		"adapter": "blob",
		"owner": null,
		"public": true,
		"url": "https://my-first-bucket.example.com",
		"createdAt": "2025-10-24T19:36:39.278Z",
		"updatedAt": "2025-10-24T19:36:39.278Z"
	}
]
```

### Get bucket

**Summary**: Retrieves a specific bucket.  
**Authorization:** Root access required.  
**Request:**

```
GET example.com/buckets/<bucket_name>
```

**Example response:**

```json
{
	"name": "my-first-bucket",
	"adapter": "blob",
	"owner": null,
	"public": true,
	"url": "https://my-first-bucket.example.com",
	"createdAt": "2025-10-24T19:36:39.278Z",
	"updatedAt": "2025-10-24T19:36:39.278Z"
}
```

### Create bucket

**Summary**: Create a new bucket.  
**Authorization:** Root access required.  
**Request:**

```http
POST example.com/buckets/<bucket_name>
```

```json
{
	// blob or keypath (recommended: blob)
	"adapter": "blob",

	// Can be null or any string. Used for external purposes.
	"owner": null,

	// If true, all files in the bucket are public
	"isPublic": false
}
```

**Example response:**

```json
{
	"name": "my-first-bucket",
	"adapter": "blob",
	"owner": null,
	"public": true,
	"url": "https://my-first-bucket.example.com",
	"createdAt": "2025-10-24T19:36:39.278Z",
	"updatedAt": "2025-10-24T19:36:39.278Z"
}
```

### Delete bucket

**Summary**: Deletes a specific bucket.  
**Authorization:** Root access required.  
**Request:**

```http
DELETE example.com/buckets/<bucket_name>
```

**Example response:**

```http
204 No Content
```

### Upload file

**Summary**: Uploads a file to the specified bucket and key.
**Authorization:** Root access required.
**Request:**

```http
POST <bucket_name>.example.com/<file_key>
```

**Body**: Raw file data.  
**Example response:**

```json
{
	"bucketName": "my-bucket",
	"key": "cute/cat.png",
	"mimeType": "image/png",
	"size": 154689,
	"public": false,
	"url": "http://my-bucket.example.com/cute/cat.png"
}
```

### Delete file

**Summary**: Deletes a file from the specified bucket and key. This will also delete all associated children and parent files if any.
**Authorization:** Root access required.
**Request:**

```http
DELETE <bucket_name>.example.com/<file_key>
```

**Example response:**

```http
200 OK
File deleted successfully
```

### Search for files by key prefix

**Summary**: Lists files in the specified bucket that start with the given key prefix.
**Authorization:** Root access required.
**Request:**

```http
GET <bucket_name>.example.com/~objects/<key_prefix>
```

**Example response:**

```json
[
	{
		"bucketName": "my-bucket",
		"key": "cute/cat.png",
		"mimeType": "image/png",
		"size": 154689,
		"public": false,
		"url": "http://my-bucket.example.com/cute/cat.png"
	}
]
```

### Get file content

**Summary**: Retrieves the content of a file from the specified bucket and key.  
**Authorization:** When file or bucket is public, no authentication is required. For private files, either root access or a valid signed URL is required.  
**Request:**

```http
GET <bucket_name>.example.com/<file_key>
```

**Response:** Returns the raw file content with the appropriate `Content-Type` header.

## Get file metadata

**Summary**: Retrieves metadata of a file from the specified bucket and key.  
**Authorization:** When file or bucket is public, no authentication is required. For private files, either root access or a valid signed URL is required.  
**Request:**

```http
GET <bucket_name>.example.com/~meta/<file_key>
```

**Example response:**

```json
{
	"bucketName": "my-bucket",
	"key": "cute/cat.png",
	"mimeType": "image/png",
	"size": 154689,
	"public": false,
	"url": "http://my-bucket.example.com/cute/cat.png",
	"bucket": {
		"name": "my-bucket",
		"adapter": "blob",
		"owner": null,
		"public": true,
		"url": "https://my-bucket.example.com",
		"createdAt": "2025-10-24T19:36:39.278Z",
		"updatedAt": "2025-10-24T19:36:39.278Z"
	},
	"parent": null,
	"children": []
}
```
