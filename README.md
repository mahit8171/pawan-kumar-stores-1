# 🛍️ Pawan Kumar Store

A full-stack e-commerce application built with **Node.js + Express + MongoDB**.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pawan-kumar-store
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
NODE_ENV=development
```

For MongoDB Atlas, replace `MONGODB_URI` with your connection string.

### 3. Start the Server

```bash
cd backend
npm start
```

**Or in dev mode with auto-restart:**
```bash
npm run dev
```

---

## 🌐 URLs

| URL | Description |
|-----|-------------|
| `http://localhost:5000` | Customer Storefront |
| `http://localhost:5000/admin` | Admin Panel |
| `http://localhost:5000/api/products` | Products API |

---

## 🔐 Default Admin Credentials

```
Username: admin
Password: admin123
```

⚠️ **Change these in production** via the Settings page.

---

## 📁 Project Structure

```
pawan-kumar-store/
├── backend/
│   ├── models/
│   │   ├── Admin.js        # Admin schema
│   │   └── Product.js      # Product schema
│   ├── routes/
│   │   ├── auth.js         # Login / verify / change-password
│   │   ├── products.js     # CRUD + image upload
│   │   └── categories.js   # Category aggregation
│   ├── middleware/
│   │   └── auth.js         # JWT middleware
│   ├── uploads/            # Uploaded product images
│   ├── server.js           # Express app entry
│   ├── package.json
│   └── .env
└── frontend/
    ├── index.html          # Customer storefront
    ├── admin/
    │   └── index.html      # Admin panel
    ├── css/
    │   ├── store.css       # Storefront styles
    │   └── admin.css       # Admin styles
    └── js/
        ├── store.js        # Storefront logic
        └── admin.js        # Admin logic
```

---

## 📡 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | ❌ | Admin login |
| POST | `/api/auth/verify` | ✅ | Verify token |
| POST | `/api/auth/change-password` | ✅ | Change password |

### Products (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (search, filter, sort, paginate) |
| GET | `/api/products/:id` | Get single product |
| GET | `/api/products/categories` | Get product categories |
| GET | `/api/categories` | Get categories with counts |

### Products (Admin — requires Bearer token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/admin/all` | All products (admin view) |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

---

## 🔑 API Usage Example

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Create product (with token)
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Test Product" \
  -F "price=999" \
  -F "description=A great product" \
  -F "category=Electronics" \
  -F "image=@/path/to/image.jpg"
```

---

## ✨ Features

- **Customer Store**: Browse products, search, filter by category, sort, cart
- **Product Detail Modal**: Full product info with image
- **Admin Panel**: Secure JWT login, full CRUD, image upload
- **Security**: Rate limiting, JWT auth, password hashing (bcrypt)
- **Responsive**: Mobile-first design
- **Search**: Text-based product search
- **Categories**: Auto-generated from products

---

## 🌍 Deployment (Production)

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET` (32+ random chars)
3. Use MongoDB Atlas for cloud database
4. Use PM2 or similar process manager:
   ```bash
   npm install -g pm2
   pm2 start server.js --name pawan-kumar-store
   ```
5. Use Nginx as reverse proxy

---

© 2024 Pawan Kumar Store
