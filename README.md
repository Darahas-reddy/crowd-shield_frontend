# 🛡️ CrowdShield – Smart Crowd Monitoring System

**CrowdShield** is a crowd-safety monitoring application designed to help monitor crowd density, identify potential overcrowding situations, and assess crowd risk levels through a centralized dashboard.

The system aims to support better crowd management by providing visual insights into crowd conditions and helping administrators identify potentially unsafe situations.

## 🚀 Project Overview

CrowdShield is developed as a web-based application with a React frontend and a Spring Boot backend. MongoDB is used to store and manage application records.

The application provides a dashboard for monitoring crowd-related information and displaying risk levels based on crowd density.

## ✨ Key Features

- **Crowd Density Monitoring:** Monitor crowd-density information through the dashboard.
- **Risk Level Assessment:** Categorize crowd conditions into LOW, MEDIUM, and HIGH risk levels.
- **Dashboard Visualization:** View crowd-related information in a centralized interface.
- **Backend Integration:** Communicate with backend services through REST APIs.
- **Data Management:** Store, retrieve, and manage application records using MongoDB.
- **Responsive Interface:** Access the monitoring interface through a web browser.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend development |
| JavaScript | Application logic |
| HTML5 | Page structure |
| CSS3 | Styling and layout |
| Java | Backend development |
| Spring Boot | Backend REST APIs |
| MongoDB | Database management |
| WebSocket | Real-time communication support |
| Git & GitHub | Version control |

## 🏗️ System Architecture

CrowdShield follows a frontend-backend-database architecture.

```text
        USER / ADMIN
             |
             v
     REACT FRONTEND
             |
             v
      SPRING BOOT
         BACKEND
             |
       +-----+------+
       |            |
       v            v
    REST APIs    WebSocket
       |
       v
     MONGODB
       |
       v
  DATA MANAGEMENT
```

## 📂 Project Structure

```text
crowd-shield_frontend/
│
├── public/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── assets/
│   ├── App.js
│   └── index.js
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

*Note: The structure above represents the typical React organization. Adjust the folder names to match the actual source files.*

## ⚙️ Installation and Setup

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Darahas-reddy/crowd-shield_frontend.git
```

### 2. Navigate to the project directory

```bash
cd crowd-shield_frontend
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env.local` file in the project root and configure the backend URLs:

```env
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_WS_URL=http://localhost:8080/ws
```

Update these URLs according to your backend deployment.

### 5. Start the development server

```bash
npm start
```

The application will be available at:

```text
http://localhost:3000
```

## 🔗 Backend Integration

The frontend communicates with the Spring Boot backend to retrieve and manage application data.

Configure the following environment variables:

| Variable | Description |
|---|---|
| REACT_APP_API_URL | Backend REST API base URL |
| REACT_APP_WS_URL | Backend WebSocket endpoint |

Ensure that the backend server and MongoDB database are running before testing integrated functionality.

## 🎯 Project Objectives

- Improve awareness of crowd-density conditions.
- Help identify potentially dangerous overcrowding situations.
- Provide a centralized interface for crowd monitoring.
- Demonstrate full-stack application development and database integration.

## 🔮 Future Enhancements

- AI-based crowd detection using CCTV footage.
- Live crowd-density visualization.
- Automated alerts for high-risk situations.
- Predictive crowd analysis.
- Integration with emergency response systems.
- Advanced analytics and historical crowd reports.

## 👨‍💻 Contributors

Developed as an academic project to explore full-stack development, database management, and crowd-safety monitoring.

## 📄 License

This project is intended for educational and demonstration purposes.

---

**CrowdShield – Making Crowd Monitoring Smarter and Safer.** 🛡️
