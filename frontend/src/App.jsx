
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  Clock3,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  History,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Server,
  ShieldCheck,
  Wifi,
  X,
  Zap,
  Container,
} from "lucide-react";

const API_URL = "http://localhost:5000";
const MAX_POINTS = 24;

function formatTime(value) {
  if (!value || value.startsWith?.("0001-")) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "--"
    : date.toLocaleString();
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "cyan",
  progress,
}) {
  const colors = {
    cyan: "text-cyan-400 bg-cyan-500/10",
    purple: "text-violet-400 bg-violet-500/10",
    green: "text-emerald-400 bg-emerald-500/10",
    red: "text-rose-400 bg-rose-500/10",
    amber: "text-amber-400 bg-amber-500/10",
  };

  const bars = {
    cyan: "bg-cyan-400",
    purple: "bg-violet-400",
    green: "bg-emerald-400",
    red: "bg-rose-400",
    amber: "bg-amber-400",
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <h3 className="mt-3 text-3xl font-bold tracking-tight text-white">
            {value}
          </h3>
        </div>
        <div className={`rounded-xl p-3 ${colors[color]}`}>
          <Icon size={21} />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {subtitle}
      </p>

      {typeof progress === "number" && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${bars[color]}`}
            style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  right,
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-400">
          <Icon size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">
            {title}
          </h2>
          <p className="text-xs text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>
      {right}
    </div>
  );
}

function LineChart({ data, dataKey, color, label }) {
  const width = 600;
  const height = 180;
  const padding = 12;

  const values = data.map((item) =>
    Math.min(100, Math.max(0, Number(item[dataKey]) || 0))
  );

  const points = values.map((value, index) => {
    const x =
      padding +
      (index / Math.max(1, values.length - 1)) *
        (width - padding * 2);

    const y =
      height -
      padding -
      (value / 100) * (height - padding * 2);

    return `${x},${y}`;
  });

  const stroke = color === "purple" ? "#a78bfa" : "#22d3ee";
  const gradientId =
    color === "purple" ? "ramGradient" : "cpuGradient";

  const linePoints = points.join(" ");

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">
          {label}
        </span>
        <span
          className={
            color === "purple"
              ? "text-sm font-bold text-violet-400"
              : "text-sm font-bold text-cyan-400"
          }
        >
          {values.length
            ? `${values[values.length - 1].toFixed(1)}%`
            : "--"}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-44 w-full"
        role="img"
        aria-label={`${label} usage chart`}
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor={stroke}
              stopOpacity="0.25"
            />
            <stop
              offset="100%"
              stopColor={stroke}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {[0, 25, 50, 75, 100].map((value) => {
          const y =
            height -
            padding -
            (value / 100) * (height - padding * 2);

          return (
            <line
              key={value}
              x1="0"
              x2={width}
              y1={y}
              y2={y}
              stroke="#334155"
              strokeDasharray="4 6"
              strokeOpacity="0.55"
            />
          );
        })}

        {values.length > 1 && (
          <>
            <polygon
              points={`${padding},${height} ${linePoints} ${
                width - padding
              },${height}`}
              fill={`url(#${gradientId})`}
            />
            <polyline
              points={linePoints}
              fill="none"
              stroke={stroke}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {values.length === 1 && (
          <circle
            cx={padding}
            cy={
              height -
              padding -
              (values[0] / 100) *
                (height - padding * 2)
            }
            r="5"
            fill={stroke}
          />
        )}
      </svg>

      <div className="flex justify-between text-xs text-slate-500">
        <span>Earlier</span>
        <span>Live monitoring</span>
        <span>Now</span>
      </div>
    </div>
  );
}

function App() {
  const [metrics, setMetrics] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [aiError, setAiError] = useState("");

  const [dockerStatus, setDockerStatus] = useState(null);
  const [dockerError, setDockerError] = useState("");

  const [chartData, setChartData] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);

  const [healing, setHealing] = useState(null);
  const [healingLoading, setHealingLoading] = useState(false);
  const [healingError, setHealingError] = useState("");

  const [lastAutomaticHealing, setLastAutomaticHealing] =
    useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] =
    useState("overview");

  async function fetchHealingHistory() {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await fetch(
        `${API_URL}/healing-history`
      );

      if (!response.ok) {
        throw new Error("History request failed");
      }

      const data = await response.json();

      if (
        data.status !== "success" ||
        !Array.isArray(data.history)
      ) {
        throw new Error("Invalid history response");
      }

      const reversed = [...data.history].reverse();
      setHistory(reversed);

      const latestAutomatic = reversed.find((event) =>
        event.reason?.includes(
          "Automatic simulation triggered"
        )
      );

      setLastAutomaticHealing(latestAutomatic || null);
    } catch (error) {
      console.error(error);
      setHistoryError("Unable to load healing history");
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    let fetching = false;
    let dockerFetching = false;

    async function fetchDockerStatus() {
      if (dockerFetching) return;
      dockerFetching = true;

      try {
        const response = await fetch(
          `${API_URL}/docker-status`
        );

        if (!response.ok) {
          throw new Error("Docker monitoring unavailable");
        }

        const data = await response.json();

        if (data.status !== "success") {
          throw new Error("Invalid Docker status response");
        }

        if (!active) return;

        setDockerStatus(data);
        setDockerError("");
      } catch (error) {
        if (!active) return;
        console.error(error);
        setDockerStatus(null);
        setDockerError("Docker monitoring unavailable");
      } finally {
        dockerFetching = false;
      }
    }

    async function fetchData() {
      if (fetching) return;
      fetching = true;

      try {
        const metricsResponse = await fetch(
          `${API_URL}/metrics`
        );

        if (!metricsResponse.ok) {
          throw new Error("Metrics API unavailable");
        }

        const metricsData = await metricsResponse.json();

        if (!active) return;

        setMetrics(metricsData);
        setBackendOnline(true);

        setChartData((previous) =>
          [
            ...previous,
            {
              cpu: Number(metricsData.cpu_usage) || 0,
              ram: Number(metricsData.ram_usage) || 0,
            },
          ].slice(-MAX_POINTS)
        );

        try {
          const predictionResponse = await fetch(
            `${API_URL}/predict`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                cpu_usage: metricsData.cpu_usage,
                ram_usage: metricsData.ram_usage,
                response_time: 500,
                error_rate: 2,
              }),
            }
          );

          if (!predictionResponse.ok) {
            throw new Error("Prediction API unavailable");
          }

          const predictionData =
            await predictionResponse.json();

          if (!active) return;

          setPrediction(predictionData);
          setAiError("");

          if (predictionData.automatic_healing) {
            setLastAutomaticHealing(
              predictionData.automatic_healing
            );
            await fetchHealingHistory();
          }
        } catch (error) {
          if (!active) return;
          console.error(error);
          setPrediction(null);
          setAiError("AI prediction unavailable");
        }
      } catch (error) {
        if (!active) return;

        console.error(error);
        setBackendOnline(false);
        setMetrics(null);
        setPrediction(null);
        setAiError("Backend connection unavailable");
      } finally {
        fetching = false;
      }
    }

    fetchData();
    fetchDockerStatus();
    fetchHealingHistory();

    const interval = setInterval(() => {
      fetchData();
      fetchDockerStatus();
    }, 5000);

    // Refresh recovery logs so automatic Docker healing appears live.
    const historyInterval = setInterval(() => {
      if (active) fetchHealingHistory();
    }, 10000);

    return () => {
      active = false;
      clearInterval(interval);
      clearInterval(historyInterval);
    };
  }, []);

  async function handleHealing() {
    if (healingLoading || !backendOnline) return;

    setHealingLoading(true);
    setHealingError("");
    setHealing(null);

    try {
      const response = await fetch(`${API_URL}/heal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service: "cloud-server-1",
          reason: "Manual dashboard simulation test",
        }),
      });

      if (!response.ok) {
        throw new Error("Healing API unavailable");
      }

      const data = await response.json();

      if (data.status !== "success" || !data.healing) {
        throw new Error("Invalid healing response");
      }

      setHealing(data.healing);
      await fetchHealingHistory();
    } catch (error) {
      console.error(error);
      setHealingError("Unable to run healing simulation");
    } finally {
      setHealingLoading(false);
    }
  }

  function navigate(section) {
    setActiveSection(section);
    setSidebarOpen(false);

    const target = document.getElementById(section);

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  const highRisk = prediction?.prediction === 1;
  const riskScore = Number(prediction?.risk_probability);
  const checks =
    prediction?.consecutive_high_risk_checks ?? 0;

  const automaticTriggered = Boolean(
    prediction?.automatic_healing
  );

  const riskColor = !prediction
    ? "text-slate-400"
    : highRisk
    ? "text-rose-400"
    : "text-emerald-400";

  const dockerRunning = dockerStatus?.running === true;
  const dockerAvailable = Boolean(dockerStatus);

  // Separate real Docker recovery from simulated healing.
  const realDockerEvents = history.filter(
    (event) => event.mode === "REAL_DOCKER"
  );

  const successfulDockerRecoveries = realDockerEvents.filter(
    (event) =>
      event.status === "RECOVERY_SUCCESS" &&
      event.action === "DOCKER_CONTAINER_START"
  );

  const simulationEvents = history.filter(
    (event) => event.mode === "SIMULATION"
  );

  const lastDockerRecovery =
    successfulDockerRecoveries[0] || null;

  const navigation = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      id: "monitoring",
      label: "Live Monitoring",
      icon: Activity,
    },
    {
      id: "docker",
      label: "Docker Monitoring",
      icon: Container,
    },
    {
      id: "prediction",
      label: "AI Prediction",
      icon: Gauge,
    },
    {
      id: "self-healing",
      label: "Self-Healing",
      icon: ShieldCheck,
    },
    {
      id: "history",
      label: "Healing History",
      icon: History,
    },
  ];

  return (
    <div className="min-h-screen bg-[#080e1c] text-slate-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800 bg-[#0d1526] transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/15 p-2.5 text-cyan-400">
              <Zap size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                CloudGuard
              </h1>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                AI Self-Healing
              </p>
            </div>
          </div>

          <button
            className="text-slate-400 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Workspace
          </p>

          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const selected = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                    selected
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                  {selected && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  backendOnline
                    ? "bg-emerald-400"
                    : "bg-rose-400"
                }`}
              />
              <span className="text-sm font-medium">
                {backendOnline
                  ? "Backend Connected"
                  : "Backend Offline"}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Cloud failure prediction and automated
              Docker container recovery platform.
            </p>
          </div>

          <p className="mt-4 text-center text-[11px] text-slate-600">
            CloudGuard • Project Dashboard
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-800/80 bg-[#080e1c]/95 px-5 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-300 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={23} />
            </button>

            <div>
              <h2 className="text-lg font-semibold md:text-xl">
                Cloud Infrastructure
              </h2>
              <p className="text-xs text-slate-500">
                Monitoring & automated Docker recovery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium sm:flex ${
                backendOnline
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : "border-rose-500/20 bg-rose-500/10 text-rose-400"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  backendOnline
                    ? "bg-emerald-400"
                    : "bg-rose-400"
                }`}
              />
              {backendOnline
                ? "System Online"
                : "System Offline"}
            </div>

            <div className="rounded-xl border border-slate-800 p-2.5 text-slate-400">
              <Bell size={19} />
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 font-bold text-white">
              AI
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] space-y-7 p-5 md:p-8">
          {/* Overview */}
          <section id="overview" className="scroll-mt-28">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  Infrastructure Overview
                </p>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  System Dashboard
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  Real-time resource monitoring, AI risk
                  analysis and Docker self-healing.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <RefreshCw size={14} />
                Refreshes every 5 seconds
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="CPU Utilization"
                value={
                  metrics
                    ? `${Number(metrics.cpu_usage).toFixed(1)}%`
                    : "--"
                }
                subtitle="Live host CPU usage"
                icon={Cpu}
                color="cyan"
                progress={
                  metrics
                    ? Number(metrics.cpu_usage)
                    : undefined
                }
              />

              <MetricCard
                title="Memory Utilization"
                value={
                  metrics
                    ? `${Number(metrics.ram_usage).toFixed(1)}%`
                    : "--"
                }
                subtitle="Live host RAM usage"
                icon={HardDrive}
                color="purple"
                progress={
                  metrics
                    ? Number(metrics.ram_usage)
                    : undefined
                }
              />

              <MetricCard
                title="AI Risk Score"
                value={
                  prediction && Number.isFinite(riskScore)
                    ? `${riskScore.toFixed(0)}%`
                    : "--"
                }
                subtitle="Synthetic-model risk score"
                icon={AlertTriangle}
                color={highRisk ? "red" : "green"}
                progress={
                  prediction && Number.isFinite(riskScore)
                    ? riskScore
                    : undefined
                }
              />

              <MetricCard
                title="Real Docker Recoveries"
                value={successfulDockerRecoveries.length}
                subtitle={`${simulationEvents.length} simulated healing events`}
                icon={ShieldCheck}
                color="green"
              />
            </div>
          </section>

          {/* Live Monitoring */}
          <section
            id="monitoring"
            className="scroll-mt-28 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 md:p-6"
          >
            <SectionHeader
              icon={Activity}
              title="Live Resource Monitoring"
              subtitle="Recent CPU and RAM usage samples"
              right={
                <span className="flex items-center gap-2 text-xs text-emerald-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  Live Data
                </span>
              }
            />

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-[#0b1425] p-5">
                <LineChart
                  data={chartData}
                  dataKey="cpu"
                  color="cyan"
                  label="CPU Usage"
                />
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#0b1425] p-5">
                <LineChart
                  data={chartData}
                  dataKey="ram"
                  color="purple"
                  label="Memory Usage"
                />
              </div>
            </div>
          </section>

          {/* Real Docker Monitoring */}
          <section
            id="docker"
            className="scroll-mt-28 rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
          >
            <SectionHeader
              icon={Container}
              title="Real Docker Container Monitoring"
              subtitle="Live Docker Engine container state"
              right={
                <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-400">
                  REAL_DOCKER
                </span>
              }
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Container Name"
                value={
                  <span className="text-lg">
                    {dockerStatus?.container_name || "--"}
                  </span>
                }
                subtitle="Monitored demo container"
                icon={Container}
                color="cyan"
              />

              <MetricCard
                title="Container Status"
                value={
                  dockerAvailable
                    ? dockerStatus.container_status
                    : "Unavailable"
                }
                subtitle="Actual Docker Engine state"
                icon={Server}
                color={
                  dockerRunning
                    ? "green"
                    : dockerAvailable
                    ? "red"
                    : "amber"
                }
              />

              <MetricCard
                title="Running State"
                value={
                  dockerAvailable
                    ? dockerRunning
                      ? "RUNNING"
                      : "STOPPED"
                    : "UNKNOWN"
                }
                subtitle="Read-only container inspection"
                icon={Activity}
                color={
                  dockerRunning
                    ? "green"
                    : dockerAvailable
                    ? "red"
                    : "amber"
                }
              />

              <MetricCard
                title="Real Recoveries"
                value={successfulDockerRecoveries.length}
                subtitle="Successful automatic Docker starts"
                icon={ShieldCheck}
                color="green"
              />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-[#0b1425] p-5">
                <p className="mb-4 text-sm font-semibold text-white">
                  Container Details
                </p>

                <div className="space-y-4 text-sm">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="text-slate-400">
                      Monitoring Mode
                    </span>
                    <span className="font-medium text-cyan-400">
                      {dockerStatus?.monitoring_mode || "--"}
                    </span>
                  </div>

                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="text-slate-400">
                      Started At
                    </span>
                    <span className="text-slate-200">
                      {formatTime(dockerStatus?.started_at)}
                    </span>
                  </div>

                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="text-slate-400">
                      Last Checked
                    </span>
                    <span className="text-slate-200">
                      {formatTime(dockerStatus?.timestamp)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#0b1425] p-5">
                <p className="mb-4 text-sm font-semibold text-white">
                  Docker Health
                </p>

                <div className="flex items-center gap-3">
                  {dockerRunning ? (
                    <CheckCircle2
                      size={28}
                      className="text-emerald-400"
                    />
                  ) : (
                    <AlertTriangle
                      size={28}
                      className="text-amber-400"
                    />
                  )}

                  <div>
                    <p
                      className={`font-semibold ${
                        dockerRunning
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {dockerRunning
                        ? "Container Running"
                        : dockerAvailable
                        ? "Container Not Running"
                        : "Monitoring Unavailable"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Status automatically refreshes every
                      5 seconds.
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-xs leading-relaxed text-slate-500">
                  Automatic real Docker recovery is enabled
                  for cloudguard-demo. AI-triggered healing
                  remains in simulation mode.
                </p>
              </div>
            </div>

            {/* Last real Docker recovery */}
            <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <div className="flex items-center gap-3">
                <ShieldCheck
                  size={22}
                  className="text-emerald-400"
                />
                <div>
                  <h3 className="font-semibold text-white">
                    Last Automatic Docker Recovery
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Real container recovery audit record
                  </p>
                </div>
              </div>

              {lastDockerRecovery ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      Status
                    </p>
                    <p className="mt-1 font-semibold text-emerald-400">
                      {lastDockerRecovery.status}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Container
                    </p>
                    <p className="mt-1 text-sm text-white">
                      {lastDockerRecovery.service}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Recovery Time
                    </p>
                    <p className="mt-1 text-sm text-white">
                      {formatTime(lastDockerRecovery.timestamp)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-400">
                  No successful real Docker recovery recorded yet.
                </p>
              )}
            </div>

            {dockerError && (
              <p className="mt-4 text-sm text-rose-400">
                {dockerError}
              </p>
            )}
          </section>

          {/* AI Prediction */}
          <section
            id="prediction"
            className="scroll-mt-28 grid gap-6 xl:grid-cols-5"
          >
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 xl:col-span-3">
              <SectionHeader
                icon={Gauge}
                title="AI Failure Prediction"
                subtitle="Random Forest risk classification"
              />

              <div className="flex flex-wrap items-center gap-7">
                <div
                  className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(${
                      highRisk ? "#fb7185" : "#34d399"
                    } ${
                      prediction && Number.isFinite(riskScore)
                        ? Math.min(100, Math.max(0, riskScore))
                        : 0
                    }%, #1e293b 0)`,
                  }}
                >
                  <div className="flex h-[132px] w-[132px] flex-col items-center justify-center rounded-full bg-slate-900">
                    <span className="text-3xl font-bold">
                      {prediction && Number.isFinite(riskScore)
                        ? `${riskScore.toFixed(0)}%`
                        : "--"}
                    </span>
                    <span className="text-xs text-slate-500">
                      Risk Score
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-sm text-slate-400">
                    Current AI Assessment
                  </p>

                  <h3
                    className={`mt-2 text-2xl font-bold ${riskColor}`}
                  >
                    {prediction
                      ? prediction.risk_status
                      : "Unavailable"}
                  </h3>

                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
                    Prediction uses live CPU/RAM and
                    demonstration response-time and
                    error-rate inputs.
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <Database size={14} />
                    Trained on simulated data
                  </div>
                </div>
              </div>

              {aiError && (
                <p className="mt-5 text-sm text-rose-400">
                  {aiError}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 xl:col-span-2">
              <SectionHeader
                icon={Server}
                title="Server Health"
                subtitle="Backend connectivity and monitoring"
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-[#0b1425] p-4">
                  <div className="flex items-center gap-3">
                    <Wifi
                      size={18}
                      className="text-cyan-400"
                    />
                    <span className="text-sm text-slate-300">
                      Backend API
                    </span>
                  </div>

                  <span
                    className={`text-sm font-medium ${
                      backendOnline
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {backendOnline ? "Online" : "Offline"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#0b1425] p-4">
                  <div className="flex items-center gap-3">
                    <Activity
                      size={18}
                      className="text-violet-400"
                    />
                    <span className="text-sm text-slate-300">
                      AI Engine
                    </span>
                  </div>

                  <span
                    className={`text-sm font-medium ${
                      prediction
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    {prediction ? "Active" : "Unavailable"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#0b1425] p-4">
                  <div className="flex items-center gap-3">
                    <Container
                      size={18}
                      className="text-cyan-400"
                    />
                    <span className="text-sm text-slate-300">
                      Docker Container
                    </span>
                  </div>

                  <span
                    className={`text-sm font-medium ${
                      dockerRunning
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    {dockerRunning
                      ? "Running"
                      : dockerAvailable
                      ? "Stopped"
                      : "Unavailable"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#0b1425] p-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck
                      size={18}
                      className="text-emerald-400"
                    />
                    <span className="text-sm text-slate-300">
                      Docker Auto Recovery
                    </span>
                  </div>

                  <span
                    className={`text-sm font-medium ${
                      dockerStatus?.automatic_recovery_enabled
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    {dockerStatus?.automatic_recovery_enabled
                      ? "Enabled"
                      : "Unavailable"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#0b1425] p-4">
                  <div className="flex items-center gap-3">
                    <Clock3
                      size={18}
                      className="text-slate-400"
                    />
                    <span className="text-sm text-slate-300">
                      Last Updated
                    </span>
                  </div>

                  <span className="text-xs text-slate-400">
                    {metrics?.timestamp
                      ? new Date(
                          metrics.timestamp
                        ).toLocaleTimeString()
                      : "--"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Self-Healing */}
          <section
            id="self-healing"
            className="scroll-mt-28 rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
          >
            <SectionHeader
              icon={ShieldCheck}
              title="Automated Self-Healing"
              subtitle="AI simulation and real Docker recovery"
              right={
                <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-400">
                  Hybrid Recovery
                </span>
              }
            />

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-[#0b1425] p-5">
                <p className="text-sm text-slate-400">
                  AI Automatic Healing Status
                </p>

                <div className="mt-4 flex items-center gap-3">
                  {automaticTriggered ? (
                    <CheckCircle2
                      className="text-emerald-400"
                      size={26}
                    />
                  ) : checks > 0 ? (
                    <AlertTriangle
                      className="text-amber-400"
                      size={26}
                    />
                  ) : (
                    <Activity
                      className="text-cyan-400"
                      size={26}
                    />
                  )}

                  <h3 className="text-xl font-bold">
                    {!prediction
                      ? "Unavailable"
                      : automaticTriggered
                      ? "Simulation Triggered"
                      : checks > 0
                      ? "High Risk Detected"
                      : "Monitoring"}
                  </h3>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-slate-500">
                  AI automatic healing is simulated after
                  three consecutive qualifying high-risk
                  prediction requests, subject to cooldown.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#0b1425] p-5">
                <p className="text-sm text-slate-400">
                  Consecutive High-Risk Checks
                </p>

                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-bold text-white">
                    {prediction ? checks : "--"}
                  </span>
                  <span className="mb-1 text-lg text-slate-500">
                    / 3
                  </span>
                </div>

                <div className="mt-5 flex gap-2">
                  {[1, 2, 3].map((number) => (
                    <div
                      key={number}
                      className={`h-2 flex-1 rounded-full ${
                        checks >= number
                          ? "bg-cyan-400"
                          : "bg-slate-700"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#0b1425] p-5">
                <p className="text-sm text-slate-400">
                  Last AI Automatic Simulation
                </p>

                {lastAutomaticHealing ? (
                  <>
                    <div className="mt-4 flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 size={21} />
                      <span className="font-semibold">
                        {lastAutomaticHealing.status}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-slate-400">
                      {lastAutomaticHealing.service}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {formatTime(
                        lastAutomaticHealing.timestamp
                      )}
                    </p>
                  </>
                ) : (
                  <p className="mt-5 text-sm text-slate-500">
                    No automatic AI simulation recorded yet.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#0b1425] p-5">
              <div>
                <h3 className="font-semibold text-white">
                  Manual Recovery Simulation
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Record a simulated container restart
                  without affecting real services.
                </p>
              </div>

              <button
                onClick={handleHealing}
                disabled={!backendOnline || healingLoading}
                className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={
                    healingLoading ? "animate-spin" : ""
                  }
                />
                {healingLoading
                  ? "Running..."
                  : "Run Healing Simulation"}
                <ArrowUpRight size={16} />
              </button>
            </div>

            {healing && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                <CheckCircle2 size={19} />
                <div>
                  <p className="font-semibold">
                    Manual simulation recorded
                  </p>
                  <p className="mt-1 text-xs">
                    {healing.service} — {healing.status}
                  </p>
                </div>
              </div>
            )}

            {healingError && (
              <p className="mt-4 text-sm text-rose-400">
                {healingError}
              </p>
            )}
          </section>

          {/* Healing History */}
          <section
            id="history"
            className="scroll-mt-28 rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
          >
            <SectionHeader
              icon={History}
              title="Recovery Activity Log"
              subtitle="Real Docker and simulated recovery events"
              right={
                <button
                  onClick={fetchHealingHistory}
                  disabled={historyLoading}
                  className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  <RefreshCw
                    size={15}
                    className={
                      historyLoading ? "animate-spin" : ""
                    }
                  />
                  Refresh History
                </button>
              }
            />

            <div className="mb-5 grid gap-4 sm:grid-cols-3">
              <MetricCard
                title="Total Events"
                value={history.length}
                subtitle="All recorded healing events"
                icon={History}
                color="cyan"
              />

              <MetricCard
                title="Real Docker Recoveries"
                value={successfulDockerRecoveries.length}
                subtitle="Confirmed container recoveries"
                icon={Container}
                color="green"
              />

              <MetricCard
                title="Simulation Events"
                value={simulationEvents.length}
                subtitle="AI and manual simulations"
                icon={ShieldCheck}
                color="purple"
              />
            </div>

            {historyError && (
              <p className="mb-4 text-sm text-rose-400">
                {historyError}
              </p>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-[#0b1425] text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Service</th>
                    <th className="px-5 py-4">Trigger</th>
                    <th className="px-5 py-4">Action</th>
                    <th className="px-5 py-4">Mode</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Timestamp</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {history.map((event, index) => {
                    const isReal =
                      event.mode === "REAL_DOCKER";

                    const isSuccess =
                      event.status === "RECOVERY_SUCCESS" ||
                      event.status === "SIMULATED_SUCCESS" ||
                      event.status === "ALREADY_RUNNING";

                    return (
                      <tr
                        key={`${event.timestamp}-${index}`}
                        className={`transition hover:bg-slate-800/40 ${
                          isReal ? "bg-emerald-500/5" : ""
                        }`}
                      >
                        <td className="px-5 py-4 font-medium text-slate-200">
                          <div className="flex items-center gap-2">
                            {isReal ? (
                              <Container
                                size={15}
                                className="text-emerald-400"
                              />
                            ) : (
                              <Server
                                size={15}
                                className="text-cyan-400"
                              />
                            )}
                            {event.service}
                          </div>
                        </td>

                        <td className="max-w-xs px-5 py-4 text-slate-400">
                          {event.reason}
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-400">
                          {event.action}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-md px-2.5 py-1 text-xs ${
                              isReal
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-cyan-500/10 text-cyan-400"
                            }`}
                          >
                            {event.mode}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${
                              isSuccess
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-rose-500/10 text-rose-400"
                            }`}
                          >
                            {isSuccess ? (
                              <CheckCircle2 size={13} />
                            ) : (
                              <AlertTriangle size={13} />
                            )}
                            {event.status}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                          {formatTime(event.timestamp)}
                        </td>
                      </tr>
                    );
                  })}

                  {history.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-10 text-center text-sm text-slate-500"
                      >
                        No recovery events found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>
                Total events: {history.length}
              </span>
              <span>
                Real Docker + Simulation Audit History
              </span>
            </div>
          </section>

          {/* Footer */}
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-6 text-xs text-slate-500">
            <p>
              CloudGuard AI — Cloud Failure Prediction &
              Self-Healing System
            </p>
            <p>
              Real Docker Monitoring & Recovery •
              Synthetic AI Training • AI Healing Simulation
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
