require('dotenv').config();

const express = require ('express');
const mongoose = require ('mongoose');
const multer = require('multer');
const cors = require ('cors');
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
    videoData: Buffer,
});

//setup multer for video uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, //limiting the filesize to 10mb
    }
})

//unique generator function
function generateUniqueId() {
    return uuidv4();
}

//data storage for ongoing recordings
const recordings = {};

const Video = mongoose.model('Video', videoSchema);

//start recording endpoint
app.post('/start-recording', (req, res) => {
    const uniqueId = generateUniqueId();

    //store unique id for recording the session
    recordings[uniqueId] = { chunks: [] }

    res.status(200).json({ uniqueId });
});

//upload chunk endpoint
app.post('/upload-chunk/:uniqueId',upload.single('videoChunk'), (req, res) => {
    const { uniqueId } = req.params;
    const videoChunkData = req.file.buffer;

    if (!recordings[uniqueId]) {
        return res.status(404).json({ message: 'Recording not found' })
    }

    //store the uploaded chunk
    recordings[uniqueId].chunks.push(videoChunkData);

    res.status(200).json({ message: 'Chunks uploaded successfully' })
});

//complete recording endpoint
app.post('/complete-recording/:uniqueId', async (req, res) => {
    const { uniqueId } = req.params;

    if (!recordings[uniqueId]) {
        return res.status(404).json({ message: 'Recording not found' })
    }

    const { title } = req.body;

    try {
        //concat all chunks to crate a complete video data
        const completeVideoData = Buffer.concat(recordings[uniqueId].chunks);

        //create new video doc in MongoDB
        const video = new Video ({
            title,
            videoData: completeVideoData,
        });
    
        await video.save();

        //remove the recording from the data store
        delete recordings[uniqueId];

        res.status(200).json({ message: 'Recordings completed and saved successfully'})
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' })
    }
});

//handle video uploads

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
});