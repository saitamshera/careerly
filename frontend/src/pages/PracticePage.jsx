import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Target
} from 'lucide-react';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

const TOPIC_PROBLEMS = {
  'dynamic-programming': [
    {
      title: 'Climbing Stairs',
      difficulty: 'Easy',
      pattern: '1D DP',
      url: 'https://leetcode.com/problems/climbing-stairs/',
      reason: 'Builds the basic DP state transition.'
    },
    {
      title: 'House Robber',
      difficulty: 'Medium',
      pattern: 'Take / Skip DP',
      url: 'https://leetcode.com/problems/house-robber/',
      reason: 'Teaches an important interview DP pattern.'
    },
    {
      title: 'Coin Change',
      difficulty: 'Medium',
      pattern: 'Unbounded DP',
      url: 'https://leetcode.com/problems/coin-change/',
      reason: 'Builds optimization-based DP thinking.'
    },
    {
      title: 'Longest Common Subsequence',
      difficulty: 'Medium',
      pattern: '2D Grid / String DP',
      url: 'https://leetcode.com/problems/longest-common-subsequence/',
      reason: 'Fundamental two-sequence comparison and grid state transitions.'
    },
    {
      title: 'Word Break',
      difficulty: 'Medium',
      pattern: 'Prefix / Decision DP',
      url: 'https://leetcode.com/problems/word-break/',
      reason: 'Tests substring partitioning and decision caching.'
    }
  ],
  'graphs': [
    {
      title: 'Number of Islands',
      difficulty: 'Medium',
      pattern: '2D Grid DFS / BFS',
      url: 'https://leetcode.com/problems/number-of-islands/',
      reason: 'Classic matrix traversal and connected components identification.'
    },
    {
      title: 'Clone Graph',
      difficulty: 'Medium',
      pattern: 'DFS with Hash Map',
      url: 'https://leetcode.com/problems/clone-graph/',
      reason: 'Teaches graph deep copying with visited tracking.'
    },
    {
      title: 'Course Schedule',
      difficulty: 'Medium',
      pattern: 'Topological Sort / Cycle Detection',
      url: 'https://leetcode.com/problems/course-schedule/',
      reason: 'Essential directed dependency resolution and cycle checking.'
    },
    {
      title: 'Network Delay Time',
      difficulty: 'Medium',
      pattern: "Dijkstra's Shortest Path",
      url: 'https://leetcode.com/problems/network-delay-time/',
      reason: 'Core priority-queue based shortest path finding in weighted graphs.'
    }
  ],
  'trees': [
    {
      title: 'Invert Binary Tree',
      difficulty: 'Easy',
      pattern: 'Tree Recursion',
      url: 'https://leetcode.com/problems/invert-binary-tree/',
      reason: 'Foundational binary tree recursion and subtree swapping.'
    },
    {
      title: 'Maximum Depth of Binary Tree',
      difficulty: 'Easy',
      pattern: 'DFS / Depth Calculation',
      url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/',
      reason: 'Standard tree traversal for structural depth.'
    }
  ],
  'arrays': [
    {
      title: 'Best Time to Buy and Sell Stock',
      difficulty: 'Easy',
      pattern: 'Running Minimum',
      url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
      reason: 'Tracks historical minima in a single pass.'
    },
    {
      title: '3Sum',
      difficulty: 'Medium',
      pattern: 'Sort + Two Pointers',
      url: 'https://leetcode.com/problems/3sum/',
      reason: 'Multi-pointer convergence and duplicate pruning.'
    },
    {
      title: 'Container With Most Water',
      difficulty: 'Medium',
      pattern: 'Shrinking Two Pointers',
      url: 'https://leetcode.com/problems/container-with-most-water/',
      reason: 'Greedy boundary narrowing based on shortest wall.'
    }
  ],
  'sliding-window': [
    {
      title: 'Maximum Average Subarray I',
      difficulty: 'Easy',
      pattern: 'Fixed-Size Window',
      url: 'https://leetcode.com/problems/maximum-average-subarray-i/',
      reason: 'Foundational rolling sum over fixed interval.'
    },
    {
      title: 'Longest Substring Without Repeating Characters',
      difficulty: 'Medium',
      pattern: 'Dynamic Window with Set',
      url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
      reason: 'High-frequency window expansion and contraction.'
    },
    {
      title: 'Minimum Window Substring',
      difficulty: 'Hard',
      pattern: 'Frequency Map Window',
      url: 'https://leetcode.com/problems/minimum-window-substring/',
      reason: 'Character constraint tracking across expanding windows.'
    }
  ],
  'stack': [
    {
      title: 'Valid Parentheses',
      difficulty: 'Easy',
      pattern: 'LIFO Bracket Matching',
      url: 'https://leetcode.com/problems/valid-parentheses/',
      reason: 'Fundamental stack verification for nested syntax.'
    },
    {
      title: 'Min Stack',
      difficulty: 'Medium',
      pattern: 'Auxiliary Tracking Stack',
      url: 'https://leetcode.com/problems/min-stack/',
      reason: 'Constant time minimum retrieval.'
    },
    {
      title: 'Daily Temperatures',
      difficulty: 'Medium',
      pattern: 'Monotonic Decreasing Stack',
      url: 'https://leetcode.com/problems/daily-temperatures/',
      reason: 'Core monotonic stack pattern for next warmer element.'
    }
  ],
  'linked-list': [
    {
      title: 'Reverse Linked List',
      difficulty: 'Easy',
      pattern: 'Iterative Pointer Swap',
      url: 'https://leetcode.com/problems/reverse-linked-list/',
      reason: 'Must-know pointer manipulation baseline.'
    },
    {
      title: 'Merge Two Sorted Lists',
      difficulty: 'Easy',
      pattern: 'Dummy Head Merge',
      url: 'https://leetcode.com/problems/merge-two-sorted-lists/',
      reason: 'Foundational linear traversal with sentinel nodes.'
    },
    {
      title: 'Linked List Cycle',
      difficulty: 'Easy',
      pattern: "Floyd's Fast & Slow Pointers",
      url: 'https://leetcode.com/problems/linked-list-cycle/',
      reason: 'Classic two-pointer cycle detection in O(1) space.'
    },
    {
      title: 'Reorder List',
      difficulty: 'Medium',
      pattern: 'Find Mid + Reverse + Interleave',
      url: 'https://leetcode.com/problems/reorder-list/',
      reason: 'Combines midpoint finding, reversal, and interleaving.'
    }
  ]
};

