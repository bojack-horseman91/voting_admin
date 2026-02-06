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
// Allow '*' to ensure mobile apps (Emulator/Device) can connect without origin issues during dev
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-upazilla-id'] 
}));

// Request Logger Middleware (Helps debug routes in Render logs)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Increase limit to 50mb to handle large image payloads if necessary
app.use(express.json({ limit: '50mb' })); 

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
  zilla: { type: String, default: 'বরগুনা' }, // Added Zilla field with default
  username: String,
  password: String, // In production, hash this!
  mongoDbUrl: String,
  port: String,
  imgbbKey: String
});
const UpazillaModel = mainConnection.model('Upazilla', UpazillaSchema);

// Schema for Zilla (District) Level Important Persons (Main DB)
const ZillaPersonSchema = new mongoose.Schema({
  id: String,
  zilla: String, // Filter key
  name: String,
  designation: String,
  phone: String,
  category: String, // 'admin', 'police', 'defence'
  ranking: { type: Number, default: 0 }
});
const ZillaPersonModel = mainConnection.model('ZillaPerson', ZillaPersonSchema);

// --- Dynamic Schemas ---
const UnionSchema = new mongoose.Schema({
    id: String,
    upazillaId: String,
    name: String,
    type: { type: String, default: 'Union' } // 'Union' or 'Pourashava'
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
    policeOfficer: OfficerSchema,
    category: { type: String, default: 'safe' },
    comment: { type: String, default: '' },
    maleVoters: { type: Number, default: 0 },
    femaleVoters: { type: Number, default: 0 }
});

const ImportantPersonSchema = new mongoose.Schema({
    id: String,
    upazillaId: String, // Added for isolation in shared DBs
    name: String,
    designation: String,
    phone: String,
    category: String, // 'admin', 'police', 'defence', 'health', 'emergency', 'other'
    ranking: { type: Number, default: 0 }
});

