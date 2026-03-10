# Divine Canvas

## Current State
Basic storefront with 3 hardcoded products, in-memory cart, no backend orders, no admin.

## Requested Changes (Diff)

### Add
- Admin login (authorization) to access admin panel
- Admin panel: upload new artworks (image + title + description + price + category), edit/delete artworks
- Dynamic artwork catalog stored in backend (replaces hardcoded products)
- Customer order form: name, email, phone, shipping address, artwork selection with quantity
- Order placement stored in backend with status (pending/confirmed/shipped/completed)
- Admin orders view: see all incoming orders, update order status
- Blob storage for artwork images uploaded by admin

### Modify
- Shop gallery now loads artworks dynamically from backend
- Cart now builds order and submits to backend via order form

### Remove
- Hardcoded product data in frontend

## Implementation Plan
- Select: authorization, blob-storage
- Backend: Artwork type (id, title, description, price, category, imageId, available), Order type (id, customerName, email, phone, address, items, status, createdAt)
- CRUD for artworks (admin only), list artworks (public)
- Create order (public), list/update orders (admin)
- Frontend: Admin login flow, artwork management CRUD, dynamic shop gallery, checkout form modal, admin orders dashboard
