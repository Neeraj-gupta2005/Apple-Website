import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/all";
gsap.registerPlugin(ScrollTrigger);
import { useState, useEffect, useRef } from "react";

import { highlightsSlides } from "../constants";
import { pauseImg, playImg, replayImg } from "../utils";

const VideoCorousel = () => {
  const videoRef = useRef([]); // video
  const videoDivRef = useRef([]); // progress bar ka div 
  const videoSpanRef = useRef([]); // ye vo vala nested progress baar h jo white hoga 


  // ye video ke saare options h jitne hosakte h inhi ke basis pe video chalegi
  const [video, setvideo] = useState({
    isEnd: false, // ye video end hua h ya nahi
    startPlay: false, // ye video play hua h ya nahi
    videoId: 0, // ye video ka id h
    isLastVideo: false, // ye last video h ya nahi
    isPlaying: false, // ye video play ho raha h ya nahi
  });

  const [loadedData, setLoadedData] = useState([]); // ye video ke data load hota h toh uska duration store karne ke liye
  const { isEnd, startPlay, videoId, isLastVideo, isPlaying } = video; // yaha pe hum har value ko alag kar rahe h 

  // ye gsap ka hook h ye saare animation control karega
  useGSAP(() => {

    // ye videos ki postion ko left right karega on the basis of videoId
    gsap.to('#slider',{
      transform:`translateX(${-100 * videoId}%)`,
      ease:'power2.inOut',
      duration:2
    })

    // ye video ko scroll karne pe play karega
    gsap.to("#video", {
      scrollTrigger: {
        trigger: "#video",
        toggleActions: "restart none none none",
      },

      // ye video ko play karega
      onComplete: () => {
        setvideo((pre) => ({
          ...pre,
          startPlay: true, // video play hua h
          isPlaying: true, // video play ho raha h
        }));
      },
    });
  }, [isEnd, videoId]); 

  // ye video ko play pause karega
  useEffect(() => {
    if (loadedData.length > 3) { // ye check karega ki video load hua h ya nahi
      if (!isPlaying) {
        videoRef.current[videoId].pause();
      } else {
        startPlay && videoRef.current[videoId].play();
      }
    }
  }, [startPlay, videoId, isPlaying, loadedData]);

  // ye video ke progress bar ko animate karega
  useEffect(() => {
    let currentProgress = 0; // ye video ka progress h
    let span = videoSpanRef.current; // ye video ke progress bar ka span h

    if (span[videoId]) { // ye check karega ki video ka span h ya nahi
      // animate the progress of the video

      let anim = gsap.to(span[videoId], {
        onUpdate: () => { 
          const progress = Math.ceil(anim.progress() * 100); 

          if (progress != currentProgress) {
            currentProgress = progress;

            gsap.to(videoDivRef.current[videoId], { // ye video ke progress bar ka div h
              width:
                window.innerWidth < 760 
                  ? "10vw" // mobile
                  : window.innerWidth < 1200
                  ? "10vw" // tablet
                  : "4vw", // laptop
            });

            // ye video ke progress bar ko animate karega
            gsap.to(span[videoId], {
              width: `${currentProgress}%`,
              backgroundColor: "white",
            });
          }
        },

        // ye video end hone pe progress bar ko reset karega
        onComplete: () => {
          if (isPlaying) {
            gsap.to(videoDivRef.current[videoId], {
              width: "12px",
            });
            gsap.to(span[videoId], {
              backgroundColor: "#afafaf",
            });
          }
        },
      });

      // hum video id ko check karenge ki video id 0 h ya nahi agar h toh video ko restart karenge
      if(videoId === 0){
        anim.restart();
      }

      // ye progress ko set kar raha h 
      const animUpdate = () => {
        anim.progress(videoRef.current[videoId].currentTime / highlightsSlides[videoId].videoDuration);
      }

      // ye har ek clock pe chalegi or animupdate ko call karegi jo fir progress ko update karega
      if(isPlaying){
        gsap.ticker.add(animUpdate);
      }
      else{
        gsap.ticker.remove(animUpdate);
      }
    }


  }, [videoId, startPlay]); 

  // ye video ke process ko handle karega
  const handleProcess = (type, i) => {
    switch (type) {
      case "video-end": // video end hoga to 
        setvideo((prev) => ({ ...prev, isEnd: true, videoId: i + 1 })); // video end hoga or next video play hoga
        break;
      case "video-last": // last video h toh
        setvideo((prev) => ({ ...prev, isLastVideo: true })); // last video h
        break;
      case "video-reset": // video reset hoga toh
        setvideo((prev) => ({ ...prev, isLastVideo: false, videoId: 0 })); // video reset hoga or video id 0 hoga
        break;
      case "play": // video play hoga toh
        setvideo((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));  // video play hoga
        break;
      case "pause":
        setvideo((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
        break;

      default:
        return video; 
    }
  };


  const handleLoadedMetaData = (i, e) => setLoadedData((pre) => [...pre, e]); 

  return (
    <>
      <div className="flex items-center">
        {highlightsSlides.map((list, i) => ( // ye saari video ko map kar raha h 
          <div key={list.id} id="slider" className="sm:pr-20 pr-10">
            <div className="video-carousel_container ">
              <div className="w-full h-full overflow-hidden flex-center rounded-3xl bg-black">
                <video
                  id="video"
                  playsInline={true} // ye video ko usi div me play karega
                  preload="auto" // ye video ko preload karega on the basis of internet speed and web browser
                  muted // ye video ko mute karega
                  className={`${list.id === 2 && 'translate-x-44' } 
                  pointers-events-none`} // ye humne special second video ke liye diya h jisme video ko right side me translate karega
                  ref={(el) => (videoRef.current[i] = el)} // ye video ko ref me store karega
                  onEnded={() => 
                    i !== 3 ? handleProcess("video-end", i) : handleProcess("video-last")
                  } // end hone pe check karta rahega ki video last to nahi thi agar nahi thi to next video play karega
                  onPlay={() => {
                    setvideo((prevVideo) => ({
                      ...prevVideo,
                      isPlaying: true
                    }));
                  }} // video play hote hi isPlaying true ho jayega
                  onLoadedMetadata={(e) => handleLoadedMetaData(i, e)} // ye video ke metadata ko load karega
                >
                  <source src={list.video} type="video/mp4" />
                </video>
              </div>

              // ye saara absolute text h jo video ke upar show hoga
              <div className="absolute top-12 left-[5%] z-10"> 
                {list.textLists.map((text) => ( // because saare text humare array me h
                  <p key={text} className="md:text-2xl text-xl font-medium">
                    {text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      // ye saara progress bar h jo video ke neeche show hoga
      <div className="relative flex-center mt-10">
        <div className="flex-center py-5 px-7 bg-gray-300 backdrop-blur rounded-full">
          {videoRef.current.map((_, i) => ( // ye saare progress bar ko map kar raha h
            <span // ye saara progress bar ka span h
              key={i}
              className="mx-2 w-3 h-3 bg-gray-200 rounded-full relative cursor-pointer"
              ref={(el) => (videoDivRef.current[i] = el)}
            >
              <span // ye saara progress bar ka span h jo white hoga
                className="absolute h-full w-full rounded-full"
                ref={(el) => (videoSpanRef.current[i] = el)}
              />
            </span>
          ))}
        </div>

        // ye saara control button h jo video ke neeche show hoga

        <button className="control-btn"
        onClick={
          isLastVideo
            ? () => handleProcess("video-reset")
            : !isPlaying
            ? () => handleProcess("play")
            : () => handleProcess("pause")
        }>
          <img
            src={isLastVideo ? replayImg : !isPlaying ? playImg : pauseImg}
            alt={isLastVideo ? "replay" : !isPlaying ? "play" : "pause"}
            
          />
        </button>
      </div>
    </>
  );
};

export default VideoCorousel;
