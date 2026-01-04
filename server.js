import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

// Standard ESM fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- Robust CORS Configuration ---
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-upazilla-id'] 
}));

// Reduce limit back to 5mb as we are now using ImgBB for images
app.use(express.json({ limit: '5mb' })); 

const MAIN_DB_URI = process.env.MONGODB_URL || "mongodb+srv://election_manager:7sHcm5XNdTLBKhy@cluster0.9fv57wd.mongodb.net/UNOs";
const PORT = process.env.PORT || 3000;

// --- Main Database Connection ---
console.log("Attempting to connect to Main MongoDB...");
const mainConnection = mongoose.createConnection(MAIN_DB_URI);

mainConnection.on('connected', () => {
    console.log("✅ Main Database Connected Successfully");
});
mainConnection.on('error', (err) => {
    console.error("❌ Main Database Connection Error:", err);
});

// Schema for Upazilla Credentials & Config
const UpazillaSchema = new mongoose.Schema({
  id: String,
  name: String,
  username: String,
  password: String, // In production, hash this!
  mongoDbUrl: String,
  port: String
});
const UpazillaModel = mainConnection.model('Upazilla', UpazillaSchema);

// --- Dynamic Schemas ---
const UnionSchema = new mongoose.Schema({
    id: String,
    upazillaId: String,
    name: String
});

const OfficerSchema = new mongoose.Schema({
    name: String,
    position: String,
    phone: String
}, { _id: false });

const CenterSchema = new mongoose.Schema({
    id: String,
    unionId: String,
    name: String,
    location: String,
    googleMapLink: String,
    imageUrl: String,
    presidingOfficer: OfficerSchema,
    assistantPresidingOfficer: OfficerSchema,
    policeOfficer: OfficerSchema
});

// --- Helper: Get Connection for specific Upazilla ---
const connectionCache = {};

const getUpazillaConnection = async (upazillaId) => {
    const upazilla = await UpazillaModel.findOne({ id: upazillaId });
    if (!upazilla) throw new Error("Upazilla not found in Main DB");

    if (connectionCache[upazilla.id]) {
        return connectionCache[upazilla.id];
    }

    console.log(`Connecting to Upazilla DB: ${upazilla.name}...`);
    const conn = mongoose.createConnection(upazilla.mongoDbUrl);
    
    conn.on('connected', () => console.log(`✅ Connected to ${upazilla.name} DB`));
    conn.on('error', (e) => console.error(`❌ Error connecting to ${upazilla.name} DB:`, e));

    conn.model('Union', UnionSchema);
    conn.model('Center', CenterSchema);

    connectionCache[upazilla.id] = conn;
    return conn;
};


// --- ROUTES ---

app.get('/api/upazillas', async (req, res) => {
    try {
        const upazillas = await UpazillaModel.find();
        res.json(upazillas);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/upazillas', async (req, res) => {
    try {
        const newUpazilla = new UpazillaModel(req.body);
        await newUpazilla.save();
        res.json(newUpazilla);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/upazillas/:id', async (req, res) => {
    try {
        await UpazillaModel.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/unions', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        if (!upazillaId) return res.status(400).json({ error: "Missing Upazilla ID" });

        const conn = await getUpazillaConnection(upazillaId);
        const Union = conn.model('Union');
        
        const unions = await Union.find({ upazillaId });
        res.json(unions);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/unions', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        const conn = await getUpazillaConnection(upazillaId);
        const Union = conn.model('Union');

        const newUnion = new Union(req.body);
        await newUnion.save();
        res.json(newUnion);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/centers', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        const { unionId } = req.query;
        const conn = await getUpazillaConnection(upazillaId);
        const Center = conn.model('Center');

        const centers = await Center.find({ unionId });
        res.json(centers);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/centers', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        const conn = await getUpazillaConnection(upazillaId);
        const Center = conn.model('Center');

        const newCenter = new Center(req.body);
        await newCenter.save();
        res.json(newCenter);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/centers/:id', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        const conn = await getUpazillaConnection(upazillaId);
        const Center = conn.model('Center');

        await Center.findOneAndUpdate({ id: req.params.id }, req.body);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- SERVE FRONTEND (Production) ---
const distPath = path.join(__dirname, 'dist');

// Check if dist exists
if (fs.existsSync(distPath)) {
    console.log(`Serving static files from ${distPath}`);
    app.use(express.static(distPath));

    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(distPath, 'index.html'));
        } else {
             res.status(404).json({ error: "API route not found" });
        }
    });
} else {
    console.error(`❌ DIST FOLDER NOT FOUND at ${distPath}. Did the build fail?`);
    app.get('/', (req, res) => {
        res.send('Backend is running, but frontend build (dist) is missing. Check deployment logs.');
    });
}

app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
});