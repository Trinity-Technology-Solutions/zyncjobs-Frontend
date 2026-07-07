import React, { useState, useEffect, useCallback } from "react";
import { API_ENDPOINTS } from "../config/constants";

interface RankingResult {
  overall: number;
  rule_score: number;
  ai_score: number;
  strengths: string[];
  missing_skills: string[];
  reason: string;
  components: Record<string, any>;
}

interface RankedCandidate {
  candidate: any;
  ranking: RankingResult;
}

interface CandidateRankingEngineProps {
  candidates: any[];
  selectedJob: any;
  onSelectCandidate: (candidateId: string) => void;
  selectedCandidates: string[];
  onNavigate?: (page: string, data?: any) => void;
}

const CandidateRankingEngine: React.FC<CandidateRankingEngineProps> = ({
  candidates,
  selectedJob,
  onSelectCandidate,
  selectedCandidates,
  onNavigate,
}) => {
  const [rankings, setRankings] = useState<RankedCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiThreshold, setAiThreshold] = useState(0);
  const [skillFilter, setSkillFilter] = useState("");
  const [expFilter, setExpFilter] = useState("");
  const [locFilter, setLocFilter] = useState("");

  const fetchRankings = useCallback(async () => {
    if (!candidates.length || !selectedJob) return;
    setLoading(true);
    setError("");

    try {
      const payload = {
        candidates: candidates.map((c) => ({
          skills:
            c.resume?.skills?.featuredSkills?.map((s: any) => s.skill) || [],
          workExperiences: c.resume?.workExperiences || [],
          educations: c.resume?.educations || [],
          projects: c.resume?.projects || [],
          certifications: c.resume?.certifications || [],
          location: c.resume?.profile?.location || "",
          featuredSkills: c.resume?.skills?.featuredSkills || [],
          profile: c.resume?.profile || {},
        })),
        job: {
          skills: selectedJob.skills || [],
          experience:
            selectedJob.experience || selectedJob.experienceReq || "",
          education: selectedJob.education || "",
          location: selectedJob.location || "",
          salary: selectedJob.salary || "",
          title: selectedJob.title || "",
        },
      };

      const res = await fetch(
        `${API_ENDPOINTS.BASE_URL}/ranking/rank`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();

      // Map rankings back to candidates
      const ranked: RankedCandidate[] = (data.rankings || []).map(
        (r: any, i: number) => ({
          candidate: candidates[i] || r.candidate,
          ranking: r.ranking,
        }),
      );

      setRankings(ranked);
    } catch (err: any) {
      console.error("[RANKING] Failed to fetch rankings:", err);
      setError(err.message || "Ranking failed");

      // Fallback: compute simple rule score locally
              const fallback = candidates.map((c) => {
        const cSkills =
          c.resume?.skills?.featuredSkills?.map((s: any) =>
            s.skill.toLowerCase(),
          ) || [];
        const jSkills = (selectedJob?.skills || []).map((s: string) =>
          s.toLowerCase(),
        );
        const matched = cSkills.filter((s: string) =>
          jSkills.some((js: string) => js.includes(s) || s.includes(js))
        );
        let skillScore =
          jSkills.length > 0
            ? Math.round((matched.length / jSkills.length) * 70)
            : 0;
        // Experience bonus (up to 20%)
        const expText = (c.resume?.workExperiences?.[0]?.date || '').toLowerCase();
        const expYears = parseInt(expText.match(/(\d+)/)?.[1] || '0');
        skillScore += Math.min(20, expYears * 4);
        // Resume attached bonus (10%)
        if (c.resume?.profile?.name) skillScore += 10;
        skillScore = Math.min(99, Math.max(10, skillScore));
        return {
          candidate: c,
          ranking: {
            overall: skillScore,
            rule_score: skillScore,
            ai_score: 0,
            strengths: matched.slice(0, 3),
            missing_skills: jSkills.filter(
              (s: string) => !cSkills.some((cs: string) => cs.includes(s) || s.includes(cs)),
            ),
            reason: "Offline fallback â€” AI unavailable",
            components: {},
          },
        } as RankedCandidate;
      });
      setRankings(fallback);
    } finally {
      setLoading(false);
    }
  }, [candidates, selectedJob]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const filteredRankings = rankings.filter((r) => {
    if (aiThreshold > 0 && (r.ranking?.ai_score || r.ranking?.overall || 0) < aiThreshold)
      return false;
    if (skillFilter) {
      const cSkills =
        r.candidate?.resume?.skills?.featuredSkills?.map((s: any) =>
          s.skill.toLowerCase(),
        ) || [];
      if (
        !cSkills.some((s: string) => s.includes(skillFilter.toLowerCase()))
      )
        return false;
    }
    if (expFilter) {
      const totalExp =
        r.ranking?.components?.experience?.years ||
        r.candidate?.resume?.workExperiences?.length ||
        0;
      const minExp = parseFloat(expFilter);
      if (!isNaN(minExp) && totalExp < minExp) return false;
    }
    if (locFilter) {
      const loc = (
        r.candidate?.resume?.profile?.location || ""
      ).toLowerCase();
      if (!loc.includes(locFilter.toLowerCase())) return false;
    }
    return true;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Candidate Ranking Engine v2
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Hybrid AI + Rule-based matching
          </p>
        </div>
        <button
          onClick={fetchRankings}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 text-sm font-medium"
        >
          {loading ? "Ranking..." : "Re-rank"}
        </button>
      </div>

      {/* Job Summary */}
      {selectedJob && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900">
                {selectedJob.title || "Job"}
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {(selectedJob.skills || []).map((s: string, i: number) => (
                  <span
                    key={i}
                    className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="flex gap-4 mt-2 text-sm text-gray-600">
                {selectedJob.experience && (
                  <span>Exp: {selectedJob.experience}</span>
                )}
                {selectedJob.location && (
                  <span>Location: {selectedJob.location}</span>
                )}
              </div>
            </div>
            <div className="text-right text-xs text-gray-400">
              {rankings.length} candidates
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            AI Match &gt;
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={aiThreshold}
            onChange={(e) => setAiThreshold(parseInt(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            placeholder="70"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Skills
          </label>
          <input
            type="text"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            placeholder="React"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Min Exp (yrs)
          </label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={expFilter}
            onChange={(e) => setExpFilter(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            placeholder="3"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Location
          </label>
          <input
            type="text"
            value={locFilter}
            onChange={(e) => setLocFilter(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            placeholder="Chennai"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setAiThreshold(0);
              setSkillFilter("");
              setExpFilter("");
              setLocFilter("");
            }}
            className="w-full px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
          Computing ranking scores...
        </div>
      )}

      {/* Rankings */}
      <div className="space-y-4">
        {filteredRankings.map((r, index) => {
          const cand = r.candidate;
          const rank = r.ranking;
          const name =
            cand?.resume?.profile?.name || cand?.fileName || "Unknown";
          const location = cand?.resume?.profile?.location || "";
          const jobTitle = cand?.resume?.workExperiences?.[0]?.jobTitle || "";
          const expYears = rank?.components?.experience?.years || 0;
          const topSkills =
            cand?.resume?.skills?.featuredSkills
              ?.map((s: any) => s.skill)
              .slice(0, 6) || [];

          return (
            <div
              key={cand.id}
              className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                {/* Left: Candidate Info */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedCandidates.includes(cand.id)}
                    onChange={() => onSelectCandidate(cand.id)}
                    className="w-4 h-4 mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">
                        #{index + 1}
                      </span>
                      <h3 className="font-semibold text-gray-900 truncate">
                        {name}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                      {jobTitle && (
                        <span>
                          💼 {jobTitle}
                        </span>
                      )}
                      {location && (
                        <span>
                          📍 {location}
                        </span>
                      )}
                      {expYears > 0 && (
                        <span>
                          🎯 {expYears} yrs
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scores */}
                <div className="flex items-start gap-4 flex-shrink-0">
                  {/* Overall */}
                  <div className="text-center min-w-[70px]">
                    <div
                      className={`text-2xl font-bold ${getScoreColor(rank.overall)}`}
                    >
                      {rank.overall}%
                    </div>
                    <div className="text-xs text-gray-500">Overall</div>
                  </div>
                  {/* Rule */}
                  <div className="text-center min-w-[60px]">
                    <div className="text-lg font-semibold text-gray-700">
                      {rank.rule_score}
                    </div>
                    <div className="text-xs text-gray-400">Rule</div>
                  </div>
                  {/* AI */}
                  <div className="text-center min-w-[60px]">
                    <div className="text-lg font-semibold text-gray-700">
                      {rank.ai_score}
                    </div>
                    <div className="text-xs text-gray-400">AI</div>
                  </div>
                </div>
              </div>

              {/* Strengths & Missing Skills */}
              <div className="mt-3 flex flex-wrap gap-2">
                {(rank.strengths || []).slice(0, 3).map((s: string, i: number) => (
                  <span
                    key={i}
                    className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs"
                  >
                    ✓ {s}
                  </span>
                ))}
                {(rank.missing_skills || []).slice(0, 3).map((s: string, i: number) => (
                  <span
                    key={i}
                    className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs"
                  >
                    ✗ {s}
                  </span>
                ))}
                {(rank.strengths?.length || 0) > 3 && (
                  <span className="text-xs text-gray-400">
                    +{rank.strengths.length - 3} more strengths
                  </span>
                )}
                {(rank.missing_skills?.length || 0) > 3 && (
                  <span className="text-xs text-gray-400">
                    +{rank.missing_skills.length - 3} more missing
                  </span>
                )}
              </div>

              {/* Top Skills */}
              <div className="mt-2 flex flex-wrap gap-1">
                {topSkills.map((skill: string, i: number) => {
                  const isMissing = (rank.missing_skills || []).some(
                    (ms: string) => ms.toLowerCase() === skill.toLowerCase(),
                  );
                  return (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        isMissing
                          ? "bg-red-50 text-red-600 line-through"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {skill}
                    </span>
                  );
                })}
              </div>

              {/* AI Reason */}
              {rank.reason && (
                <div className="mt-2 text-xs text-gray-500 italic">
                  {rank.reason}
                </div>
              )}

              {/* Actions */}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() =>
                    onNavigate?.("resume-viewer", {
                      candidateId: cand.id,
                      resume: cand.resume,
                    })
                  }
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200"
                >
                  View Resume
                </button>
                <button
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                >
                  Invite
                </button>
                <button className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200">
                  Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty */}
      {!loading && filteredRankings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {candidates.length === 0
            ? "No candidates uploaded yet. Use bulk upload to add resumes."
            : "No candidates match the current filters."}
        </div>
      )}
    </div>
  );
};

export default CandidateRankingEngine;