const MarkhaSchema = new mongoose.Schema({
    id: String,
    name: String,
    partyName: String,
    nomineeName: String,
    imageUrl: String
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
    conn.model('ImportantPerson', ImportantPersonSchema);
    conn.model('Markha', MarkhaSchema);

    connectionCache[upazilla.id] = conn;
    return conn;
};


// --- ROUTES ---

// Health Check Route (Fixes the "API route not found" on base URL)
app.get('/api', (req, res) => {
    res.json({
        status: 'online',
        message: 'ElectionManager Pro API is running',
        documentation: 'https://github.com/your-repo/blob/main/API_DOCUMENTATION.md',
        endpoints: [
            '/api/upazillas',
            '/api/unions',
            '/api/centers'
        ]
    });
});

// Updated: Supports filtering by ?zilla=Name
app.get('/api/upazillas', async (req, res) => {
    try {
        const { zilla } = req.query;
        const query = {};
        
        if (zilla) {
            query.zilla = zilla;
        }

        const upazillas = await UpazillaModel.find(query);
        res.json(upazillas);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get single upazilla details (Internal use for loading configs)
app.get('/api/upazillas/:id', async (req, res) => {
    try {
        const upazilla = await UpazillaModel.findOne({ id: req.params.id });
        if(!upazilla) return res.status(404).json({error: "Not found"});
        res.json(upazilla);
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

app.put('/api/upazillas/:id', async (req, res) => {
    try {
        await UpazillaModel.findOneAndUpdate({ id: req.params.id }, req.body);
        res.json({ success: true });
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

// --- ZILLA PERSON ROUTES (Global/Main DB) ---

app.get('/api/zilla-persons', async (req, res) => {
    try {
        const { zilla } = req.query;
        const query = {};
        if (zilla) query.zilla = zilla;
        
        const persons = await ZillaPersonModel.find(query).sort({ ranking: 1 });
        res.json(persons);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/zilla-persons', async (req, res) => {
    try {
        const newPerson = new ZillaPersonModel(req.body);
        await newPerson.save();
        res.json(newPerson);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/zilla-persons/:id', async (req, res) => {
    try {
        await ZillaPersonModel.findOneAndUpdate({ id: req.params.id }, req.body);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/zilla-persons/:id', async (req, res) => {
    try {
        await ZillaPersonModel.deleteOne({ id: req.params.id });
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

app.put('/api/unions/:id', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        const conn = await getUpazillaConnection(upazillaId);
        const Union = conn.model('Union');

        await Union.findOneAndUpdate({ id: req.params.id }, req.body);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/unions/:id', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        const conn = await getUpazillaConnection(upazillaId);
        const Union = conn.model('Union');

        await Union.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// OPTIMIZED: List View (Name, Address & Category only)
app.get('/api/centers', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        const { unionId } = req.query;
        const conn = await getUpazillaConnection(upazillaId);
        const Center = conn.model('Center');

        // Projection: Return essential fields for list view including category
        const centers = await Center.find({ unionId }).select('id name location unionId category');
        res.json(centers);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// NEW ENDPOINT: Detail View (Full Info)
app.get('/api/centers/:id', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        const conn = await getUpazillaConnection(upazillaId);
        const Center = conn.model('Center');

        const center = await Center.findOne({ id: req.params.id });
        if (!center) return res.status(404).json({ error: "Center not found" });
        
        res.json(center);
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

app.delete('/api/centers/:id', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        const conn = await getUpazillaConnection(upazillaId);
        const Center = conn.model('Center');

        await Center.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- IMPORTANT PERSONS ROUTES ---

app.get('/api/important-persons', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        const conn = await getUpazillaConnection(upazillaId);
        const ImportantPerson = conn.model('ImportantPerson');

        // SMART FILTER: 
        // 1. Show items specifically belonging to this upazilla (upazillaId match).
        // 2. OR show items with NO upazillaId (Legacy data in shared database).
        // This allows migration: User sees legacy data, edits it, system saves it with new ID, 
        // effectively 'moving' it to their view exclusively.
        const query = {
            $or: [
                { upazillaId: upazillaId },
                { upazillaId: { $exists: false } },
                { upazillaId: null }
            ]
        };

        const persons = await ImportantPerson.find(query).sort({ ranking: 1 });
        res.json(persons);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/important-persons', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        const conn = await getUpazillaConnection(upazillaId);
        const ImportantPerson = conn.model('ImportantPerson');

        // Enforce Upazilla ID on creation
        const newPerson = new ImportantPerson({ ...req.body, upazillaId });
        await newPerson.save();
        res.json(newPerson);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/important-persons/:id', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        const conn = await getUpazillaConnection(upazillaId);
        const ImportantPerson = conn.model('ImportantPerson');

        // Enforce Upazilla ID on update (Claims the record if it was legacy)
        await ImportantPerson.findOneAndUpdate(
            { id: req.params.id }, 
            { ...req.body, upazillaId }
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/important-persons/:id', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        const conn = await getUpazillaConnection(upazillaId);
        const ImportantPerson = conn.model('ImportantPerson');

        await ImportantPerson.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- MARKHA (SYMBOLS) ROUTES ---

app.get('/api/markhas', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        const conn = await getUpazillaConnection(upazillaId);
        const Markha = conn.model('Markha');

        const markhas = await Markha.find();
        res.json(markhas);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/markhas', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        const conn = await getUpazillaConnection(upazillaId);
        const Markha = conn.model('Markha');

        const newMarkha = new Markha(req.body);
        await newMarkha.save();
        res.json(newMarkha);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/markhas/:id', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        const conn = await getUpazillaConnection(upazillaId);
        const Markha = conn.model('Markha');

        await Markha.findOneAndUpdate({ id: req.params.id }, req.body);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/markhas/:id', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        const conn = await getUpazillaConnection(upazillaId);
        const Markha = conn.model('Markha');

        await Markha.deleteOne({ id: req.params.id });
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
    // Development mode helper
    app.get('/', (req, res) => {
        res.send('Backend is running. For frontend, run `npm run dev` and access port 5173.');
    });
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
});