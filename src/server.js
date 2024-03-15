require('dotenv').config();
const express = require('express');
const db = require('./database');
const cron = require('node-cron');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', 'src/views');

function selectRandomMember(members, lastMember) {
    let filteredMembers = members.filter(m => m.nome !== lastMember);
    return filteredMembers[Math.floor(Math.random() * filteredMembers.length)];
}
  
function generateScaleForFriday(friday) {
    const formattedDate = `${("0" + friday.getDate()).slice(-2)}/${("0" + (friday.getMonth() + 1)).slice(-2)}/${friday.getFullYear()}`;

    db.get("SELECT * FROM schedules WHERE date = ?", [formattedDate], (err, row) => {
        if (err) {
            console.error("Error checking for existing schedule:", err);
            return;
        }

        if (!row) {
            db.all("SELECT name, type FROM members", [], (err, members) => {
                if (err) {
                    console.error("Error fetching members:", err);
                    return;
                }

                const vests = members.filter(member => member.type === "Closed Vest");
                const pps = members.filter(member => member.type === "PP");

                db.get("SELECT vest, pp FROM last_pair ORDER BY ROWID DESC LIMIT 1", (error, lastPair) => {
                    if (error) {
                        console.error("Error fetching last pair:", error);
                        return;
                    }

                    const vest = selectRandomMember(vests, lastPair ? lastPair.vest : null);
                    const pp = selectRandomMember(pps, lastPair ? lastPair.pp : null);

                    if (vest && pp) {
                        db.run("INSERT INTO schedules (date, vest, pp) VALUES (?, ?, ?)", [formattedDate, vest.name, pp.name]);
                        db.run("INSERT INTO last_pair (vest, pp) VALUES (?, ?)", [vest.name, pp.name]);
                    } else {
                        console.error("Error: Unable to select a vest and pp for the schedule.");
                    }
                });
            });
        }
    });
}

function generateScaleByMonth() {
    let currentDate = new Date();
    let year = currentDate.getFullYear();
    let month = currentDate.getMonth();
    let firstDayOfMonth = new Date(year, month, 1);
    let firstFriday = firstDayOfMonth;

    // Finding the first Friday of the month
    while (firstFriday.getDay() !== 5) {
        firstFriday.setDate(firstFriday.getDate() + 1);
    }

    // Generating scales for all Fridays
    while (firstFriday.getMonth() === month) {
        generateScaleForFriday(new Date(firstFriday));
        firstFriday.setDate(firstFriday.getDate() + 7);
    }
}

generateScaleByMonth();  // Chamada inicial para garantir a população do mês atual.

cron.schedule('0 0 28-31 * *', () => {
    const today = new Date();
    if (today.getDate() === new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()) {
        generateScaleByMonth();
    }
});

app.get('/', (req, res) => {
    db.all("SELECT * FROM schedules ORDER BY substr(date, 7, 4) || substr(date, 4, 2) || substr(date, 1, 2) ASC", [], (err, rows) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }
        res.render('index', { schedules: rows });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});