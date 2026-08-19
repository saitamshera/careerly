import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Code2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Layers,
  Flame,
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
      reason: 'Basic divide-and-conquer tree height calculation.'
    },
    {
      title: 'Binary Tree Level Order Traversal',
      difficulty: 'Medium',
      pattern: 'Queue BFS',
      url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/',
      reason: 'Core breadth-first traversal by level.'
    },
    {
      title: 'Lowest Common Ancestor of a Binary Tree',
      difficulty: 'Medium',
      pattern: 'Recursive Post-Order',
      url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/',
      reason: 'Classic tree branch division and node bubbling.'
    }
  ],
  'binary-search': [
    {
      title: 'Binary Search',
      difficulty: 'Easy',
      pattern: 'Basic Range Halving',
      url: 'https://leetcode.com/problems/binary-search/',
      reason: 'Foundational search on sorted arrays.'
    },
    {
      title: 'Search in Rotated Sorted Array',
      difficulty: 'Medium',
      pattern: 'Rotated Boundary Check',
      url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/',
      reason: 'Determining sorted halves under rotation.'
    },
    {
      title: 'Find Minimum in Rotated Sorted Array',
      difficulty: 'Medium',
      pattern: 'Pivot Detection',
      url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/',
      reason: 'Edge condition convergence without target values.'
    }
  ],
  'arrays': [
    {
      title: 'Two Sum',
      difficulty: 'Easy',
      pattern: 'Hash Map Complement',
      url: 'https://leetcode.com/problems/two-sum/',
      reason: 'Classic complement lookup in linear time.'
    },
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

  const difficultyStyles = {
    Easy: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40',
    Medium: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40',
    Hard: 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40'
  };

  return (
    <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-5xl mx-auto w-full animate-fadeIn">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Overview</span>
        </Link>
        <Link
          to="/dsa-tracker"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <span>Open DSA Log Tracker →</span>
        </Link>
      </div>

      {/* Header & Why Recommended Card */}
      <Card className="p-6 sm:p-8 space-y-6 border-amber-200/70 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 dark:from-amber-950/20 dark:via-slate-900 dark:to-amber-950/10 dark:border-amber-900/40 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Target Preparation Priority</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Practice {topicTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            <strong className="text-slate-900 dark:text-slate-100">{topicTitle}</strong> is currently identified as one of your biggest preparation gaps. Mastering these core interview patterns directly impacts your performance in algorithmic screening rounds.
          </p>
        </div>

        {/* Progress Metrics Grid */}
        <div className="pt-4 border-t border-amber-200/50 dark:border-amber-900/40">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Your Progress & Benchmark
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
              <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">
                Current DSA Score
              </span>
              <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                {dsaScore}%
              </p>
              <p className="text-[0.7rem] text-slate-500">Based on verified practice telemetry</p>
            </div>

            <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
              <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">
                Target Benchmark
              </span>
              <p className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                {targetScore}%
              </p>
              <p className="text-[0.7rem] text-slate-500">Target SDE screening threshold</p>
            </div>

            <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
              <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">
                Preparation Gap
              </span>
              <p className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                {gapPoints} pts
              </p>
              <p className="text-[0.7rem] text-slate-500">To reach target interview readiness</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Recommended Problems Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Recommended Problems ({problemsList.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Ordered from foundational to core interview patterns
          </span>
        </div>

        <div className="space-y-3.5">
          {problemsList.map((prob, idx) => {
            const isSolved = solvedSet.has(prob.title.trim().toLowerCase());
            return (
              <Card
                key={prob.title}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      #{idx + 1}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {prob.title}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[0.68rem] font-bold border ${difficultyStyles[prob.difficulty] || difficultyStyles.Medium}`}
                    >
                      {prob.difficulty}
                    </span>
                    <Badge variant="blue" size="sm">
                      {prob.pattern}
                    </Badge>
                    {isSolved && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.68rem] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Solved</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Why: </span>
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
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center gap-1.5"
                    >
                      <span>{isSolved ? 'Re-solve on LeetCode' : 'Solve on LeetCode'}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
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
