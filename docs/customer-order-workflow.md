# Customer Order Workflow

This is the user flow for placing an order in BuildMart.

Base path: `/api/v1/user`

Authentication: customer routes require `Authorization: Bearer <JWT>` except signup/signin.

## 1. Sign up

Create the customer account first.

### POST `/auth/signup`
Required fields: `email`, `password`, `name`, `gender`, `dateOfBirth`, `avatar`.

```bash
curl -X POST http://localhost:3000/api/v1/user/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "secret123",
    "name": "Aman Kumar",
    "gender": "MALE",
    "dateOfBirth": "1998-06-15",
    "avatar": "https://example.com/avatar.jpg",
    "phone": "9999999999"
  }'
```

The response returns a `token`, `user`, and `customer` object.

## 2. Sign in

### POST `/auth/signin`
Use this after signup or on later visits.

```bash
curl -X POST http://localhost:3000/api/v1/user/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "secret123"
  }'
```

Save the returned JWT for the next steps.

## 3. Add a delivery address

An order needs a saved address.

### POST `/address/add`

```bash
curl -X POST http://localhost:3000/api/v1/user/address/add \
  -H "Authorization: Bearer YOUR_CUSTOMER_JWT" \
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

Use the returned address `id` as `addressId` when creating the order.

## 4. Browse products and variants

### GET `/inventory/items`
List all available products.

```bash
curl http://localhost:3000/api/v1/user/inventory/items \
  -H "Authorization: Bearer YOUR_CUSTOMER_JWT"
```

### GET `/inventory/item/:id`
Fetch a single product with its variants.

```bash
curl http://localhost:3000/api/v1/user/inventory/item/ITEM_ID \
  -H "Authorization: Bearer YOUR_CUSTOMER_JWT"
```

Pick the `variantId` you want to order. The order endpoint expects each item line to include a `variantId`.

## 5. Create the order

### POST `/orders`
Send the selected `itemId`, `variantId`, and quantity for each line.

Rules enforced by the API:
- `addressId` is required
- `items` must be a non-empty array
- `paymentType` must be `COD` or `CASH`
- every item in the request must belong to the same shopkeeper
- the selected variant must belong to the selected product
- stock must be available for the chosen variant
- optional `couponCode` or `couponId` can be included for direct checkout discounts

```bash
curl -X POST http://localhost:3000/api/v1/user/orders \
  -H "Authorization: Bearer YOUR_CUSTOMER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "addressId": "ADDRESS_ID",
    "paymentType": "COD",
    "couponCode": "SAVE10",
    "items": [
      {
        "itemId": "ITEM_ID",
        "variantId": "VARIANT_ID",
        "quantity": 2
      }
    ]
  }'
```

The response returns the created order with item snapshots and the delivery address.

## 6. Checkout from cart

```bash
curl -X POST http://localhost:3000/api/v1/user/cart/checkout \
  -H "Authorization: Bearer YOUR_CUSTOMER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "addressId": "ADDRESS_ID",
    "paymentType": "COD"
  }'
```

## 7. View orders

### GET `/orders`
List the customer’s order history.

```bash
curl http://localhost:3000/api/v1/user/orders \
  -H "Authorization: Bearer YOUR_CUSTOMER_JWT"
```

### GET `/orders/:id`
Fetch one order by id.

```bash
curl http://localhost:3000/api/v1/user/orders/ORDER_ID \
  -H "Authorization: Bearer YOUR_CUSTOMER_JWT"
```

## 8. Cancel an order

### PUT `/orders/:id/cancel`
Cancel an order if it has not reached a non-cancellable state.

```bash
curl -X PUT http://localhost:3000/api/v1/user/orders/ORDER_ID/cancel \
  -H "Authorization: Bearer YOUR_CUSTOMER_JWT"
  -H "Content-Type: application/json" \
  -d '{
    "cancelReason": "Changed my mind"
  }'
```

The API now requires `cancelReason` and stores it with the cancellation timestamp.

## Recommended flow

1. Sign up or sign in.
2. Add at least one delivery address.
3. Browse products and open the product details page.
4. Choose a variant for each product.
5. Add items to cart and optionally apply a coupon.
6. Checkout the cart with `addressId` and `paymentType`, or submit a direct order with `items`.
7. Show the order history page using `GET /orders`.
