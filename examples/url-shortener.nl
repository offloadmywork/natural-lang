@ShortURL
A short URL has a unique short code (6 alphanumeric characters), original URL, creation timestamp, expiration date (optional), and creator (optional, if authenticated).
The short code must be unique and URL-safe (letters, numbers only).
Original URLs must be valid HTTP or HTTPS URLs.
URLs can have an optional expiration date after which they redirect to an "expired" page.

@Click
Track every time a short URL is clicked.
Store the timestamp, IP address (hashed for privacy), user agent, and referrer.
Do not store personally identifiable information directly.

@Analytics
For each short URL, provide analytics including:
- Total click count
- Clicks over time (hourly, daily, weekly, monthly)
- Geographic distribution (inferred from IP via GeoIP)
- Browsers and devices
- Top referrers

Analytics should only be accessible to the URL creator or via a secret analytics token.

@CustomAlias
Users can optionally specify a custom alias instead of a random code.
Custom aliases must be 3-30 characters, alphanumeric with hyphens.
If a custom alias is taken, return an error.
Custom aliases are case-insensitive.

@QRCode
Generate a QR code for each short URL.
The QR code should encode the full short URL (e.g., https://short.link/abc123).
Serve QR codes as PNG images.

@RateLimiting
Anonymous users: 10 short URL creations per hour per IP
Authenticated users: 100 short URL creations per hour
Redirect requests: unlimited (but implement abuse detection)

@API
Expose a REST API with the following endpoints:

POST /shorten — create a new short URL
  Body: { url: string, customAlias?: string, expiresAt?: ISO date string }
  Returns: { shortCode: string, shortUrl: string, analyticsToken: string }

GET /:shortCode — redirect to the original URL (record analytics)
  Returns: 302 redirect or 404 if not found or expired

GET /analytics/:shortCode/:token — get analytics for a short URL
  Returns: click count, time series data, geographic distribution, etc.

GET /qr/:shortCode — get QR code as PNG image

DELETE /:shortCode/:deleteToken — delete a short URL (only creator can delete)

All endpoints return JSON (except redirects and QR codes).
Use appropriate HTTP status codes (200, 201, 302, 400, 404, 429).

@URLValidation
Before creating a short URL, validate that the original URL is:
- A valid URL format
- Uses HTTP or HTTPS protocol
- Not in the blocklist (malicious sites, spam)
- Resolves to a real domain (optional DNS check)

@Blocklist
Maintain a list of blocked domains to prevent abuse.
Block URLs that resolve to:
- Known malware or phishing sites
- Localhost or private IP ranges
- The short URL service itself (no circular redirects)

@Expiration
Check for expired URLs on every redirect.
Optionally run a background job to clean up expired URLs from the database.
Expired URLs should redirect to an informative page instead of the original destination.

@Storage
Store short URLs in a database (Redis or PostgreSQL).
Use the short code as the primary key for fast lookups.
Store analytics clicks in a separate time-series optimized table or use an analytics service.
Index by creation date for cleanup jobs.

@WebInterface
Provide a simple web page where users can:
- Paste a long URL and get a short link instantly
- Optionally set a custom alias
- Optionally set an expiration date
- Copy the short URL to clipboard
- View QR code
- Access analytics via the analytics link

Clean, minimalist design focused on speed and usability.
Mobile-responsive.
Show previews of the original URL for security.