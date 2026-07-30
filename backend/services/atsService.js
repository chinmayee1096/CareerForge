import { placementSkillCatalog } from "../utils/placementData.js";
import { parseResumeText } from "./resumeService.js";

const stopWords = new Set([
  "a", "an", "and", "are", "as", "at", "be", "build", "for", "from", "in", "into", "is",
  "of", "on", "or", "our", "that", "the", "their", "to", "using", "with", "will", "you",
  "your", "this", "have", "has", "must", "need", "needs", "work", "working", "role"
]);

const keywordCatalog = [
  { term: "react", category: "frameworks" },
  { term: "node.js", category: "frameworks" },
  { term: "express", category: "frameworks" },
  { term: "mongodb", category: "databases" },
  { term: "sql", category: "databases" },
  { term: "mysql", category: "databases" },
  { term: "postgresql", category: "databases" },
  { term: "rest api", category: "backend" },
  { term: "jwt", category: "backend" },
  { term: "javascript", category: "languages" },
  { term: "typescript", category: "languages" },
  { term: "python", category: "languages" },
  { term: "java", category: "languages" },
  { term: "c++", category: "languages" },
  { term: "data structures", category: "core" },
  { term: "algorithms", category: "core" },
  { term: "dbms", category: "core" },
  { term: "oops", category: "core" },
  { term: "operating systems", category: "core" },
  { term: "computer networks", category: "core" },
  { term: "aws", category: "cloud" },
  { term: "docker", category: "cloud" },
  { term: "git", category: "tooling" },
  { term: "problem solving", category: "soft-skills" },
  { term: "communication", category: "soft-skills" },
  { term: "teamwork", category: "soft-skills" }
];

for (const skill of placementSkillCatalog) {
  keywordCatalog.push({ term: skill.name.toLowerCase(), category: skill.category.toLowerCase() });
  for (const topic of skill.topics || []) {
    keywordCatalog.push({ term: topic.toLowerCase(), category: skill.category.toLowerCase() });
  }
}

const actionVerbPattern = /\b(built|implemented|designed|led|created|optimized|reduced|improved|launched|developed|automated|delivered|owned)\b/gi;
const metricPattern = /\b\d+(\.\d+)?(%|x|ms|sec|s|days|users|students|projects|apis|features|lpa)?\b/gi;

