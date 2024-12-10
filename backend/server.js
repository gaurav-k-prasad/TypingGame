const cors = require("cors");
const data = require("./data.cjs");
const express = require("express");
const app = express();
const PORT = 3000;

app.use(cors())
app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.get("/data", (req, res) => {
    const passage = data.quotes[Math.floor(Math.random() * (data.quotes.length + 1))];
    console.log(passage);
    res.json(passage)
})

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);;
})