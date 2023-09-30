require('dotenv').config();

const express = require ('express');
const mongoose = require ('mongoose');
const multer = require ('multer');
const cloudinary = require ('cloudinary').v2

const app = express();
port = process.env.PORT || 3050;
          
cloudinary.config({ 
  cloud_name: 'dglpy94yq', 
  api_key: '349563784769639', 
  api_secret: 'digX16WEKTBHwdeC4X0BNflG7gQ' 
});

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
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
}); 

//handle video uploads
app.post('/api/upload', upload.single('video'), async (req, res) => {
    try {
        //create a new video doc in mongoDB
        const { title } = req.body;
        const videoFileBuffer = req.file.buffer;

        //upload video to cloudinary
        const uploadResponse = await cloudinary.uploader.upload_stream(
            { resource_type: 'video' },
            async (error, result) => {
                if (error) {
                    console.error(error);
                    res.status(500).json({ message: 'Error uploading video' });
                } else {
                    //save vido metadata to the mongoDB
                    const { public_id, secure_url } = result;

                    //create new video doc in mongoDB
                    const video = new Video({
                        title,
                        filename: public_id //store public_id
                    });
                    await video.save(); //save metadata in mongoDB

                    res.status(201).json({ message: 'Video uploaded succesfully' } )
                }
            }
        );

        videoFileBuffer.pipe(uploadResponse)
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'server error' })
    }
});

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
});