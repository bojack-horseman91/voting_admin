import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// --- Robust CORS Configuration ---
// We explicitly allow the frontend origin (5173) and the custom header 'x-upazilla-id'
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-upazilla-id'] 
}));

// Reduce limit back to 5mb as we are now using ImgBB for images
app.use(express.json({ limit: '5mb' })); 

const MAIN_DB_URI = process.env.MONGODB_URL || "mongodb+srv://election_manager:7sHcm5XNdTLBKhy@cluster0.9fv57wd.mongodb.net/UNOs";
const PORT = process.env.PORT || 3000;

// --- Main Database Connection (For Super Admin & Upazilla Directory) ---
console.log("Attempting to connect to Main MongoDB...");
const mainConnection = mongoose.createConnection(MAIN_DB_URI);

mainConnection.on('connected', () => {
    console.log("✅ Main Database Connected Successfully");
    console.log(`   Target: ${MAIN_DB_URI.split('@')[1]}`); // Log the cluster address for verification
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

// --- Dynamic Schemas (For User Data inside specific Upazilla DBs) ---
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
// We cache connections to avoid opening too many
const connectionCache = {};

const getUpazillaConnection = async (upazillaId) => {
    // 1. Find the upazilla config from the main DB
    const upazilla = await UpazillaModel.findOne({ id: upazillaId });
    if (!upazilla) throw new Error("Upazilla not found in Main DB");

    // 2. Check if we already have a connection open
    if (connectionCache[upazilla.id]) {
        return connectionCache[upazilla.id];
    }

    // 3. Create new connection to the SPECIFIC mongoDbUrl provided by Super Admin
    console.log(`Connecting to Upazilla DB: ${upazilla.name}...`);
    const conn = mongoose.createConnection(upazilla.mongoDbUrl);
    
    conn.on('connected', () => console.log(`✅ Connected to ${upazilla.name} DB`));
    conn.on('error', (e) => console.error(`❌ Error connecting to ${upazilla.name} DB:`, e));

    // 4. Register models on this dynamic connection
    conn.model('Union', UnionSchema);
    conn.model('Center', CenterSchema);

    connectionCache[upazilla.id] = conn;
    return conn;
};


// --- ROUTES ---

// 1. Super Admin: Get All Upazillas
app.get('/api/upazillas', async (req, res) => {
    try {
        const upazillas = await UpazillaModel.find();
        console.log(`Fetched ${upazillas.length} upazillas from Main DB`);
        res.json(upazillas);
    } catch (e) {
        console.error("Get Upazillas Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// 2. Super Admin: Create Upazilla
app.post('/api/upazillas', async (req, res) => {
    try {
        const newUpazilla = new UpazillaModel(req.body);
        await newUpazilla.save();
        console.log("✅ New Upazilla SAVED to Main DB:", newUpazilla.name);
        res.json(newUpazilla);
    } catch (e) {
        console.error("Create Upazilla Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// 3. Super Admin: Delete Upazilla
app.delete('/api/upazillas/:id', async (req, res) => {
    try {
        await UpazillaModel.deleteOne({ id: req.params.id });
        console.log(`🗑️ Upazilla ${req.params.id} DELETED from Main DB`);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. Upazilla Admin: Get Unions
// Requires header 'x-upazilla-id' to know which DB to connect to
app.get('/api/unions', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        if (!upazillaId) return res.status(400).json({ error: "Missing Upazilla ID" });

        const conn = await getUpazillaConnection(upazillaId);
        const Union = conn.model('Union');
        
        const unions = await Union.find({ upazillaId });
        res.json(unions);
    } catch (e) {
        console.error("Get Unions Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// 5. Upazilla Admin: Create Union
app.post('/api/unions', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        const conn = await getUpazillaConnection(upazillaId);
        const Union = conn.model('Union');

        const newUnion = new Union(req.body);
        await newUnion.save();
        console.log(`✅ Union '${newUnion.name}' SAVED to Upazilla DB`);
        res.json(newUnion);
    } catch (e) {
        console.error("Create Union Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// 6. Upazilla Admin: Get Centers
app.get('/api/centers', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        const { unionId } = req.query;
        const conn = await getUpazillaConnection(upazillaId);
        const Center = conn.model('Center');

        const centers = await Center.find({ unionId });
        res.json(centers);
    } catch (e) {
        console.error("Get Centers Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// 7. Upazilla Admin: Create Center
app.post('/api/centers', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        const conn = await getUpazillaConnection(upazillaId);
        const Center = conn.model('Center');

        const newCenter = new Center(req.body);
        await newCenter.save();
        console.log(`✅ Center '${newCenter.name}' SAVED to Upazilla DB`);
        res.json(newCenter);
    } catch (e) {
        console.error("Create Center Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// 8. Upazilla Admin: Update Center
app.put('/api/centers/:id', async (req, res) => {
    try {
        const upazillaId = req.headers['x-upazilla-id'];
        const conn = await getUpazillaConnection(upazillaId);
        const Center = conn.model('Center');

        await Center.findOneAndUpdate({ id: req.params.id }, req.body);
        console.log(`✅ Center '${req.body.name}' UPDATED in Upazilla DB`);
        res.json({ success: true });
    } catch (e) {
        console.error("Update Center Error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Frontend should be running on http://localhost:5173`);
    console.log(`-----------------------------------`);
});