const normalize = (text = "") =>
  text
    .toLowerCase()
    .replace(/\r/g, "\n")
    .replace(/[^a-z0-9+#.\n ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const titleCase = (value = "") =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

const unique = (items = []) => [...new Set(items.filter(Boolean))];

const splitLines = (text = "") =>
  text
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const extractKnownKeywords = (text = "") => {
  const normalized = normalize(text);
  return unique(
    keywordCatalog
      .filter(({ term }) => normalized.includes(term))
      .map(({ term }) => titleCase(term))
  );
};

const extractDynamicKeywords = (jobDescription = "") => {
  const counts = new Map();
  for (const token of normalize(jobDescription).split(" ")) {
    if (token.length < 4 || stopWords.has(token)) continue;
    counts.set(token, (counts.get(token) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 18)
    .map(([term]) => titleCase(term));
};

const buildKeywordGroups = ({ matchedKeywords, missingKeywords }) => {
  const groups = new Map();

  for (const entry of keywordCatalog) {
    const key = entry.category;
    if (!groups.has(key)) groups.set(key, { label: titleCase(key), matched: [], missing: [], score: 0 });
  }

  for (const keyword of matchedKeywords) {
    const found = keywordCatalog.find((entry) => titleCase(entry.term) === keyword);
    const category = found?.category || "general";
    const group = groups.get(category) || { label: titleCase(category), matched: [], missing: [], score: 0 };
    group.matched.push(keyword);
    groups.set(category, group);
  }

  for (const keyword of missingKeywords) {
    const found = keywordCatalog.find((entry) => titleCase(entry.term) === keyword);
    const category = found?.category || "general";
    const group = groups.get(category) || { label: titleCase(category), matched: [], missing: [], score: 0 };
    group.missing.push(keyword);
    groups.set(category, group);
  }

  return [...groups.values()]
    .map((group) => {
      const total = group.matched.length + group.missing.length;
      return {
        ...group,
        matched: unique(group.matched).slice(0, 8),
        missing: unique(group.missing).slice(0, 8),
        score: total ? Math.round((group.matched.length / total) * 100) : 0
      };
    })
    .filter((group) => group.matched.length || group.missing.length)
    .sort((a, b) => b.score - a.score);
};

const detectFormattingIssues = (resumeText = "", parsedResume = {}) => {
  const lines = splitLines(resumeText);
  const issues = [];
  const bulletLines = lines.filter((line) => /^[-*•]/.test(line)).length;
  const longLines = lines.filter((line) => line.split(/\s+/).length > 28).length;
  const metricHits = (resumeText.match(metricPattern) || []).length;

  if (!parsedResume.skills?.length) issues.push("Skills section is missing or too thin for quick ATS parsing.");
  if (!parsedResume.projects?.length) issues.push("Projects section needs at least one clearly scoped project.");
  if (!parsedResume.education?.length) issues.push("Education section is incomplete or not clearly labeled.");
  if (bulletLines < 4) issues.push("Use concise bullet points instead of dense paragraphs for recruiter scanning.");
  if (longLines > 3) issues.push("Several lines are too long. Break them into shorter bullets with one result each.");
  if (metricHits < 3) issues.push("Add measurable impact such as scale, speed, percentages, or outcomes.");

  return issues.slice(0, 6);
};

const computeReadability = (resumeText = "", parsedResume = {}, formattingIssues = []) => {
  const lines = splitLines(resumeText);
  const bulletLines = lines.filter((line) => /^[-*•]/.test(line)).length;
  const metricHits = (resumeText.match(metricPattern) || []).length;
  const sectionCount = [
    parsedResume.education?.length,
    parsedResume.skills?.length,
    parsedResume.projects?.length,
    parsedResume.experience?.length,
    parsedResume.certifications?.length
  ].filter(Boolean).length;

  let score = 42;
  score += Math.min(sectionCount * 10, 30);
  score += Math.min(bulletLines * 3, 16);
  score += Math.min(metricHits * 4, 16);
  score -= formattingIssues.length * 6;

  return Math.max(20, Math.min(100, Math.round(score)));
};

const computeImpactScore = (resumeText = "") => {
  const actionVerbHits = (resumeText.match(actionVerbPattern) || []).length;
  const metricHits = (resumeText.match(metricPattern) || []).length;
  return Math.max(18, Math.min(100, Math.round(actionVerbHits * 7 + metricHits * 6)));
};

const buildSuggestions = ({
  missingKeywords,
  formattingIssues,
  targetRole,
  company,
  extractedSkills,
  parsedResume
}) => {
  const suggestions = [];

  if (missingKeywords.length) {
    suggestions.push(`Bring these JD keywords into real project bullets where they are truthful: ${missingKeywords.slice(0, 6).join(", ")}.`);
  }
  if (formattingIssues.length) {
    suggestions.push(formattingIssues[0]);
  }
  if (!parsedResume.experience?.length && parsedResume.projects?.length) {
    suggestions.push("Use your strongest project as a pseudo-experience block: scope, stack, ownership, and measurable outcome.");
  }
  if ((parsedResume.projects || []).length < 2) {
    suggestions.push("Add one more role-relevant project bullet cluster so recruiters can quickly validate depth.");
  }
  if ((parsedResume.skills || []).length > 12) {
    suggestions.push("Trim the skills list to the tools you can confidently explain in an interview.");
  }
  suggestions.push(`For ${company || "this role"}, move ${targetRole || "the target role"} keywords closer to the top third of the resume.`);
  suggestions.push(`Lead with ${extractedSkills.slice(0, 3).join(", ") || "your strongest stack"} before lower-priority tools.`);

  return unique(suggestions).slice(0, 6);
};

const buildRoleSuggestions = ({ targetRole, company, missingSkills, matchedKeywords }) => {
  const suggestions = [];
  if (targetRole) {
    suggestions.push(`Rename one project bullet to directly signal ${targetRole} ownership and delivery impact.`);
  }
  if (company) {
    suggestions.push(`Tune the summary and project bullets toward the hiring pattern common in ${company}.`);
  }
  if (missingSkills.length) {
    suggestions.push(`Add credible evidence for ${missingSkills.slice(0, 4).join(", ")} through projects, coursework, or internships.`);
  }
  if (matchedKeywords.length < 8) {
    suggestions.push("Improve keyword depth by mirroring the job description's technical nouns and action verbs.");
  }
  return unique(suggestions).slice(0, 5);
};

export const analyzeAtsResume = ({
  resumeText = "",
  jobDescription = "",
  targetRole = "",
  company = ""
}) => {
  const parsedResume = parseResumeText(resumeText);
  const jdKeywords = unique([...extractKnownKeywords(jobDescription), ...extractDynamicKeywords(jobDescription)]);
  const resumeKeywords = unique([
    ...extractKnownKeywords(resumeText),
    ...((parsedResume.skills || []).map((skill) => titleCase(skill)))
  ]);
  const matchedKeywords = jdKeywords.filter((keyword) => resumeKeywords.includes(keyword));
  const missingKeywords = jdKeywords.filter((keyword) => !resumeKeywords.includes(keyword));
  const formattingIssues = detectFormattingIssues(resumeText, parsedResume);
  const recruiterReadability = computeReadability(resumeText, parsedResume, formattingIssues);
  const impactScore = computeImpactScore(resumeText);
  const keywordMatch = jdKeywords.length ? Math.round((matchedKeywords.length / jdKeywords.length) * 100) : 0;
  const formattingScore = Math.max(30, 100 - formattingIssues.length * 12);
  const atsScore = Math.round(
    (keywordMatch * 0.45) +
    (recruiterReadability * 0.25) +
    (impactScore * 0.15) +
    (formattingScore * 0.15)
  );

  const extractedSkills = unique([
    ...(parsedResume.skills || []).map((skill) => titleCase(skill)),
    ...resumeKeywords
  ]).slice(0, 18);

  const missingSkills = missingKeywords.filter((keyword) =>
    keywordCatalog.some((entry) => titleCase(entry.term) === keyword && entry.category !== "soft-skills")
  );

  return {
    parsedResume,
    extractedSkills,
    matchedKeywords,
    missingKeywords,
    missingSkills: unique(missingSkills),
    keywordGroups: buildKeywordGroups({ matchedKeywords, missingKeywords }),
    formattingIssues,
    optimizationSuggestions: buildSuggestions({
      missingKeywords,
      formattingIssues,
      targetRole,
      company,
      extractedSkills,
      parsedResume
    }),
    roleSuggestions: buildRoleSuggestions({
      targetRole,
      company,
      missingSkills,
      matchedKeywords
    }),
    metrics: {
      atsScore,
      recruiterReadability,
      keywordMatch,
      formatting: formattingScore,
      impact: impactScore
    }
  };
};