function normalizeTopicKey(slug = '') {
  const clean = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (clean.includes('dp') || clean.includes('dynamic')) return 'dynamic-programming';
  if (clean.includes('graph')) return 'graphs';
  if (clean.includes('tree')) return 'trees';
  if (clean.includes('binary-search') || clean.includes('search')) return 'binary-search';
  if (clean.includes('slide') || clean.includes('window')) return 'sliding-window';
  if (clean.includes('stack') || clean.includes('queue')) return 'stack';
  if (clean.includes('link')) return 'linked-list';
  if (clean.includes('array') || clean.includes('pointer')) return 'arrays';
  return clean || 'dynamic-programming';
}

function getFormattedTopicTitle(slug = '') {
  const key = normalizeTopicKey(slug);
  const titles = {
    'dynamic-programming': 'Dynamic Programming',
    'graphs': 'Graphs',
    'trees': 'Trees & Binary Search Trees',
    'binary-search': 'Binary Search',
    'arrays': 'Arrays & Two Pointers',
    'sliding-window': 'Sliding Window',
    'stack': 'Stack & Queue',
    'linked-list': 'Linked Lists'
  };
  return titles[key] || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PracticePage() {
  const { topic: rawTopic } = useParams();
  const normalizedKey = normalizeTopicKey(rawTopic);
  const topicTitle = getFormattedTopicTitle(rawTopic);

  // 1. Fetch live readiness context
  const { data: readinessData } = useQuery({
    queryKey: ['job-readiness'],
    queryFn: async () => (await api.get('/readiness')).data?.data
  });

  // 2. Fetch user's solved DSA problems to detect solved status
  const { data: userProblems = [] } = useQuery({
    queryKey: ['dsa-problems'],
    queryFn: async () => (await api.get('/dsa')).data?.data || []
  });

  const solvedSet = useMemo(() => {
    const set = new Set();
    userProblems.forEach((p) => {
      if (p.status === 'solved' && p.title) {
        set.add(p.title.trim().toLowerCase());
      }
    });
    return set;
  }, [userProblems]);

  const problemsList = TOPIC_PROBLEMS[normalizedKey] || TOPIC_PROBLEMS['dynamic-programming'];

  const dsaScore = readinessData?.readinessBreakdown?.dsaCompetency?.score ?? 33;
  const targetScore = 75;
  const gapPoints = Math.max(0, targetScore - dsaScore);

  return (
    <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-5xl mx-auto w-full animate-fadeIn bg-[#F8F6F0]">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#74766F] hover:text-[#20211E] transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Overview</span>
        </Link>
        <Link
          to="/dsa-tracker"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#315B45] hover:underline"
        >
          <span>Open DSA Log Tracker →</span>
        </Link>
      </div>

      {/* Header & Why Recommended Card */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FBF4E6] border border-[#F3E3C4] text-[#B9822E] text-[0.68rem] font-bold uppercase tracking-wider">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Target Preparation Priority</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#20211E] tracking-tight">
            Practice {topicTitle}
          </h1>
          <p className="text-xs text-[#5F625C] leading-relaxed max-w-3xl">
            <strong className="text-[#20211E]">{topicTitle}</strong> is currently identified as one of your biggest preparation gaps. Mastering these core interview patterns directly impacts your performance in algorithmic screening rounds.
          </p>
        </div>

        {/* Progress Metrics Grid */}
        <div className="pt-3 border-t border-[#E3DED3]">
          <h2 className="text-[0.68rem] font-bold uppercase tracking-wider text-[#74766F] mb-2.5">
            Your Progress & Benchmark
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-[#FFFDF8] border border-[#E3DED3] space-y-0.5">
              <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-[#74766F]">
                Current DSA Score
              </span>
              <p className="text-xl font-bold font-mono text-[#20211E]">
                {dsaScore}%
              </p>
              <p className="text-[0.68rem] text-[#74766F]">Based on verified telemetry</p>
            </div>

            <div className="p-3 rounded-lg bg-[#FFFDF8] border border-[#E3DED3] space-y-0.5">
              <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-[#74766F]">
                Target Benchmark
              </span>
              <p className="text-xl font-bold font-mono text-[#315B45]">
                {targetScore}%
              </p>
              <p className="text-[0.68rem] text-[#74766F]">Target SDE screening threshold</p>
            </div>

            <div className="p-3 rounded-lg bg-[#FFFDF8] border border-[#E3DED3] space-y-0.5">
              <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-[#74766F]">
                Preparation Gap
              </span>
              <p className="text-xl font-bold font-mono text-[#C9683A]">
                {gapPoints} pts
              </p>
              <p className="text-[0.68rem] text-[#74766F]">To reach target readiness</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Recommended Problems Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-[#E3DED3]">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[#315B45]" />
            <h2 className="text-sm sm:text-base font-bold text-[#20211E]">
              Recommended Problems ({problemsList.length})
            </h2>
          </div>
          <span className="text-xs text-[#74766F]">
            Ordered from foundational to core patterns
          </span>
        </div>

        <div className="space-y-2.5">
          {problemsList.map((prob, idx) => {
            const isSolved = solvedSet.has(prob.title.trim().toLowerCase());
            return (
              <Card
                key={prob.title}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#D7D0C4] transition"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-[#74766F]">
                      #{idx + 1}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-[#20211E]">
                      {prob.title}
                    </h3>
                    <Badge variant={prob.difficulty === 'Easy' ? 'green' : prob.difficulty === 'Hard' ? 'red' : 'orange'} size="sm">
                      {prob.difficulty}
                    </Badge>
                    <Badge variant="neutral" size="sm">
                      {prob.pattern}
                    </Badge>
                    {isSolved && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.68rem] font-bold bg-[#E8F0EA] text-[#315B45] border border-[#D1E0D7]">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Solved</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#5F625C] leading-relaxed">
                    <span className="font-semibold text-[#20211E]">Why: </span>
                    {prob.reason}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <a
                    href={prob.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      size="sm"
                      className="inline-flex items-center gap-1.5"
                    >
                      <span>{isSolved ? 'Re-solve on LeetCode' : 'Solve on LeetCode'}</span>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
