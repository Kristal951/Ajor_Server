import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from './routes/User.js'

dotenv.config();

const app = express();
const PORT = process.env.PORT_NUMBER;

app.use(cors());
app.use(express.json());
app.use('/api/user', userRoutes)

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
