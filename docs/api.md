# CDN Origin API

## Caching

Every file response carries an explicit `Cache-Control` so a CDN edge only ever caches
responses that are safe to share with other visitors:

-   Objects readable by anyone (public bucket, public object, or a public parent) get
    `Cache-Control: public, max-age=<PUBLIC_CACHE_MAX_AGE_SECONDS>`.
-   Anything only readable because of a root token or a signed URL gets
    `Cache-Control: private, no-store`, so it is never cached at the edge — the origin's
    authorization check always runs.
-   Metadata (`~meta`) and directory listing (`~objects`) responses are always `no-store`.

Deleting or overwriting a public object automatically purges it from Cloudflare's edge cache
if `CLOUDFLARE_ZONE_ID` / `CLOUDFLARE_API_TOKEN` are configured — otherwise stale content
would keep being served from the edge until `PUBLIC_CACHE_MAX_AGE_SECONDS` expires.

## Main page redirect

The bare CDN domain (e.g. `https://example.com/`, as opposed to a bucket subdomain) has no
content of its own. Set `MAIN_PAGE_REDIRECT_URL` to redirect visitors who land there to
somewhere useful (your main site, docs, etc). Without it, `/` on the bare domain returns a
plain 404. Bucket subdomains are unaffected — they keep serving their own `indexKey` page.

## Origin protection

This server is meant to sit behind Cloudflare, not be reachable directly — direct access
bypasses Cloudflare's caching, WAF, and rate limiting entirely. Set `ORIGIN_SHARED_SECRET`
and configure a Cloudflare Transform Rule (or Worker) that adds a matching `X-Origin-Secret`
header to every request forwarded to this origin; requests without it are rejected with 403.
`/healthz` is exempt so infrastructure health checks (which don't go through Cloudflare) keep
working.

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
	"exp": 1700000000,
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

```
POST example.com/buckets/<bucket_name>
```

```json
{
	"adapter": "blob",
	"owner": null,
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

### Update bucket

**Summary**: Updates a bucket's visibility and index/fallback keys.
**Authorization:** Root access, or a bucket actor matching the bucket name.
**Request:**

```
PATCH example.com/buckets/<bucket_name>
```

```json
{
	"isPublic": true,
	"indexKey": "index.html",
	"notFoundFallbackKey": "404.html",
	"accessDeniedFallbackKey": "403.html"
}
```

All fields are optional; omitted fields are left unchanged. Pass `null` for a fallback/index key to clear it.

**Example response:**

```json
{
	"name": "my-first-bucket",
	"adapter": "blob",
	"owner": null,
	"public": true,
	"indexKey": "index.html",
	"notFoundFallbackKey": "404.html",
	"accessDeniedFallbackKey": "403.html",
	"url": "https://my-first-bucket.example.com",
	"createdAt": "2025-10-24T19:36:39.278Z",
	"updatedAt": "2025-10-24T19:36:39.278Z"
}
```

### Delete bucket

**Summary**: Deletes a specific bucket.  
**Authorization:** Root access required.  
**Request:**

```
DELETE example.com/buckets/<bucket_name>
```

**Example response:**

```
204 No Content
```

### Upload file

**Summary**: Uploads a file to the specified bucket and key.
**Authorization:** Root access required.
**Request:**

```
POST <bucket_name>.example.com/<file_key>
```

**Body**: Raw file data.

**Optional headers:**

-   `X-Expires-At`: An ISO 8601 timestamp. The file is automatically deleted once this time passes.
-   `X-Expires-In`: Number of seconds from now after which the file is automatically deleted. Ignored if `X-Expires-At` is also set.

Expired files are hidden immediately (treated as not found / excluded from directory listings) and are permanently removed from storage by a background cleanup job that runs roughly every minute.

**Example response:**

```json
{
	"bucketName": "my-bucket",
	"key": "cute/cat.png",
	"mimeType": "image/png",
	"size": 154689,
	"public": false,
	"expiresAt": null,
	"url": "http://my-bucket.example.com/cute/cat.png"
}
```

### Delete file

**Summary**: Deletes a file from the specified bucket and key. This will also delete all associated children and parent files if any.
**Authorization:** Root access required.
**Request:**

```
DELETE <bucket_name>.example.com/<file_key>
```

**Example response:**

```
200 OK
File deleted successfully
```

### Search for files by key prefix

**Summary**: Lists files in the specified bucket that start with the given key prefix.
**Authorization:** Root access required.
**Request:**

```
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

```
GET <bucket_name>.example.com/<file_key>
```

**Response:** Returns the raw file content with the appropriate `Content-Type` header.

## Get file metadata

**Summary**: Retrieves metadata of a file from the specified bucket and key.  
**Authorization:** When file or bucket is public, no authentication is required. For private files, either root access or a valid signed URL is required.  
**Request:**

```
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
