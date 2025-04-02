require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 5001;

app.use(express.static("public")); // Serve static files
app.set("view engine", "ejs"); // Set EJS as the template engine

const API_KEY = process.env.API_KEY;
const YT_API_KEY = process.env.YT_API_KEY;

// Root Route
app.get("/", (req, res) => {
    res.render("index"); // Render views/index.ejs
});

// Fetch Man City Highlights (YouTube API)
app.get("/api/city_highlights", async (req, res) => {
    try {
        const query = "Manchester City Highlights";
        const maxResults = 6;
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&key=${YT_API_KEY}&maxResults=${maxResults}`;

        const response = await axios.get(url);
        const videos = response.data.items.map(item => ({
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.high.url,
            video_url: `https://www.youtube.com/embed/${item.id.videoId}`
        }));

        res.json(videos);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch videos" });
    }
});

// Fetch Man City Squad Details (API)
app.get("/api/squad", async (req, res) => {
    const url = "http://api.football-data.org/v4/teams/65";

    try {
        const response = await axios.get(url, {
            headers: { "X-Auth-Token": API_KEY }
        });

        if (response.status === 200) {
            const squad = response.data.squad || [];
            const players = squad.map(player => [
                player.name,
                player.position,
                player.nationality
            ]);
            // console.log(players);

            res.json({ team_squad: players });
        } else {
            res.status(response.status).json({ error: "Failed to fetch squad data" });
        }
    } catch (error) {
        res.status(500).json({ error: "Server error fetching squad data" });
    }
});

/* ==============================
   Premier League Data
   ============================== */

/* ---- Team Data ---- */
app.get("/api/team_data", async (req, res) => {
    const url = "https://api.football-data.org/v4/competitions/PL/standings";

    try {
        const response = await axios.get(url, {
            headers: {"X-Auth-Token": API_KEY}
        });

        if (response.status === 200) {
            const standings_sections = response.data.standings || [];
            let manCityData = null;

            for (const section of standings_sections) {
                const table = section.table || [];

                for (const teamEntry of table) {
                    const team = teamEntry.team || {};

                    if (team.name === 'Manchester City FC') {
                        manCityData = {
                            team_name: "Manchester City FC",
                            position: teamEntry.position,
                            points: teamEntry.points,
                            played_games: teamEntry.playedGames,
                            won: teamEntry.won,
                            draw: teamEntry.draw,
                            lost: teamEntry.lost,
                            goals_for: teamEntry.goalsFor,
                            goals_conceded: teamEntry.goalsAgainst
                        };
                        break;
                    }
                }
                if (manCityData) break;
            }
            if (manCityData) {
                res.json(manCityData);                
            } else {
                res.status(404).json({error: "Manchester City FC not found in the standinga."});
            }
        } else {
            res.status(response.status).json({error: "Failed to fetch standings data."});
        }
    } catch (error) {
        res.status(500).json({error: "Server error while fetching team data"});
    }
});

/* ---- Team Top Scorer ---- */
app.get("/api/pl_team_top_scorer", async(req, res) => {
    try {
        const url = 'https://api.football-data.org/v4/competitions/PL/scorers';

        const response = await axios.get(url, {
            headers: {'X-Auth-Token': API_KEY} 
        });

        if (response.status === 200) {
            const scorers = response.data.scorers || [];

            const cityScorers = scorers
                .filter(player => player.team?.name === "Manchester City FC")
                .map(player => {
                    const player_name = player.player?.name || '';
                    const player_goals = player.goals || 0;
                    const penalties = player.penalties ?? 0;
                    const non_pen_goals = player_goals - penalties;
                    
                    return { [player_name]: [player_goals, penalties, non_pen_goals] };
                });

            // console.log('City Scorers:', cityScorers);

            const player_score = Object.assign({}, ...cityScorers);

            // console.log('Player Score:', player_score);
            
            return res.json({ player_score });
        } else {
            return res.status(response.status).json({ error: "Failed to fetch data"});
        }
    } catch(error) {
        console.error("Error fetching top scorer data:", error);
        return res.status(500).json({ error:"Internak Server Error" });
    }
});

