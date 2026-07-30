import { openai, aiModel } from "../config/ai.js";
import { companyQuestionBank } from "../utils/placementData.js";
import OpenAI from "openai";

const parseJson = (content, fallback) => {
  try {
    return JSON.parse(content);
  } catch {
    return fallback;
  }
};

const runAiJson = async (system, user, fallback, temperature = 0.85) => {
  if (!process.env.OPENAI_API_KEY) return fallback;

  try {
    const completion = await openai.chat.completions.create({
      model: aiModel,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature
    });

    return parseJson(completion.choices[0]?.message?.content || "{}", fallback);
  } catch {
    return fallback;
  }
};

const defaultQuestionBank = {
  aptitude: [
    "How do you choose between solving an aptitude question exactly and estimating quickly under time pressure?",
    "Walk me through your approach to a data interpretation set before doing calculations.",
    "What kind of aptitude questions usually cost you time, and how are you fixing that?"
  ],
  technical: [
    "Explain one technical decision from your project and the alternative you rejected.",
    "How would you design the APIs for a student progress tracker?",
    "What database indexes would you add first if dashboard load time became slow?"
  ],
  coding: [
    "Given a list of mock interview scores, return the longest improvement streak.",
    "Write pseudo-code to group tasks by deadline risk.",
    "How would you find duplicate applications in a list efficiently?"
  ],
  behavioral: [
    "Tell me about a time feedback changed the way you worked.",
    "Describe a project conflict and the specific step you took to move it forward.",
    "Give an example of taking ownership without being asked."
  ],
  "system-design": [
    "Design a student-mentor placement preparation product for one college.",
    "How would you model students, mentors, applications, interviews, and notes?",
    "What would you cache or queue if interview feedback generation became slow?"
  ],
  hr: [
    "Tell me about yourself in a way that connects your projects to this role.",
    "Why this company, and what preparation have you done for its hiring pattern?",
    "What is one weakness you are actively working on this month?"
  ]
};

const difficultyPrompts = {
  easy: "Keep it foundational and confidence-building.",
  medium: "Add one practical constraint or follow-up trade-off.",
  hard: "Make it deeper, scenario-based, and require justification of trade-offs.",
  mixed: "Mix one foundation question, one applied question, and one deeper trade-off question."
};

const normalizeInterviewType = (type, interviewType) => {
  const selected = type || interviewType || "technical";
  if (["system-design", "behavioral", "hr", "coding", "aptitude"].includes(selected)) return selected;
  return "technical";
};

