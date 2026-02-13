@Product
A product has a unique ID (UUID), SKU (stock keeping unit), name, description, price, currency (default USD), and creation timestamp.
Products belong to one or more categories.
Products can have multiple variants (e.g., different sizes or colors).
Each product has an inventory count tracking available stock.
Products can be marked as featured, on sale, or out of stock.

@ProductVariant
Variants represent different options for a product (e.g., Red T-Shirt size M).
Each variant has its own SKU, price adjustment (optional), inventory count, and attributes (color, size, material, etc.).
Variants inherit the base product's name and description but can override the price.

@Category
Categories organize products hierarchically.
Each category has an ID, name, slug (URL-friendly), description, and optional parent category.
Categories can be nested multiple levels deep (e.g., Electronics > Computers > Laptops).
Display products from all subcategories when viewing a parent category.

@Image
Products have multiple images.
Each image has a URL, alt text for accessibility, and display order.
The first image is the primary thumbnail.
Images should be optimized for different sizes (thumbnail, medium, full).

@Tag
Products can have tags for flexible organization (e.g., "summer", "bestseller", "eco-friendly").
Tags are freeform strings that enable cross-category browsing.

@Review
Customers can leave reviews on products.
Reviews have an ID, product ID, customer name, rating (1-5 stars), title, text content, helpful count, and timestamp.
Reviews must be verified purchases (optional enforcement).
Calculate average rating and review count for each product.

@SearchAndFilter
Support full-text search across product names, descriptions, and SKUs.
Filter products by:
- Category (including subcategories)
- Price range (min/max)
- Tags
- Availability (in stock, out of stock, on sale)
- Rating (minimum stars)
- Attributes (size, color, brand, etc.)

Sort results by:
- Relevance (for search queries)
- Price (low to high, high to low)
- Newest first
- Best rating
- Most reviewed

@Inventory
Track inventory count for each product/variant.
When inventory reaches a low threshold (configurable per product, default 5), mark as "low stock".
When inventory is 0, mark as "out of stock".
Support inventory adjustments (manual increases/decreases) with audit log.

@Pricing
Products have a base price in their currency.
Support sale pricing with start and end dates.
Optionally show "was/now" pricing when on sale.
Calculate discounts as percentage off or fixed amount.

@ShoppingCart
Users can add products/variants to a cart.
Each cart item has product ID, variant ID (if applicable), quantity, and snapshot of price at time of addition.
Carts persist across sessions (use cookies or database).
Validate cart items against current inventory and pricing on checkout.

@API
Expose a REST API with the following endpoints:

GET /products — list all products with pagination, filtering, and sorting
  Query params: category, tags, minPrice, maxPrice, inStock, minRating, sort, limit, offset
GET /products/:id — get a single product with variants, images, reviews, and inventory
POST /products — create a new product (admin only)
PUT /products/:id — update a product (admin only)
DELETE /products/:id — soft delete a product (admin only)

GET /categories — list all categories with hierarchy
GET /categories/:slug — get category details and products

GET /search?q=query — search products by keyword

GET /products/:id/reviews — get all reviews for a product
POST /products/:id/reviews — add a review (requires purchase verification)

POST /cart — add item to cart
  Body: { productId, variantId?, quantity }
GET /cart — get cart contents with current prices and availability
PUT /cart/:itemId — update cart item quantity
DELETE /cart/:itemId — remove item from cart
DELETE /cart — clear entire cart

All endpoints return JSON.
Use appropriate HTTP status codes (200, 201, 400, 404, 403).

@ImageOptimization
Store images in multiple resolutions:
- Thumbnail: 200x200px
- Medium: 800x800px  
- Full: 1600x1600px

Serve images via CDN for fast loading.
Use lazy loading for images below the fold.

@Validation
Product names: 3-200 characters
SKUs: 3-50 characters, alphanumeric with hyphens
Prices: positive numbers with 2 decimal places
Inventory: non-negative integers
Review ratings: 1-5 stars only

@WebInterface
Provide a responsive e-commerce storefront with:

Homepage featuring:
- Featured products carousel
- Categories grid
- Recent/trending products

Product listing page with:
- Filters sidebar (category, price, tags, attributes)
- Sort dropdown
- Product grid with images, prices, ratings
- Pagination

Product detail page with:
- Image gallery with zoom
- Variant selector (color swatches, size dropdown, etc.)
- Price and availability
- Add to cart button
- Product description and specifications
- Customer reviews with rating distribution

Search results page similar to product listing

Shopping cart with:
- Line items showing product, variant, quantity, price
- Quantity adjusters
- Remove item buttons
- Subtotal
- Continue shopping / checkout buttons

Clean, modern design optimized for conversion.
Mobile-first responsive layout.
Fast page loads and smooth interactions.