const CountBadge = ({ count, label, className = "" }) => {
  if (!count) return null;
  return (
    <span className={`badge badge-primary badge-sm ${className}`} aria-label={`${count} ${label}`}>
      {count > 99 ? "99+" : count}
    </span>
  );
};

export default CountBadge;
