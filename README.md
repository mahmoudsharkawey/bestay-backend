<div align="center">
  <h1>🏨 BeStay Backend API</h1>
  <p><strong>A Modern Student Housing Platform Backend</strong></p>
  
  [![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
  [![Express.js](https://img.shields.io/badge/Express-5.x-lightgrey.svg)](https://expressjs.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-blue.svg)](https://www.prisma.io/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791.svg)](https://www.postgresql.org/)
  [![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
</div>

<br />

## 📖 Overview

**BeStay** is a comprehensive student housing platform designed to connect students with verified landlords seamlessly. The backend is engineered with **Node.js, Express 5, Prisma, and PostgreSQL**, featuring a robust architecture that supports a multi-role ecosystem (User, Landlord, Admin) and over 14 functional modules. 

With built-in AI recommendations, Stripe payment processing, and comprehensive RESTful APIs, BeStay provides a secure, fast, and scalable foundation for modern real-estate tech.

---

## ✨ Key Features

- 🔐 **Multi-Role Authentication**: JWT-based auth with Local & Google OAuth login. Secure password resets and role-based access control (Admin, Landlord, Student/User).
- 🏘️ **Unit Management**: Full CRUD operations for properties, advanced filtering/searching, and seamless image uploads via Cloudinary.
- 📅 **Visit Scheduling Lifecycle**: Complete flow for requesting, approving, rejecting, rescheduling, and confirming property visits.
- 💳 **Payments & Bookings**: Integrated with Stripe (including webhooks) for secure payment processing. Bookings are auto-generated upon visit confirmations.
- 🤖 **AI-Driven Features**: Utilizes Google Generative AI for smart recommendations (`getMatchingUnits`) based on user preferences (budget, city, facilities, university).
- ⭐ **Reviews & Ratings**: Transparent 1-5 star rating system for units with dynamic average recalculation.
- 🔔 **Notifications System**: In-app and email notification dispatching using Nodemailer.
- 📊 **Admin Dashboard Data**: Endpoints to serve KPIs, analytical charts, and overarching user/system management.

---

## 🛠️ Tech Stack

- **Core**: Node.js, Express 5
- **Database & ORM**: PostgreSQL, Prisma Client & Studio
- **Validation**: Zod
- **Security**: Helmet, Express Rate Limit, Cors, Bcrypt, JWT
- **Storage**: Cloudinary, Multer
- **Payments**: Stripe
- **AI / LLM**: Google Generative AI
- **API Docs**: Swagger (swagger-jsdoc, swagger-ui-express)
- **Testing**: Vitest
- **Logging**: Winston, Morgan, Colorette

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL database
- Cloudinary Account
- Stripe Account
- Google OAuth & Gemini API Keys

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables Configuration:**
   Create a `.env` file in the root directory. You will need variables for your Database URL, JWT secrets, Stripe, Cloudinary, NodeMailer, and Google API keys.

3. **Database Setup (Prisma):**
   ```bash
   npx prisma generate
   npx prisma db push
   # Or npx prisma migrate dev
   ```

---

## 💻 Development

Start the application in development mode with live reloading:

```bash
# Start backend server
npm run dev
```

### Local Webhook Development (Stripe)

For testing webhooks locally, you can use `ngrok` to expose your local server:

```bash
# Expose port 3000 to the internet
ngrok http --url=inspective-unbred-lois.ngrok-free.dev 3000
```

| Purpose | URL |
|---------|-----|
| **API Base** | `https://inspective-unbred-lois.ngrok-free.dev/api/v1` |
| **Stripe Webhook** | `https://inspective-unbred-lois.ngrok-free.dev/api/v1/payments/webhook` |

---

## 📚 API Documentation

Interactive API documentation is available via **Swagger UI**. 

Once the server is running, navigate to:  
`http://localhost:<PORT>/api-docs` (or your configured swagger route).

---

## 🧪 Testing

The project uses **Vitest** for testing.

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch
```

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).