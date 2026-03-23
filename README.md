# Terminal 1
npm run dev

# Terminal 2
ngrok http --url=inspective-unbred-lois.ngrok-free.dev 3000

Purpose	URL
API base	https://inspective-unbred-lois.ngrok-free.dev/api/v1
Stripe webhook	https://inspective-unbred-lois.ngrok-free.dev/api/v1/payments/webhook




TODOS:
canceled by owner 
I have refactored the landlord.controller.js to use the project's standard httpError and httpResponse patterns.

Project Summary
BeStay is a student housing platform backend built with Express 5 + Prisma + PostgreSQL + Stripe + Zod. It supports 3 roles (User, Landlord, Admin) with 14 feature modules covering:

Module	Key Functions
Auth	Local + Google login, password reset via email
Unit	CRUD, search/filter, images via Cloudinary
Visit	Full lifecycle (request → approve/reject → reschedule → confirm)
Payment	Stripe integration with webhook
Booking	Auto-created on visit confirmation
Review	1-5 rating with average recalculation
Favorites	User bookmark system
User Preference	Budget, city, facilities, gender, university + 
getMatchingUnits
Notification	In-app + email notifications
Admin	KPIs, charts, user management