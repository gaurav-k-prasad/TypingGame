const Socket = require("ws");
const express = require("express");
const data = require("./data.cjs");
const cors = require("cors")

const app = express();
const PORT = 8080;

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
app.use(cors())
app.use(express.static("public"));

app.get("/data", (req, res) => {
	const passage =
		data.quotes[Math.floor(Math.random() * (data.quotes.length + 1))];
	res.json(passage);
});