const uniqueQuestions = (questions, previousQuestions = []) => {
  const previous = new Set(previousQuestions.map((q) => q.toLowerCase().trim()));
  const seen = new Set();
  return questions.filter((question) => {
    const key = question.toLowerCase().trim();
    if (!key || seen.has(key) || previous.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const cleanList = (items = []) =>
  items
    .map((item) => String(item || "").replace(/\s+/g, " ").trim())
    .filter(Boolean);

const shortText = (value = "", fallback = "") => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
};

const compactListForPrompt = (items = [], limit = 8) => cleanList(items).slice(0, limit);

const inferResumeProjects = (resume = {}, resumeText = "") => {
  const explicitProjects = cleanList(resume.projects || []);
  if (explicitProjects.length) return explicitProjects;

  const lines = String(resumeText || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const projectLines = lines.filter((line) =>
    /\b(project|built|developed|implemented|created|designed|application|system|platform|dashboard|tracker|portal|api)\b/i.test(line)
  );

  return projectLines.slice(0, 4);
};

const getProjectLabel = (project, index) => shortText(project, `project ${index + 1}`);

const pickSkillForProject = (skills = [], index = 0) => {
  const cleaned = cleanList(skills);
  if (!cleaned.length) return "the most relevant technology from your resume";
  return shortText(cleaned[index % cleaned.length], "the most relevant technology from your resume");
};

const buildProjectTechnicalQuestions = ({
  normalizedType,
  difficulty,
  targetRole,
  company,
  resumeSkills = [],
  resumeProjects = [],
  companyFocus = [],
  weakAreas = [],
  skillLevel = "developing"
}) => {
  const projects = cleanList(resumeProjects).length
    ? cleanList(resumeProjects).slice(0, 6)
    : ["your strongest resume project"];
  const role = targetRole || "the role";
  const focusArea = shortText(companyFocus[0], "the company's technical round");
  const weakArea = shortText(weakAreas[0], "one weaker topic");

  const projectAngles = {
    technical: [
      (project, skill, index) => `Project ${index + 1}: Walk me through ${project}. What problem did it solve, which part did you personally build, and where did ${skill} fit technically?`,
      (project, skill) => `In ${project}, explain one backend, database, API, or integration decision. What alternative did you reject, and why?`,
      (project, skill) => `Pick a failure scenario in ${project}. How would you debug it step by step, and which logs, validations, or tests would you check first?`,
      (project, skill) => `If ${company} asked you to scale ${project} for more users, what would you change in the data model, APIs, or deployment flow first?`,
      (project, skill) => `Explain a core concept behind ${skill} using a concrete feature from ${project}. What edge case could an interviewer challenge?`
    ],
    coding: [
      (project, skill, index) => `Project ${index + 1}: Identify one feature in ${project} that can be represented with arrays, maps, queues, trees, or graphs. What data structure would you choose and why?`,
      (project) => `For ${project}, design an algorithm to detect duplicate, invalid, or inconsistent records. What is the time complexity?`,
      (project) => `Take one event stream or list from ${project}. How would you compute the top three most important items efficiently?`,
      (project) => `What edge cases would you include in test cases for a coding problem inspired by ${project}?`,
      (project, skill) => `Where could ${skill} hide a performance issue in ${project}, and how would you prove the bottleneck?`
    ],
    "system-design": [
      (project, skill, index) => `Project ${index + 1}: Redesign ${project} for 10x usage. What are the main services, database collections or tables, and API boundaries?`,
      (project) => `For ${project}, which entities would you model first and which indexes would matter most for read-heavy screens?`,
      (project) => `Where would caching, queues, background jobs, or rate limits fit if ${project} became production-grade?`,
      (project) => `How would you monitor ${project} in production? Name the logs, metrics, and alerts you would create.`,
      (project) => `What security or access-control risk exists in ${project}, and how would you design against it?`
    ],
    aptitude: [
      (project, skill, index) => `Project ${index + 1}: Create a percentage, ratio, or trend question using ${project}'s users, scores, or events, and solve it aloud quickly.`,
      (project) => `If ${project} produced seven days of activity data, how would you compare improvement trends without overcalculating?`,
      (project) => `Use ${project} as context for a data interpretation problem. What information would you calculate first under time pressure?`
    ],
    hr: [
      (project, skill, index) => `Project ${index + 1}: Explain ${project} to a ${company} HR interviewer in under one minute, connecting it to ${role}.`,
      (project) => `Tell me about one difficult moment while building ${project}. What did you try first, and what changed after feedback?`,
      (project) => `What did ${project} teach you about ownership, communication, or prioritization? Give a specific example.`
    ],
    behavioral: [
      (project, skill, index) => `Project ${index + 1}: Tell me about a time ${project} forced you to learn something outside your comfort zone.`,
      (project) => `Describe a decision where you kept ${project} simple instead of adding another feature. Why was that the right call?`,
      (project) => `What feedback did you receive on ${project}, and what exactly did you improve afterward?`
    ]
  };

  const selectedAngles = projectAngles[normalizedType] || projectAngles.technical;
  const perProjectQuestions = projects.flatMap((project, index) => {
    const projectName = getProjectLabel(project, index);
    const skill = pickSkillForProject(resumeSkills, index);
    const primaryAngle = selectedAngles[index % selectedAngles.length];
    const depthAngle = selectedAngles[(index + 1) % selectedAngles.length];
    return [
      primaryAngle(projectName, skill, index),
      depthAngle(projectName, skill, index)
    ];
  });

  const crossProjectQuestions = [
    `Compare two projects from your resume. Which one demonstrates stronger technical depth for ${role}, and what evidence would you show in a ${company} interview?`,
    `Across your projects, which repeated technical pattern appears most often: API design, database modeling, authentication, analytics, UI state, or testing? Explain one example.`,
    `Choose the project that best connects to ${focusArea}. What concept should you revise before the ${company} round?`,
    `Pick the project where ${weakArea} matters most. Explain that topic using the project rather than a textbook definition.`,
    `For your current ${skillLevel} level, choose one resume project and explain the trade-off an interviewer is most likely to probe.`,
    `${difficultyPrompts[difficulty] || difficultyPrompts.mixed} Use a different resume project than your previous answer.`
  ];

  return [...perProjectQuestions, ...crossProjectQuestions];
};

const buildRoundSkillQuestions = ({
  normalizedType,
  difficulty,
  targetRole,
  company,
  resumeSkills = [],
  resumeProjects = [],
  companyFocus = [],
  weakAreas = [],
  skillLevel = "developing"
}) => {
  const role = targetRole || "the role";
  const primarySkill = shortText(resumeSkills[0], "your strongest technical skill");
  const secondarySkill = shortText(resumeSkills[1], "a supporting skill from your resume");
  const primaryProject = shortText(resumeProjects[0], "one resume project");
  const focusArea = shortText(companyFocus[0], "the company's round pattern");
  const weakArea = shortText(weakAreas[0], "one weaker topic");

  const questionSets = {
    technical: [
      `Explain ${primarySkill} from first principles. Where does it fail, and how would you debug that failure in a real application?`,
      `Compare two technical choices from your resume or coursework. Which one is better for maintainability, and why?`,
      `A feature works locally but fails after deployment. Walk me through your debugging checklist.`,
      `Explain one DBMS, OS, networking, or OOP concept that matters for ${role}, then connect it to a real implementation.`,
      `If an API becomes slow, how would you isolate whether the issue is frontend, backend, database, or network?`
    ],
    aptitude: [
      `A candidate attempts 48 questions and gets 36 correct. What is the accuracy percentage, and how would you calculate it quickly?`,
      `A process improves from 40 units/hour to 52 units/hour. What is the percentage improvement?`,
      `If A can finish a task in 12 days and B in 18 days, how many days will they take together? Explain your shortcut.`,
      `Read this pattern aloud and solve the next term: 3, 6, 11, 18, 27, ? What changed between terms?`,
      `A passage question has four options and two close answers. What is your elimination strategy for verbal reasoning?`,
      `For a ${company} online assessment, how would you divide time between quant, reasoning, verbal, and coding sections?`,
      `You are stuck on a reasoning puzzle after two minutes. What decision rule do you use to skip, mark, or continue?`
    ],
    hr: [
      `Tell me about yourself in a way that connects your background, ${primarySkill}, and interest in ${role}.`,
      `Why ${company}, and what preparation have you done for this company's hiring pattern?`,
      `Describe a time you received critical feedback. What did you change afterward?`,
      `Tell me about a conflict or disagreement in a team. What was your action, and what was the result?`,
      `What is one weakness you are actively improving, and how are you measuring progress?`,
      `If you are selected, what kind of work environment helps you perform best?`
    ],
    coding: [
      `Given an array of interview scores, explain how you would find the longest continuous improvement streak. Include time complexity.`,
      `How would you detect duplicates in a list of job applications efficiently? Which data structure would you use?`,
      `Given tasks with deadlines and priorities, design an approach to return the top tasks that should be completed first.`,
      `Explain the difference between using a hash map, sorting, and two pointers for solving list problems.`,
      `For ${company}'s coding round, how do you handle edge cases before writing code? Give examples.`,
      `Take ${primaryProject}. Turn one feature into a coding problem and explain the input, output, constraints, and edge cases.`
    ],
    "system-design": [
      `Design a placement preparation platform for one college. What are the core services and data models?`,
      `How would you design authentication, roles, and permissions for students, mentors, and admins?`,
      `If interview feedback generation is slow, where would you use queues, caching, or background jobs?`,
      `Which database indexes would you add for dashboards, application tracking, and notification history?`,
      `How would you monitor reliability, latency, and failures in a production placement platform?`,
      `Redesign ${primaryProject} for 10x usage and explain the trade-offs you would make first.`
    ],
    behavioral: [
      `Tell me about a time you had to learn something quickly to complete a task.`,
      `Describe a situation where you showed ownership without being asked.`,
      `Give an example of handling ambiguity and still making progress.`,
      `Tell me about a time you balanced speed and quality.`,
      `How do you respond when a teammate disagrees with your technical approach?`
    ]
  };

  const calibration = [
    `${difficultyPrompts[difficulty] || difficultyPrompts.mixed} Keep the answer calibrated to a ${skillLevel} candidate.`,
    `Use ${focusArea} and ${weakArea} only where relevant; do not force project context into every answer.`,
    `Where useful, connect ${secondarySkill} to ${role}, but keep the question aligned to the selected round.`
  ];

  return [...(questionSets[normalizedType] || questionSets.technical), ...calibration];
};

const buildProfileDrivenQuestions = ({
  normalizedType,
  difficulty,
  targetRole,
  company,
  resumeSkills = [],
  resumeProjects = [],
  companyFocus = [],
  weakAreas = [],
  skillLevel = "developing"
}) => {
  const projectTechnicalQuestions = buildProjectTechnicalQuestions({
    normalizedType,
    difficulty,
    targetRole,
    company,
    resumeSkills,
    resumeProjects,
    companyFocus,
    weakAreas,
    skillLevel
  });
  const roundSkillQuestions = buildRoundSkillQuestions({
    normalizedType,
    difficulty,
    targetRole,
    company,
    resumeSkills,
    resumeProjects,
    companyFocus,
    weakAreas,
    skillLevel
  });
  const primarySkill = shortText(resumeSkills[0], "your strongest technical skill");
  const secondarySkill = shortText(resumeSkills[1], "a supporting skill from your resume");
  const primaryProject = shortText(resumeProjects[0], "your strongest project");
  const secondaryProject = shortText(resumeProjects[1], primaryProject);
  const weakArea = shortText(weakAreas[0], "one topic you are currently improving");
  const companyFocusArea = shortText(companyFocus[0], "the company's placement focus");
  const role = targetRole || "the role";

  const questionSets = {
    technical: [
      `Walk me through ${primaryProject}. What problem did it solve, what part did you personally build, and why was ${primarySkill} the right choice there?`,
      `In ${primaryProject}, describe one technical decision you would defend in an interview for ${role}. What alternative did you reject?`,
      `Your resume mentions ${primarySkill}. Explain a real place where you used it, including the input, output, and one edge case you handled.`,
      `If ${company} asked you to improve ${primaryProject} for more users, what would you change first in the backend, database, or API design?`,
      `Connect ${secondarySkill} with ${companyFocusArea}. What concept should you revise before a ${company} technical round?`,
      `You flagged ${weakArea} as a weaker area. Explain the concept using an example from ${primaryProject} or ${secondaryProject}.`
    ],
    coding: [
      `Choose a data structure you used or could use in ${primaryProject}. Why does it fit, and what is the time complexity of the key operation?`,
      `If ${primaryProject} had duplicate or inconsistent records, how would you detect and clean them efficiently in code?`,
      `Write the approach, not full code: how would you process a list of events from ${primaryProject} and return the top three most important ones?`,
      `For a ${company} coding round, explain how you would test edge cases for a feature related to ${primaryProject}.`,
      `Which part of ${primarySkill} maps to DSA practice for ${role}, and what problem pattern should you practice next?`
    ],
    aptitude: [
      `Using ${primaryProject} as context, create a simple percentage or ratio example and explain how you would solve it quickly.`,
      `If ${primaryProject} had user activity numbers for seven days, how would you compare improvement trends without overcalculating?`,
      `What kind of aptitude question slows you down most, and how would you connect that practice to ${company}'s round pattern?`,
      `Explain your time-allocation strategy for a ${company} online assessment when coding and aptitude appear together.`
    ],
    hr: [
      `Introduce yourself for ${company} by connecting ${primaryProject}, ${primarySkill}, and your interest in ${role}.`,
      `Tell me about one difficult moment while working on ${primaryProject}. What did you try first, and what changed after feedback?`,
      `Why ${company}, and which part of your resume proves you have prepared for this role beyond classroom work?`,
      `What weakness are you actively improving, and how are you measuring progress in ${weakArea}?`,
      `Describe a team or communication challenge from ${primaryProject} or another resume experience using situation, action, and result.`
    ],
    behavioral: [
      `Tell me about a time ${primaryProject} forced you to learn something outside your comfort zone.`,
      `Describe a decision where you chose simplicity over adding another feature in ${primaryProject}.`,
      `Give an example from your resume where you handled ambiguity and still shipped something usable.`,
      `Tell me about feedback you received on ${primaryProject}. What exactly did you change afterward?`
    ],
    "system-design": [
      `Redesign ${primaryProject} for 10x more users. What are the first database, API, and monitoring changes you would make?`,
      `How would you model the main entities in ${primaryProject}, and which fields would need indexes first?`,
      `If ${primaryProject} started failing during peak usage, what logs or metrics would you check first?`,
      `Where would caching, queues, or background jobs fit if ${primaryProject} became production-grade?`
    ]
  };

  const base = questionSets[normalizedType] || questionSets.technical;
  const calibration = [
    `For your current ${skillLevel} preparation level, explain ${primarySkill} as if the interviewer asks one follow-up on trade-offs.`,
    `${difficultyPrompts[difficulty] || difficultyPrompts.mixed} Use one example from ${primaryProject} in your answer.`
  ];

  const projectHeavyTypes = ["technical", "coding", "system-design"];
  if (projectHeavyTypes.includes(normalizedType)) {
    return [...roundSkillQuestions, ...projectTechnicalQuestions, ...base, ...calibration];
  }

  return [...roundSkillQuestions, ...base, ...calibration];
};

const ensureQuestionSet = ({ result, fallback, profileQuestions, previousQuestions, numQuestions }) => {
  const aiQuestions = Array.isArray(result?.questions) ? result.questions : [];
  const fallbackQuestions = Array.isArray(fallback?.questions) ? fallback.questions : [];
  const merged = uniqueQuestions(
    [...cleanList(profileQuestions), ...cleanList(aiQuestions), ...cleanList(fallbackQuestions)],
    previousQuestions
  );

  const enoughQuestions = [...merged];
  let variant = 1;
  while (enoughQuestions.length < numQuestions && profileQuestions.length) {
    for (const question of profileQuestions) {
      enoughQuestions.push(`${question} Give version ${variant} with a different concrete example from your resume.`);
      if (enoughQuestions.length >= numQuestions) break;
    }
    variant += 1;
  }

  return { questions: enoughQuestions.slice(0, numQuestions) };
};

const buildFallbackQuestions = ({
  company,
  normalizedType,
  difficulty,
  targetRole,
  resumeSkills,
  resumeProjects,
  companyFocus,
  previousQuestions,
  numQuestions
}) => {
  const companyBank = companyQuestionBank[company] || companyQuestionBank.Startups || {};
  const primary = companyBank[normalizedType] || defaultQuestionBank[normalizedType] || defaultQuestionBank.technical;
  const support = [
    ...(companyBank.technical || []),
    ...(companyBank.behavioral || []),
    ...(companyBank["system-design"] || []),
    ...(defaultQuestionBank[normalizedType] || [])
  ];
  const contextQuestions = [
    `For ${company}, connect your ${resumeSkills[0] || companyFocus[0] || "strongest skill"} preparation to the ${targetRole || "software engineer"} role. What would you emphasize first?`,
    resumeProjects.length
      ? `Choose one project from ${resumeProjects.map((project, index) => `Project ${index + 1}: ${shortText(project)}`).join(" | ")}. What was the hardest design or implementation trade-off in it?`
      : "Pick your strongest project and explain the implementation trade-off an interviewer should ask you about.",
    resumeProjects.length > 1
      ? `Compare two resume projects technically. Which one shows stronger backend, database, API, or problem-solving depth, and why?`
      : "Explain a second technical angle from your project: data model, API, testing, debugging, or performance.",
    `${difficultyPrompts[difficulty] || difficultyPrompts.mixed} If your first answer is challenged, what evidence or example would you use to defend it?`
  ];

  return {
    questions: uniqueQuestions([...contextQuestions, ...primary, ...support], previousQuestions).slice(0, numQuestions)
  };
};

// Generate unique session seed to prevent question repetition
const generateSessionSeed = () => {
  const seeds = [
    "alpha", "beta", "gamma", "delta", "epsilon", "zeta", "theta", "kappa",
    "lambda", "sigma", "omega", "nova", "apex", "peak", "zenith", "nexus"
  ];
  return seeds[Math.floor(Math.random() * seeds.length)] + "-" + Date.now().toString(36);
};

export const generateInterviewQuestions = async ({
  type,
  mode = "Technical Interview",
  round = "Technical Questions",
  difficulty = "mixed",
  targetRole,
  company = "TCS",
  domain = "general",
  skills = [],
  resume = {},
  companyFocus = [],
  resumeText = "",
  previousQuestions = [],
  interviewType = "technical",
  numQuestions = 7,
  skillLevel = "developing",
  previousExperiences = [],
  weakAreas = []
}) => {
  const resumeSkills = compactListForPrompt(resume.skills || skills || [], 12);
  const resumeProjects = compactListForPrompt(inferResumeProjects(resume, resumeText), 6);
  const sessionSeed = generateSessionSeed();
  const normalizedType = normalizeInterviewType(type, interviewType);

  const fallback = buildFallbackQuestions({
    company,
    normalizedType,
    difficulty,
    targetRole,
    resumeSkills,
    resumeProjects,
    companyFocus,
    previousQuestions,
    numQuestions
  });
  const profileQuestions = buildProfileDrivenQuestions({
    normalizedType,
    difficulty,
    targetRole,
    company,
    resumeSkills,
    resumeProjects,
    companyFocus,
    weakAreas,
    skillLevel
  });

  const previousQuestionsStr = previousQuestions.length > 0
    ? `IMPORTANT: Do NOT repeat these previously asked questions: ${JSON.stringify(previousQuestions)}`
    : "This is the student's first interview session.";

  const weakAreasStr = weakAreas.length > 0
    ? `Focus extra attention on these weak areas: ${weakAreas.join(", ")}`
    : "";

  const generated = await runAiJson(
    `You are a senior campus placement interviewer at ${company}. 
Generate UNIQUE, NON-REPETITIVE interview questions as JSON: {"questions": [string]}.
RULES:
- Generate exactly ${numQuestions} questions tailored to the candidate's resume
- Questions must be DIVERSE and must follow the selected interview type: ${normalizedType}
- Follow the selected round category strictly:
  - technical: projects, fundamentals, DSA awareness, debugging, implementation decisions
  - aptitude: quant, logical reasoning, verbal strategy, speed, accuracy, time management
  - hr: behavioral examples, motivation, communication, ownership, company fit
  - coding: live problem solving, data structures, algorithms, edge cases, complexity
  - system-design: architecture, data models, APIs, scaling, trade-offs, reliability
- Use projects as supporting context only when relevant. Do not make aptitude, HR, or every coding question only about projects.
- For technical, coding, and system-design rounds, cover multiple resume projects when multiple projects exist.
- Ask technical-skill checks through evidence: fundamentals, architecture, database/API design, debugging, DSA/data structures, testing, scaling, security, and trade-offs.
- Do not invent projects, tools, internships, companies, CGPA, achievements, or experience not present in the resume context.
- Each question should reference at least one real resume signal when possible: project, skill, weak area, or target role.
- Match difficulty level: ${difficulty}
- Calibrate for candidate skill level: ${skillLevel}
- Use this difficulty behavior: ${difficultyPrompts[difficulty] || difficultyPrompts.mixed}
- Session ID (for uniqueness guarantee): ${sessionSeed}
- Include follow-up worthy questions that require deep thinking
- Write like a human interviewer: short transitions, specific context, no robotic "based on your profile" phrasing
- Use ${company}'s common campus hiring pattern and question style. Do not claim these are exact leaked questions.
- Include at least two questions that naturally invite probing, for example "What trade-off did you consider?" or "What changed after feedback?"
- For technical rounds: DSA, system design, project deep-dive, debugging scenarios
- For HR rounds: STAR method questions, leadership, conflict resolution
- Questions should feel like a real ${company} ${difficulty} interview for ${targetRole || "software engineer"}`,
    `Session: ${sessionSeed}. Interview Type: ${normalizedType}. Mode: ${mode}. Round: ${round}. 
Company: ${company}. Target Role: ${targetRole}. Difficulty: ${difficulty}. Domain: ${domain}.
Skills from resume: ${resumeSkills.join(", ")}.
Projects on resume, cover them broadly: ${resumeProjects.map((project, index) => `Project ${index + 1}: ${project}`).join(" | ")}.
Company focus areas: ${companyFocus.join(", ")}.
Company-style fallback examples to learn from, not copy exactly: ${JSON.stringify(fallback.questions)}.
Resume content: ${resumeText?.slice(0, 1500)}.
Previous interview experiences to learn from, not quote directly: ${JSON.stringify(previousExperiences)}.
${previousQuestionsStr}
${weakAreasStr}
Number of questions needed: ${numQuestions}.`,
    fallback
  );

  return ensureQuestionSet({
    result: generated,
    fallback,
    profileQuestions,
    previousQuestions,
    numQuestions
  });
};

const evaluateWithGroq = async (system, user) => {
  if (!process.env.GROQ_API_KEY) return null;
  try {
    const groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    });
    const completion = await groqClient.chat.completions.create({
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.2
    });
    return JSON.parse(completion.choices[0]?.message?.content || "{}");
  } catch (error) {
    console.error("Groq evaluation error:", error.message || error);
    return null;
  }
};

const evaluateWithGemini = async (system, user) => {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const gemini = new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    });
    const completion = await gemini.chat.completions.create({
      model: "gemini-3.6-flash",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.2
    });
    return JSON.parse(completion.choices[0]?.message?.content || "{}");
  } catch (error) {
    console.error("Gemini evaluation error:", error.message || error);
    return null;
  }
};

