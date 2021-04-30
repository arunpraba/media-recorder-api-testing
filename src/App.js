import { useRef, useEffect, useState } from "react";
import "./styles.css";

const videoType = "video/webm";
const audioType = "audio/webm";

export default function App() {
  const streamRef = useRef();
  const blobsRef = useRef([]);
  const mediaRecorderRef = useRef([]);
  const mediaRef = useRef(null);
  const counterRef = useRef(0);
  const [history, setHistory] = useState([`Initialied...`]);
  const [mimeType, setMimeType] = useState(videoType);
  const [recording, setIsRecording] = useState(false);

  const preview = () => {
    setIsRecording(false);
    setHistory((prev) => [...prev, `Showing the preview`]);

    const blobs = blobsRef.current;
    if (!blobs.length) return;
    mediaRef.current.src = URL.createObjectURL(
      new Blob(blobs, { type: mimeType })
    );
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setHistory((prev) => [...prev, `Video Started`]);
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      setHistory((prev) => [...prev, `Got Media Stream`]);

      mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
        mimeType
      });

      setHistory((prev) => [
        ...prev,
        `Media Recored Started with mimeType ${mimeType}`
      ]);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data) {
          counterRef.current += 1;
          setHistory((prev) => [
            ...prev,
            `Recorded...: ${counterRef.current}s`
          ]);
          blobsRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = preview;
      mediaRecorderRef.current.start(1000);
    } catch (err) {
      setHistory((prev) =>
        [...prev, err.message, `${JSON.stringify(err.stack)}`].filter(
          (value) => !!value
        )
      );
    }
  };

  const stopRecording = () => {
    counterRef.current = 0;
    setHistory((prev) => [...prev, `Stopped recording`]);
    if (mediaRecorderRef.current && mediaRecorderRef.current.stop) {
      mediaRecorderRef.current.stop();
    }
    streamRef.current.getTracks().forEach((track) => track.stop());
  };

  useEffect(() => {
    return () => {
      if (mediaRef.current && mediaRef.current.src) {
        URL.revokeObjectURL(mediaRef.current.src);
      }
    };
  }, []);

  return (
    <div className="App">
      <h1>Media Record Testing</h1>
      <h2>Start editing to see some magic happen!</h2>

      <div>
        <button
          className={mimeType === videoType ? "active-button" : ""}
          disabled={recording}
          onClick={() => setMimeType("video/webm")}
        >
          Video
        </button>
        <button
          className={mimeType === audioType ? "active-button" : ""}
          disabled={recording}
          onClick={() => setMimeType("audio/webm")}
        >
          Audio
        </button>

        <button className="start" disabled={recording} onClick={startRecording}>
          start
        </button>
        <button className="stop" disabled={!recording} onClick={stopRecording}>
          end
        </button>
      </div>

      {mimeType === videoType ? (
        <video ref={mediaRef} id="video" autoPlay playsInline muted></video>
      ) : (
        <div className="audio">
          <audio ref={mediaRef} id="video" autoPlay playsInline muted></audio>
        </div>
      )}

      <div className="console">
        <code>
          <ol>
            {history.map((history) => (
              <li>{history}</li>
            ))}
          </ol>
        </code>
      </div>
    </div>
  );
}
