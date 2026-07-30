const average = (values = []) => {
  const valid = values.filter((value) => typeof value === "number" && !Number.isNaN(value));
  return valid.length ? Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length) : null;
};

const averageOrZero = (values = []) => average(values) ?? 0;

const toDateKey = (value) => new Date(value).toISOString().slice(0, 10);

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

const statusWeights = {
  applied: 30,
  assessment: 48,
  "oa-cleared": 52,
  interviewing: 72,
  "technical-round": 72,
  "hr-round": 84,
  offer: 100,
  "offer-received": 100,
  rejected: 12,
  withdrawn: 10,
  wishlist: 18
};

const topicMatchers = {
  DBMS: /\b(dbms|database|sql|mongodb|index|normalization|joins?)\b/i,
  DSA: /\b(array|string|tree|graph|dynamic programming|hash|stack|queue|algorithm|complexity)\b/i,
  OOPs: /\b(oop|oops|inheritance|polymorphism|encapsulation|abstraction|solid)\b/i,
  OS: /\b(os|operating system|deadlock|thread|process|scheduling|memory)\b/i,
  CN: /\b(network|tcp|http|dns|osi|routing)\b/i,
  Aptitude: /\b(aptitude|quant|reasoning|probability|percentage|ratio)\b/i,
  Communication: /\b(communication|hr|behavioral|introduce|conflict|leadership)\b/i
};

const getRecentAndPrevious = (items = [], dateSelector = "createdAt", windowDays = 7) => {
  const now = Date.now();
  const recent = [];
  const previous = [];

  for (const item of items) {
    const timestamp = new Date(item[dateSelector] || item.createdAt || item.date).getTime();
    const ageDays = (now - timestamp) / (24 * 60 * 60 * 1000);
    if (ageDays <= windowDays) recent.push(item);
    else if (ageDays <= windowDays * 2) previous.push(item);
  }

  return { recent, previous };
};

const topicPerformance = (interviews = []) => {
  const scores = {};

  for (const interview of interviews) {
    for (const answer of interview.answers || []) {
      const score = answer.score ?? interview.overallScore ?? 0;
      for (const [topic, matcher] of Object.entries(topicMatchers)) {
        if (matcher.test(answer.question || "")) {
          scores[topic] = scores[topic] || [];
          scores[topic].push(score);
        }
      }
    }
  }

  return Object.fromEntries(
    Object.entries(scores).map(([topic, values]) => [topic, averageOrZero(values)])
  );
};

const buildWeaknessInsights = ({
  interviews = [],
  codingSubmissions = [],
  atsReviews = [],
  profileWeakTopics = []
}) => {
  const insights = [];
  const { recent, previous } = getRecentAndPrevious(interviews);
  const recentTopics = topicPerformance(recent);
  const previousTopics = topicPerformance(previous);

  for (const topic of Object.keys(recentTopics)) {
    const current = recentTopics[topic];
    const older = previousTopics[topic];
    if (older !== undefined && current - older <= -8) {
      insights.push({
        area: topic,
        severity: "high",
        delta: current - older,
        message: `${topic} accuracy dropped ${Math.abs(current - older)}% this week.`,
        recommendation: `Revise ${topic} with two focused practice sessions and one timed recall round.`
      });
    }
  }

  if (recent.length) {
    const communicationRecent = average(recent.map((item) => item.evaluation?.communication));
    const communicationPrevious = average(previous.map((item) => item.evaluation?.communication));
    if (communicationRecent !== null && communicationPrevious !== null && communicationRecent - communicationPrevious <= -6) {
      insights.push({
        area: "Communication",
        severity: "medium",
        delta: communicationRecent - communicationPrevious,
        message: "Communication confidence needs improvement compared with last week.",
        recommendation: "Practice 3 voice answers aloud and trim filler words in the opening 30 seconds."
      });
    }
  }

  const codingRecent = codingSubmissions.filter((item) => item.mode === "submit").slice(0, 5);
  if (codingRecent.length) {
    const acceptedRate = Math.round((codingRecent.filter((item) => item.verdict === "accepted").length / codingRecent.length) * 100);
    if (acceptedRate < 50) {
      insights.push({
        area: "Coding",
        severity: "high",
        delta: acceptedRate - 60,
        message: "Coding conversion is below the current benchmark for interview readiness.",
        recommendation: "Focus on one DSA category at a time and submit with hidden test thinking before running code."
      });
    }
  }

  if (atsReviews.length >= 2) {
    const latest = atsReviews[0];
    const previousReview = atsReviews[1];
    const delta = latest.metrics.atsScore - previousReview.metrics.atsScore;
    if (delta < 0) {
      insights.push({
        area: "Resume",
        severity: "medium",
        delta,
        message: `ATS alignment slipped by ${Math.abs(delta)}% on the latest revision.`,
        recommendation: "Restore the strongest role keywords and measurable outcomes from the previous version."
      });
    }
  }

  for (const weakTopic of profileWeakTopics || []) {
    if (!insights.some((item) => item.area.toLowerCase() === String(weakTopic).toLowerCase())) {
      insights.push({
        area: weakTopic,
        severity: "medium",
        delta: 0,
        message: `${weakTopic} remains a weak topic based on recent practice and mentor feedback.`,
        recommendation: `Schedule one targeted ${weakTopic} review before the next mock interview.`
      });
    }
  }

  return insights.slice(0, 6);
};

