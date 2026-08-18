const { z } = require('zod');
const { generateStructuredJSON } = require('../utils/geminiClient');
const { logger } = require('../config/logger');

// Standard SDE core competencies (General SDE benchmark)
const GENERAL_SDE_BENCHMARK = {
  coreDsaTopics: [
    'Arrays & Two Pointers',
    'Strings & Hashing',
    'Linked Lists',
    'Trees & Binary Search Trees',
    'Dynamic Programming',
    'Graphs & BFS/DFS',
    'Stack & Queue',
    'Heap / Priority Queue'
  ],
  dsaProblemTarget: 150,
  minMediumProblems: 50,
  resumeAtsTarget: 75,
  minMockInterviews: 3,
  interviewScoreTarget: 70,
  communicationScoreTarget: 75,
  githubReposTarget: 2
};

const COMMON_TECH_SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'ruby', 'rust',
  'react', 'next.js', 'vue', 'angular', 'node.js', 'express', 'django', 'fastapi',
  'spring', 'spring boot', 'flask', 'nest.js',
  'mongodb', 'postgresql', 'mysql', 'sql', 'redis', 'dynamodb', 'cassandra', 'elasticsearch',
  'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'ci/cd', 'git', 'linux',
  'data structures', 'algorithms', 'system design', 'rest api', 'graphql', 'microservices'
];

/**
 * Extract required & preferred skills from a raw Job Description text.
 * Uses deterministic keyword scanning first, supplemented by Gemini if available.
 */
async function extractJobRequirements({ targetRole = 'Software Development Engineer', targetCompany = '', jobDescription = '' }) {
  const text = `${targetRole} ${targetCompany} ${jobDescription}`.toLowerCase();
  
  // 1. Deterministic keyword detection
  const detectedSkills = COMMON_TECH_SKILLS.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(text);
  });

  const baseRequirements = {
    targetRole: targetRole || 'Software Development Engineer',
    targetCompany: targetCompany || 'General Tech',
    requiredSkills: detectedSkills.length > 0 ? detectedSkills.slice(0, 8) : ['data structures', 'algorithms', 'javascript', 'node.js'],
    preferredSkills: detectedSkills.slice(8, 14),
    coreAreas: [
      text.includes('system design') || text.includes('distributed') ? 'System Design' : 'Data Structures & Algorithms',
      text.includes('front') || text.includes('react') ? 'Frontend Engineering' : 'Backend & API Architecture'
    ],
    experienceLevel: text.includes('senior') || text.includes('lead') ? 'Senior' : text.includes('intern') ? 'Intern' : 'SDE-1 / Junior'
  };

  // If no raw JD provided or Gemini is absent, return deterministic extraction
  if (!jobDescription || jobDescription.length < 50 || !process.env.GEMINI_API_KEY) {
    return baseRequirements;
  }

  // 2. LLM Enhancement for unstructured JD parsing
  try {
    const prompt = `You are a technical recruiter. Extract structured hiring requirements from this job description.
Role: ${targetRole}
Company: ${targetCompany}
Job Description:
${jobDescription.slice(0, 3000)}

Extract:
1. requiredSkills: Array of must-have technical skills, languages, tools (lowercase).
2. preferredSkills: Array of nice-to-have technical skills (lowercase).
3. coreAreas: Key engineering domains (e.g. Distributed Systems, Frontend, Cloud).
4. experienceLevel: "Intern" | "SDE-1 / Junior" | "SDE-2 / Mid" | "Senior"

Respond STRICTLY in JSON format.`;

    const schema = z.object({
      requiredSkills: z.array(z.string()).default([]),
      preferredSkills: z.array(z.string()).default([]),
      coreAreas: z.array(z.string()).default([]),
      experienceLevel: z.string().default('SDE-1 / Junior')
    });

    const parsed = await generateStructuredJSON({ prompt, schema });
    if (parsed && Array.isArray(parsed.requiredSkills) && parsed.requiredSkills.length > 0) {
      return {
        targetRole,
        targetCompany,
        requiredSkills: parsed.requiredSkills.map((s) => s.toLowerCase().trim()),
        preferredSkills: (parsed.preferredSkills || []).map((s) => s.toLowerCase().trim()),
        coreAreas: parsed.coreAreas?.length ? parsed.coreAreas : baseRequirements.coreAreas,
        experienceLevel: parsed.experienceLevel || baseRequirements.experienceLevel
      };
    }
  } catch (err) {
    logger.warn('Job requirement extraction with Gemini failed, using deterministic parser', { error: err.message });
  }

  return baseRequirements;
}

