const Socket = require("ws");
const express = require("express");
const data = require("./data.cjs");

const app = express();
const PORT = 3000;

const server = app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});

const wss = new Socket.WebSocketServer({ server });
const multiplayerUsers = [];

wss.on("connection", (ws) => {
    multiplayerUsers.push(ws);
	ws.on("message", (data) => {
		console.log("message", data.toString());
	});
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
	res.render("index.ejs");
});

app.get("/data", (req, res) => {
	const passage =
		data.quotes[Math.floor(Math.random() * (data.quotes.length + 1))];
	console.log(passage);
	res.json(passage);
});
