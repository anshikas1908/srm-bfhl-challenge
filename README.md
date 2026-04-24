<div align="center">
  <img src="https://img.shields.io/badge/SRM-BFHL%20Engineering%20Challenge-blue?style=for-the-badge&logo=codeforces" alt="SRM BFHL Challenge"/>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express" />
  <br/>
  <h1>🚀 Graph Hierarchy Analyzer</h1>
  <p><strong>A full-stack, production-ready directed graph parser with cycle detection.</strong></p>
</div>

<hr/>

## 🌟 Overview
This project is an advanced full-stack application built for the **SRM BFHL Engineering Challenge**. It features a robust Node.js/Express backend algorithm capable of ingesting raw textual edge data, identifying complex hierarchies, detecting cyclic dependencies using Depth-First Search (DFS), and organizing disjointed graphs by lexicographical priority.

The frontend is a custom-built, responsive React dashboard styled with a high-fidelity "hacker-terminal" aesthetic, featuring dynamic recursive tree rendering, real-time KPI generation, and clean data categorization.

---

## 🛠️ Tech Stack & Architecture
- **Frontend Core**: React 18, JSX, Functional Components, Hooks (`useState`, `useCallback`)
- **Backend Core**: Node.js, Express, Cross-Origin Resource Sharing (CORS)
- **Styling**: Pure CSS3 with custom variables, `Fira Code` & `Syncopate` typography, CSS Animations.
- **Deployment**: Configured for edge deployment on **Vercel** with integrated `vercel.json` monorepo routing.

---

## ⚡ Core Features
1. **Strict Input Validation**: Rejects multi-character nodes, self-loops (`A->A`), and malformed strings.
2. **Cycle Detection**: Implements recursive DFS graph traversal to accurately detect infinite loops and mark them securely without crashing the server.
3. **Lexicographical Tie-Breaking**: When multiple pure cyclic groups exist without distinct roots, it selects the lexicographically smallest node as the anchor.
4. **Multi-Parent Resolution**: In diamond graphs, the first encountered parent edge takes precedence, strictly enforcing a tree structure.
5. **Depth Calculation**: Automatically calculates the absolute depth of valid, acyclic tree paths.

---

## 📡 API Reference
**Base Endpoint**: `POST /bfhl`
**Content-Type**: `application/json`

### Request Payload Format:
```json
{
  "data": [
    "A->B", "A->C", "B->D", "C->E", "E->F", 
    "X->Y", "Y->Z", "Z->X", 
    "P->Q", "Q->R", 
    "G->H", "G->H", "G->I", 
    "hello", "1->2", "A->"
  ]
}
```

### Expected Response:
```json
{
  "is_success": true,
  "user_id": "AnshikaSrivastava_19082004",
  "email_id": "as8327@srmist.edu.in",
  "college_roll_number": "RA2311003012252",
  "hierarchies": [
    {
      "root": "A",
      "tree": { "A": { "B": { "D": {} }, "C": { "E": { "F": {} } } } },
      "depth": 4
    },
    {
      "root": "X",
      "tree": {},
      "has_cycle": true
    }
  ],
  "invalid_entries": ["hello", "1->2", "A->"],
  "duplicate_edges": ["G->H"],
  "summary": {
    "total_trees": 3,
    "total_cycles": 1,
    "largest_tree_root": "A"
  }
}
```

---

## 💻 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/anshikas1908/srm-bfhl-challenge.git
cd srm-bfhl-challenge
```

### 2. Start the Backend API
```bash
# Install root dependencies
npm install

# Start Express server on Port 3000
npm start
```

### 3. Start the React Frontend
Open a new terminal window:
```bash
cd frontend

# Install React dependencies
npm install

# Start React dev server on Port 3001
npm start
```

---
<div align="center">
  <i>Developed for the SRM Engineering Full Stack Challenge</i>
</div>
