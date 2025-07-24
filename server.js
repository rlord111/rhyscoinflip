
const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const adminEmail = "rhys.lord09@gmail.com";

function updateBalance(username, delta) {
  let lines = fs.readFileSync('balances.csv', 'utf8').split('\n').filter(l => l.trim());
  let updated = false;
  lines = lines.map((line, i) => {
    if (i === 0) return line;
    const [user, bal] = line.split(',');
    if (user === username) {
      updated = true;
      return `${user},${parseInt(bal) + delta}`;
    }
    return line;
  });
  if (!updated) lines.push(`${username},${delta}`);
  fs.writeFileSync('balances.csv', lines.join('\n'));
}

function getBalance(username) {
  const data = fs.readFileSync('balances.csv', 'utf8').split('\n');
  for (let i = 1; i < data.length; i++) {
    const [user, bal] = data[i].split(',');
    if (user === username) return parseInt(bal);
  }
  return 0;
}

function logGame(username, game, play, outcome, note) {
  const time = new Date().toISOString();
  fs.appendFileSync('results.csv', `${username},${game},${play},${outcome},${note},${time}\n`);
  if (note.startsWith("CASHOUT")) {
    fs.appendFileSync('cashouts.csv', `${username},${game},${note},${time}\n`);
  }
}

app.post('/coinflip', (req, res) => {
  const { username, doubleDown } = req.body;
  const cost = doubleDown ? 20 : 10;
  if (getBalance(username) < cost) return res.json({ message: "Not enough Rhys Coins" });
  updateBalance(username, -cost);
  const outcome = Math.random() < 0.56 ? "Bot Wins" : "Player Wins";
  const note = outcome === "Player Wins"
    ? doubleDown ? "CASHOUT: 40 skins" : "CASHOUT: 20 skins"
    : "-";
  logGame(username, "CoinFlip", doubleDown ? "Double Down" : "Flip", outcome, note);
  res.json({ message: outcome });
});

app.post('/blackjack', (req, res) => {
  const { username, doubleDown } = req.body;
  const cost = doubleDown ? 40 : 20;
  if (getBalance(username) < cost) return res.json({ message: "Not enough Rhys Coins" });
  updateBalance(username, -cost);
  const outcome = Math.random() < 0.45 ? "Player Wins" : "Bot Wins";
  const note = outcome === "Player Wins"
    ? doubleDown ? "CASHOUT: 2000 skins" : "CASHOUT: 1000 skins"
    : "-";
  logGame(username, "Blackjack", doubleDown ? "Double Down" : "Play", outcome, note);
  res.json({ message: outcome });
});

app.post('/roulette', (req, res) => {
  const { username, doubleDown } = req.body;
  const cost = doubleDown ? 10 : 5;
  if (getBalance(username) < cost) return res.json({ message: "Not enough Rhys Coins" });
  updateBalance(username, -cost);
  const number = Math.ceil(Math.random() * 10);
  const outcome = number === 7 ? "Player Wins" : "Bot Wins";
  const note = outcome === "Player Wins"
    ? doubleDown ? "CASHOUT: 10x payout" : "CASHOUT: 5x payout"
    : "-";
  logGame(username, "Roulette", doubleDown ? "Double Down" : "Play", outcome, note);
  res.json({ message: `${outcome} (Number: ${number})` });
});

app.post('/buy', (req, res) => {
  const { username, amount } = req.body;
  const coins = parseInt(amount) * 100;
  updateBalance(username, coins);
  const time = new Date().toISOString();
  fs.appendFileSync('purchases.csv', `${username},${amount},${coins},${time}\n`);
  res.json({ message: `Added ${coins} coins to ${username}` });
});

app.post('/admin', (req, res) => {
  const { admin } = req.body;
  if (admin !== adminEmail) return res.json({ message: "Unauthorized" });
  const balances = fs.readFileSync('balances.csv', 'utf8');
  res.json({ message: balances });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
