# Customer Shopping Curl Guide

Base path: `/api/v1/user`

This guide covers the user flow currently supported by the server:
- browse products and variants
- add a delivery address if needed
- add items to cart
- view cart summary
- apply and remove coupons
- save wishlist items and move them into cart
- checkout the cart
- place a direct order
- place one order with multiple items
- write a product review
- read public product reviews
- read public banners
- view public offers

Important: cart endpoints are available under `/api/v1/user/cart`.

## 1. Sign in

Use an existing customer account to get a JWT.

```bash
curl -X POST http://localhost:3000/api/v1/user/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "secret123"
  }'
```

Save the returned token as `CUSTOMER_JWT`.

## 2. Browse categories

```bash
curl http://localhost:3000/api/v1/user/inventory/categories \
  -H "Authorization: Bearer CUSTOMER_JWT"
```

## 3. Browse products

### All products

```bash
curl http://localhost:3000/api/v1/user/inventory/items \
  -H "Authorization: Bearer CUSTOMER_JWT"
```

### Products under a category

```bash
curl http://localhost:3000/api/v1/user/inventory/category/CATEGORY_ID/items \
  -H "Authorization: Bearer CUSTOMER_JWT"
```

### Single product with variants

```bash
curl http://localhost:3000/api/v1/user/inventory/item/ITEM_ID \
  -H "Authorization: Bearer CUSTOMER_JWT"
```

The single-product response includes the available `variants`, and the checkout API expects you to send the chosen `variantId`.

## 4. Add a delivery address if you do not already have one

```bash
curl -X POST http://localhost:3000/api/v1/user/address/add \
  -H "Authorization: Bearer CUSTOMER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411001",
    "flatnumber": 12,
    "latitude": 18.5204,
    "longitude": 73.8567
  }'
```

If you want to confirm saved addresses:

```bash
curl http://localhost:3000/api/v1/user/address/all \
  -H "Authorization: Bearer CUSTOMER_JWT"
```

## 5. Add to cart

```bash
curl -X POST http://localhost:3000/api/v1/user/cart/items \
  -H "Authorization: Bearer CUSTOMER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "ITEM_ID",
    "variantId": "VARIANT_ID",
    "quantity": 1
  }'
```

```bash
curl http://localhost:3000/api/v1/user/cart \
  -H "Authorization: Bearer CUSTOMER_JWT"
```

```bash
curl -X PUT http://localhost:3000/api/v1/user/cart/items/VARIANT_ID \
  -H "Authorization: Bearer CUSTOMER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 3
  }'
```

```bash
curl -X DELETE http://localhost:3000/api/v1/user/cart/items/VARIANT_ID \
  -H "Authorization: Bearer CUSTOMER_JWT"
```

```bash
curl -X DELETE http://localhost:3000/api/v1/user/cart/clear \
  -H "Authorization: Bearer CUSTOMER_JWT"
```

### Cart summary

```bash
curl http://localhost:3000/api/v1/user/cart/summary \
  -H "Authorization: Bearer CUSTOMER_JWT"
```

## 6. Wishlist

### View wishlist

```bash
curl http://localhost:3000/api/v1/user/wishlist \
  -H "Authorization: Bearer CUSTOMER_JWT"
```

### Add to wishlist

```bash
curl -X POST http://localhost:3000/api/v1/user/wishlist \
  -H "Authorization: Bearer CUSTOMER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "ITEM_ID",
    "variantId": "VARIANT_ID"
  }'
```

### Move wishlist item to cart

```bash
curl -X POST http://localhost:3000/api/v1/user/wishlist/move-to-cart \
  -H "Authorization: Bearer CUSTOMER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "wishlistItemId": "WISHLIST_ITEM_ID",
    "quantity": 1
  }'
```

## 7. Apply coupon to cart

```bash
curl -X POST http://localhost:3000/api/v1/user/cart/coupon/apply \
  -H "Authorization: Bearer CUSTOMER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SAVE10"
  }'
```

```bash
curl -X DELETE http://localhost:3000/api/v1/user/cart/coupon \
  -H "Authorization: Bearer CUSTOMER_JWT"
```

## 8. Checkout cart

```bash
curl -X POST http://localhost:3000/api/v1/user/cart/checkout \
  -H "Authorization: Bearer CUSTOMER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "addressId": "ADDRESS_ID",
    "paymentType": "COD"
  }'
```

## 9. Direct purchase of one item

Use this when the user wants to buy a single product immediately.

```bash
curl -X POST http://localhost:3000/api/v1/user/orders \
  -H "Authorization: Bearer CUSTOMER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "addressId": "ADDRESS_ID",
    "paymentType": "COD",
    "items": [
      {
        "itemId": "ITEM_ID",
        "variantId": "VARIANT_ID",
        "quantity": 1
      }
    ]
  }'
```

## 10. Direct multi-item purchase

Use this if you want to skip cart persistence and purchase a set of items in one request.

```bash
curl -X POST http://localhost:3000/api/v1/user/orders \
  -H "Authorization: Bearer CUSTOMER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "addressId": "ADDRESS_ID",
    "paymentType": "COD",
    "items": [
      {
        "itemId": "ITEM_ID_1",
        "variantId": "VARIANT_ID_1",
        "quantity": 2
      },
      {
        "itemId": "ITEM_ID_2",
        "variantId": "VARIANT_ID_2",
        "quantity": 1
      }
    ]
  }'
```

Rules enforced by the API:
- every line item must include `itemId`, `variantId`, and `quantity`
- all items must belong to the same shopkeeper
- the variant must belong to the product
- the variant must have enough stock
- `paymentType` must be `COD` or `CASH`

## 11. View orders

```bash
curl http://localhost:3000/api/v1/user/orders \
  -H "Authorization: Bearer CUSTOMER_JWT"
```

## 12. View one order

```bash
curl http://localhost:3000/api/v1/user/orders/ORDER_ID \
  -H "Authorization: Bearer CUSTOMER_JWT"
```

## 13. Cancel an order

```bash
curl -X PUT http://localhost:3000/api/v1/user/orders/ORDER_ID/cancel \
  -H "Authorization: Bearer CUSTOMER_JWT"
```

## 14. Reviews and offers

### Submit a review

```bash
curl -X POST http://localhost:3000/api/v1/user/reviews \
  -H "Authorization: Bearer CUSTOMER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "ITEM_ID",
    "rating": 5,
    "description": "Good product",
    "title": "Recommended",
    "orderId": "ORDER_ID"
  }'
```

### View public reviews

```bash
curl http://localhost:3000/api/v1/user/reviews
```

### View public offers

```bash
curl http://localhost:3000/api/v1/user/inventory/offers
```

### View public banners

```bash
curl http://localhost:3000/api/v1/user/inventory/banners
```

## Suggested client flow

1. Sign in and save the JWT.
2. Fetch categories and products.
3. Open one product to read its variants.
4. If no address exists, create one.
5. Either submit one item directly or send the full selected item list to `POST /orders`.
6. Refresh the order list after checkout.
