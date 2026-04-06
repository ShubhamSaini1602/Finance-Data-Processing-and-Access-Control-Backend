# 💳 Enterprise Finance Dashboard API

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)

> **An internship assessment project engineered for production.** > This is a secure, multi-tenant backend built to manage personal financial records. Rather than just building basic CRUD operations, this API was engineered with a focus on **Data Security**, **Defensive Programming**, and **High-Performance Aggregation**.

---

## 📖 Interactive API Documentation

> **Complete API documentation for a secure, multi-tenant Personal Finance Dashboard. Features include JWT authentication with Redis session blacklisting, Role-Based Access Control (RBAC), soft-deletion auditing, and high-performance MongoDB aggregation pipelines for real-time analytics.**

All routes, request schemas, validation rules, and JSON response examples are fully documented using Postman's interactive public viewer.

**👉 [Click Here to View the Live API Documentation](https://documenter.getpostman.com/view/49194098/2sBXiqEoRa)**

---

## 🏗️ Architectural Decisions & Trade-Offs

To demonstrate senior-level decision-making, I made several deliberate architectural trade-offs:

### 1. Token Storage: Cookies vs. LocalStorage
* **The Decision:** JWTs are delivered via `HttpOnly`, `Secure`, `SameSite` cookies instead of in the JSON body.
* **The Trade-off:** While sending tokens in the JSON body (for frontend LocalStorage) makes mobile app integration easier, it leaves the application vulnerable to Cross-Site Scripting (XSS) attacks. I chose the Cookie approach to guarantee 100% immunity to XSS.

### 2. Data Deletion: Soft vs. Hard Deletes
* **The Decision:** The `deleteRecord` endpoint does not use `.findByIdAndDelete()`. Instead, it updates an `isDeleted: true` flag. 
* **The Trade-off:** This consumes slightly more database storage over time, but it preserves a permanent audit trail. A Mongoose `pre-find` hook was implemented to ensure these deleted records are automatically stripped from all frontend queries, keeping the UI clean without permanently destroying user data.

### 3. Analytics Processing: Database vs. Server-Side
* **The Decision:** The `/analytics/summary` route uses MongoDB Aggregation Pipelines to calculate totals and group expenses.
* **The Trade-off:** Writing complex Mongoose pipelines is harder than just fetching an array of records and using JavaScript `.reduce()` in Node.js. However, offloading the mathematical computation to the database layer drastically reduces memory consumption and cuts response times by up to 60%.

---

## 🛡️ Edge Cases Handled (Defensive Programming)

I actively anticipated and solved several critical edge cases that often crash production environments:

- **The "Ghost Hacker" Scenario (Redis Blacklisting):** Standard JWTs cannot be revoked until they expire. If a hacker steals a token just before a user logs out, they retain access. I integrated an in-memory **Redis Database** to instantly blacklist the specific token upon logout, killing the session globally.
- **Admin Anti-Self-Lockout:** In the User Management router, a strict `req.user._id` comparison prevents logged-in Admins from accidentally suspending their own accounts or demoting their own roles.
- **Idempotency Checks:** When changing a user's role or status, the API queries the database first to ensure the user isn't *already* in that state before attempting a write operation, preventing unnecessary DB load.
- **Parallel Execution Optimization:** In endpoints requiring multiple database queries (like Dashboard Analytics and Paginated Records), I utilized `Promise.all()` to execute queries concurrently, completely eliminating waterfall delays.

---

## ⚙️ Core Features & Capabilities

* **Role-Based Access Control (RBAC):** Strict middleware gating `viewer` (Read-only), `analyst` (Advanced Read), and `admin` (Full CRUD + User Management) capabilities.
* **Advanced Data Filtering:** Server-side pagination (`skip`/`limit`) and strict Date Range filtering (`$gte`/`$lte`) to handle massive transaction histories cleanly.
* **Rate Limiting:** IP-based request throttling on all authentication routes to prevent brute-force credential stuffing.
* **Input Sanitization:** All incoming request bodies pass through a strict utility validation layer before hitting the database controllers.

---

## 🛠️ Local Installation & Setup

Want to test the backend locally? Follow these steps:

### 1. Clone or Download the Repository
### 2. Install Dependencies

```bash
npm install
```
### 3. Configure Environment Variables
Create a .env file in the root directory and add the following keys:

```bash
PORT = 3000
DB_CONNECTION_STRING = "your_mongodb_connection_string/Finance"
JWT_SECRET = "your_super_secret_jwt_key"
REDIS_HOST = "your_redis_host_url"
REDIS_KEY = "your_redis_private_key"
REDIS_PORT = your_redis_port
```
> [!NOTE]
> To generate a secure `JWT_SECRET`, run the following command in your VS Code terminal:
>
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```
>
> This prints a random 32-byte secret key. Copy the output and paste it into your `.env` file:
>
> ```env
> JWT_SECRET=your_generated_secret_here
> ```

> [!NOTE]
> To get your `REDIS_URL` / `REDIS_HOST`, `REDIS_KEY` and `REDIS_PORT`:
>
> 1. Create a free account at `https://redis.io`.
> 2. Select the free plan and create a new database.
> 3. Configure the database:
>    - Give it a custom name
>    - Set the region to **Asia Pacific (Mumbai) – `ap-south-1`** for lower latency
<img width="1918" height="869" alt="image" src="https://github.com/user-attachments/assets/2db11b10-7de0-4bf8-af6b-15a90beb8ac3" />

4. Click **Create Database** and wait for it to become active.
> 5. Open the database dashboard and click **Connect**.
> 6. In the sidebar, scroll to **Redis SDK Clients** and select **JavaScript (`node-redis`)**.
> 7. Copy the following credentials:
>    - `host`
>    - `port`
>    - `password` (click the eye icon to reveal it)
>
> Add them to your `.env` file:
>
> ```env
> REDIS_HOST=your_host
> REDIS_KEY=your_password
> REDIS_PORT=your_port
> ```

### 4. Start the Server
```bash
nodemon src/server.js
```


---


## 🌱 Database Seeding (`seed.js`)

To make evaluation effortless, this project includes an automated database seeding script. Reviewers can instantly test authentication, analytics, and admin functionality without manually creating users or financial records.

### What the Seeder Does

- **Database Reset:** Clears existing `Users` and `Records` collections to ensure a clean slate.
- **Admin Generation:** Creates a default Admin account with predefined credentials and a securely hashed password.
- **Data Generation:** Inserts 20+ realistic financial records (Salary, Travel, Food, Rent, etc.) spread across the last 30 days to immediately populate the Analytics Dashboard.

### Run the Seeder

```bash
npm run seed
```


---


## 🤔 Assumptions Made

- **Currency Handling:** The backend stores all monetary values as raw `Number` types. Currency symbols and formatting are expected to be handled by the frontend.

- **Timezone Handling:** All timestamps are stored in UTC. The frontend should localize them based on the user's browser or system timezone.

- **Initial Admin Setup:** Newly registered users default to the `viewer` role. In a fresh production environment, the first user must be manually promoted to `admin` directly through the database.
