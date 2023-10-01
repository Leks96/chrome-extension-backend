require('dotenv').config();

const express = require ('express');
const mongoose = require ('mongoose');
const multer = require('multer');
const cors = require ('cors');
const path = require ('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
port = process.env.PORT || 3050;

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on('connected', () => {
    console.log('connected to mongoDB');
});

db.on('error', (error) => {
    console.log('mongoDB connection error:', error);
});

//the video schema
const videoSchema = new mongoose.Schema({
    title: String,
    filePath: String,
});

//setup multer for video uploads
const storage = multer.diskStorage({
    destination: path.join(__dirname, 'uploads'),
    filename: (req, file, cb) => {
        const uniqueId = generateUniqueId();
        cb(null, `${uniqueId}-${file.originalname}`); //remove the file to include a unique id
    },
});

const upload = multer ({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024
    }
})

//unique generator function
function generateUniqueId() {
    return uuidv4();
}

//data storage for ongoing recordings
const recordings = {};

const Video = mongoose.model('Video', videoSchema);

let currentUniqueId;

//start recording endpoint
app.post('/start-recording', (req, res) => {
    currentUniqueId = generateUniqueId();

    //store unique id for recording the session
    recordings[currentUniqueId] = { chunks: [] }

    res.status(200).json({ uniqueId: currentUniqueId });
});

//upload chunk endpoint
app.post('/upload-chunk',upload.single('videoChunk'), (req, res) => {
    if (!currentUniqueId || !recordings[currentUniqueId]) {
        return res.status(404).json({ message: 'Recording not found' })
    }

    const videoChunkData = req.file.buffer

    //store the uploaded chunk using current unique id 
    recordings[currentUniqueId].chunks.push(videoChunkData);

    res.status(200).json({ message: 'Chunks uploaded successfully' })
});

//complete recording endpoint
app.post('/complete-recording', async (req, res) => {
    if (!currentUniqueId || !recordings[currentUniqueId]) {
        return res.status(404).json({ message: 'Recording not found' })
    }

    const { title } = req.body;

    try {
        // Concatenate all chunks to create complete video data
        const completeVideoData = Buffer.concat(recordings[currentUniqueId].chunks);
    
        // Define the file path where the video will be saved on the server
        const filePath = path.join(__dirname, 'uploads', `${currentUniqueId}.mp4`); // Use currentUniqueId as the filename
    
        // Write the complete video data to the file on the server
        fs.writeFileSync(filePath, completeVideoData);
    
        // Create a new video doc in MongoDB with title and the path to the saved video file
        const video = new Video({
            title,
            filePath: `${currentUniqueId}.mp4`, // Associate the file path with the model
        });
    
        await video.save();
    
        // Remove the recording from the data store
        delete recordings[uniqueId];
    
        res.status(200).json({ message: 'Recording metadata saved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
    
    
});

//handle video uploads

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
});