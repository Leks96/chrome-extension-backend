require('dotenv').config();

const express = require ('express');
const mongoose = require ('mongoose');
const multer = require ('multer');
const path = require ('path');
//const fs = require ('fs');

const app = express();
port = process.env.PORT || 3050;

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
    filename: String,
});

const Video = mongoose.model('Video', videoSchema);

//setting up multer for video file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb (null, './uploads');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb (null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 1000 * 1024 * 1024
    },
});

//handle video uploads
app.post('/api/upload', upload.single('video'), async (req, res) => {
    try {
        //create a new video doc in mongoDB
        const { title } = req.body;
        const { filename } = req.file;

        const video = new Video({ title, filename });
        await video.save();

        res.status(201).json({ message: 'video uploaded successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'server error' })
    }
});

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
});