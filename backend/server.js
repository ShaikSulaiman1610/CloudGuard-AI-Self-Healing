
const express = require("express");
const cors = require("cors");
const si = require("systeminformation");
const { execFile } = require("child_process");
const { promisify } = require("util");

const { predictFailure } = require("./aiService");

const {
  simulateHealing,
  healDockerContainer,
  getHealingHistory,
} = require("./healingService");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const execFileAsync = promisify(execFile);

// ========================================
// DOCKER CONFIGURATION
// ========================================

const DEMO_CONTAINER = "cloudguard-demo";

const DOCKER_PATH = process.platform === "win32"
  ? "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe"
  : "/usr/bin/docker";

const DOCKER_CHECK_INTERVAL_MS = 10000;
const DOCKER_RECOVERY_COOLDOWN_MS = 30000;

let dockerCheckRunning = false;
let lastDockerRecoveryAttempt = 0;

// ========================================
// AUTOMATIC AI HEALING SETTINGS
// ========================================

const RISK_THRESHOLD = 80;
const REQUIRED_HIGH_RISK_CHECKS = 3;
const COOLDOWN_MS = 5 * 60 * 1000;

let consecutiveHighRiskChecks = 0;
let lastAutoHealingTime = 0;

// ========================================
// HOME API
// ========================================

app.get("/", (req, res) => {
  res.json({
    message: "AI Cloud Self-Healing System",
    status: "Backend Running Successfully",
  });
});

// ========================================
// HEALTH CHECK API
// ========================================

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "AI Cloud Self-Healing Backend",
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// REAL-TIME CPU AND RAM MONITORING
// ========================================

app.get("/metrics", async (req, res) => {
  try {
    const cpu = await si.currentLoad();
    const memory = await si.mem();

    const cpuUsage = Number(
      cpu.currentLoad.toFixed(2)
    );

    const ramUsage = Number(
      (
        ((memory.total - memory.available) /
          memory.total) *
        100
      ).toFixed(2)
    );

    res.json({
      status: "success",
      cpu_usage: cpuUsage,
      ram_usage: ramUsage,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "Monitoring error:",
      error.message
    );

    res.status(500).json({
      status: "error",
      message: "Unable to collect server metrics",
    });
  }
});

// ========================================
// READ DOCKER CONTAINER STATE
// ========================================

async function inspectDemoContainer() {
  const { stdout } = await execFileAsync(
    DOCKER_PATH,
    [
      "inspect",
      "--format",
      "{{json .State}}",
      DEMO_CONTAINER,
    ],
    {
      timeout: 10000,
      windowsHide: true,
    }
  );

  return JSON.parse(stdout.trim());
}

// ========================================
// REAL DOCKER CONTAINER MONITORING API
// ========================================

app.get("/docker-status", async (req, res) => {
  try {
    const state = await inspectDemoContainer();

    res.json({
      status: "success",
      container_name: DEMO_CONTAINER,
      container_status: state.Status,
      running: state.Running,
      started_at: state.StartedAt,
      finished_at: state.FinishedAt,
      exit_code: state.ExitCode,
      monitoring_mode: "REAL_DOCKER",
      automatic_recovery_enabled: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "Docker monitoring error:",
      error.message
    );

    res.status(503).json({
      status: "error",
      container_name: DEMO_CONTAINER,
      running: null,
      monitoring_mode: "REAL_DOCKER",
      message:
        "Unable to inspect demo container. Check Docker Desktop and container availability.",
      timestamp: new Date().toISOString(),
    });
  }
});

// ========================================
// SAFE AUTOMATIC REAL DOCKER RECOVERY
// ========================================

async function checkAndHealDocker(
  reason = "Automatic Docker recovery triggered after detecting stopped container"
) {
  // Prevent concurrent Docker recovery checks
  if (dockerCheckRunning) {
    return {
      status: "CHECK_IN_PROGRESS",
      container_name: DEMO_CONTAINER,
    };
  }

  dockerCheckRunning = true;

  try {
    const state = await inspectDemoContainer();

    // Never restart a healthy container
    if (state.Running === true) {
      return {
        status: "ALREADY_RUNNING",
        container_name: DEMO_CONTAINER,
        recovery_attempted: false,
      };
    }

    const now = Date.now();

    if (
      now - lastDockerRecoveryAttempt <
      DOCKER_RECOVERY_COOLDOWN_MS
    ) {
      return {
        status: "RECOVERY_COOLDOWN",
        container_name: DEMO_CONTAINER,
        recovery_attempted: false,
      };
    }

    lastDockerRecoveryAttempt = now;

    console.log(
      `[Docker Recovery] ${DEMO_CONTAINER} is stopped. Attempting recovery...`
    );

    const recovery = await healDockerContainer(
      DEMO_CONTAINER,
      reason
    );

    console.log(
      "[Docker Recovery] Result:",
      recovery.status
    );

    return {
      status: recovery.status,
      container_name: DEMO_CONTAINER,
      recovery_attempted: true,
      recovery,
    };
  } catch (error) {
    console.error(
      "[Docker Recovery] Check failed:",
      error.message
    );

    return {
      status: "DOCKER_CHECK_FAILED",
      container_name: DEMO_CONTAINER,
      recovery_attempted: false,
      message: error.message,
    };
  } finally {
    dockerCheckRunning = false;
  }
}

// ========================================
// AI FAILURE PREDICTION
// ========================================

app.post("/predict", async (req, res) => {
  try {
    const {
      cpu_usage,
      ram_usage,
      response_time,
      error_rate,
    } = req.body || {};

    const values = [
      cpu_usage,
      ram_usage,
      response_time,
      error_rate,
    ];

    if (
      !values.every(
        (value) =>
          typeof value === "number" &&
          Number.isFinite(value)
      )
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "All four metrics must be valid numbers",
      });
    }

    if (
      cpu_usage < 0 ||
      cpu_usage > 100 ||
      ram_usage < 0 ||
      ram_usage > 100 ||
      response_time < 0 ||
      error_rate < 0 ||
      error_rate > 100
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Metric values are outside the allowed range",
      });
    }

    const result = await predictFailure(
      cpu_usage,
      ram_usage,
      response_time,
      error_rate
    );

    const isHighRisk =
      result.prediction === 1 &&
      result.risk_probability >= RISK_THRESHOLD;

    if (isHighRisk) {
      consecutiveHighRiskChecks++;
    } else {
      consecutiveHighRiskChecks = 0;
    }

    let automaticHealing = null;
    let aiDockerCheck = null;

    const now = Date.now();

    const cooldownCompleted =
      now - lastAutoHealingTime >= COOLDOWN_MS;

    if (
      consecutiveHighRiskChecks >=
        REQUIRED_HIGH_RISK_CHECKS &&
      cooldownCompleted
    ) {
      // Preserve existing AI healing simulation
      automaticHealing = simulateHealing(
        "cloud-server-1",
        "Automatic simulation triggered after repeated high AI risk predictions"
      );

      lastAutoHealingTime = now;
      consecutiveHighRiskChecks = 0;

      console.log(
        "[AI Healing] Automatic simulation recorded:",
        automaticHealing
      );

      // NEW: AI-triggered safe Docker inspection.
      // Only a stopped demo container can be started.
      // A running container is never restarted.
      console.log(
        "[AI Docker] Repeated high risk detected. Checking demo container..."
      );

      aiDockerCheck = await checkAndHealDocker(
        "AI-triggered Docker check after repeated high-risk predictions; recovery only if container is stopped"
      );

      console.log(
        "[AI Docker] Check result:",
        aiDockerCheck.status
      );
    }

    res.json({
      status: "success",
      prediction: result.prediction,
      risk_status: result.status,
      risk_probability: result.risk_probability,
      consecutive_high_risk_checks:
        consecutiveHighRiskChecks,
      automatic_healing: automaticHealing,
      healing_mode: "SIMULATION",
      ai_docker_check: aiDockerCheck,
      docker_recovery_policy:
        "START_ONLY_IF_STOPPED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "AI prediction error:",
      error.message
    );

    res.status(500).json({
      status: "error",
      message: "AI prediction failed",
    });
  }
});