/* ---- Team Matches ---- */
app.get("/api/pl_matches", async(req, res) => {
    try {
        const url = 'https://api.football-data.org/v4/teams/65/matches?status=SCHEDULED';

        const response = await axios.get(url, {
            headers: {'X-Auth-Token': API_KEY}
        });

        if (response.status === 200) {
            const matches = response.data.matches || [];

            const premierLeagueMatches = matches.filter(
                match => match?.competition?.name === "Premier League"
            );

            if (premierLeagueMatches.length > 0) {
                const upcomingMatches = [];
                const updatesMatchDetails = [];

                premierLeagueMatches.forEach(match => {
                    const homeTeam = match?.homeTeam?.tla || 'Unknown';
                    const awayTeam = match?.awayTeam?.tla || "Unknown";
                    const matchDateRaw = match?.utcDate || '';

                    const matchDate = new Date(matchDateRaw);
                    const formattedDate = matchDate.toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    });
                    const formattedTime = matchDate.toLocaleString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                    });
                    
                    const matchSummary = `${homeTeam} vs ${awayTeam} on ${formattedDate}`;
                    const matchTime = `${homeTeam} ${formattedTime} ${awayTeam}`;

                    upcomingMatches.push(matchSummary);
                    updatesMatchDetails.push(matchTime);
                });
                return res.json({
                    upcoming_matches: upcomingMatches,
                    updates_match: updatesMatchDetails,
                });
            } else {
                return res.status(404).json({ error: "No upcoming Premier League matches found." });
            }
        } else {
            return res.status(response.status).json({ error: "Failed to Fetch Data" });
        }
    } catch(error) {
        console.error("Error fetching upcoming matches:", error);
    }
});

/* ---- Live Matches ---- */
app.get("/api/pl_live_matches", async (req, res) => {
    try {
        const url = "https://api.football-data.org/v4/matches";
        const response = await axios.get(url, {
            headers: {'X-Auth-Token': API_KEY}
        });

        if (response.status === 200) {
            const plMatches = response.data.matches.filter(match => match?.competition?.code === "PL");
            const livePLMatches = plMatches.filter(liveMatch => liveMatch.status == "LIVE" || liveMatch.status == "IN_PLAY");
            const liveManCityMatches = livePLMatches.filter(cityLive => 
                cityLive.homeTeam.name == "Manchester City FC" || cityLive.awayTeam.name == "Manchester City FC"
            );

            let result = {};

            if (liveManCityMatches.length === 0) {
                result = {
                    "live_match": "No Matches Today",
                    "live_match_score": ""
                };
            } else {
                const match = liveManCityMatches[0];
                const homeTeam = match.homeTeam.name;
                const awayTeam = match.awayTeam.name;
                const score = match.score.fullTime;

                result = {
                    "live_match": `${homeTeam} vs ${awayTeam}`,
                    "live_match_score": `Score: ${score['home']}:${score['away']}`
                };
            }

            return res.json(result);
        } else {
            return res.status(response.status).json({ error: "Failed to Fetch Data" });
        }
    } catch(error) {
        console.error("Error fetching live matches:", error);
    }
})

/* ==============================
   Champions League Data
   ============================== */

/* ---- Team Data ---- */
app.get("/api/team_data_ucl", async (req, res) => {
    const url = "https://api.football-data.org/v4/competitions/CL/standings";

    try {
        const response = await axios.get(url, {
            headers: {"X-Auth-Token": API_KEY}
        });

        if (response.status === 200) {
            const standings_sections = response.data.standings || [];
            let manCityData = null;

            for (const section of standings_sections) {
                const table = section.table || [];

                for (const teamEntry of table) {
                    const team = teamEntry.team || {};

                    if (team.name === 'Manchester City FC') {
                        manCityData = {
                            team_name: "Manchester City FC",
                            position: teamEntry.position,
                            points: teamEntry.points,
                            played_games: teamEntry.playedGames,
                            won: teamEntry.won,
                            draw: teamEntry.draw,
                            lost: teamEntry.lost,
                            goals_for: teamEntry.goalsFor,
                            goals_conceded: teamEntry.goalsAgainst
                        };
                        break;
                    }
                }
                if (manCityData) break;
            }
            if (manCityData) {
                res.json(manCityData);                
            } else {
                res.status(404).json({error: "Manchester City FC not found in the standinga."});
            }
        } else {
            res.status(response.status).json({error: "Failed to fetch standings data."});
        }
    } catch (error) {
        res.status(500).json({error: "Server error while fetching team data"});
    }
});

