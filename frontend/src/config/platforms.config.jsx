export const PLATFORMS_CONFIG = [
  {
    id: 'leetcode',
    name: 'LeetCode',
    tagline: 'Problems solved, contests, ranking & more',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    accentColor: '#f59e0b',
    detailRoute: '/coding-profiles/leetcode',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .666-1.607L9.4 7.998l4.546-4.838a1.376 1.376 0 0 0-.463-2.16zM15.42 6.552a1.376 1.376 0 0 0-1.376 1.376v5.82a1.376 1.376 0 1 0 2.752 0v-5.82a1.376 1.376 0 0 0-1.376-1.376z" />
      </svg>
    )
  },
  {
    id: 'github',
    name: 'GitHub',
    tagline: 'Public repositories, contributions & more',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    accentColor: '#a855f7',
    detailRoute: '/coding-profiles/github',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    )
  },
  {
    id: 'hackerrank',
    name: 'HackerRank',
    tagline: 'Problem solving, contests, badges & more',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    accentColor: '#10b981',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 0c1.867 0 3.376 1.51 3.376 3.376v6.335h5.248C22.49 9.711 24 11.22 24 13.087v7.537c0 1.867-1.51 3.376-3.376 3.376H3.376C1.51 24 0 22.49 0 20.624v-7.537c0-1.867 1.51-3.376 3.376-3.376h5.248V3.376C8.624 1.51 10.133 0 12 0zm-1.875 3.376v17.248h3.75V3.376h-3.75z" />
      </svg>
    )
  },
  {
    id: 'codeforces',
    name: 'Codeforces',
    tagline: 'Rating, contests, submissions & more',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    accentColor: '#3b82f6',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M4.5 7.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-3 0V9a1.5 1.5 0 0 1 1.5-1.5zm7.5-4.5a1.5 1.5 0 0 1 1.5 1.5v16.5a1.5 1.5 0 0 1-3 0V4.5A1.5 1.5 0 0 1 12 3zm7.5 9a1.5 1.5 0 0 1 1.5 1.5v7.5a1.5 1.5 0 0 1-3 0v-7.5a1.5 1.5 0 0 1 1.5-1.5z" />
      </svg>
    )
  },
  {
    id: 'atcoder',
    name: 'AtCoder',
    tagline: 'Contests, rating, rankings & more',
    badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30',
    accentColor: '#64748b',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2L2 22h20L12 2zm0 5.2L18.4 20H5.6L12 7.2z" />
      </svg>
    )
  },
  {
    id: 'codechef',
    name: 'CodeChef',
    tagline: 'Contests, problems, ratings & more',
    badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
    accentColor: '#f97316',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2a6 6 0 0 0-6 6c0 1.95.93 3.68 2.37 4.78C5.55 14.1 3.5 17.3 3.5 21a1 1 0 0 0 2 0c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5a1 1 0 0 0 2 0c0-3.7-2.05-6.9-4.87-8.22A5.99 5.99 0 0 0 18 8a6 6 0 0 0-6-6zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" />
      </svg>
    )
  }
];
