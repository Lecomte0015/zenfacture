import React from "react";
import ReactPlayer from "react-player";

function Video() {
  return (
    <ReactPlayer
      src="/videos/video.mp4"
      playing
      loop
      muted
      playsInline
      controls={false}
      width="100%"
      height="100%"
    />
  );
}

export default Video;