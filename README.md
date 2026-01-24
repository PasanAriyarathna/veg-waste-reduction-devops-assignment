# Vegetable Wastage Reduction System — Sri Lanka

## Group Information
- **Student 1:** Hiranya Pahasara - ITBIN-2313-0019 - Role: Backend Developer
- **Student 2:** Pasan Ariyarathna - ITBIN-2313-0009 - Role: DevOps/Release Manager
- **Student 3:** Nethmina Seeman - ITBIN-2313-0103 - Role: Frontend Developer

## Project Description
The Vegetable Wastage Reduction System is a web application designed to track and reduce vegetable wastage in Sri Lanka. It enables agricultural agents to monitor harvest data across all 25 districts in real-time, identify production trends, and make data-driven decisions to minimize wastage.

## Live Deployment
🔗 **Live URL:** https://veg-waste-reduction-devops-assignment.onrender.com/

## Technologies Used
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Node.js, Express.js
- **Database:** SQLite3
- **DevOps:** GitHub Actions (CI/CD)
- **Deployment:** Render
- **Version Control:** Git, GitHub

## Features
- 🔐 User authentication (Admin, Employee, Customer roles)
- 📊 Real-time harvest data tracking by district
- 📈 Production trend visualization
- 🗺️ District-wise analytics
- 🌱 Seasonal data management
- 📱 Responsive mobile design
- 🔄 Automated CI/CD pipeline
- 🚀 One-click cloud deployment

## Branch Strategy
We implemented a professional Git workflow:
- `main` — Production branch (protected, requires PRs)
- `develop` — Integration branch for testing
- `feature/*` — Individual feature branches
	- `feature/frontend-ui` — Frontend UI development
	- `feature/backend-api` — Backend API development
	- `feature/devops-pipeline` — CI/CD pipeline setup
- `docs/readme` — Edit readme file

## Individual Contributions

### Pasan Ariyarathna — DevOps/Release Manager
- Repository initialization and GitHub configuration
- GitHub Actions CI/CD pipeline setup
	- `.github/workflows/ci.yml` — Node.js matrix testing (18.x, 20.x), install hardening, audit
	- `.github/workflows/deploy.yml` — Vercel auto-deployment with secrets checks
	- Security audit with high severity threshold
- Branch protection rules on `main` and `develop`
- Deployment platform setup (Render configuration)
- Merge conflict resolution and release coordination
- Commits: ci (initial), deploy (initial), chore (dependencies), docs (badges)

### Nethmina Seeman — Frontend Developer
- Complete responsive UI/UX design and implementation
- HTML pages: `frontend/index.html`, `frontend/signin.html`, `frontend/category.html`, `frontend/dashboard-admin.html`, `frontend/dashboard-agent.html`, `frontend/dashboard-customer.html`, `frontend/District-tracking.html`, `frontend/seasonal-guide.html`,
`frontend/seasonal-tracking.html`
- CSS styling with mobile responsiveness: `frontend/styles.css`
- JavaScript authentication logic: `frontend/auth.js`
- Core application functions: `frontend/app.js`
- Add to API overview: `frontend/vegetable-details.js`
- README creation and maintenance
- User documentation and setup instructions
- Code review participation
- Commits: feat (homepage), feat (login), docs (readme), style (responsive design)

### Hiranya Pahasara — Backend Developer
- Express.js server setup with RESTful API design
- SQLite database schema and configuration
- API endpoints implementation in `backend/server.js`
	- GET `/api/vegetables` — Fetch all vegetables
	- GET `/api/vegetables/:id` — Fetch single vegetable
	- GET `/api/harvest/:vegetableId` — District totals by date
	- POST `/api/harvest` — Add harvest data (employee only)
	- PUT `/api/harvest/:id` — Update harvest data (employee only)
	- DELETE `/api/harvest/:id` — Delete harvest data (employee only)
	- Auth: POST `/api/auth/register`, POST `/api/auth/login`
- Database seeding script: `backend/seed-data.js`
- Backend testing and validation
- API documentation
- Commits: feat (server), feat (endpoints), test (seed-data)

## Setup Instructions

### Prerequisites
- Node.js v18 or v20
- Git
- npm (bundled with Node.js)

### Installation
```bash
# Clone repository
git clone https://github.com/PasanAriyarathna/veg-waste-reduction-devops-assignment.git
cd veg-waste-reduction-devops-assignment

# Install dependencies
npm install

# Seed database (optional)
node backend/seed-data.js

# Start server (serves frontend and APIs)
npm start

# Open the app
# http://localhost:3000
```
### Default Credentials (seeded)
- Admin — email: `admin@mail.com`, password: `admin123`
- Employee (Colombo) — email: `farmer@colombo.com`, password: `farm123`
- Employee (Galle) — email: `farmer@galle.com`, password: `farm123`
- Customer — email: `customer@mail.com`, password: `cust123`

## API Overview
- `GET /api/vegetables` — List categories
- `GET /api/vegetables/:id` — Category details
- `GET /api/harvest/:vegetableId` — Aggregated quantities per district/date
- `POST /api/harvest` — Add harvest (requires `employeeRole: "employee"`)
- `PUT /api/harvest/:id` — Update harvest (employee only)
- `DELETE /api/harvest/:id` — Delete harvest (employee only)
- `POST /api/auth/register` — Customer or employee (auto by district)
- `POST /api/auth/login` — Login and receive role/district