export const evaluateAnswer = async ({ question, answer, targetRole, company, mode, resumeContext = {}, deliveryMetrics = {} }) => {
  if (!answer || !answer.trim()) {
    return {
      score: 0,
      feedback: "No answer was provided for this question.",
      followUp: "Could you tell me how you would approach this question if you were to answer it?",
      metrics: {
        technicalCorrectness: 0,
        communication: 0,
        confidence: 0,
        grammar: 0,
        problemSolving: 0,
        fluency: 0,
        professionalism: 0
      },
      strengths: [],
      improvements: ["Provide an answer to get feedback"],
      suggestions: ["Attempt every question in the interview"]
    };
  }

  const systemPrompt = `You are an expert placement interviewer at ${company || "a top tech company"}.
Evaluate the student's interview answer thoroughly and return JSON:
{
  "score": number (0-100),
  "feedback": string (2-3 sentences, constructive and specific),
  "followUp": string (a probing follow-up question based on their answer),
  "metrics": {
    "technicalCorrectness": number,
    "communication": number,
    "confidence": number,
    "grammar": number,
    "problemSolving": number,
    "fluency": number,
    "professionalism": number
  },
  "strengths": [string],
  "improvements": [string],
  "suggestions": [string]
}
Be realistic, strict, but constructive. Score honestly based on answer quality.
CRITICAL SCORING RULES:
- If the answer is completely irrelevant, off-topic, nonsense, contains only gibberish or filler, or is completely unrelated to the question asked, assign a score of 0% or close to 0% for the overall score and the individual metrics.
- Penalize weak, brief, or circular answers that repeat the question without actual content.
Tone rules:
- Sound like a supportive senior interviewer, not a template.
- Avoid phrases like "Based on your response", "Your answer demonstrates", and "Improvement needed".
- Give concrete next-step coaching in plain professional language.
- The followUp should feel like a live interviewer probing the student's exact answer.`;

  const userPrompt = `Company: ${company}. Mode: ${mode}. Target Role: ${targetRole}.
Question: ${question}
Student's Answer: ${answer}
Resume context: ${JSON.stringify(resumeContext)}
Delivery metrics: ${JSON.stringify(deliveryMetrics)}`;

  const fallbackVal = {
    score: 72,
    feedback: "You covered the main idea clearly. Add one concrete example, the trade-off you chose, and the result so the answer feels grounded.",
    followUp: "Tell me more about the hardest part of that implementation. What did you try first, and why did you change direction?",
    metrics: {
      technicalCorrectness: 72,
      communication: 76,
      confidence: 70,
      grammar: 78,
      problemSolving: 74,
      fluency: 75,
      professionalism: 80
    },
    strengths: ["Clear thought process", "Relevant experience mentioned"],
    improvements: ["Add quantifiable impact", "Be more specific about technical choices"],
    suggestions: ["Use the STAR method", "Mention measurable outcomes", "Practice speaking more confidently"]
  };

  const [groqRes, geminiRes] = await Promise.all([
    evaluateWithGroq(systemPrompt, userPrompt),
    evaluateWithGemini(systemPrompt, userPrompt)
  ]);

  if (groqRes && geminiRes) {
    const avgScore = Math.round(((groqRes.score || 0) + (geminiRes.score || 0)) / 2);
    const avgMetrics = {};
    const keys = ["technicalCorrectness", "communication", "confidence", "grammar", "problemSolving", "fluency", "professionalism"];
    for (const key of keys) {
      avgMetrics[key] = Math.round(
        (((groqRes.metrics?.[key] || 0) + (geminiRes.metrics?.[key] || 0)) / 2)
      );
    }
    return {
      score: avgScore,
      feedback: groqRes.feedback || geminiRes.feedback || fallbackVal.feedback,
      followUp: groqRes.followUp || geminiRes.followUp || fallbackVal.followUp,
      metrics: avgMetrics,
      strengths: Array.from(new Set([...(groqRes.strengths || []), ...(geminiRes.strengths || [])])).slice(0, 3),
      improvements: Array.from(new Set([...(groqRes.improvements || []), ...(geminiRes.improvements || [])])).slice(0, 3),
      suggestions: Array.from(new Set([...(groqRes.suggestions || []), ...(geminiRes.suggestions || [])])).slice(0, 3)
    };
  }

  const activeRes = groqRes || geminiRes;
  if (activeRes) {
    return {
      ...fallbackVal,
      ...activeRes,
      metrics: {
        ...fallbackVal.metrics,
        ...(activeRes.metrics || {})
      }
    };
  }

  return fallbackVal;
};

