export const placementSkillCatalog = [
  { id: "dsa", name: "DSA", category: "Technical", priority: 1, topics: ["Arrays", "Strings", "Trees", "Graphs", "Dynamic Programming"] },
  { id: "oops", name: "OOPs", category: "Technical", priority: 2, topics: ["Inheritance", "Polymorphism", "Abstraction", "Encapsulation", "SOLID basics"] },
  { id: "dbms", name: "DBMS", category: "Core CS", priority: 3, topics: ["Normalization", "Indexing", "Transactions", "Joins", "ACID"] },
  { id: "os", name: "OS", category: "Core CS", priority: 4, topics: ["Processes", "Threads", "Deadlocks", "Scheduling", "Memory management"] },
  { id: "cn", name: "CN", category: "Core CS", priority: 5, topics: ["OSI model", "TCP/IP", "HTTP", "DNS", "Routing"] },
  { id: "aptitude", name: "Aptitude", category: "Assessment", priority: 6, topics: ["Quantitative", "Logical reasoning", "Verbal ability", "Data interpretation"] },
  { id: "web", name: "Web Development", category: "Role Skills", priority: 7, topics: ["React", "Node.js", "REST APIs", "Authentication", "Deployment"] },
  { id: "aiml", name: "AI/ML", category: "Role Skills", priority: 8, topics: ["ML basics", "Model evaluation", "Python", "NLP", "Responsible AI"] },
  { id: "hr", name: "HR Questions", category: "Communication", priority: 9, topics: ["Tell me about yourself", "Strengths", "Weaknesses", "Goals", "Salary expectations"] },
  { id: "communication", name: "Communication Skills", category: "Communication", priority: 10, topics: ["Clarity", "STAR method", "Active listening", "Confidence", "Professional tone"] }
];

export const companyPreparationPaths = {
  TCS: {
    pattern: "Aptitude, coding basics, technical interview, HR",
    focus: ["Aptitude", "C programming", "DBMS", "OOPs", "Communication Skills"],
    questions: ["Explain normalization with an example.", "Write logic for palindrome checking.", "Why do you want to join TCS?"]
  },
  Infosys: {
    pattern: "InfyTQ-style aptitude, pseudo-code, technical and HR",
    focus: ["Aptitude", "Python/Java", "DBMS", "OOPs", "HR Questions"],
    questions: ["What is polymorphism?", "Solve a basic array frequency problem.", "Tell us about your final-year project."]
  },
  Wipro: {
    pattern: "Online assessment, essay/communication, technical, HR",
    focus: ["Aptitude", "Verbal Ability", "OOPs", "OS", "Communication Skills"],
    questions: ["Describe process scheduling.", "How do you handle deadlines?", "Explain your strongest technical skill."]
  },
  Accenture: {
    pattern: "Cognitive assessment, coding, communication, interview",
    focus: ["Logical Reasoning", "Coding", "Cloud basics", "DBMS", "Communication Skills"],
    questions: ["Explain REST APIs.", "Describe a time you solved a team conflict.", "What is indexing in databases?"]
  },
  Amazon: {
    pattern: "Online assessment, DSA-heavy interviews, leadership principles",
    focus: ["DSA", "System Design basics", "Projects", "Behavioral Questions", "Problem Solving"],
    questions: ["Design an LRU cache.", "Tell me about a time you took ownership.", "Optimize this array problem."]
  },
  Google: {
    pattern: "DSA rounds, problem solving, project depth, Googliness",
    focus: ["DSA", "Algorithms", "Complexity Analysis", "Projects", "Communication Skills"],
    questions: ["Explain time complexity trade-offs.", "Solve a graph traversal problem.", "How do you test your code?"]
  },
  Microsoft: {
    pattern: "DSA, CS fundamentals, project discussion, behavioral",
    focus: ["DSA", "OOPs", "OS", "DBMS", "Projects"],
    questions: ["Explain deadlock prevention.", "Design a simple authentication system.", "What did you learn from your best project?"]
  },
  Flipkart: {
    pattern: "Online assessment, DSA/problem solving, machine coding, project and hiring-manager discussion",
    focus: ["DSA", "APIs", "Scalability basics", "Projects", "Problem Solving"],
    questions: ["Design a rate limiter.", "Find top K frequent items.", "How would you handle a high-traffic product page?"]
  },
  Startups: {
    pattern: "Practical coding, project ownership, product thinking",
    focus: ["Web Development", "APIs", "Deployment", "Projects", "Communication Skills"],
    questions: ["How would you ship an MVP in one week?", "Explain your deployment process.", "How do you debug production issues?"]
  }
};

