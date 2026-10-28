# BuildMart Admin API

This document covers the admin/shopkeeper endpoints currently available in the codebase.

Base path: `/api/v1/owner`

Authentication: most protected endpoints require `Authorization: Bearer <JWT>`.

## 1. Auth

### POST `/auth/signup`
Create a shopkeeper account.

Required fields: `email`, `password`, `shopname`.

```bash
curl -X POST http://localhost:3000/api/v1/owner/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "secret123",
    "name": "Shop Owner",
    "phone": "9999999999",
    "profileimage": "https://example.com/avatar.jpg",
    "shopname": "BuildMart Store",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411001",
    "flatnumber": 12
  }'
```

### POST `/auth/signin`
Sign in with email and password.

```bash
curl -X POST http://localhost:3000/api/v1/owner/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "secret123"
  }'
```

### GET `/auth/profile`
Fetch the current shopkeeper profile.

```bash
curl http://localhost:3000/api/v1/owner/auth/profile \
  -H "Authorization: Bearer YOUR_JWT"
```

### PUT `/auth/profile`
Update profile fields.

```bash
curl -X PUT http://localhost:3000/api/v1/owner/auth/profile \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Owner Name",
    "phone": "9888877776",
    "profileimage": "https://example.com/new-avatar.jpg",
    "shopname": "New Shop Name"
  }'
```

## 2. Categories

### POST `/inventory/category`
Create a top-level category. Uses multipart form-data and accepts `image` and `banner` uploads.

```bash
curl -X POST http://localhost:3000/api/v1/owner/inventory/category \
  -H "Authorization: Bearer YOUR_JWT" \
  -F "title=Groceries" \
  -F "description=Daily essentials" \
  -F "sortOrder=1" \
  -F "image=@./category.jpg" \
  -F "banner=@./banner.jpg"
```

### GET `/inventory/categories`
List all categories.

```bash
curl http://localhost:3000/api/v1/owner/inventory/categories \
  -H "Authorization: Bearer YOUR_JWT"
```

### GET `/inventory/category/:id`
Get one category with its children.

```bash
curl http://localhost:3000/api/v1/owner/inventory/category/CATEGORY_ID \
  -H "Authorization: Bearer YOUR_JWT"
```

### PUT `/inventory/category/:id`
Update a category.

```bash
curl -X PUT http://localhost:3000/api/v1/owner/inventory/category/CATEGORY_ID \
  -H "Authorization: Bearer YOUR_JWT" \
  -F "title=Updated Groceries" \
  -F "description=Updated description" \
  -F "banner=@./new-banner.jpg"
```

### DELETE `/inventory/category/:id`
Delete a category.

```bash
curl -X DELETE http://localhost:3000/api/v1/owner/inventory/category/CATEGORY_ID \
  -H "Authorization: Bearer YOUR_JWT"
```

## 3. Subcategories

### POST `/inventory/category/:parentId/subcategory`
Create a subcategory under an existing category.

```bash
curl -X POST http://localhost:3000/api/v1/owner/inventory/category/PARENT_ID/subcategory \
  -H "Authorization: Bearer YOUR_JWT" \
  -F "title=Rice" \
  -F "description=Basmati and more" \
  -F "sortOrder=2" \
  -F "image=@./subcategory.jpg"
```

### GET `/inventory/category/:id/subcategories`
List direct child categories.

```bash
curl http://localhost:3000/api/v1/owner/inventory/category/CATEGORY_ID/subcategories \
  -H "Authorization: Bearer YOUR_JWT"
```

## 4. Products

### POST `/inventory/item`
Create a product with up to 5 images and optional variants.

Use multipart form-data. `variants` can be sent as JSON.

```bash
curl -X POST http://localhost:3000/api/v1/owner/inventory/item \
  -H "Authorization: Bearer YOUR_JWT" \
  -F "title=Premium Rice" \
  -F "categoryId=CATEGORY_ID" \
  -F "unit=KG" \
  -F "description=High quality rice" \
  -F "shortDescription=Everyday staple" \
  -F "minimumpurchase=1" \
  -F "images=@./product-1.jpg" \
  -F "images=@./product-2.jpg" \
  -F 'variants=[{"name":"1kg","mrp":120,"sellingPrice":99,"stockQty":10,"lowStockAlert":3,"isDefault":true},{"name":"5kg","mrp":550,"sellingPrice":499,"stockQty":5,"lowStockAlert":2}]'
```

### GET `/inventory/items`
List all products for the current shopkeeper.

```bash
curl http://localhost:3000/api/v1/owner/inventory/items \
  -H "Authorization: Bearer YOUR_JWT"
```

