
const { spawn } = require("child_process");
const path = require("path");

const projectRoot = path.join(__dirname, "..");

const pythonPath = path.join(
  projectRoot,
  "venv",
  ...(process.platform === "win32"
    ? ["Scripts", "python.exe"]
    : ["bin", "python"])
);

const predictionScript = path.join(
  projectRoot,
  "ai_model",
  "predict_failure.py"
);

function predictFailure(cpu, ram, responseTime, errorRate) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonPath, [
      predictionScript,
      "--json",
      String(cpu),
      String(ram),
      String(responseTime),
      String(errorRate),
    ]);

    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on("error", (error) => {
      reject(error);
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(errorOutput || "Python prediction failed")
        );
        return;
      }

      try {
        resolve(JSON.parse(output.trim()));
      } catch (error) {
        reject(
          new Error("Invalid JSON response from Python AI model")
        );
      }
    });
  });
}

module.exports = { predictFailure };