export const companyQuestionBank = {
  TCS: {
    aptitude: [
      "A TCS NQT-style question: how would you approach a time-and-work problem when two people work at different speeds?",
      "Walk me through a percentage-profit-loss shortcut you trust during timed aptitude rounds.",
      "In a verbal reasoning passage, how do you avoid choosing an option that sounds right but is not stated?"
    ],
    technical: [
      "Explain normalization using a student placement database example.",
      "How would you index a student-progress tracker collection so mentor dashboards stay fast?",
      "Write the logic for palindrome checking and explain the edge cases you would test."
    ],
    coding: [
      "Given an array of interview scores, find the longest streak where scores improved each time.",
      "Write pseudo-code to count duplicate email registrations without using nested loops.",
      "How would you detect whether a linked list has a cycle?"
    ],
    behavioral: [
      "Tell me about a time you had to improve after feedback from a mentor or teacher.",
      "Describe a team project where your role was small at first but became important later.",
      "Why TCS, and what kind of long-term learning path are you expecting here?"
    ],
    "system-design": [
      "Design a simple campus placement tracker for 5,000 students and 50 mentors.",
      "How would you store resume reviews, mock interview scores, and task progress without mixing unrelated data?",
      "If mentor dashboards became slow, what would you cache first and why?"
    ]
  },
  Infosys: {
    aptitude: [
      "How would you solve a pseudo-code tracing question quickly without running the code?",
      "Explain your approach to a number-series problem when the pattern is not obvious.",
      "What checks do you use to avoid calculation mistakes in InfyTQ-style aptitude?"
    ],
    technical: [
      "Explain polymorphism with a Java or Python example from a real project.",
      "How would you design REST endpoints for tasks, interviews, and student profiles?",
      "What is the difference between SQL joins and MongoDB references in practical terms?"
    ],
    coding: [
      "Given a string, return the first non-repeating character and explain the complexity.",
      "Write pseudo-code to merge two sorted arrays without using extra sorting.",
      "How would you validate balanced brackets in an expression?"
    ],
    behavioral: [
      "Tell me about a time you learned a technology because the project needed it.",
      "Describe a situation where you had to communicate technical progress to a non-technical person.",
      "Why Infosys, and how do you see training helping you grow?"
    ],
    "system-design": [
      "Design a training-progress portal for new Infosys campus hires.",
      "How would you model assessments, attempts, and certificates for a learning platform?",
      "What failure cases would you handle in an online assessment submission system?"
    ]
  },
  Wipro: {
    aptitude: [
      "How do you handle verbal ability questions when two options are grammatically close?",
      "Explain your method for solving data interpretation questions under time pressure.",
      "What is your strategy for essay or communication rounds before technical interviews?"
    ],
    technical: [
      "Explain process scheduling with a practical example.",
      "What is deadlock, and how would you explain it to a teammate using a non-textbook example?",
      "How would you secure a login flow in a MERN application?"
    ],
    coding: [
      "Write logic to reverse words in a sentence while preserving word order rules.",
      "Given a list of tasks and deadlines, identify overdue tasks efficiently.",
      "How would you find the second largest element without sorting?"
    ],
    behavioral: [
      "Tell me about a deadline you almost missed and how you recovered.",
      "Describe a time when you had to improve your communication for a project demo.",
      "How do you handle routine work while still learning new skills?"
    ],
    "system-design": [
      "Design a lightweight task reminder service for students preparing for placements.",
      "How would you send deadline notifications without spamming users?",
      "What database fields would you add to track whether students are active weekly?"
    ]
  },
  Accenture: {
    aptitude: [
      "How would you approach a cognitive ability question that mixes logic and pattern recognition?",
      "Explain a shortcut for solving seating arrangement questions.",
      "How do you divide time between reasoning, verbal, and coding sections?"
    ],
    technical: [
      "Explain REST APIs using a placement application tracker as the example.",
      "What is database indexing, and when can an index hurt performance?",
      "How would you debug a React page that keeps making duplicate API calls?"
    ],
    coding: [
      "Given daily practice minutes, calculate the best seven-day consistency streak.",
      "Write logic to group applications by status for a placement dashboard.",
      "How would you remove duplicates from an array while preserving order?"
    ],
    behavioral: [
      "Tell me about a time you worked with people from different skill levels.",
      "Describe a situation where you had to adapt quickly to a changed requirement.",
      "Accenture works across clients. How would you handle switching context between projects?"
    ],
    "system-design": [
      "Design a client-ready dashboard showing student readiness and interview risk.",
      "How would you separate analytics data from transactional user data?",
      "What logs would help you debug failed notifications in production?"
    ]
  },
  Amazon: {
    aptitude: [
      "How would you reason through an optimization problem when the first solution is brute force?",
      "Explain how you validate assumptions before solving a DSA-heavy assessment question.",
      "How do you decide when to move on during a timed online assessment?"
    ],
    technical: [
      "Explain the trade-off between hash maps and sorted arrays for lookup-heavy features.",
      "How would you improve an API that becomes slow when many students load reports?",
      "What metrics would you watch after launching a new interview evaluation feature?"
    ],
    coding: [
      "Design an LRU cache and explain every operation's complexity.",
      "Given interview slots, merge overlapping intervals and return available windows.",
      "Find the shortest path in an unweighted graph and explain why BFS fits."
    ],
    behavioral: [
      "Tell me about a time you took ownership when nobody assigned the task to you.",
      "Describe a decision where you traded speed against quality.",
      "Give an example of using data or feedback to improve something you built."
    ],
    "system-design": [
      "Design a high-scale mock interview platform with queues for AI evaluation.",
      "How would you make resume analysis reliable if many students upload at once?",
      "Where would you use caching, queues, and retries in a placement-prep SaaS?"
    ]
  },
  Google: {
    aptitude: [
      "How do you explain your reasoning clearly while solving an unfamiliar problem?",
      "What steps do you follow before choosing a data structure for a problem?",
      "How would you test your solution when hidden cases are likely?"
    ],
    technical: [
      "Explain time complexity trade-offs using a search/filter feature in this product.",
      "How would you structure data for fast mentor search across students and skills?",
      "What does clean API design mean to you beyond endpoint naming?"
    ],
    coding: [
      "Given a graph of students and mentors, find all reachable mentors from a student node.",
      "Implement a function that returns top K weak topics across recent interviews.",
      "Find the longest substring without repeating characters and explain edge cases."
    ],
    behavioral: [
      "Tell me about a time you changed your approach after discovering a better idea.",
      "Describe a project decision where simplicity was better than adding more features.",
      "How do you respond when someone challenges your technical choice?"
    ],
    "system-design": [
      "Design search for a placement prep platform across tasks, resumes, interviews, and notes.",
      "How would you keep analytics fresh without recomputing everything on each dashboard load?",
      "Design a feedback system where mentor comments and AI evaluations stay explainable."
    ]
  },
  Microsoft: {
    aptitude: [
      "How would you break down a problem before writing code in an online assessment?",
      "What is your approach to debugging when a solution passes samples but fails hidden tests?",
      "How do you communicate your thought process in a technical interview?"
    ],
    technical: [
      "Explain deadlock prevention with an example from a scheduling system.",
      "How would authentication and authorization work in a student-mentor product?",
      "What would you change in a MongoDB schema if reporting became a core feature?"
    ],
    coding: [
      "Design a function to find the next available interview slot from mentor calendars.",
      "Given student scores, return students who improved in three consecutive mock interviews.",
      "Implement binary search and explain where it fails if the data is not sorted."
    ],
    behavioral: [
      "Tell me about a time you helped a teammate understand a technical concept.",
      "Describe a project where you had to balance user experience and engineering constraints.",
      "What did you learn from the most difficult bug you fixed?"
    ],
    "system-design": [
      "Design a Teams-like meeting request flow between students and mentors.",
      "How would you build role-based access for students, mentors, and admins?",
      "Design a report generation service that can export weekly progress as PDF."
    ]
  },
  Flipkart: {
    aptitude: [
      "How would you approach a probability question involving user behavior or conversion?",
      "What is your strategy for a timed coding-plus-aptitude test?",
      "How do you identify edge cases in data interpretation questions?"
    ],
    technical: [
      "Explain how you would model orders, users, and inventory in a database.",
      "How would you make a dashboard resilient during high traffic?",
      "What is the difference between optimistic and pessimistic updates in UI?"
    ],
    coding: [
      "Given product ratings, return the top K products with tie-breaking rules.",
      "Design a rate limiter for login attempts.",
      "Find all pairs in an array that sum to a target and explain duplicate handling."
    ],
    behavioral: [
      "Tell me about a time you improved a user-facing workflow.",
      "Describe a situation where speed mattered but correctness could not be compromised.",
      "How do you prioritize bugs when multiple users are affected?"
    ],
    "system-design": [
      "Design a flash-sale style notification system for placement deadlines.",
      "How would you scale a company application tracker during campus drive week?",
      "Design a recommendation system for next preparation tasks based on weak topics."
    ]
  },
  Startups: {
    aptitude: [
      "How do you decide what to solve first when requirements are vague?",
      "What trade-offs do you make when building an MVP quickly?",
      "How would you validate whether a feature is useful before spending a week on it?"
    ],
    technical: [
      "Explain how you would ship, monitor, and roll back a MERN feature.",
      "How would you debug production API failures with limited logs?",
      "What makes a codebase easy for a small team to maintain?"
    ],
    coding: [
      "Build a small function that groups tasks by priority and deadline risk.",
      "Given recent activity events, return the most important three for a dashboard.",
      "Write logic to autosave drafts without overwriting newer server data."
    ],
    behavioral: [
      "Tell me about a time you worked without a clear specification.",
      "Describe a product decision you made from observing users.",
      "How do you handle ownership when there is no separate QA or product team?"
    ],
    "system-design": [
      "Design the first production MVP of this placement-prep platform for one college.",
      "What would you build now, defer, and instrument before scaling?",
      "How would you keep AI interview feedback useful without making it feel generic?"
    ]
  }
};

