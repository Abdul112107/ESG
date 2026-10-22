# EcoTrack — ESG Sustainability Management Platform

EcoTrack is a production-style enterprise ESG Sustainability Management Platform built on the MERN stack (MongoDB, Express.js, React, Node.js, TypeScript, and Tailwind CSS).

The platform allows organizations to monitor energy consumption, calculate greenhouse gas carbon emissions across Scopes 1–3, track industrial waste circularity and diversion rates, evaluate ESG performance pillars, manage sustainability goals with dynamic progress formulas, and generate server-compiled PDF reports.

---

## 1. Technology Stack

- **Database:** MongoDB with Mongoose ODM (Atlas or local mongod, with persistent development file storage fallback).
- **Backend API:** Node.js & Express.js REST API with JWT authentication and Role-Based Access Control (RBAC).
- **Frontend UI:** React 19, TypeScript, Tailwind CSS, Lucide icons, and Recharts.
- **Reporting Engine:** Server-side PDFKit document compilation for real downloadable PDFs.
- **Security:** bcryptjs password hashing with strict password complexity policy, organization-level data isolation, and JWT session handling.

---

## 2. Seed Accounts & Roles

EcoTrack provides 4 pre-configured development accounts for quick testing of all role permissions:

| Role | Name | Email | Password | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Dr. Sarah Jenkins | `admin@ecotrack.org` | `Admin@EcoTrack2026!` | Full administrative access (users, org settings, records, goals, reports) |
| **Manager** | Marcus Vance | `manager@ecotrack.org` | `Manager@EcoTrack2026!` | Operational management (CRUD records, run calculations, export reports) |
| **Employee** | Elena Rostova | `employee@ecotrack.org` | `Employee@EcoTrack2026!` | Operational logging (add energy, emission, and waste records) |
| **Auditor** | Arthur Sterling (CPA) | `auditor@ecotrack.org` | `Auditor@EcoTrack2026!` | Read-only compliance audit across all logs and generated PDF reports |

*Quick Role Switcher:* You can switch between roles instantly using the role switcher menu at the bottom of the sidebar or the quick 1-click buttons on the login screen.

---

## 3. Calculation Methodologies

### A. Carbon Emissions (GHG Protocol Corporate Standard)
$$\text{Emissions } (\text{kgCO}_2\text{e}) = \text{Activity Data} \times \text{Emission Factor}$$
$$\text{Metric Tons } (\text{tCO}_2\text{e}) = \frac{\text{Emissions } (\text{kgCO}_2\text{e})}{1,000}$$

Documented Official Illustrative Factors:
- **Scope 2:** US Grid Average Electricity: `0.386 kgCO2e/kWh` (Source: EPA eGRID 2024 v2024.1)
- **Scope 1:** Natural Gas Stationary Combustion: `5.300 kgCO2e/therm` (Source: EPA GHG Hub 2024 v2024.1)
- **Scope 1:** Fleet Diesel Mobile Combustion: `10.210 kgCO2e/gallon` (Source: EPA GHG Hub 2024 v2024.1)
- **Scope 3:** Commercial Business Flights: `0.150 kgCO2e/passenger-km` (Source: UK DEFRA 2024 v1.0)
- **Scope 3:** Industrial Process Materials: `1.820 kgCO2e/kg` (Source: IEA Industrial Guide v2024.2)

### B. Waste Recycling & Circularity Rate
$$\text{Recycling Rate } (\%) = \left(\frac{\text{Total Recycled Waste (kg)}}{\text{Total Waste Generated (kg)}}\right) \times 100$$
- Mass balance validation: $\text{Recycled} + \text{Disposed} \le \text{Total Waste}$.
- Zero denominator guard: returns $0\%$.

### C. Overall ESG Composite Index
$$\text{Overall ESG Score} = \frac{\text{Environmental Score} + \text{Social Score} + \text{Governance Score}}{3}$$
- Normalized 0–100 scale across all categories.

