# Manchester-City-Fan-Dashboard

### Overview
A web application that provides real-time data on Manchester City FC, including standings, top scorers, squad details, upcoming matches, and live scores for the Premier League and UEFA Champions League. The app also integrates YouTube highlights, allowing fans to watch match recaps.

### Tech Stack
Frontend: HTML, CSS, JavaScript

Backend: Node.js, Express.js

API Calls: Axios

Data Sources: Football-Data-Org API (for real-time data), YouTube API (for match highlights)

### Features
- **Live Team Standings**  
  Fetches real-time Premier League and UCL standings.  

- **Top Scorers**  
  Displays top goal scorers for Manchester City players.  

- **Upcoming Matches**  
  Provides match schedules with date and time.

- **Live Matches**  
  Provides real-time updates on ongoing match scores and live time.

- **Match Highlights**  
  Integrates YouTube API for easy access to match highlights. 

### Installation & Setup
- **Clone the Repository**
  git clone https://github.com/yourusername/man-city-dashboard.git <br>
  cd man-city-dashboard <br>

- **Install Dependencies**
  npm install <br>

- **Set Up Environment Variables**
  ##### Create a .env file in the root directory and add:
  API_KEY=your_football_api_key <br>
  YOUTUBE_API_KEY=your_youtube_api_key <br>

- **Start the Server**
  node server.js <br>

#### The app will run on http://localhost:5001.

### API Endpoints
- **GET /api/team_standings – Fetches team standings.**

- **GET /api/top_scorers – Retrieves Manchester City's top scorers.**

- **GET /api/squad – Lists all squad members.**

- **GET /api/matches – Fetches upcoming and live matches.**

- **GET /api/highlights – Returns YouTube links for recent match highlights.**

### Project Structure
man-city-dashboard/ <br>
│── server.js <br>
│── package.json <br>
│── .env <br>
│── public/ <br>
│   ├─ assets/ (Images & logos) <br>
│   ├─ css/ (Stylesheets) <br>
│   ├─ js/ (Frontend scripts) <br>
│── views/ <br>
│   ├─ index.html (Main UI) <br>

### Contact & Contributions
💼 Author: Your Name (LinkedIn) <br>
📩 Email: your@email.com <br>
🤝 Contributions: Open to feature suggestions & pull requests! <br>