export const interviewRounds = [
  "Introduction Round",
  "Resume Discussion",
  "Technical Questions",
  "Project-Based Questions",
  "Scenario-Based Questions",
  "HR Round",
  "Behavioral Questions",
  "Final Feedback Round"
];

export const interviewModes = [
  "AI Video Conference Interview",
  "Voice Only Interview",
  "MCQ Test Mode",
  "Rapid Fire Round",
  "Coding Interview",
  "HR Interview",
  "Technical Interview",
  "Group Discussion Simulation"
];

export const placementGuidance = [
  { title: "Resume Building Tips", points: ["Keep it one page for campus roles.", "Quantify project impact.", "Match skills to the target company."] },
  { title: "Interview Etiquette", points: ["Join early.", "Answer directly before adding detail.", "Ask thoughtful clarifying questions."] },
  { title: "Communication Skills", points: ["Use STAR for behavioral answers.", "Avoid filler words.", "Summarize your conclusion clearly."] },
  { title: "Body Language Tips", points: ["Sit upright.", "Maintain camera-level eye contact.", "Use calm hand gestures."] },
  { title: "Common HR Mistakes", points: ["Do not memorize robotic answers.", "Avoid negative comments about teams.", "Do not exaggerate skills."] },
  { title: "Dress Code Suggestions", points: ["Choose neat formal or smart casual attire.", "Prefer solid colors.", "Keep background uncluttered."] },
  { title: "Confidence Building", points: ["Practice aloud daily.", "Record one answer per day.", "Review progress weekly."] },
  { title: "Test Time Management", points: ["Scan all questions first.", "Mark hard questions for review.", "Avoid spending too long on one item."] },
  { title: "Placement Roadmap", points: ["Weeks 1-2: fundamentals.", "Weeks 3-4: coding and aptitude.", "Weeks 5-6: mock interviews and company patterns."] }
];

