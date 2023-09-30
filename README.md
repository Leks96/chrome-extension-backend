## Backend API for A Chrome Extension
This API have an endpoint to receive videos recorded sent fron the frontend and store it in a database and also an endpoint for retrieve each videos stored in the database

## The start recording endpoint
here the frontend posts a request to the backend to an ID for the screen record session

`` /start-recording ``

## The upload chunk endpoint
here the frontend sends the recorded screen in chunks to this endpoint

`` /upload-chunk/:uniqueId ``

## The upload chunk endpoint
here the frontend sends the post request to the endpoint that the recorded session for that uniqueId has
been concluded

`` /complete-recording/:uniqueId ``