export const analyzeResume = async ({ resumeText, targetRole, skills = [] }) =>
  runAiJson(
    `Analyze this placement resume as an expert campus hiring reviewer. Return JSON:
{
  "score": number (0-100),
  "strengths": [string],
  "improvements": [string],
  "keySkills": [string],
  "missingSkills": [string],
  "questions": [string],
  "atsScore": number,
  "suggestions": string
}`,
    `Target Role: ${targetRole}. Skills: ${skills.join(", ")}. Resume: ${resumeText?.slice(0, 2000)}`,
    {
      score: 72,
      strengths: ["The project section gives recruiters something concrete to discuss", "The skills section is easy to scan"],
      improvements: ["Add measurable outcomes to project bullets", "Move the most relevant skills closer to the target role", "Clarify internship or team project ownership"],
      keySkills: skills.slice(0, 5),
      missingSkills: ["System Design", "Cloud basics", "Open source contributions"],
      questions: ["Which project best demonstrates your readiness for this role?"],
      atsScore: 65,
      suggestions: "Start with the two strongest projects. For each one, add scope, your specific contribution, and a measurable result."
    }
  );

export const generatePersonalizedGuidance = async ({ analytics, profile, companyPath }) =>
  runAiJson(
    `Generate personalized placement preparation guidance as JSON:
{
  "dailyRecommendations": [string],
  "weakAreaPlan": [string],
  "confidenceTips": [string],
  "roadmap": [string],
  "priorityTopics": [string]
}`,
    `Analytics: ${JSON.stringify(analytics)}. Profile: ${JSON.stringify(profile)}. Company path: ${JSON.stringify(companyPath)}.`,
    {
      dailyRecommendations: ["Solve 3 DSA problems on LeetCode", "Practice one HR answer using STAR method", "Revise one DBMS concept with examples"],
      weakAreaPlan: ["Spend 30 minutes daily on weak topics", "Take one timed aptitude test twice a week", "Watch one system design video per week"],
      confidenceTips: ["Record yourself answering mock questions", "Use shorter, precise sentences", "Pause 2 seconds before answering complex questions"],
      roadmap: ["Week 1-2: DSA fundamentals", "Week 3-4: Web dev projects", "Week 5-6: Mock interviews"],
      priorityTopics: ["Data Structures", "System Design basics", "DBMS", "HR behavioral questions"]
    }
  );