const buildWeeklyTrend = ({
  logs = [],
  interviews = [],
  atsReviews = [],
  codingSubmissions = []
}) => {
  const weeks = new Map();

  const ensureBucket = (date) => {
    const key = toDateKey(date);
    if (!weeks.has(key)) {
      weeks.set(key, {
        label: key,
        readiness: [],
        interview: [],
        ats: [],
        coding: []
      });
    }
    return weeks.get(key);
  };

  for (const log of logs.slice(0, 21)) {
    const bucket = ensureBucket(log.date || log.createdAt);
    if (typeof log.consistencyScore === "number") bucket.readiness.push(log.consistencyScore);
  }

  for (const interview of interviews.slice(0, 21)) {
    const bucket = ensureBucket(interview.createdAt);
    if (typeof interview.overallScore === "number") {
      bucket.readiness.push(interview.overallScore);
      bucket.interview.push(interview.overallScore);
    }
  }

  for (const review of atsReviews.slice(0, 12)) {
    const bucket = ensureBucket(review.createdAt);
    bucket.ats.push(review.metrics?.atsScore || 0);
  }

  for (const submission of codingSubmissions.slice(0, 21)) {
    const bucket = ensureBucket(submission.createdAt);
    bucket.coding.push(submission.score || 0);
  }

  return [...weeks.values()]
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(-8)
    .map((bucket) => ({
      label: bucket.label,
      readiness: averageOrZero(bucket.readiness),
      interview: averageOrZero(bucket.interview),
      ats: averageOrZero(bucket.ats),
      coding: averageOrZero(bucket.coding)
    }));
};

const buildHeatmap = (pillars = {}) =>
  Object.entries(pillars).map(([label, score]) => ({
    label,
    score,
    band: score >= 75 ? "strong" : score >= 55 ? "watch" : "risk"
  }));

const buildApplicationAnalytics = (applications = []) => {
  const active = applications.filter((item) => !["rejected", "withdrawn"].includes(item.status));
  const offers = applications.filter((item) => item.status === "offer-received").length;
  const interviews = applications.filter((item) => ["technical-round", "hr-round", "offer-received"].includes(item.status)).length;
  const applied = applications.filter((item) => item.status !== "wishlist").length;
  const roleCounts = new Map();

  for (const app of applications) {
    const key = app.role || "Unknown";
    roleCounts.set(key, (roleCounts.get(key) || 0) + 1);
  }

  return {
    activeCount: active.length,
    successRatio: applied ? clamp((offers / applied) * 100) : 0,
    interviewConversion: applied ? clamp((interviews / applied) * 100) : 0,
    mostAppliedRoles: [...roleCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([role, count]) => ({ role, count }))
  };
};

export const buildPlacementReadiness = ({
  profile,
  tasks = [],
  interviews = [],
  logs = [],
  applications = [],
  atsReviews = [],
  codingSubmissions = []
}) => {
  const latestAts = atsReviews[0];
  const submittedCoding = codingSubmissions.filter((item) => item.mode === "submit");
  const acceptedCoding = submittedCoding.filter((item) => item.verdict === "accepted");
  const interviewScore = average(interviews.map((item) => item.overallScore));
  const aptitudeScore = average(
    interviews
      .filter((item) => item.type === "aptitude")
      .map((item) => item.overallScore)
  );
  const communicationScore = average(
    interviews.map((item) => item.deliveryMetrics?.confidenceScore || item.evaluation?.communication)
  );
  const codingScore = submittedCoding.length
    ? clamp(
        ((acceptedCoding.length / submittedCoding.length) * 55) +
        ((averageOrZero(submittedCoding.map((item) => item.score)) / 100) * 45)
      )
    : null;
  const resumeScore = latestAts?.metrics?.atsScore ?? profile?.resumeScore ?? null;
  const appScore = applications.length
    ? averageOrZero(applications.map((item) => statusWeights[item.status] || 0))
    : null;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const taskScore = tasks.length ? clamp((completedTasks / tasks.length) * 100) : null;
  const pillars = {
    interview: interviewScore ?? 0,
    aptitude: aptitudeScore ?? interviewScore ?? 0,
    coding: codingScore ?? 0,
    communication: communicationScore ?? 0,
    applications: appScore ?? 0,
    resume: resumeScore ?? 0
  };

  const availableScores = [
    interviewScore,
    aptitudeScore,
    codingScore,
    communicationScore,
    appScore,
    resumeScore,
    taskScore
  ].filter((value) => value !== null);

  const overall = availableScores.length
    ? clamp(availableScores.reduce((sum, value) => sum + value, 0) / availableScores.length)
    : 0;

  return {
    overall,
    pillars,
    taskScore,
    weakInsights: buildWeaknessInsights({
      interviews,
      codingSubmissions,
      atsReviews,
      profileWeakTopics: profile?.weakTopics || []
    }),
    weeklyTrend: buildWeeklyTrend({ logs, interviews, atsReviews, codingSubmissions }),
    heatmap: buildHeatmap(pillars),
    applicationAnalytics: buildApplicationAnalytics(applications)
  };
};
