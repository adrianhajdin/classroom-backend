import AgentAPI from "apminsight";
AgentAPI.config()

import express from 'express';
import cors from "cors";

import subjectsRouter from "./routes/subjects.js";
import securityMiddleware from "./middleware/security.js";

const app = express();
const PORT = 8000;

if (!process.env.FRONTEND_URL) throw new Error('FRONTEND_URL is not set in .env file');

app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}))

app.use(express.json());

app.use('/api/subjects', subjectsRouter)

app.use(securityMiddleware);

app.get('/', (req, res) => {
  res.send('Hello, welcome to the Classroom API!');
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
