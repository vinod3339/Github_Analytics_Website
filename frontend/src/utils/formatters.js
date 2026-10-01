export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Never';
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now - d;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return dateString;
  }
};

export const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return Number(num).toLocaleString('en-US');
};

export const getRankBadge = (rank) => {
  if (rank === 1) return { label: '🥇 Rank 1', className: 'rank-badge rank-gold', medal: '🥇' };
  if (rank === 2) return { label: '🥈 Rank 2', className: 'rank-badge rank-silver', medal: '🥈' };
  if (rank === 3) return { label: '🥉 Rank 3', className: 'rank-badge rank-bronze', medal: '🥉' };
  return { label: `Rank ${rank}`, className: 'badge bg-secondary', medal: `#${rank}` };
};

export const getLanguageBadgeColor = (lang) => {
  const colors = {
    Python: 'bg-primary',
    JavaScript: 'bg-warning text-dark',
    TypeScript: 'bg-info text-dark',
    Go: 'bg-cyan text-white',
    Rust: 'bg-danger',
    'C++': 'bg-purple text-white',
    Java: 'bg-danger',
    HTML: 'bg-warning',
    CSS: 'bg-primary'
  };
  return colors[lang] || 'bg-secondary';
};
