
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const LOG_FILE = path.join(__dirname, "healing_logs.json");

const DOCKER_PATH =
  "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe";

const DEMO_CONTAINER = "cloudguard-demo";

// Read previous healing events
function getHealingHistory() {
  if (!fs.existsSync(LOG_FILE)) {
    return [];
  }

  try {
    const existing = JSON.parse(
      fs.readFileSync(LOG_FILE, "utf8")
    );

    if (!Array.isArray(existing)) {
      throw new Error("Healing log file must contain an array");
    }

    return existing;
  } catch (error) {
    console.error(
      "Unable to read healing logs:",
      error.message
    );

    throw error;
  }
}

// Save a healing event
function saveHealingEvent(event) {
  const logs = getHealingHistory();

  logs.push(event);

  fs.writeFileSync(
    LOG_FILE,
    JSON.stringify(logs, null, 2),
    "utf8"
  );

  return event;
}

// Existing simulation functionality
function simulateHealing(serviceName, reason) {
  const result = {
    service: serviceName,
    reason: reason,
    action: "SIMULATED_CONTAINER_RESTART",
    mode: "SIMULATION",
    status: "SIMULATED_SUCCESS",
    timestamp: new Date().toISOString(),
  };

  return saveHealingEvent(result);
}

// Real Docker recovery - restricted to demo container
async function healDockerContainer(
  serviceName,
  reason
) {
  if (serviceName !== DEMO_CONTAINER) {
    throw new Error(
      "Real Docker healing is allowed only for cloudguard-demo"
    );
  }

  let action = "NONE";
  let status = "UNKNOWN";

  try {
    // Inspect the current container state
    const { stdout } = await execFileAsync(
      DOCKER_PATH,
      [
        "inspect",
        "--format",
        "{{.State.Running}}",
        DEMO_CONTAINER,
      ],
      { timeout: 10000 }
    );

    const isRunning = stdout.trim() === "true";

    if (isRunning) {
      // Do not interrupt a healthy running container
      action = "NO_ACTION";
      status = "ALREADY_RUNNING";
    } else {
      // Start the stopped demo container
      action = "DOCKER_CONTAINER_START";

      await execFileAsync(
        DOCKER_PATH,
        ["start", DEMO_CONTAINER],
        { timeout: 20000 }
      );

      // Verify that the container is running
      const verification = await execFileAsync(
        DOCKER_PATH,
        [
          "inspect",
          "--format",
          "{{.State.Running}}",
          DEMO_CONTAINER,
        ],
        { timeout: 10000 }
      );

      if (verification.stdout.trim() !== "true") {
        throw new Error(
          "Container did not reach running state"
        );
      }

      status = "RECOVERY_SUCCESS";
    }
  } catch (error) {
    status = "RECOVERY_FAILED";

    const failureEvent = {
      service: DEMO_CONTAINER,
      reason,
      action,
      mode: "REAL_DOCKER",
      status,
      error: error.message,
      timestamp: new Date().toISOString(),
    };

    saveHealingEvent(failureEvent);
    throw error;
  }

  const result = {
    service: DEMO_CONTAINER,
    reason,
    action,
    mode: "REAL_DOCKER",
    status,
    timestamp: new Date().toISOString(),
  };

  return saveHealingEvent(result);
}

module.exports = {
  simulateHealing,
  healDockerContainer,
  getHealingHistory,
};
