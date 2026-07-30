import { useEffect, useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import api from "../api/api.js";
import Loader from "../components/Loader.jsx";
import NotificationToast from "../components/NotificationToast.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Profile() {
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);

  // Mentor state
  const [mentorName, setMentorName] = useState(user?.name || "");
  const [mentorEmail, setMentorEmail] = useState(user?.email || "");
  const [mentorPhoto, setMentorPhoto] = useState(user?.profilePhoto || "");

  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (user?.role === "student") {
      api.get("/students/profile").then(({ data }) => setProfile(data.data || {}));
    } else {
      // Mentors don't need StudentProfile API calls
      setProfile({});
    }
  }, [user]);

  if (!profile) return <Loader label="Loading profile" />;

  // Save for student
  const saveStudent = async (event) => {
    event.preventDefault();
    const payload = {
      ...profile,
      profilePhoto: profile.userId?.profilePhoto || "",
      skills: String(profile.skills || "").split(",").map((item) => item.trim()).filter(Boolean),
      weakTopics: String(profile.weakTopics || "").split(",").map((item) => item.trim()).filter(Boolean),
      targetCompanies: String(profile.targetCompanies || "").split(",").map((item) => item.trim()).filter(Boolean)
    };
    const { data } = await api.put("/students/profile", payload);
    setProfile(data.data);
    updateUser({ profilePhoto: data.data.userId?.profilePhoto || "" });
    setToast("Profile updated");
  };

  // Save for mentor
  const saveMentor = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.put("/auth/update-profile", {
        name: mentorName,
        email: mentorEmail,
        profilePhoto: mentorPhoto
      });
      updateUser({
        name: data.data.name,
        email: data.data.email,
        profilePhoto: data.data.profilePhoto
      });
      setToast("Mentor profile updated");
    } catch (err) {
      setToast(err.response?.data?.message || err.message || "Failed to update profile");
    }
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setToast("Please select a JPG, JPEG, or PNG image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setToast("Image size must be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      if (user?.role === "student") {
        setProfile((prev) => ({
          ...prev,
          userId: {
            ...(prev.userId || {}),
            profilePhoto: base64
          }
        }));
        setToast("Photo loaded. Save profile to apply changes.");
      } else {
        setMentorPhoto(base64);
        setToast("Photo loaded. Click Save profile to apply changes.");
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removePhoto = () => {
    if (user?.role === "student") {
      setProfile((prev) => ({
        ...prev,
        userId: {
          ...(prev.userId || {}),
          profilePhoto: ""
        }
      }));
      setToast("Photo removed. Save profile to apply changes.");
    } else {
      setMentorPhoto("");
      setToast("Photo removed. Click Save profile to apply changes.");
    }
  };

  // Rest of student helpers
  const update = (event) => setProfile({ ...profile, [event.target.name]: event.target.value });

  const analyze = async () => {
    const { data } = await api.post("/students/resume/analyze", { resumeText: profile.parsedResume?.rawText || "" });
    setToast(`Resume score: ${data.data.score}`);
  };

  const uploadResume = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const payload = new FormData();
    payload.append("resume", file);
    setUploading(true);
    try {
      const { data } = await api.post("/students/resume/upload", payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setProfile((prev) => ({
        ...prev,
        parsedResume: data.data.parsedResume,
        resumeMetadata: data.data.resumeMetadata,
        skills: data.data.parsedResume?.skills?.length ? data.data.parsedResume.skills : prev.skills
      }));
      setToast(`${file.name} uploaded and parsed successfully.`);
    } catch (error) {
      setToast(error.response?.data?.message || error.message || "Resume upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  // Render mentor profile form
  if (user?.role === "mentor") {
    return (
      <>
        <div className="page-title">
          <h1>Mentor Profile</h1>
          <p>Update your personal information and profile picture.</p>
        </div>
        <form className="panel stack" style={{ maxWidth: "600px", gap: "24px" }} onSubmit={saveMentor}>
          <div className="profile-photo-upload-row" style={{ display: "flex", alignItems: "center", gap: "20px", paddingBottom: "20px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ position: "relative", width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "grid", placeItems: "center", overflow: "hidden", flexShrink: 0, border: "2px solid rgba(45, 212, 191, 0.4)" }}>
              {mentorPhoto ? (
                <img src={mentorPhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: "28px", fontWeight: "700", color: "white" }}>{mentorName?.[0]?.toUpperCase() || "M"}</span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span className="form-label" style={{ margin: 0, fontWeight: "600" }}>Profile Picture</span>
              <span className="muted" style={{ fontSize: "12px" }}>Accepted formats: JPG, JPEG, PNG. Max size 2MB.</span>
              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button type="button" className="secondary-button" style={{ padding: "6px 12px", fontSize: "13px" }} onClick={() => photoInputRef.current?.click()}>
                  <Upload size={14} style={{ marginRight: "6px" }} /> Upload Image
                </button>
                {mentorPhoto && (
                  <button type="button" className="secondary-button" style={{ padding: "6px 12px", fontSize: "13px", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.2)" }} onClick={removePhoto}>
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                style={{ display: "none" }}
                onChange={handlePhotoChange}
              />
            </div>
          </div>
          <label>
            Full Name
            <input required value={mentorName} onChange={(e) => setMentorName(e.target.value)} />
          </label>
          <label>
            Email Address
            <input required type="email" value={mentorEmail} onChange={(e) => setMentorEmail(e.target.value)} />
          </label>
          <div className="button-row">
            <button className="primary-button">Save profile</button>
          </div>
        </form>
        <NotificationToast message={toast} />
      </>
    );
  }

  // Render student profile form
  return (
    <>
      <div className="page-title"><h1>Profile</h1><p>Keep your placement goals and resume metadata current.</p></div>
      <form className="panel grid-form" onSubmit={saveStudent}>
        <div className="profile-photo-upload-row" style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "20px", paddingBottom: "20px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", marginBottom: "10px" }}>
          <div style={{ position: "relative", width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "grid", placeItems: "center", overflow: "hidden", flexShrink: 0, border: "2px solid rgba(45, 212, 191, 0.4)" }}>
            {profile.userId?.profilePhoto ? (
              <img src={profile.userId.profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "28px", fontWeight: "700", color: "white" }}>{profile.userId?.name?.[0]?.toUpperCase() || "U"}</span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span className="form-label" style={{ margin: 0, fontWeight: "600" }}>Profile Picture</span>
            <span className="muted" style={{ fontSize: "12px" }}>Accepted formats: JPG, JPEG, PNG. Max size 2MB.</span>
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button type="button" className="secondary-button" style={{ padding: "6px 12px", fontSize: "13px" }} onClick={() => photoInputRef.current?.click()}>
                <Upload size={14} style={{ marginRight: "6px" }} /> Upload Image
              </button>
              {profile.userId?.profilePhoto && (
                <button type="button" className="secondary-button" style={{ padding: "6px 12px", fontSize: "13px", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.2)" }} onClick={removePhoto}>
                  Remove
                </button>
              )}
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              style={{ display: "none" }}
              onChange={handlePhotoChange}
            />
          </div>
        </div>
        <label>Department<input name="department" value={profile.department || ""} onChange={update} /></label>
        <label>Semester<input name="semester" type="number" value={profile.semester || ""} onChange={update} /></label>
        <label>Target role<input name="targetRole" value={profile.targetRole || ""} onChange={update} /></label>
        <label>Target companies<input name="targetCompanies" value={Array.isArray(profile.targetCompanies) ? profile.targetCompanies.join(", ") : profile.targetCompanies || ""} onChange={update} /></label>
        <label>Skills<input name="skills" value={Array.isArray(profile.skills) ? profile.skills.join(", ") : profile.skills || ""} onChange={update} /></label>
        <label>Weak topics<input name="weakTopics" value={Array.isArray(profile.weakTopics) ? profile.weakTopics.join(", ") : profile.weakTopics || ""} onChange={update} /></label>
        <div className="profile-resume-upload">
          <span className="form-label">Resume file</span>
          <div className="resume-upload-card">
            <div>
              <strong>{profile.resumeMetadata?.originalName || "Upload PDF/DOC/DOCX resume"}</strong>
              <p className="muted">
                {profile.resumeMetadata?.uploadedAt
                  ? `Uploaded ${new Date(profile.resumeMetadata.uploadedAt).toLocaleDateString()}`
                  : "Used for ATS analysis, mock interview context, and mentor reviews."}
              </p>
            </div>
            <button type="button" className="secondary-button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <span className="loader-spin" /> : <Upload size={16} />}
              {uploading ? "Uploading..." : "Upload resume"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md"
              className="sr-only-file-input"
              onChange={uploadResume}
            />
          </div>
          {profile.parsedResume?.rawText && (
            <div className="resume-upload-summary">
              <FileText size={16} />
              <span>{profile.parsedResume.skills?.length || 0} skills extracted · {(profile.parsedResume.projects || []).length} projects detected</span>
            </div>
          )}
        </div>
        <label>GitHub<input name="githubLink" value={profile.githubLink || ""} onChange={update} /></label>
        <label>LinkedIn<input name="linkedinLink" value={profile.linkedinLink || ""} onChange={update} /></label>
        <div className="button-row"><button className="primary-button">Save profile</button><button type="button" className="secondary-button" onClick={analyze}>Analyze resume</button></div>
      </form>
      <NotificationToast message={toast} />
    </>
  );
}