// ========================================
// MANUAL HEALING SIMULATION
// ========================================

app.post("/heal", (req, res) => {
  try {
    const { service, reason } = req.body || {};

    if (
      typeof service !== "string" ||
      !service.trim() ||
      service.length > 100 ||
      typeof reason !== "string" ||
      !reason.trim() ||
      reason.length > 300
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Valid service and reason are required",
      });
    }

    const result = simulateHealing(
      service.trim(),
      reason.trim()
    );

    res.json({
      status: "success",
      healing: result,
    });
  } catch (error) {
    console.error(
      "Healing simulation error:",
      error.message
    );

    res.status(500).json({
      status: "error",
      message: "Healing simulation failed",
    });
  }
});

// ========================================
// SELF-HEALING HISTORY
// ========================================

app.get("/healing-history", (req, res) => {
  try {
    const history = getHealingHistory();

    res.json({
      status: "success",
      total_events: history.length,
      history: history,
    });
  } catch (error) {
    console.error(
      "Healing history error:",
      error.message
    );

    res.status(500).json({
      status: "error",
      message: "Unable to fetch healing history",
    });
  }
});

// ========================================
// START BACKEND SERVER
// ========================================

app.listen(PORT, () => {
  console.log(
    `Server running at http://localhost:${PORT}`
  );

  console.log(
    `[Docker Recovery] Monitoring ${DEMO_CONTAINER} every 10 seconds`
  );

  console.log(
    "[AI Docker] Safe AI-triggered Docker checks enabled"
  );

  checkAndHealDocker();

  setInterval(
    checkAndHealDocker,
    DOCKER_CHECK_INTERVAL_MS
  );
});