/* ---- Team Top Scorer ---- */
app.get("/api/ucl_team_top_scorer", async(req, res) => {
    try {
        const url = 'https://api.football-data.org/v4/competitions/CL/scorers';

        const response = await axios.get(url, {
            headers: {'X-Auth-Token': API_KEY} 
        });

        if (response.status === 200) {
            const scorers = response.data.scorers || [];

            const cityScorers = scorers
                .filter(player => player.team?.name === "Manchester City FC")
                .map(player => {
                    const player_name = player.player?.name || '';
                    const player_goals = player.goals || 0;
                    const penalties = player.penalties ?? 0;
                    const non_pen_goals = player_goals - penalties;
                    
                    return { [player_name]: [player_goals, penalties, non_pen_goals] };
                });

            const player_score = Object.assign({}, ...cityScorers);

            return res.json({ player_score });
        } else {
            return res.status(response.status).json({ error: "Failed to fetch data"});
        }
    } catch(error) {
        console.error("Error fetching top scorer data:", error);
        return res.status(500).json({ error:"Internak Server Error" });
    }
});

/* ---- Team Matches ---- */
app.get("/api/ucl_matches", async(req, res) => {
    try {
        const url = 'https://api.football-data.org/v4/teams/65/matches?status=SCHEDULED';

        const response = await axios.get(url, {
            headers: {'X-Auth-Token': API_KEY}
        });

        if (response.status === 200) {
            const matches = response.data.matches || [];

            const CLeagueMatches = matches.filter(
                match => match?.competition?.name === "UEFA Champions League"
            );

            if (CLeagueMatches.length > 0) {
                const upcomingMatches = [];
                const updatesMatchDetails = [];

                CLeagueMatches.forEach(match => {
                    const homeTeam = match?.homeTeam?.tla || 'Unknown';
                    const awayTeam = match?.awayTeam?.tla || "Unknown";
                    const matchDateRaw = match?.utcDate || '';

                    const matchDate = new Date(matchDateRaw);
                    const formattedDate = matchDate.toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    });
                    const formattedTime = matchDate.toLocaleString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                    });
                    
                    const matchSummary = `${homeTeam} vs ${awayTeam} on ${formattedDate}`;
                    const matchTime = `${homeTeam} ${formattedTime} ${awayTeam}`;

                    upcomingMatches.push(matchSummary);
                    updatesMatchDetails.push(matchTime);
                });
                return res.json({
                    upcoming_matches: upcomingMatches,
                    updates_match: updatesMatchDetails,
                });
            } else {
                return res.status(404).json({ error: "No upcoming Champions League matches found." });
            }
        } else {
            return res.status(response.status).json({ error: "Failed to Fetch Data" });
        }
    } catch(error) {
        console.error("Error fetching upcoming matches:", error);
    }
});

/* ---- Live Matches ---- */
app.get("/api/ucl_live_matches", async (req, res) => {
    try {
        const url = "https://api.football-data.org/v4/matches";
        const response = await axios.get(url, {
            headers: {'X-Auth-Token': API_KEY}
        });

        if (response.status === 200) {
            const plMatches = response.data.matches.filter(match => match?.competition?.code === "CL");
            const livePLMatches = plMatches.filter(liveMatch => liveMatch.status == "LIVE" || liveMatch.status == "IN_PLAY");
            const liveManCityMatches = livePLMatches.filter(cityLive => 
                cityLive.homeTeam.name == "Manchester City FC" || cityLive.awayTeam.name == "Manchester City FC"
            );

            let result = {};

            if (liveManCityMatches.length === 0) {
                result = {
                    "live_match": "No Matches Today",
                    "live_match_score": ""
                };
            } else {
                const match = liveManCityMatches[0];
                const homeTeam = match.homeTeam.name;
                const awayTeam = match.awayTeam.name;
                const score = match.score.fullTime;

                result = {
                    "live_match": `${homeTeam} vs ${awayTeam}`,
                    "live_match_score": `Score: ${score['home']}:${score['away']}`
                };
            }

            return res.json(result);
        } else {
            return res.status(response.status).json({ error: "Failed to Fetch Data" });
        }
    } catch(error) {
        console.error("Error fetching live matches:", error);
    }
})


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});



