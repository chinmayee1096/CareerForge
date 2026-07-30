const sectionPatterns = {
  education: /\b(education|academic|academics|qualification|qualifications|degree|cgpa|gpa)\b/i,
  skills: /\b(skills|technical skills|technologies|tech stack|tools|programming languages|languages|frameworks)\b/i,
  projects: /\b(projects|project experience|academic projects|personal projects|portfolio)\b/i,
  experience: /\b(experience|internship|internships|work history|employment|training)\b/i,
  certifications: /\b(certifications|certificates|courses|achievements|awards)\b/i
};

const knownSkills = [
  "Python",
  "Java",
  "JavaScript",
  "TypeScript",
  "SQL",
  "MySQL",
  "MongoDB",
  "PostgreSQL",
  "C",
  "C++",
  "HTML",
  "CSS",
  "React",
  "React.js",
  "Node.js",
  "Express",
  "MERN",
  "Machine Learning",
  "Deep Learning",
  "AI",
  "ML",
  "Data Science",
  "Pandas",
  "NumPy",
  "TensorFlow",
  "Scikit-learn",
  "Git",
  "GitHub",
  "REST API",
  "DBMS",
  "OOP",
  "Data Structures",
  "Algorithms",
  "Web Development",
  "Communication"
];

const starterTemplateMarkers = [
  "B.Tech Computer Science / AIML, Semester 4",
  "[Project Name] - Built using MERN stack",
  "[Any certifications]"
];

export const isStarterTemplateResume = (resumeText = "") =>
  starterTemplateMarkers.some((marker) => resumeText.includes(marker));

const splitList = (text = "") =>
  text
    .split(/[,;|\n]/)
    .map((item) => item.replace(/^[-*\u2022\d.)\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 12);

const unique = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const sectionText = (lines, startKey) => {
  const start = lines.findIndex((line) => sectionPatterns[startKey].test(line));
  if (start === -1) return "";
  const collected = [inlineSectionContent(lines[start], startKey)].filter(Boolean);
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    const hitsOtherSection = Object.entries(sectionPatterns).some(([key, pattern]) => {
      if (key === startKey) return false;
      return pattern.test(line) || (key === "projects" && looksLikeProjectLine(line));
    });
    if (hitsOtherSection) break;
    collected.push(line);
  }
  return collected.join("\n");
};

const inlineSectionContent = (line = "", startKey) => {
  const withoutLabel = line
    .replace(sectionPatterns[startKey], "")
    .replace(/^[-:|,\s]+/, "")
    .trim();
  return withoutLabel.length >= 3 && withoutLabel !== line ? withoutLabel : "";
};

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractKnownSkills = (resumeText = "") =>
  knownSkills.filter((skill) => {
    const escaped = escapeRegex(skill);
    return new RegExp(`(^|[^a-z0-9+#.])${escaped}([^a-z0-9+#.]|$)`, "i").test(resumeText);
  });

const extractSkills = (lines, resumeText) =>
  unique([...splitList(sectionText(lines, "skills")), ...extractKnownSkills(resumeText)]).slice(0, 20);

const looksLikeProjectLine = (line = "") =>
  /\b(project|built|developed|implemented|created|designed|application|system|platform|dashboard|tracker|portal|website|app|api|model|prediction|classifier)\b/i.test(line) &&
  line.length >= 12 &&
  line.length <= 180;

const extractProjects = (lines) => {
  const fromSection = splitList(sectionText(lines, "projects"));
  const fromSignals = lines
    .filter(looksLikeProjectLine)
    .map((line) => line.replace(/^[-*\u2022\d.)\s]+/, "").trim());
  return unique([...fromSection, ...fromSignals]).slice(0, 12);
};

export const parseResumeText = (resumeText = "") => {
  if (isStarterTemplateResume(resumeText)) {
    return {
      name: "",
      education: [],
      skills: [],
      projects: [],
      experience: [],
      certifications: [],
      rawText: "",
      parsingStatus: "needs_manual_review"
    };
  }

  const clean = resumeText.replace(/\r/g, "\n").replace(/\n{2,}/g, "\n").trim();
  const lines = clean.split("\n").map((line) => line.trim()).filter(Boolean);
  const name = lines.find((line) => /^[A-Za-z][A-Za-z\s.]{2,50}$/.test(line)) || "";

  return {
    name,
    education: splitList(sectionText(lines, "education")),
    skills: extractSkills(lines, resumeText),
    projects: extractProjects(lines),
    experience: splitList(sectionText(lines, "experience")),
    certifications: splitList(sectionText(lines, "certifications")),
    rawText: resumeText,
    parsingStatus: clean ? "parsed" : "needs_manual_review"
  };
};
