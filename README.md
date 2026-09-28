# WoodCraft ERP — Mini Manufacturing ERP System

## 📌 Purpose

WoodCraft ERP is a lightweight Manufacturing ERP system built for a furniture manufacturing business. It digitizes what was previously tracked manually (often in Excel), connecting **Inventory → Production → Sales** into one real-time system so that:

- Raw material stock is always accurate and visible
- Production (Work Orders) automatically consumes raw materials and produces finished goods based on a defined Bill of Materials (BOM)
- Sales orders automatically deduct finished goods stock and prevent overselling
- Admins/Managers get a live dashboard view of stock levels, work orders, and pending orders — with alerts before stock runs out

The goal is to remove manual reconciliation between departments and give management a single source of truth for stock and production status.

---

## 🧩 Core Modules

| Module         | Responsibility                                                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth / HR**  | Login/logout (JWT), role-based access (Admin, Manager, Employee), employee profiles, attendance                                                                  |
| **Inventory**  | Raw material & finished goods stock, stock in/out, low-stock alerts, stock history                                                                               |
| **Production** | Bill of Materials (BOM), Work Orders (Planned → In Progress → Completed), auto raw-material deduction, auto finished-goods addition, insufficient-stock warnings |
| **Sales**      | Customers, Sales Orders, stock availability check, auto stock deduction, invoice generation, order status tracking                                               |
| **Dashboard**  | Real-time overview of stock, work orders, pending orders, low-stock alerts                                                                                       |

Role-based access is enforced throughout: **Admin** has full access, **Manager** oversees Inventory/Production/Sales, **Employee** has limited access to their own work-order/attendance related tasks.

---

## 🛠️ Tech Stack

**Backend:** Node.js, Express.js
**Database:** MongoDB with Mongoose
**Cache / Session / Queue backing store:** Redis
**Auth:** JWT (`jsonwebtoken`) + `argon2` for password hashing, `cookie-parser` for httpOnly cookie-based token storage
**Validation:** Zod
**Security:** Helmet, CORS, express-rate-limit
**Background Jobs:** RabbitMQ (`amqplib`) — invoice generation, notification emails
**Logging:** Morgan (dev), Winston/Pino (structured logs)
**Frontend:** React, Redux/Zustand
**Deployment:** Render/Railway (backend), Vercel/Netlify (frontend)
**Containerization:** Docker & Docker Compose

---

## 🐳 Docker

Docker is used to keep the local development environment consistent across the team and to mirror production as closely as possible.

- **MongoDB** and **Redis** (and optionally **RabbitMQ**) run as containers via `docker-compose.yml`, so every developer runs the exact same versions without installing them natively.
- A new team member can get a working local environment with a single command instead of manually installing and configuring each service.
- The same container setup can be extended to package the backend itself for deployment, keeping local and production environments aligned.

```bash
docker-compose up -d
```

Example services typically included in `docker-compose.yml`:

```yaml
services:
  mongo:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: ["mongo-data:/data/db"]

  redis:
    image: redis:7
    ports: ["6379:6379"]

  rabbitmq:
    image: rabbitmq:3-management
    ports: ["5672:5672", "15672:15672"]

volumes:
  mongo-data:
```

---

## ⚡ Redis

Redis is used as a fast, in-memory data store for several cross-cutting concerns:

- **JWT session control** — blacklisting invalidated tokens on logout/password reset, since JWTs are stateless by default
- **Caching** — dashboard statistics (stock levels, work order summary, low-stock counts) are cached briefly to reduce repeated MongoDB queries and keep the dashboard fast
- **Rate limiting** — backs `express-rate-limit` to throttle repeated login/API abuse per IP/user
- **Queue backing store** — supports background job processing (e.g., if BullMQ is used instead of/alongside RabbitMQ for lightweight jobs)

---

## 📁 Project Structure (Backend)

```
WoodCraft_ERP_Backend/
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── redis.js
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.model.js
│   │   ├── user/
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   └── user.model.js
│   │   ├── inventory/
│   │   │   ├── inventory.controller.js
│   │   │   ├── inventory.service.js
│   │   │   └── inventory.model.js
│   │   ├── production/
│   │   │   ├── production.controller.js
│   │   │   ├── production.service.js
│   │   │   └── production.model.js
│   │   ├── sales/
│   │   │   ├── sales.controller.js
│   │   │   ├── sales.service.js
│   │   │   └── sales.model.js
│   │   └── dashboard/
│   │       ├── dashboard.controller.js
│   │       └── dashboard.service.js
│   ├── routes/
│   │   ├── auth/index.js
│   │   ├── user/index.js
│   │   ├── inventory/index.js
│   │   ├── production/index.js
│   │   ├── sales/index.js
│   │   ├── dashboard/index.js
│   │   └── index.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   └── error.middleware.js
│   ├── utils/
│   │   └── asyncHandler.js
│   ├── app.js
│   └── server.js
├── .env
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

**Flow:** `Route → Controller (handles req/res) → Service (business logic) → Model (MongoDB)`

---

## 🚀 Getting Started

```bash
# 1. Clone the repo
git clone <repo-url>
cd WoodCraft_ERP_Backend

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env
# fill in MONGO_URI, JWT_SECRET, REDIS_URL, CLIENT_URL, etc.

# 4. Start MongoDB, Redis (and RabbitMQ if used) via Docker
docker-compose up -d

# 5. Run the server
npm run dev
```

---

## 🔐 Environment Variables

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/woodcraft_erp
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d
REDIS_URL=redis://localhost:6379
CLIENT_URL=http://localhost:3000
```

---

## 🌿 Branching Strategy

- `main` — production-ready code only
- `dev` — active integration branch
- `feature/<name>` — one branch per feature, merged into `dev` via reviewed PR
- `hotfix/<name>` — urgent production fixes, merged into both `main` and `dev`

---

## 📦 Deliverables

- Full source code (Frontend + Backend + Database)
- Deployed live link
- GitHub repository
- This README as user guide
- Demo login credentials (see below)

**Demo Credentials**

| Role     | Email                  | Password                 |
| -------- | ---------------------- | ------------------------ |
| Admin    | admin@woodcraft.com    | _(set after deployment)_ |
| Manager  | manager@woodcraft.com  | _(set after deployment)_ |
| Employee | employee@woodcraft.com | _(set after deployment)_ |
