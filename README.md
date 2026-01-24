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