### GET `/inventory/item/:id`
Get one product with variants.

```bash
curl http://localhost:3000/api/v1/owner/inventory/item/ITEM_ID \
  -H "Authorization: Bearer YOUR_JWT"
```

### GET `/inventory/category/:categoryId/items`
List products under a category.

```bash
curl http://localhost:3000/api/v1/owner/inventory/category/CATEGORY_ID/items \
  -H "Authorization: Bearer YOUR_JWT"
```

### PUT `/inventory/admin/products/:id`
Update product-level fields.

```bash
curl -X PUT http://localhost:3000/api/v1/owner/inventory/admin/products/ITEM_ID \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Product Name",
    "shortDescription": "Updated summary",
    "categoryId": "CATEGORY_ID",
    "isActive": true
  }'
```

### DELETE `/inventory/products/:id`
Delete a product.

```bash
curl -X DELETE http://localhost:3000/api/v1/owner/inventory/products/ITEM_ID \
  -H "Authorization: Bearer YOUR_JWT"
```

### POST `/inventory/item/:id/images`
Append more images to an existing product later.

```bash
curl -X POST http://localhost:3000/api/v1/owner/inventory/item/ITEM_ID/images \
  -H "Authorization: Bearer YOUR_JWT" \
  -F "images=@./extra-1.jpg" \
  -F "images=@./extra-2.jpg"
```

### POST `/inventory/shop-image`
Add a shop image for the current shopkeeper.

```bash
curl -X POST http://localhost:3000/api/v1/owner/inventory/shop-image \
  -H "Authorization: Bearer YOUR_JWT" \
  -F "description=Storefront" \
  -F "image=@./storefront.jpg"
```

### GET `/inventory/shop-images`
List the current shopkeeper’s uploaded shop images.

```bash
curl http://localhost:3000/api/v1/owner/inventory/shop-images \
  -H "Authorization: Bearer YOUR_JWT"
```

### POST `/inventory/offer`
Create an offer with optional image and banner uploads.

```bash
curl -X POST http://localhost:3000/api/v1/owner/inventory/offer \
  -H "Authorization: Bearer YOUR_JWT" \
  -F "title=Summer Sale" \
  -F "description=Flat discount on selected products" \
  -F "discountType=FLAT" \
  -F "discountValue=50" \
  -F "minQty=1" \
  -F "image=@./offer.jpg" \
  -F "banner=@./offer-banner.jpg" \
  -F 'applicableProductIds=["PRODUCT_ID"]'
```

Public offer browsing is exposed at `GET /api/v1/user/inventory/offers`.

## 5. Variants

### GET `/inventory/products/:id/variants`
List all variants for one product.

```bash
curl http://localhost:3000/api/v1/owner/inventory/products/ITEM_ID/variants \
  -H "Authorization: Bearer YOUR_JWT"
```

### POST `/inventory/admin/products/:id/variants`
Create a new variant for a product.

```bash
curl -X POST http://localhost:3000/api/v1/owner/inventory/admin/products/ITEM_ID/variants \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "10kg",
    "sku": "SKU-10KG",
    "mrp": 999,
    "sellingPrice": 899,
    "costPrice": 750,
    "stockQty": 20,
    "lowStockAlert": 5,
    "isDefault": false,
    "isActive": true,
    "sortOrder": 1
  }'
```

### PUT `/inventory/admin/products/:id/variants/:variantId`
Update a variant.

```bash
curl -X PUT http://localhost:3000/api/v1/owner/inventory/admin/products/ITEM_ID/variants/VARIANT_ID \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Variant",
    "sellingPrice": 949,
    "stockQty": 30,
    "isDefault": true
  }'
```

### DELETE `/inventory/admin/products/:id/variants/:variantId`
Delete a variant.

```bash
curl -X DELETE http://localhost:3000/api/v1/owner/inventory/admin/products/ITEM_ID/variants/VARIANT_ID \
  -H "Authorization: Bearer YOUR_JWT"
```

## 6. Inventory views

### GET `/inventory/variants`
List all variants with stock status.

Optional query: `filter=low|high|out|all`

```bash
curl "http://localhost:3000/api/v1/owner/inventory/inventory/variants?filter=low" \
  -H "Authorization: Bearer YOUR_JWT"
```

### GET `/inventory/variants/low`
Low stock variants only.

```bash
curl http://localhost:3000/api/v1/owner/inventory/inventory/variants/low \
  -H "Authorization: Bearer YOUR_JWT"
```

### GET `/inventory/variants/high`
Healthy stock variants only.