export const companyRoundBlueprints = {
  TCS: {
    aptitude: ["Time and work", "Percentages", "Verbal reasoning"],
    technical: ["DBMS basics", "C or Java basics", "OOPs"],
    hr: ["Why TCS", "Teamwork", "Adaptability"]
  },
  Infosys: {
    aptitude: ["Pseudo-code tracing", "Number series", "Logical reasoning"],
    technical: ["Java or Python fundamentals", "DBMS", "REST APIs"],
    hr: ["Learning ability", "Project ownership", "Communication"]
  },
  Wipro: {
    aptitude: ["Data interpretation", "Verbal ability", "Analytical reasoning"],
    technical: ["OS", "DBMS", "MERN basics"],
    hr: ["Deadlines", "Communication", "Client readiness"]
  },
  Accenture: {
    aptitude: ["Cognitive reasoning", "Seating arrangement", "Verbal"],
    technical: ["React", "APIs", "Indexing"],
    hr: ["Team collaboration", "Requirement changes", "Client-facing mindset"]
  },
  Amazon: {
    aptitude: ["Optimization thinking", "Constraint prioritization", "Trade-offs"],
    technical: ["DSA", "Scalability", "API performance"],
    hr: ["Ownership", "Customer obsession", "Bias for action"]
  },
  Google: {
    aptitude: ["Problem decomposition", "Testing edge cases", "Complexity choices"],
    technical: ["Algorithms", "Data modeling", "System design"],
    hr: ["Curiosity", "Simplicity", "Collaboration"]
  }
};

export const companyInterviewExperiences = {
  TCS: [
    "OA difficulty usually stays moderate, but communication round follow-ups are often sharper than students expect.",
    "Project questions tend to stay practical: stack used, one challenge solved, and what changed after testing."
  ],
  Infosys: [
    "Pseudo-code and reasoning sections reward calm step-by-step solving more than speed alone.",
    "Interviewers often ask candidates to connect one classroom concept to a project they actually built."
  ],
  Wipro: [
    "Communication and written clarity can influence the final decision even when technical answers are decent.",
    "Expect OS and networking follow-ups if those subjects appear in the resume skills section."
  ],
  Accenture: [
    "Behavioral answers are judged on structure, not drama. Clear context-action-result answers perform better.",
    "Frontend and API questions often shift into debugging scenarios instead of textbook theory."
  ],
  Amazon: [
    "Strong candidates keep answers grounded in one decision, one trade-off, and one measurable outcome.",
    "If you mention scale, expect a follow-up about bottlenecks, monitoring, and failure handling."
  ],
  Google: [
    "Interviewers usually keep probing until the candidate explains why the chosen approach is better than one alternative.",
    "Even mid-level difficulty questions often include an edge-case or testing follow-up before they move on."
  ]
};