### D. Sustainability Goal Progress Formulas
- **Reduction Goals** (e.g. Energy or Carbon reduction):
  $$\text{Progress } (\%) = \left(\frac{\text{Baseline} - \text{Current}}{\text{Baseline} - \text{Target}}\right) \times 100$$
- **Increase Goals** (e.g. Recycling Rate or Renewable Share):
  $$\text{Progress } (\%) = \left(\frac{\text{Current} - \text{Baseline}}{\text{Target} - \text{Baseline}}\right) \times 100$$
- Display progress is clamped between 0% and 100%, and "Target Exceeded" is flagged when $> 100\%$.

---

## 4. Setup & Running Instructions

### 1. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Set your MongoDB connection string in `.env`:
```env
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/ecotrack?retryWrites=true&w=majority"
JWT_SECRET="ecotrack-super-secure-production-jwt-secret-key-2026"
PORT=3000
```

### 2. Configure MongoDB Atlas (Free in 2 Minutes)
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free Shared Cluster.
2. Under **Database Access**, create a user with Read and Write permissions.
3. Under **Network Access**, allow access from anywhere (`0.0.0.0/0`).
4. Click **Connect → Drivers** and copy the URI. Replace `<password>` with your database user password.
5. In EcoTrack, you can paste the URI in the **Database Configuration** modal in the header or in `.env`.

*Note:* If `MONGODB_URI` is not yet configured, EcoTrack operates in development mode with a persistent file-backed database (`.data/db.json`), ensuring zero-friction local testing while keeping schemas and data structures 100% Mongoose compliant.

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Application
Development server (Full-stack Express API + Vite React on port 3000):
```bash
npm run dev
```

Production build & standalone server:
```bash
npm run build
npm start
```

### 5. Seed Demonstration Records
The application automatically seeds 12+ months of realistic data on first launch.
To re-seed or reset records at any time:
- In the UI: Click the **Database Status button** in the header or go to **Settings** and click **Reset & Seed 12-Month Demo Data**.
- Via API: `POST /api/db/seed` with `{ "forceReset": true }`.

---

## 5. REST API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/me` — Get authenticated user profile and organization

### Sustainability Records
- `GET /api/energy` — List energy records (filters: `energyType`, `facility`, `startDate`, `endDate`)
- `POST /api/energy` — Log new energy consumption record
- `PUT /api/energy/:id` — Update energy record
- `DELETE /api/energy/:id` — Delete energy record

- `GET /api/emissions` — List emissions records (filters: `scope`, `source`, date range)
- `GET /api/emissions/factors` — Retrieve official emission factor library
- `POST /api/emissions` — Calculate and log carbon emission record
- `PUT /api/emissions/:id` — Update emission record
- `DELETE /api/emissions/:id` — Delete emission record

- `GET /api/waste` — List waste stream records
- `POST /api/waste` — Log waste generation and diversion
- `PUT /api/waste/:id` — Update waste record
- `DELETE /api/waste/:id` — Delete waste record

- `GET /api/esg` — Retrieve ESG scores and historical audits
- `POST /api/esg` — Log quarterly ESG evaluation
- `PUT /api/esg/:id` — Update ESG score

- `GET /api/goals` — List goals with dynamic formula progress
- `POST /api/goals` — Create sustainability target
- `PUT /api/goals/:id` — Update goal
- `DELETE /api/goals/:id` — Delete goal

### Analytics & Reports
- `GET /api/dashboard/overview` — Aggregated KPIs, goals, and recent activity
- `GET /api/dashboard/trends` — Monthly energy (kWh) and emissions (tCO2e) series
- `GET /api/dashboard/emissions-by-source` — Scope and source distribution data
- `GET /api/reports` — List generated reports archive
- `POST /api/reports/generate` — Compile and save PDF report
- `GET /api/reports/:id/download` — Stream downloadable PDF report
