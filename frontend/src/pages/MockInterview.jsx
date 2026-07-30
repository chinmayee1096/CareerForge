import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  ChevronRight,
  FileText,
  Mic,
  Play,
  Send,
  Sparkles,
  Timer,
  Video,
  Volume2,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/api.js";
import Loader from "../components/Loader.jsx";
import NotificationToast from "../components/NotificationToast.jsx";

const interviewTypes = [
  { value: "technical", label: "Technical", description: "Projects, DSA, debugging, fundamentals" },
  { value: "aptitude", label: "Aptitude", description: "Quant, reasoning, verbal" },
  { value: "hr", label: "HR", description: "Behavioral and motivation patterns" },
  { value: "coding", label: "Coding", description: "Live problem solving" },
  { value: "system-design", label: "System Design", description: "Architecture and trade-offs" }
];

const fillerPattern = /\b(um|uh|like|actually|basically|literally|you know)\b/gi;
const starterTemplateMarkers = [
  "B.Tech Computer Science / AIML, Semester 4",
  "[Project Name] - Built using MERN stack",
  "[Any certifications]"
];

const hasResumeContent = (resume) => {
  if (!resume) return false;
  const text = [
    resume.rawText,
    ...(resume.education || []),
    ...(resume.skills || []),
    ...(resume.projects || []),
    ...(resume.experience || []),
    ...(resume.certifications || [])
  ].join(" ");
  return text.trim() && !starterTemplateMarkers.some((marker) => text.includes(marker));
};

const average = (values = []) => {
  const valid = values.filter((value) => typeof value === "number" && !Number.isNaN(value));
  return valid.length ? Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length) : 0;
};

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value || 0)));

const buildVoiceMetrics = (answer = "", secondsSpent = 0) => {
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const fillerWordCount = (answer.match(fillerPattern) || []).length;
  const minutes = Math.max(secondsSpent / 60, 1 / 6);
  const wordsPerMinute = Math.round(words.length / minutes);
  const confidenceScore = Math.max(20, Math.min(100, Math.round(82 - fillerWordCount * 6 + Math.min(words.length, 80) * 0.25)));
  const clarityScore = Math.max(20, Math.min(100, Math.round(88 - fillerWordCount * 7 + (answer.includes(".") ? 6 : 0))));
  return {
    wordsPerMinute,
    fillerWordCount,
    confidenceScore,
    pauseCount: fillerWordCount,
    clarityScore
  };
};

const buildVisualConfidenceSummary = (samples = [], cameraEnabled = false) => {
  if (!cameraEnabled || !samples.length) {
    return {
      visualConfidenceScore: 0,
      lightingScore: 0,
      stabilityScore: 0,
      cameraOnRatio: 0,
      sampleCount: 0
    };
  }

  const avgBrightness = samples.reduce((sum, item) => sum + item.brightness, 0) / samples.length;
  const avgMotion = samples.reduce((sum, item) => sum + item.motion, 0) / samples.length;
  const lightingScore = clampScore(100 - Math.abs(135 - avgBrightness) * 0.9);
  const stabilityScore = clampScore(100 - avgMotion * 2.2);
  const cameraOnRatio = 100;

  return {
    visualConfidenceScore: clampScore((lightingScore * 0.35) + (stabilityScore * 0.45) + (cameraOnRatio * 0.2)),
    lightingScore,
    stabilityScore,
    cameraOnRatio,
    sampleCount: samples.length
  };
};

const initialConfig = {
  interviewType: "technical",
  company: "TCS",
  difficulty: "mixed",
  targetRole: "Software Engineer",
  numQuestions: 6,
  resumeBasedMode: true
};

