import fs from "fs/promises";
import os from "os";
import path from "path";
import { spawn } from "child_process";

const runtimeRoot = path.resolve(process.cwd(), ".runtime");

const bundledPythonPath = path.join(
  os.homedir(),
  ".cache",
  "codex-runtimes",
  "codex-primary-runtime",
  "dependencies",
  "python",
  "python.exe"
);

const nodeExecutable = process.env.NODE_EXECUTABLE || process.execPath;

const normalizeOutput = (text = "") =>
  text.replace(/\r/g, "").trim();

const runProcess = (command, args, { cwd, input = "", timeout = 2500 } = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
    let stdout = "";
    let stderr = "";
    let finished = false;

    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      child.kill();
      reject(new Error("time-limit"));
    }, timeout);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });

    if (input) child.stdin.write(input);
    child.stdin.end();
  });

const fileExists = async (target) => {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
};

const resolvePythonCommand = async () => {
  const candidates = [
    process.env.PYTHON_EXECUTABLE,
    bundledPythonPath
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (await fileExists(candidate)) return { command: candidate, args: [] };
  }

  return { command: "py", args: ["-3"] };
};

const languageConfig = async (language, dir) => {
  if (language === "javascript") {
    const source = path.join(dir, "main.js");
    return {
      source,
      compile: null,
      run: () => ({ command: nodeExecutable, args: [source] })
    };
  }

  if (language === "python") {
    const source = path.join(dir, "main.py");
    const python = await resolvePythonCommand();
    return {
      source,
      compile: null,
      run: () => ({ command: python.command, args: [...python.args, source] })
    };
  }

  if (language === "java") {
    const source = path.join(dir, "Main.java");
    return {
      source,
      compile: { command: "javac", args: [source] },
      run: () => ({ command: "java", args: ["-cp", dir, "Main"] })
    };
  }

  const source = path.join(dir, "main.cpp");
  const binary = path.join(dir, "main.exe");
  return {
    source,
    compile: { command: "g++", args: [source, "-std=c++17", "-O2", "-o", binary] },
    run: () => ({ command: binary, args: [] })
  };
};

const verdictFromError = (errorMessage = "") => {
  if (errorMessage === "time-limit") return "time-limit";
  if (/javac|g\+\+|compile/i.test(errorMessage)) return "compile-error";
  if (/python|node|not recognized|enoent/i.test(errorMessage)) return "runtime-error";
  return "runtime-error";
};

export const executeSubmission = async ({
  language,
  code,
  testCases = [],
  timeLimitMs = 2500
}) => {
  await fs.mkdir(runtimeRoot, { recursive: true });
  const dir = await fs.mkdtemp(path.join(runtimeRoot, `run-${language}-`));

  try {
    const config = await languageConfig(language, dir);
    await fs.writeFile(config.source, code, "utf8");

    if (config.compile) {
      const compileResult = await runProcess(config.compile.command, config.compile.args, {
        cwd: dir,
        timeout: Math.max(4000, timeLimitMs)
      });

      if (compileResult.code !== 0) {
        return {
          verdict: "compile-error",
          runtimeMs: 0,
          cases: [],
          message: compileResult.stderr || "Compilation failed."
        };
      }
    }

    const cases = [];
    let totalRuntime = 0;
    let verdict = "accepted";

    for (const testCase of testCases) {
      const startedAt = Date.now();
      try {
        const runConfig = config.run();
        const result = await runProcess(runConfig.command, runConfig.args, {
          cwd: dir,
          input: testCase.input,
          timeout: timeLimitMs
        });
        const runtimeMs = Date.now() - startedAt;
        totalRuntime += runtimeMs;
        const actualOutput = normalizeOutput(result.stdout);
        const expectedOutput = normalizeOutput(testCase.output);
        const passed = result.code === 0 && actualOutput === expectedOutput;
        if (!passed && verdict === "accepted") verdict = result.code === 0 ? "wrong-answer" : "runtime-error";

        cases.push({
          input: testCase.hidden ? "" : testCase.input,
          expectedOutput: testCase.hidden ? "" : expectedOutput,
          actualOutput: testCase.hidden ? "" : actualOutput,
          passed,
          runtimeMs,
          hidden: !!testCase.hidden,
          message: result.stderr?.trim() || ""
        });
      } catch (error) {
        verdict = verdictFromError(error.message);
        cases.push({
          input: testCase.hidden ? "" : testCase.input,
          expectedOutput: testCase.hidden ? "" : normalizeOutput(testCase.output),
          actualOutput: "",
          passed: false,
          runtimeMs: Date.now() - startedAt,
          hidden: !!testCase.hidden,
          message: error.message === "time-limit" ? "Execution timed out." : error.message
        });
        break;
      }
    }

    return {
      verdict,
      runtimeMs: totalRuntime,
      cases,
      message: verdict === "accepted" ? "All test cases passed." : ""
    };
  } catch (error) {
    return {
      verdict: verdictFromError(error.message),
      runtimeMs: 0,
      cases: [],
      message: error.message
    };
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
};
