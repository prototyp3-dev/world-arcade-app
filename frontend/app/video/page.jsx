"use client"
import React from 'react';

// This imports the functional component from the previous sample.
import VideoJS from '../components/videojs';
import videojs from 'video.js';

import "videojs-markers/dist/videojs-markers";
import "videojs-markers/dist/videojs.markers.css";


export default function Home() {
  const playerRef = React.useRef(null);

  const videoJsOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: true,
    sources: [{
      src: 'example.mp4',
      type: 'video/mp4'
    }]
  };

  const handlePlayerReady = (player) => {
    playerRef.current = player;

    // You can handle player events here, for example:
    player.on('waiting', () => {
      videojs.log('player is waiting');
    });

    player.on('dispose', () => {
      videojs.log('player will dispose');
    });

    //load the marker plugin
    player.markers({
      markers: [
        {
            time: 9.5,
            text: "put"
        },
        {
            time: 16,
            text: "any"
        },
        {
            time: 23.6,
            text: "text"
        },
        {
            time: 28,
            text: "here"
        }
      ]
    });
  };

  const addMarker = () => {
    playerRef.current.markers.add([{
      time: 22,
      text: "I'm added dynamically"
    }])    
  }


  return (
    <div>
      <VideoJS options={videoJsOptions} onReady={handlePlayerReady} />

      <div className='my-12'></div>

      <button 
      className='p-2 m-4 text-center border hover:shadow-md'
      onClick={addMarker}>
        Add Marker
      </button>
    </div>
  );
}