export default function MockInterview() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const webcamStreamRef = useRef(null);
  const previousFrameRef = useRef(null);
  const visualSamplesRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("resume");
  const [profile, setProfile] = useState(null);
  const [library, setLibrary] = useState(null);
  const [history, setHistory] = useState([]);
  const [resumeText, setResumeText] = useState("");
  const [parsedResume, setParsedResume] = useState(null);
  const [config, setConfig] = useState(initialConfig);
  const [interview, setInterview] = useState(null);
  const [answers, setAnswers] = useState({});
  const [answerStats, setAnswerStats] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [timer, setTimer] = useState(0);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [visualMetrics, setVisualMetrics] = useState(() => buildVisualConfidenceSummary([], false));

  useEffect(() => {
    Promise.all([
      api.get("/students/profile"),
      api.get("/placement/library"),
      api.get("/interviews?limit=6&status=evaluated")
    ]).then(([profileRes, libraryRes, historyRes]) => {
      const nextProfile = profileRes.data.data || {};
      setProfile(nextProfile);
      setResumeText(nextProfile.parsedResume?.rawText || "");
      setParsedResume(hasResumeContent(nextProfile.parsedResume) ? nextProfile.parsedResume : null);
      setConfig((prev) => ({
        ...prev,
        company: nextProfile.selectedCompany || prev.company,
        targetRole: nextProfile.selectedRole || nextProfile.targetRole || prev.targetRole
      }));
      setLibrary(libraryRes.data.data || {});
      setHistory(historyRes.data.data || []);
      setLoading(false);
    });
  }, []);

  // Fullscreen proctoring and visibility listener
  useEffect(() => {
    if (step === "interview") {
      const enterFS = async () => {
        try {
          if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen?.();
          }
        } catch (err) {
          console.warn("Fullscreen request failed:", err);
        }
      };
      enterFS();

      const handleVisibilityChange = () => {
        if (document.hidden) {
          setToast({ message: "Warning: Tab switching detected! Your session has been flagged.", type: "error" });
        }
      };

      const handleFullscreenChange = () => {
        if (!document.fullscreenElement) {
          // Immediately wipe all recorded answers — they will not be scored
          setAnswers({});
          setAnswerStats({});
          setToast({
            message: "⚠️ Fullscreen exited! All your answers have been cleared and will not be evaluated. Return to fullscreen to continue.",
            type: "error"
          });
          // Re-request fullscreen
          document.documentElement.requestFullscreen?.().catch(() => {});
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      document.addEventListener("fullscreenchange", handleFullscreenChange);

      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        document.removeEventListener("fullscreenchange", handleFullscreenChange);
      };
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch((err) => {
          console.warn("Exit fullscreen failed:", err);
        });
      }
    }
  }, [step]);

  useEffect(() => {
    if (step !== "interview") return;
    const id = setInterval(() => setTimer((value) => value + 1), 1000);
    return () => clearInterval(id);
  }, [step]);

  useEffect(() => () => stopCamera(false), []);

  useEffect(() => {
    if (!cameraEnabled || step !== "interview") return undefined;
    const id = setInterval(captureVisualSample, 1800);
    captureVisualSample();
    return () => clearInterval(id);
  }, [cameraEnabled, step]);

  const companyBlueprint = useMemo(() => library?.companyRoundBlueprints?.[config.company], [library, config.company]);
  const companyExperiences = useMemo(() => library?.companyInterviewExperiences?.[config.company] || [], [library, config.company]);

  if (loading || !profile || !library) return <Loader label="Preparing interview studio" />;

  const parseResume = async () => {
    if (!resumeText.trim()) {
      setToast({ message: "Paste your actual resume before continuing.", type: "error" });
      return;
    }

    try {
      const { data } = await api.post("/students/resume/parse", { resumeText, fileName: "resume.txt" });
      setParsedResume(data.data);
      setToast({ message: "Resume parsed and saved for this session.", type: "info" });
      setStep("setup");
    } catch (error) {
      setToast({ message: error.message || "Could not parse the resume.", type: "error" });
    }
  };

  const startInterview = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post("/interviews/generate", {
        type: config.interviewType,
        interviewType: config.interviewType,
        mode: config.interviewType === "hr" ? "Voice HR Interview" : "Company Mock Interview",
        round: config.interviewType === "aptitude" ? "Online Assessment" : "Technical Questions",
        difficulty: config.difficulty,
        company: config.company,
        targetRole: config.targetRole,
        numQuestions: config.numQuestions,
        resumeBasedMode: config.resumeBasedMode,
        resumeText: parsedResume?.rawText || resumeText
      });
      if (!data.data?.questions?.length) {
        setToast({ message: "No questions were generated. Add project and skills detail to the resume, then try again.", type: "error" });
        return;
      }
      setInterview(data.data);
      setAnswers({});
      setAnswerStats({});
      visualSamplesRef.current = [];
      previousFrameRef.current = null;
      setVisualMetrics(buildVisualConfidenceSummary([], false));
      setTimer(0);
      setStep("interview");
      // Trigger fullscreen right away within the user gesture callback
      try {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.().catch(() => {});
        }
      } catch (e) {}
      setToast({ message: "Interview room ready.", type: "info" });
    } catch (error) {
      setToast({ message: error.message || "Could not generate questions.", type: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Webcam is not supported in this browser.");
      setToast({ message: "Webcam is not supported in this browser.", type: "error" });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 960 }, height: { ideal: 540 }, facingMode: "user" },
        audio: false
      });
      webcamStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      visualSamplesRef.current = [];
      previousFrameRef.current = null;
      setCameraEnabled(true);
      setCameraError("");
      setToast({ message: "Webcam enabled. Only confidence summary metrics are saved, not video.", type: "info" });
    } catch {
      setCameraEnabled(false);
      setCameraError("Camera permission was blocked or no webcam was found.");
      setToast({ message: "Camera permission was blocked or no webcam was found.", type: "error" });
    }
  };

  function stopCamera(updateState = true) {
    webcamStreamRef.current?.getTracks().forEach((track) => track.stop());
    webcamStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (updateState) setCameraEnabled(false);
  }

  const toggleCamera = () => {
    if (cameraEnabled) {
      stopCamera();
      setToast({ message: "Webcam turned off.", type: "info" });
      return;
    }
    startCamera();
  };

  function captureVisualSample() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const width = 80;
    const height = 45;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(video, 0, 0, width, height);
    const frame = context.getImageData(0, 0, width, height).data;
    let brightnessTotal = 0;
    let diffTotal = 0;
    const previous = previousFrameRef.current;

    for (let index = 0; index < frame.length; index += 4) {
      const luminance = (frame[index] * 0.299) + (frame[index + 1] * 0.587) + (frame[index + 2] * 0.114);
      brightnessTotal += luminance;
      if (previous) {
        const previousLuminance = (previous[index] * 0.299) + (previous[index + 1] * 0.587) + (previous[index + 2] * 0.114);
        diffTotal += Math.abs(luminance - previousLuminance);
      }
    }

    const pixels = frame.length / 4;
    const sample = {
      brightness: brightnessTotal / pixels,
      motion: previous ? diffTotal / pixels : 0,
      capturedAt: Date.now()
    };

    previousFrameRef.current = new Uint8ClampedArray(frame);
    visualSamplesRef.current = [...visualSamplesRef.current.slice(-24), sample];
    setVisualMetrics(buildVisualConfidenceSummary(visualSamplesRef.current, true));
  }

  const updateAnswer = (question, value) => {
    setAnswers((prev) => ({ ...prev, [question]: value }));
    setAnswerStats((prev) => {
      const current = prev[question] || {};
      return {
        ...prev,
        [question]: {
          startedAt: current.startedAt || Date.now(),
          updatedAt: Date.now()
        }
      };
    });
  };

  const dictateAnswer = (question) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setToast({ message: "Speech recognition is not available in this browser.", type: "error" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript || "";
      updateAnswer(question, `${answers[question] || ""} ${transcript}`.trim());
    };
    recognition.onerror = () => setToast({ message: "Voice capture failed. Try again.", type: "error" });
    recognition.start();
  };

  const speakQuestion = (question) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const submitInterview = async () => {
    if (!interview) return;
    setSubmitting(true);
    try {
      const visualSnapshot = buildVisualConfidenceSummary(visualSamplesRef.current, cameraEnabled);
      const payload = interview.questions.map((question) => {
        const stats = answerStats[question] || {};
        const elapsedSeconds = stats.startedAt ? Math.max(20, Math.round(((stats.updatedAt || Date.now()) - stats.startedAt) / 1000)) : Math.max(30, Math.round(timer / Math.max(interview.questions.length, 1)));
        return {
          question,
          answer: answers[question] || "",
          voiceMetrics: buildVoiceMetrics(answers[question] || "", elapsedSeconds),
          visualMetrics: visualSnapshot
        };
      });

      const { data } = await api.post(`/interviews/${interview._id}/submit`, { answers: payload });
      setInterview(data.data);
      stopCamera();
      setStep("results");
      setToast({ message: `Interview evaluated at ${data.data.overallScore}%.`, type: "info" });
    } catch (error) {
      setToast({ message: error.message || "Could not evaluate the interview.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const resetInterview = () => {
    stopCamera();
    setInterview(null);
    setAnswers({});
    setAnswerStats({});
    visualSamplesRef.current = [];
    previousFrameRef.current = null;
    setVisualMetrics(buildVisualConfidenceSummary([], false));
    setTimer(0);
    setStep("setup");
  };

  const renderResumeStep = () => (
    <div className="interview-step-container">
      <div className="interview-step-header">
        <div className="step-badge">Step 1 of 3</div>
        <h2>Resume-Aware Interview Setup</h2>
        <p className="muted">Paste the latest resume text so the interviewer can ask project and skill-specific questions instead of generic prompts.</p>
      </div>

      <div className="stack">
        <textarea
          className="resume-textarea"
          value={resumeText}
          onChange={(event) => setResumeText(event.target.value)}
          placeholder="Paste resume content here. Include skills, projects, internships, certifications, and any role-specific experience."
        />
        <div className="button-row">
          <button className="primary-button" onClick={parseResume}>
            <FileText size={16} /> Parse resume
          </button>
          {hasResumeContent(parsedResume) && (
            <button className="secondary-button" onClick={() => setStep("setup")}>
              Continue <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderSetupStep = () => (
    <div className="interview-step-container">
      <div className="interview-step-header">
        <div className="step-badge">Step 2 of 3</div>
        <h2>Company-Specific Interview Configuration</h2>
        <p className="muted">Generate company-aware aptitude, technical, and HR patterns that adapt to your resume depth and recent preparation level.</p>
      </div>

      <div className="setup-grid">
        <div className="type-cards">
          {interviewTypes.map((type) => (
            <button
              key={type.value}
              className={`type-card ${config.interviewType === type.value ? "selected" : ""}`}
              onClick={() => setConfig((prev) => ({ ...prev, interviewType: type.value }))}
            >
              <strong>{type.label}</strong>
              <span className="type-desc">{type.description}</span>
            </button>
          ))}
        </div>

        <div className="config-form">
          <label>Company<select value={config.company} onChange={(event) => setConfig((prev) => ({ ...prev, company: event.target.value }))}>{Object.keys(library.companies || {}).map((company) => <option key={company}>{company}</option>)}</select></label>
          <label>Target role<input value={config.targetRole} onChange={(event) => setConfig((prev) => ({ ...prev, targetRole: event.target.value }))} /></label>
          <label>Difficulty<select value={config.difficulty} onChange={(event) => setConfig((prev) => ({ ...prev, difficulty: event.target.value }))}><option>easy</option><option>medium</option><option>hard</option><option>mixed</option></select></label>
          <label>Questions<input type="number" min={3} max={10} value={config.numQuestions} onChange={(event) => setConfig((prev) => ({ ...prev, numQuestions: Number(event.target.value) }))} /></label>
        </div>

        <div className="company-focus-panel stack">
          <strong>{config.company} hiring blueprint</strong>
          <div className="analytics-pill-row">
            {(companyBlueprint?.aptitude || []).map((item) => <span className="analytics-pill" key={item}>{item}</span>)}
          </div>
          <div className="analytics-pill-row">
            {(companyBlueprint?.technical || []).map((item) => <span className="analytics-pill" key={item}>{item}</span>)}
          </div>
          <div className="analytics-pill-row">
            {(companyBlueprint?.hr || []).map((item) => <span className="analytics-pill" key={item}>{item}</span>)}
          </div>
        </div>

        <div className="panel stack">
          <h3 style={{ margin: 0 }}>Recent interview experiences</h3>
          {companyExperiences.map((item) => <p className="muted" key={item}>{item}</p>)}
        </div>

        <div className="panel stack">
          <h3 style={{ margin: 0 }}>Your recent benchmark</h3>
          <p className="muted">Average of last {history.length} evaluated interviews: <strong>{average(history.map((item) => item.overallScore))}%</strong></p>
          {(parsedResume?.skills || []).slice(0, 6).map((skill) => <span className="tag" key={skill}>{skill}</span>)}
        </div>
      </div>

      <div className="setup-actions">
        <button className="secondary-button" onClick={() => setStep("resume")}>Back</button>
        <button className="primary-button start-btn" onClick={startInterview} disabled={generating}>
          {generating ? <span className="loader-spin" /> : <Video size={16} />}
          {generating ? "Generating..." : "Start interview"}
        </button>
      </div>
    </div>
  );

  const renderInterviewStep = () => (
    <div className="interview-active">
      <div className="interview-active-header">
        <div className="interview-meta-row">
          <span className="eyebrow">{config.company} · {config.interviewType}</span>
          <span className="interview-difficulty-badge">{config.difficulty}</span>
        </div>
        <div className="interview-timer"><Timer size={16} /> {String(Math.floor(timer / 60)).padStart(2, "0")}:{String(timer % 60).padStart(2, "0")}</div>
        <button className="secondary-button" onClick={resetInterview}><X size={15} /> Cancel</button>
      </div>

      <div className="video-stage">
        <div className={`webcam-tile ${cameraEnabled ? "active" : ""}`}>
          <video ref={videoRef} className="webcam-video" muted playsInline aria-label="Webcam preview" />
          {!cameraEnabled && <div className="webcam-placeholder"><Camera size={22} /><span>Camera off</span></div>}
        </div>
        <div>
          <span className="eyebrow">Voice Mock Interview</span>
          <h2>{config.company} conversational round</h2>
          <p>Use voice and webcam coaching to capture delivery quality. Video stays local; only confidence summary metrics are saved.</p>
          {cameraError && <p className="camera-error">{cameraError}</p>}
        </div>
        <div className="call-controls">
          <button className={`icon-button ${cameraEnabled ? "active" : ""}`} onClick={toggleCamera} title={cameraEnabled ? "Turn off webcam" : "Turn on webcam"}><Camera size={18} /></button>
          <button className="icon-button"><Mic size={18} /></button>
          <button className="icon-button"><Volume2 size={18} /></button>
        </div>
      </div>
      <canvas ref={canvasRef} className="visual-analysis-canvas" aria-hidden="true" />

      <section className="interviewer-note">
        <strong>Interviewer note</strong>
        <p>Keep each answer crisp: direct answer first, one concrete example, one trade-off, then a short closing line on outcome.</p>
      </section>

      <section className="camera-coach-panel">
        <div>
          <span className="eyebrow">Webcam Confidence Coach</span>
          <strong>{cameraEnabled ? `${visualMetrics.visualConfidenceScore}% visual confidence` : "Enable webcam for confidence signals"}</strong>
          <p className="muted">The score estimates delivery conditions from lighting and movement stability. It is coaching feedback, not a hiring decision.</p>
        </div>
        <div className="camera-metrics">
          <span>Lighting <strong>{visualMetrics.lightingScore}%</strong></span>
          <span>Stability <strong>{visualMetrics.stabilityScore}%</strong></span>
          <span>Samples <strong>{visualMetrics.sampleCount}</strong></span>
        </div>
      </section>

      <div className="questions-container">
        {(interview?.questions || []).length === 0 && (
          <section className="panel">
            <h2>No questions generated</h2>
            <p className="muted">Add resume projects and skills, then restart the interview. The system uses your actual profile to build questions.</p>
          </section>
        )}
        {(interview?.questions || []).map((question, index) => (
          <article className="question-card" key={question}>
            <div className="question-meta">
              <div className="question-num-badge">Q{index + 1}</div>
              <div className="button-row">
                <button className="icon-button" onClick={() => speakQuestion(question)}><Play size={15} /></button>
                <button className="icon-button" onClick={() => dictateAnswer(question)}><Mic size={15} /></button>
              </div>
            </div>
            <h3 className="question-text">{question}</h3>
            <textarea
              className="answer-textarea"
              value={answers[question] || ""}
              onChange={(event) => updateAnswer(question, event.target.value)}
              placeholder="Type or dictate your answer here."
            />
            <div className="answer-actions">
              <span className="answer-word-count">{(answers[question] || "").trim().split(/\s+/).filter(Boolean).length} words</span>
            </div>
          </article>
        ))}
      </div>

      <div className="submit-row">
        <div className="progress-hint">{Object.values(answers).filter((value) => value?.trim()).length} / {interview?.questions?.length || 0} answered</div>
        <button className="primary-button submit-btn" onClick={submitInterview} disabled={submitting}>
          {submitting ? <span className="loader-spin" /> : <Send size={16} />}
          {submitting ? "Evaluating..." : "Submit interview"}
        </button>
      </div>
    </div>
  );

  const renderResultsStep = () => {
    const delivery = interview?.deliveryMetrics || {};
    return (
      <div className="results-container">
        <div className="results-header">
          <div>
            <h2>Interview Results</h2>
            <p className="muted">{config.company} · {config.targetRole}</p>
          </div>
          <div className="overall-score-badge" style={{ borderColor: interview?.overallScore >= 75 ? "#0f766e" : interview?.overallScore >= 55 ? "#d97706" : "#dc2626" }}>
            <span>{interview?.overallScore || 0}%</span>
            <label>Overall</label>
          </div>
        </div>

        <div className="metric-grid compact">
          <article className="metric-card"><span>Technical</span><strong>{interview?.evaluation?.technicalCorrectness || 0}%</strong></article>
          <article className="metric-card"><span>Communication</span><strong>{interview?.evaluation?.communication || 0}%</strong></article>
          <article className="metric-card"><span>Confidence</span><strong>{delivery.confidenceScore || 0}%</strong></article>
          <article className="metric-card"><span>Visual confidence</span><strong>{delivery.visualConfidenceScore || 0}%</strong></article>
          <article className="metric-card"><span>Lighting</span><strong>{delivery.lightingScore || 0}%</strong></article>
          <article className="metric-card"><span>Stability</span><strong>{delivery.stabilityScore || 0}%</strong></article>
          <article className="metric-card"><span>WPM</span><strong>{delivery.wordsPerMinute || 0}</strong></article>
          <article className="metric-card"><span>Filler words</span><strong>{delivery.fillerWordCount || 0}</strong></article>
          <article className="metric-card"><span>Clarity</span><strong>{delivery.clarityScore || 0}%</strong></article>
        </div>

        <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          <section className="panel stack">
            <h2>Strengths</h2>
            {(interview?.strengths || []).map((item) => <div className="strength-item" key={item}>{item}</div>)}
          </section>
          <section className="panel stack">
            <h2>Improvement Plan</h2>
            {(interview?.improvements || []).map((item) => <div className="improvement-item" key={item}>{item}</div>)}
          </section>
        </div>

        <section className="panel stack">
          <h2>Question-by-question feedback</h2>
          {(interview?.answers || []).map((item, index) => (
            <div className="feedback-card" key={`${item.question}-${index}`}>
              <div className="feedback-header">
                <span className="feedback-q">Q{index + 1}. {item.question}</span>
                <span className="feedback-score">{item.score}%</span>
              </div>
              <p className="feedback-text">{item.feedback}</p>
              {item.followUp && <div className="follow-up"><strong>Follow-up:</strong> {item.followUp}</div>}
            </div>
          ))}
        </section>

        <div className="results-actions">
          <button className="secondary-button" onClick={resetInterview}>Try another round</button>
          <LinkLikeButton to="/reports" label="View reports" />
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="page-title">
        <h1>Company-Specific Mock Interviews</h1>
        <div className="step-progress">
          {["Resume", "Setup", "Interview", "Results"].map((label) => (
            <div key={label} className={`step-dot ${step === label.toLowerCase() || (step === "setup" && label === "Resume") ? "active" : ""}`}>
              <div className="step-circle">{label[0]}</div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {step === "resume" && renderResumeStep()}
      {step === "setup" && renderSetupStep()}
      {step === "interview" && renderInterviewStep()}
      {step === "results" && renderResultsStep()}

      <NotificationToast message={toast.message} type={toast.type} />
    </>
  );
}

function LinkLikeButton({ to, label }) {
  return <Link className="primary-button" to={to}>{label}</Link>;
}
