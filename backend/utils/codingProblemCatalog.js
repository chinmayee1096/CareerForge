const jsTemplate = (hint) => `const fs = require("fs");
const input = fs.readFileSync(0, "utf8");

function solve(input) {
  // ${hint}
  return "";
}

process.stdout.write(String(solve(input)).trim());
`;

const pyTemplate = (hint) => `import sys

def solve(raw_input: str) -> str:
    # ${hint}
    return ""

if __name__ == "__main__":
    print(str(solve(sys.stdin.read())).strip())
`;

const javaTemplate = (hint) => `import java.io.*;
import java.util.*;

public class Main {
  static String solve(String input) {
    // ${hint}
    return "";
  }

  public static void main(String[] args) throws Exception {
    String input = new String(System.in.readAllBytes());
    System.out.print(solve(input).trim());
  }
}
`;

const cppTemplate = (hint) => `#include <bits/stdc++.h>
using namespace std;

string solve(const string& input) {
  // ${hint}
  return "";
}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  string input((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());
  cout << solve(input);
  return 0;
}
`;

export const codingProblemCatalog = [
  {
    slug: "longest-improving-streak",
    title: "Longest Improving Streak",
    statement: "Given daily interview scores, return the length of the longest contiguous streak where each next score is strictly higher than the previous one.",
    inputFormat: "Line 1: integer n. Line 2: n space-separated integers.",
    outputFormat: "Print one integer representing the longest improving streak.",
    constraints: ["1 <= n <= 100000", "0 <= score <= 100"],
    difficulty: "easy",
    category: "Arrays",
    companies: ["TCS", "Infosys", "Accenture"],
    tags: ["arrays", "streaks", "placement"],
    supportedLanguages: ["javascript", "python", "java", "cpp"],
    templates: [
      { language: "javascript", starterCode: jsTemplate("Parse n and the scores. Track the current increasing streak and the best streak.") },
      { language: "python", starterCode: pyTemplate("Parse n and the scores. Track the current increasing streak and the best streak.") },
      { language: "java", starterCode: javaTemplate("Parse n and the scores. Track the current increasing streak and the best streak.") },
      { language: "cpp", starterCode: cppTemplate("Parse n and the scores. Track the current increasing streak and the best streak.") }
    ],
    testCases: [
      { input: "6\n40 42 50 48 49 70\n", output: "3", explanation: "40,42,50 is the longest increasing contiguous streak." },
      { input: "5\n70 70 70 70 70\n", output: "1", hidden: true },
      { input: "7\n10 20 30 5 6 7 8\n", output: "4", hidden: true }
    ],
    order: 1
  },
  {
    slug: "group-applications-by-status",
    title: "Group Applications By Status",
    statement: "Given a list of application statuses, print each unique status with its frequency in alphabetical order.",
    inputFormat: "Line 1: integer n. Next n lines: one status string each.",
    outputFormat: "Print one line per status in the format status count.",
    constraints: ["1 <= n <= 50000"],
    difficulty: "easy",
    category: "Hashing",
    companies: ["Accenture", "Wipro", "Startups"],
    tags: ["maps", "counts", "strings"],
    supportedLanguages: ["javascript", "python", "java", "cpp"],
    templates: [
      { language: "javascript", starterCode: jsTemplate("Count each status and print sorted key-value pairs line by line.") },
      { language: "python", starterCode: pyTemplate("Count each status and print sorted key-value pairs line by line.") },
      { language: "java", starterCode: javaTemplate("Count each status and print sorted key-value pairs line by line.") },
      { language: "cpp", starterCode: cppTemplate("Count each status and print sorted key-value pairs line by line.") }
    ],
    testCases: [
      { input: "5\napplied\nrejected\napplied\nhr-round\napplied\n", output: "applied 3\nhr-round 1\nrejected 1" },
      { input: "4\noffer-received\noffer-received\ntechnical-round\ntechnical-round\n", output: "offer-received 2\ntechnical-round 2", hidden: true }
    ],
    order: 2
  },
  {
    slug: "first-non-repeating-character",
    title: "First Non-Repeating Character",
    statement: "Given a lowercase string, print the first character that appears exactly once. Print -1 if none exists.",
    inputFormat: "A single line string s.",
    outputFormat: "Print one character or -1.",
    constraints: ["1 <= |s| <= 100000"],
    difficulty: "easy",
    category: "Strings",
    companies: ["Infosys", "TCS", "Google"],
    tags: ["strings", "frequency"],
    supportedLanguages: ["javascript", "python", "java", "cpp"],
    templates: [
      { language: "javascript", starterCode: jsTemplate("Count characters, then scan again to find the first one with frequency 1.") },
      { language: "python", starterCode: pyTemplate("Count characters, then scan again to find the first one with frequency 1.") },
      { language: "java", starterCode: javaTemplate("Count characters, then scan again to find the first one with frequency 1.") },
      { language: "cpp", starterCode: cppTemplate("Count characters, then scan again to find the first one with frequency 1.") }
    ],
    testCases: [
      { input: "placement\n", output: "p" },
      { input: "aabbcc\n", output: "-1", hidden: true },
      { input: "interview\n", output: "n", hidden: true }
    ],
    order: 3
  },
  {
    slug: "merge-interview-slots",
    title: "Merge Interview Slots",
    statement: "Given interview slots as closed intervals, merge overlapping slots and print the resulting intervals in sorted order.",
    inputFormat: "Line 1: integer n. Next n lines: two integers start end.",
    outputFormat: "Print each merged interval on its own line.",
    constraints: ["1 <= n <= 100000", "0 <= start <= end <= 1000000"],
    difficulty: "medium",
    category: "Intervals",
    companies: ["Amazon", "Microsoft", "Flipkart"],
    tags: ["intervals", "sorting", "scheduling"],
    supportedLanguages: ["javascript", "python", "java", "cpp"],
    templates: [
      { language: "javascript", starterCode: jsTemplate("Sort intervals by start time, then merge overlaps into a result list.") },
      { language: "python", starterCode: pyTemplate("Sort intervals by start time, then merge overlaps into a result list.") },
      { language: "java", starterCode: javaTemplate("Sort intervals by start time, then merge overlaps into a result list.") },
      { language: "cpp", starterCode: cppTemplate("Sort intervals by start time, then merge overlaps into a result list.") }
    ],
    testCases: [
      { input: "4\n1 3\n2 6\n8 10\n9 12\n", output: "1 6\n8 12" },
      { input: "3\n1 2\n3 4\n5 6\n", output: "1 2\n3 4\n5 6", hidden: true }
    ],
    order: 4
  },
  {
    slug: "top-k-weak-topics",
    title: "Top K Weak Topics",
    statement: "Given topic names and their missed-question counts, print the top k topics by count. Break ties alphabetically.",
    inputFormat: "Line 1: integer n and integer k. Next n lines: topic count.",
    outputFormat: "Print k topic names, one per line.",
    constraints: ["1 <= n <= 100000"],
    difficulty: "medium",
    category: "Sorting",
    companies: ["Google", "Amazon", "Accenture"],
    tags: ["sorting", "ranking", "analytics"],
    supportedLanguages: ["javascript", "python", "java", "cpp"],
    templates: [
      { language: "javascript", starterCode: jsTemplate("Sort by missed count descending and topic ascending, then print the top k topics.") },
      { language: "python", starterCode: pyTemplate("Sort by missed count descending and topic ascending, then print the top k topics.") },
      { language: "java", starterCode: javaTemplate("Sort by missed count descending and topic ascending, then print the top k topics.") },
      { language: "cpp", starterCode: cppTemplate("Sort by missed count descending and topic ascending, then print the top k topics.") }
    ],
    testCases: [
      { input: "5 3\nDBMS 7\nOS 3\nDSA 7\nReact 4\nCN 4\n", output: "DBMS\nDSA\nCN" },
      { input: "4 2\nAptitude 10\nHR 1\nCoding 5\nProjects 5\n", output: "Aptitude\nCoding", hidden: true }
    ],
    order: 5
  },
  {
    slug: "mentor-network-bfs",
    title: "Mentor Network BFS",
    statement: "Given an undirected graph of students and mentors, print the shortest distance from node 1 to every node using BFS.",
    inputFormat: "Line 1: integers n m. Next m lines: two integers u v.",
    outputFormat: "Print n integers separated by spaces.",
    constraints: ["1 <= n <= 200000", "0 <= m <= 200000"],
    difficulty: "hard",
    category: "Graphs",
    companies: ["Google", "Amazon", "Microsoft"],
    tags: ["graphs", "bfs", "shortest path"],
    supportedLanguages: ["javascript", "python", "java", "cpp"],
    templates: [
      { language: "javascript", starterCode: jsTemplate("Build the adjacency list and run BFS from node 1.") },
      { language: "python", starterCode: pyTemplate("Build the adjacency list and run BFS from node 1.") },
      { language: "java", starterCode: javaTemplate("Build the adjacency list and run BFS from node 1.") },
      { language: "cpp", starterCode: cppTemplate("Build the adjacency list and run BFS from node 1.") }
    ],
    testCases: [
      { input: "5 4\n1 2\n1 3\n3 4\n2 5\n", output: "0 1 1 2 2" },
      { input: "4 1\n1 2\n", output: "0 1 -1 -1", hidden: true }
    ],
    order: 6
  }
];