```bash
curl http://localhost:3000/api/v1/owner/inventory/inventory/variants/high \
  -H "Authorization: Bearer YOUR_JWT"
```

### GET `/inventory/stock-movements`
List inventory log entries.

Optional query: `variantId=...`

```bash
curl "http://localhost:3000/api/v1/owner/inventory/inventory/stock-movements?variantId=VARIANT_ID" \
  -H "Authorization: Bearer YOUR_JWT"
```

### GET `/admin/products/:id/variants/:variantId/stock-movements`
List stock history for a single variant.

```bash
curl http://localhost:3000/api/v1/owner/inventory/admin/products/ITEM_ID/variants/VARIANT_ID/stock-movements \
  -H "Authorization: Bearer YOUR_JWT"
```

## 7. Coupons

### POST `/coupons`
Create a coupon.

```bash
curl -X POST http://localhost:3000/api/v1/owner/coupons \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SAVE10",
    "description": "10% off on orders above 500",
    "discountType": "PERCENTAGE",
    "discountValue": 10,
    "minOrderAmount": 500,
    "maxDiscountAmount": 100,
    "usageLimit": 100,
    "usageLimitPerUser": 1,
    "isFirstOrder": true,
    "isAppOnly": false,
    "applicableOn": []
  }'
```

### GET `/coupons`
List coupons.

```bash
curl http://localhost:3000/api/v1/owner/coupons \
  -H "Authorization: Bearer YOUR_JWT"
```

### GET `/coupons/:id`
Get one coupon.

```bash
curl http://localhost:3000/api/v1/owner/coupons/COUPON_ID \
  -H "Authorization: Bearer YOUR_JWT"
```

### PUT `/coupons/:id`
Update a coupon.

```bash
curl -X PUT http://localhost:3000/api/v1/owner/coupons/COUPON_ID \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated coupon text",
    "discountValue": 15,
    "status": "ACTIVE"
  }'
```

### DELETE `/coupons/:id`
Delete a coupon.

```bash
curl -X DELETE http://localhost:3000/api/v1/owner/coupons/COUPON_ID \
  -H "Authorization: Bearer YOUR_JWT"
```

## 8. Orders

### GET `/orders`
Get all orders for the current shopkeeper.

```bash
curl http://localhost:3000/api/v1/owner/orders \
  -H "Authorization: Bearer YOUR_JWT"
```

### PATCH `/orders/:id/confirm`
Move an order from `PROCESSING` to `CONFIRMED` and reserve variant stock.

```bash
curl -X PATCH http://localhost:3000/api/v1/owner/orders/ORDER_ID/confirm \
  -H "Authorization: Bearer YOUR_JWT"
```

### PATCH `/orders/:id/ship`
Move an order from `CONFIRMED` to `SHIPPED`.

```bash
curl -X PATCH http://localhost:3000/api/v1/owner/orders/ORDER_ID/ship \
  -H "Authorization: Bearer YOUR_JWT"
```

### PATCH `/orders/:id/out-for-delivery`
Move an order from `SHIPPED` to `OUT_FOR_DELIVERY`.

```bash
curl -X PATCH http://localhost:3000/api/v1/owner/orders/ORDER_ID/out-for-delivery \
  -H "Authorization: Bearer YOUR_JWT"
```

### PATCH `/orders/:id/delivered`
Mark an order as delivered from `OUT_FOR_DELIVERY`.

```bash
curl -X PATCH http://localhost:3000/api/v1/owner/orders/ORDER_ID/delivered \
  -H "Authorization: Bearer YOUR_JWT"
```

### PATCH `/orders/:id/cancel`
Cancel an order and restock variants if it was already confirmed or later.

```bash
curl -X PATCH http://localhost:3000/api/v1/owner/orders/ORDER_ID/cancel \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "cancelReason": "Customer unreachable"
  }'
```

### PATCH `/orders/:id/reject`
Reject an order while it is still `PROCESSING`.

```bash
curl -X PATCH http://localhost:3000/api/v1/owner/orders/ORDER_ID/reject \
  -H "Authorization: Bearer YOUR_JWT"
```

## 9. Inventory Media Notes

The item create/update endpoints already accept `images` uploads. The new `POST /inventory/item/:id/images` route is for appending more product images later without replacing the existing gallery.

Shop images live in the `ShopkeeperImage` model and can be created, listed, updated, and deleted through the inventory routes.

## Notes

The inventory routes also expose `PATCH` actions for toggling product/variant active state and updating stock quantities. Those are available in the codebase, but this reference intentionally focuses on `GET`, `POST`, `PUT`, and `DELETE` for the sections requested.
