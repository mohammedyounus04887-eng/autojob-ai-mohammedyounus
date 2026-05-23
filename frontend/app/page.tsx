"use client";

import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Upload,
  Search,
  Send,
  ExternalLink,
  Sparkles,
  FileText,
  Brain,
  CheckCircle,
  Mail,
  Zap,
  ShieldCheck,
} from "lucide-react";

type Job = {
  title: string;
  company: string;
  link: string;
  snippet: string;
  hr_email?: string;
  source?: string;
};

type AtsResult = {
  ats_score: number;
  match_level: string;
  summary: string;
  strengths: string[];
  missing_keywords: string[];
  improvements: string[];
  recommended_roles?: string[];
};

type InfoCardProps = {
  icon: React.ReactNode;
  title: string;
  text: string;
};

type ResultBoxProps = {
  title: string;
  items?: string[];
};

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://autojob-ai-mohammedyounus.onrender.com";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("India");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [ats, setAts] = useState<AtsResult | null>(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [atsLoading, setAtsLoading] = useState(false);

  const getErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.detail || error.message || "Request failed";
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "Something went wrong";
  };

  const uploadResume = async () => {
    if (!file) {
      alert("Please select your resume PDF");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(`${API}/upload-resume`, formData);

      setResumeUploaded(true);
      alert(res.data.message || "Resume uploaded successfully");
    } catch (error: unknown) {
      console.error("UPLOAD ERROR:", error);
      alert(getErrorMessage(error));
    }
  };

  const checkAtsScore = async () => {
    if (!resumeUploaded) {
      alert("Upload resume first");
      return;
    }

    if (!role) {
      alert("Enter job role first");
      return;
    }

    try {
      setAtsLoading(true);

      const formData = new FormData();
      formData.append("job_role", role);
      formData.append("job_description", "");

      const res = await axios.post(`${API}/ats-score`, formData);
      setAts(res.data.ats);
    } catch (error: unknown) {
      console.error("ATS ERROR:", error);
      alert(getErrorMessage(error));
    } finally {
      setAtsLoading(false);
    }
  };

  const searchJobs = async () => {
    if (!role) {
      alert("Enter job role");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("role", role);
      formData.append("location", location);

      const res = await axios.post(`${API}/search-jobs`, formData);
      setJobs(res.data.jobs || []);
    } catch (error: unknown) {
      console.error("SEARCH ERROR:", error);
      alert(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const sendResume = async (job: Job) => {
    if (!resumeUploaded) {
      alert("Upload resume first");
      return;
    }

    const hrEmail = job.hr_email || prompt("Enter HR email:");
    if (!hrEmail) return;

    const confirmSend = confirm(`Send your resume to ${hrEmail}?`);
    if (!confirmSend) return;

    try {
      const formData = new FormData();
      formData.append("hr_email", hrEmail);
      formData.append("company", job.company || "Company");
      formData.append("role", job.title || role);

      const res = await axios.post(`${API}/send-resume`, formData);
      alert(res.data.message || "Resume sent successfully");
    } catch (error: unknown) {
      console.error("SEND ERROR:", error);
      alert(getErrorMessage(error));
    }
  };

  return (
    <main
      suppressHydrationWarning
      className="min-h-screen overflow-hidden bg-[#020617] text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#2563eb55,transparent_35%),radial-gradient(circle_at_top_right,#9333ea55,transparent_35%),radial-gradient(circle_at_bottom,#14b8a655,transparent_35%)]" />

      <section className="relative max-w-7xl mx-auto px-6 py-10">
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-3 rounded-2xl shadow-lg shadow-blue-500/30">
              <Zap />
            </div>
            <h2 className="text-xl font-bold">AutoJob AI</h2>
          </div>

          <div className="hidden md:flex gap-6 text-sm text-slate-300">
            <span>Resume AI</span>
            <span>ATS Score</span>
            <span>Job Apply</span>
          </div>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-5 py-2 rounded-full mb-6">
            <Sparkles size={18} />
            <span>AI-powered resume apply assistant</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Apply Smarter.
            <br />
            Get ATS Ready.
          </h1>

          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Upload your resume, check ATS score using AI, discover jobs, open
            LinkedIn apply pages, and send your resume to HR emails safely.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-8 shadow-2xl mb-10"
        >
          <div className="grid md:grid-cols-3 gap-5">
            <label className="bg-black/30 border border-white/20 rounded-3xl p-6 cursor-pointer hover:bg-white/10 transition">
              <FileText className="mb-4 text-blue-300" size={32} />
              <p className="font-bold mb-2">Upload Resume PDF</p>
              <p className="text-xs text-slate-400 mb-4">
                AI will read your resume and calculate ATS score.
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-sm"
              />
              {file && (
                <p className="text-emerald-300 text-xs mt-3">{file.name}</p>
              )}
            </label>

            <div className="bg-black/30 border border-white/20 rounded-3xl p-6">
              <Brain className="mb-4 text-purple-300" size={32} />
              <p className="font-bold mb-2">Target Role</p>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Python Developer"
                className="w-full bg-white/10 rounded-2xl p-4 outline-none"
              />
            </div>

            <div className="bg-black/30 border border-white/20 rounded-3xl p-6">
              <Search className="mb-4 text-emerald-300" size={32} />
              <p className="font-bold mb-2">Location</p>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Bangalore"
                className="w-full bg-white/10 rounded-2xl p-4 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-8">
            <button
              onClick={uploadResume}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-7 py-4 rounded-2xl font-bold shadow-lg shadow-blue-500/30"
            >
              <Upload size={18} />
              Upload Resume
            </button>

            <button
              onClick={checkAtsScore}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black px-7 py-4 rounded-2xl font-bold shadow-lg shadow-yellow-500/30"
            >
              <Brain size={18} />
              Check ATS Score
            </button>

            <button
              onClick={searchJobs}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-7 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-500/30"
            >
              <Search size={18} />
              Search Jobs
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 mb-10">
          <InfoCard
            icon={<ShieldCheck />}
            title="Safe Apply"
            text="No LinkedIn botting. You manually open job links."
          />
          <InfoCard
            icon={<Brain />}
            title="AI ATS Score"
            text="OpenAI analyzes resume quality for your target role."
          />
          <InfoCard
            icon={<Mail />}
            title="HR Email"
            text="Send resume only after your confirmation."
          />
        </div>

        {atsLoading && (
          <p className="text-center text-slate-300 mb-8">
            AI is checking your ATS score...
          </p>
        )}

        {ats && (
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 mb-10 shadow-2xl"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
              <div>
                <p className="text-slate-400 mb-2">AI ATS Result</p>
                <h2 className="text-4xl font-black">{ats.ats_score}/100</h2>
                <p className="text-blue-300 font-semibold mt-2">
                  {ats.match_level}
                </p>
              </div>

              <div className="w-full md:w-72 h-5 bg-black/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-400 via-yellow-400 to-emerald-400"
                  style={{ width: `${ats.ats_score}%` }}
                />
              </div>
            </div>

            <p className="text-slate-300 mb-8">{ats.summary}</p>

            <div className="grid md:grid-cols-3 gap-6">
              <ResultBox title="Strengths" items={ats.strengths} />
              <ResultBox
                title="Missing Keywords"
                items={ats.missing_keywords}
              />
              <ResultBox title="Improvements" items={ats.improvements} />
            </div>
          </motion.div>
        )}

        {loading && (
          <p className="text-center text-slate-300 mb-8">
            Searching job opportunities...
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {jobs.map((job, index) => (
            <motion.div
              key={`${job.link}-${index}`}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="group bg-white/10 border border-white/20 rounded-[2rem] p-7 shadow-xl hover:bg-white/15 hover:scale-[1.02] transition"
            >
              <div className="flex justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-black mb-2">{job.title}</h2>
                  <p className="text-blue-300 font-semibold">{job.company}</p>
                </div>

                <span className="h-fit bg-white/10 text-xs px-3 py-2 rounded-full">
                  {job.source || "Job"}
                </span>
              </div>

              <p className="text-slate-300 text-sm mb-6">{job.snippet}</p>

              {job.hr_email && (
                <p className="text-emerald-300 text-sm mb-4 flex items-center gap-2">
                  <CheckCircle size={16} />
                  HR Email found: {job.hr_email}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => window.open(job.link, "_blank")}
                  className="flex items-center gap-2 bg-white text-black px-5 py-3 rounded-2xl font-bold"
                >
                  <ExternalLink size={17} />
                  Open Job
                </button>

                <button
                  onClick={() => sendResume(job)}
                  className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 px-5 py-3 rounded-2xl font-bold"
                >
                  <Send size={17} />
                  Send Resume
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}

function InfoCard({ icon, title, text }: InfoCardProps) {
  return (
    <div className="bg-white/10 border border-white/20 rounded-3xl p-6 backdrop-blur-xl">
      <div className="text-blue-300 mb-4">{icon}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{text}</p>
    </div>
  );
}

function ResultBox({ title, items = [] }: ResultBoxProps) {
  return (
    <div className="bg-black/30 rounded-3xl p-5 border border-white/10">
      <h3 className="font-bold text-lg mb-4">{title}</h3>
      <ul className="space-y-2 text-sm text-slate-300">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}