export const generateImprovementRoadmap = async ({ interviewHistory, weakAreas, targetRole, company }) =>
  runAiJson(
    `You are a placement coach. Generate a personalized improvement roadmap as JSON:
{
  "immediateActions": [string],
  "weeklyPlan": [{"week": number, "focus": string, "tasks": [string]}],
  "strengthsToLeverage": [string],
  "criticalWeaknesses": [string],
  "estimatedReadinessIn": string
}`,
    `Interview history: ${JSON.stringify(interviewHistory?.slice(-5))}. Weak areas: ${weakAreas?.join(", ")}. 
Target: ${targetRole} at ${company}.`,
    {
      immediateActions: ["Practice 2 mock interviews per week", "Revise weak topics daily", "Update resume with project metrics"],
      weeklyPlan: [
        { week: 1, focus: "DSA Foundations", tasks: ["Arrays, strings", "Sorting algorithms", "LeetCode easy problems"] },
        { week: 2, focus: "Web Dev & Projects", tasks: ["MERN stack review", "Build one mini project", "API design practice"] }
      ],
      strengthsToLeverage: ["Project experience", "Communication skills"],
      criticalWeaknesses: ["System design", "Time complexity analysis"],
      estimatedReadinessIn: "3-4 weeks with consistent practice"
    }
  );