/**
 * Match candidate skills against extracted job requirements deterministically
 * with 3-way evidence classification: VERIFIED, UNVERIFIED, MISSING.
 */
function calculateJobMatch({
  candidateSkills = [],
  candidateProjects = [],
  resumeReport = null,
  dsaProblems = [],
  codingProfiles = [],
  interviews = [],
  githubLanguages = []
}, jobRequirements = {}) {
  const resumeTextBlob = `${(resumeReport?.strengths || []).join(' ')} ${(resumeReport?.weaknesses || []).join(' ')} ${(candidateProjects || []).join(' ')}`.toLowerCase();
  
  const additionalFoundSkills = COMMON_TECH_SKILLS.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(resumeTextBlob);
  });

  const resumeClaimedSet = new Set([
    ...candidateSkills.map((s) => String(s || '').toLowerCase().trim()),
    ...(resumeReport?.skillsFound || []).map((s) => String(s || '').toLowerCase().trim()),
    ...additionalFoundSkills
  ].filter(Boolean));

  // DSA topic evidence
  const dsaSolvedTopics = new Set(
    dsaProblems.map((p) => String(p.topic || '').toLowerCase().trim()).filter(Boolean)
  );

  // GitHub language and repo evidence
  const ghProfile = codingProfiles.find((p) => p.platform === 'github');
  let rawLangs = [];
  if (ghProfile?.stats?.languages) {
    if (ghProfile.stats.languages instanceof Map) {
      rawLangs = Array.from(ghProfile.stats.languages.keys());
    } else if (typeof ghProfile.stats.languages === 'object') {
      rawLangs = Object.keys(ghProfile.stats.languages);
    }
  }

  const ghLanguages = new Set([
    ...githubLanguages.map((l) => String(l || '').toLowerCase().trim()),
    ...rawLangs.map((l) => String(l || '').toLowerCase().trim()),
    ...(ghProfile?.featuredRepos || []).map((r) => String(r || '').toLowerCase().trim())
  ].filter(Boolean));

  // Interview topics covered
  const interviewTopicsCovered = new Set();
  (interviews || []).forEach((iv) => {
    if (iv.topic) interviewTopicsCovered.add(String(iv.topic).toLowerCase().trim());
    if (iv.structuredMemory?.technologiesMentioned) {
      iv.structuredMemory.technologiesMentioned.forEach((t) => interviewTopicsCovered.add(String(t).toLowerCase().trim()));
    }
  });

  const required = jobRequirements.requiredSkills || [];
  if (required.length === 0) {
    return {
      score: null,
      status: 'insufficient_data',
      matchedSkills: [],
      missingSkills: [],
      verifiedSkills: [],
      unverifiedSkills: [],
      missingRequirements: [],
      matchPercentage: null,
      details: 'No specific technical requirements extracted for this target.'
    };
  }

  const verifiedSkills = [];
  const unverifiedSkills = [];
  const missingRequirements = [];

  required.forEach((reqSkill) => {
    const cleanReq = reqSkill.toLowerCase().trim();
    const stemReq = cleanReq.replace(/s$/, '').replace(/ algorithms$/, '');
    
    // Check resume claim
    const hasResumeClaim = Array.from(resumeClaimedSet).some((candSkill) => {
      const stemCand = candSkill.replace(/s$/, '');
      return candSkill.includes(cleanReq) || cleanReq.includes(candSkill) || stemCand.includes(stemReq) || stemReq.includes(stemCand);
    });

    // Check GitHub proof
    const hasGithubProof = Array.from(ghLanguages).some((lang) => {
      const stemLang = lang.replace(/s$/, '');
      return lang.includes(cleanReq) || cleanReq.includes(lang) || stemLang === stemReq;
    });

    // Check DSA proof
    const hasDsaProof = Array.from(dsaSolvedTopics).some((topic) => {
      const stemTopic = topic.replace(/s$/, '');
      return topic.includes(cleanReq) || cleanReq.includes(topic) || stemReq.includes(stemTopic) || stemTopic.includes(stemReq);
    }) || (['data structures', 'algorithms', 'dsa'].includes(cleanReq) && dsaProblems.length > 0);

    // Check Interview proof
    const hasInterviewProof = Array.from(interviewTopicsCovered).some((topic) => {
      const stemTopic = topic.replace(/s$/, '');
      return topic.includes(cleanReq) || cleanReq.includes(topic) || stemReq.includes(stemTopic);
    });

    // Determine action route & label based on skill nature
    let actionRoute = '/coding-profiles';
    let actionLabel = 'Connect Proof';
    let actionIntent = { type: 'VERIFY_SKILL', topic: cleanReq };

    if (['arrays', 'trees', 'graphs', 'dynamic programming', 'strings', 'linked list', 'algorithms', 'data structures', 'binary search', 'recursion'].some((t) => cleanReq.includes(t))) {
      actionRoute = `/dsa-tracker?topic=${encodeURIComponent(cleanReq)}`;
      actionLabel = `Practice ${cleanReq}`;
      actionIntent = { type: 'SOLVE_DSA', topic: cleanReq };
    } else if (['system design', 'distributed systems', 'microservices', 'rest api', 'architecture'].some((t) => cleanReq.includes(t))) {
      actionRoute = `/interview-prep?topic=${encodeURIComponent(cleanReq)}`;
      actionLabel = `Mock Interview (${cleanReq})`;
      actionIntent = { type: 'PRACTICE_INTERVIEW', topic: cleanReq };
    } else if (['resume', 'communication', 'leadership'].some((t) => cleanReq.includes(t))) {
      actionRoute = '/resume';
      actionLabel = 'Update Resume';
      actionIntent = { type: 'IMPROVE_RESUME', section: 'Skills' };
    } else {
      actionRoute = `/coding-profiles/github`;
      actionLabel = `Add GitHub Project with ${cleanReq}`;
      actionIntent = { type: 'BUILD_PROJECT', topic: cleanReq };
    }

    if (hasResumeClaim && (hasGithubProof || hasDsaProof || hasInterviewProof)) {
      const evidence = [];
      if (hasResumeClaim) evidence.push('Extracted & verified in Resume ATS scan');
      if (hasGithubProof) evidence.push('Active verified GitHub code repository presence');
      if (hasDsaProof) evidence.push('Tracked problem solutions in DSA Tracker');
      if (hasInterviewProof) evidence.push('Demonstrated in AI Technical Mock Interview');

      verifiedSkills.push({
        name: reqSkill,
        status: 'verified',
        evidence,
        actionRoute,
        actionLabel: 'View Proof',
        actionIntent
      });
    } else if (hasResumeClaim) {
      unverifiedSkills.push({
        name: reqSkill,
        status: 'unverified',
        evidence: [
          'Claimed in Resume / Profile skills',
          'No supporting GitHub code repository, DSA practice, or mock interview verification found'
        ],
        reason: 'Claimed on resume but lacks verifiable code or interview telemetry.',
        actionRoute,
        actionLabel: actionLabel.replace('View Proof', 'Verify Skill'),
        actionIntent
      });
    } else {
      missingRequirements.push({
        name: reqSkill,
        status: 'missing',
        evidence: [
          `Required for target role ${jobRequirements.targetRole || 'SDE'}`,
          'No matching resume claim, DSA practice, or GitHub project detected'
        ],
        reason: 'Key job requirement not currently found in your resume or engineering evidence.',
        actionRoute,
        actionLabel,
        actionIntent
      });
    }
  });

  // Calculate score: Verified skills count full (100%), Unverified claims count partial (35%), Missing count 0%
  const totalPoints = verifiedSkills.length * 1.0 + unverifiedSkills.length * 0.35;
  const matchPercentage = Math.min(100, Math.round((totalPoints / required.length) * 100));

  return {
    score: matchPercentage,
    status: 'measured',
    matchPercentage,
    verifiedSkills,
    unverifiedSkills,
    missingSkills: missingRequirements,
    matchedSkills: verifiedSkills.map((s) => s.name),
    unverifiedSkillsList: unverifiedSkills.map((s) => s.name),
    missingSkillsList: missingRequirements.map((s) => s.name),
    details: `Verified ${verifiedSkills.length} of ${required.length} required technical skills. ${unverifiedSkills.length} unverified claims, ${missingRequirements.length} missing.`
  };
}

module.exports = {
  GENERAL_SDE_BENCHMARK,
  extractJobRequirements,
  calculateJobMatch
};
