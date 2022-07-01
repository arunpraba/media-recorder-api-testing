import { useRef, useEffect, useState } from "react";

import "./styles.css";
import { useVad } from "./useVad";

let videoType = "video/webm";
let audioType = "audio/webm";
let extension = "webm";

const mediaRecordingSizes = {
  xs: {
    width: 640,
    height: 480
  },
  sm: {
    width: 1024,
    height: 576
  },
  md: {
    width: 1280,
    height: 720
  },
  lg: {
    width: 1920,
    height: 1080
  }
};

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

const vadInitialState = "Voice activity is in idle";
const initialHistory = [`Media console initialized...`];
if (isSafari) {
  videoType = "video/mp4";
  audioType = "audio/mp4";
  extension = "mp4";
}

export default function App() {
  const streamRef = useRef();
  const blobsRef = useRef([]);
  const mediaRecorderRef = useRef([]);
  const mediaRef = useRef(null);
  const counterRef = useRef(0);
  const frameRateRef = useRef(null);
  const [history, setHistory] = useState(initialHistory);
  const [mimeType, setMimeType] = useState(videoType);
  const [recording, setIsRecording] = useState(false);
  const [videoSize, setVideoSize] = useState("xs");
  const [frameRate, setFrameRate] = useState(10);
  const [timeSlice, setTimeSlice] = useState(5);
  const startTimeRef = useRef(0);
  const endTimeRef = useRef(0);
  

  const [recorderTime, setRecorderTime] = useState(0);
  const [voiceActivityMessage, setVoiceActivityMessage] = useState(
    vadInitialState
  );
  const { start, stop } = useVad();

  const preview = () => {
    setIsRecording(false);
    setHistory((prev) => [...prev, `Showing the preview`]);
    const blobs = blobsRef.current;
    if (!blobs.length) return;
    mediaRef.current.srcObject = null;
    mediaRef.current.muted = false;
    mediaRef.current.src = URL.createObjectURL(
      new Blob(blobs, { type: mimeType })
    );
  };

  const startRecording = async () => {
    if (!frameRate || frameRate > 60 || frameRate < 5) {
      alert(`Frame rate should be less that 60 and greater than 5`);
      frameRateRef.current.focus();
      return;
    }
    try {
      blobsRef.current = [];
      setIsRecording(true);
      setHistory((prev) => [...prev, `Video Started`]);
      let video = false;
      if (mimeType === videoType) {
        video = { ...mediaRecordingSizes[videoSize], frameRate };
      }
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video
      });
      mediaRef.current.srcObject = streamRef.current;
      mediaRef.current.muted = "muted";
      setHistory((prev) => [...prev, `Got Media Stream`]);

      mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
        mimeType
      });

      setHistory((prev) => [
        ...prev,
        `Media Recored Started with mimeType ${mimeType}`
      ]);

      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log(`Size: ${event.data.size}`);
        if (event.data.size > 0) {
          counterRef.current += 1;
          setHistory((prev) => [
            ...prev,
            `Recorded...: ${counterRef.current * timeSlice}s`
          ]);
          blobsRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = preview;
      mediaRecorderRef.current.start(timeSlice * 1000);
      mediaRef.current.ontimeupdate = () => {
        if (!startTimeRef.current) {
          startTimeRef.current = mediaRef.current.currentTime;
        }
      };
      start({
        stream: streamRef.current,
        onUpdate(value) {
          setVoiceActivityMessage(`Current voice activity value ${value}`);
          console.log("Hello onUpdate");
        },
        onVoiceStart() {
          setVoiceActivityMessage(`Voice activity started`);
          console.log("Hello onVoiceStart");
        },
        onVoiceStop() {
          setVoiceActivityMessage(`Voice activity stopped`);
          console.log("Hello onVoiceStop");
        }
      });
    } catch (err) {
      setHistory((prev) => [...prev, err.message]);
    }
  };

  const stopRecording = () => {
    counterRef.current = 0;
    setIsRecording(false);
    setHistory((prev) => [...prev, `Stopped recording`]);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (!endTimeRef.current) {
      endTimeRef.current = mediaRef.current.currentTime;
    }
    const diff = Math.trunc(endTimeRef.current - startTimeRef.current);
    setRecorderTime(diff);
    if (mediaRecorderRef.current && mediaRecorderRef.current.stop) {
      mediaRecorderRef.current.stop();
    }
    stop();
  };

  const download = () => {
    const file = new Blob(blobsRef.current, { type: mimeType });
    console.log(`File`, file);
    setHistory((prev) => [
      ...prev,
      `Downloading file`,
      `File Size: ${file.size}`
    ]);
    const url = window.URL.createObjectURL(file);
    const name = `${mimeType.split("/")[0]}${
      mediaRecordingSizes[videoSize].height
    }p.${extension}`;
    const a = document.createElement("a");
    a.style = "display: none";
    a.href = url;
    a.download = name;
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    setHistory((prev) => [...prev, `Downloaded: ${name}`]);
  };

  useEffect(() => {
    return () => {
      if (mediaRef.current && mediaRef.current.src) {
        URL.revokeObjectURL(mediaRef.current.src);
      }
    };
  }, []);

  useEffect(() => {
    startTimeRef.current = 0;
    endTimeRef.current = 0;
    setVoiceActivityMessage(vadInitialState);
  }, [mimeType]);

  return (
    <div className="App">
      <h1>Media Record Testing</h1>

      <div className="mb-20">
        {Object.keys(mediaRecordingSizes).map((value) => {
          return (
            <span key={value} style={{ marginRight: "10px" }}>
              <input
                id={value}
                name="videoSize"
                onChange={(e) => {
                  setVideoSize(e.target.value);
                }}
                checked={videoSize === value}
                value={value}
                type="radio"
              />
              <label htmlFor={value}>
                {value.toUpperCase()} - {mediaRecordingSizes[value].width} X{" "}
                {mediaRecordingSizes[value].height}
              </label>
            </span>
          );
        })}
      </div>
      <div className="mb-20">
        <label htmlFor="frameRate">Frame Rate</label>
        <input
          id="frameRate"
          name="videoSize"
          ref={frameRateRef}
          onChange={(e) => {
            setFrameRate(e.target.value);
          }}
          value={frameRate}
          type="number"
        />
      </div>
      <div className="mb-20">
        <label htmlFor="timeSlice">Time Slice</label>
        <input
          id="timeSlice"
          name="videoSize"
          ref={frameRateRef}
          onChange={(e) => {
            setTimeSlice(e.target.value);
          }}
          value={timeSlice}
          type="number"
        />
      </div>
      <div className="mb-20">
        <div>Recordered Time: {recorderTime}s</div>
      </div>

      <div className="mb-20">
        <div>{voiceActivityMessage}</div>
      </div>
      <div>
        <button
          className={mimeType === videoType ? "active-button" : ""}
          disabled={recording}
          onClick={() => setMimeType(videoType)}
        >
          Video
        </button>
        <button
          className={mimeType === audioType ? "active-button" : ""}
          disabled={recording}
          onClick={() => setMimeType(audioType)}
        >
          Audio
        </button>
        <button className="start" disabled={recording} onClick={startRecording}>
          Start
        </button>
        <button className="stop" disabled={!recording} onClick={stopRecording}>
          End
        </button>
        <button className="stop" disabled={recording} onClick={download}>
          Download
        </button>
      </div>

      {mimeType === videoType ? (
        <video ref={mediaRef} controls autoPlay playsInline></video>
      ) : (
        <div className="audio">
          <audio ref={mediaRef} controls autoPlay playsInline></audio>
        </div>
      )}

      <div className="console">
        <button
          className="clear-icon"
          onClick={() => setHistory(initialHistory)}
        >
          Clear
        </button>
        <code>
          <ol>
            {history.map((history, index) => (
              <li key={index}>{history}</li>
            ))}
          </ol>
        </code>
      </div>
    </div>
  );
}
