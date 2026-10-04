import { createElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClockIcon, FlameIcon, VideoIcon } from "lucide-react";
import { getPracticeStats } from "../lib/api";
import Avatar from "../components/Avatar";

const Stat = ({ icon, label, value }) => (
  <div className="stat bg-base-200 rounded-box">
    <div className="stat-figure text-primary">
      {createElement(icon, { className: "size-8", "aria-hidden": true })}
    </div>
    <div className="stat-title">{label}</div>
    <div className="stat-value">{value}</div>
  </div>
);

const formatMinutes = (min) => (min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`);

const ProgressPage = () => {
  const { data, isLoading } = useQuery({ queryKey: ["practiceStats"], queryFn: getPracticeStats });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  const maxMinutes = Math.max(1, ...data.last7Days.map((d) => d.minutes));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Your progress</h1>
          <p className="opacity-70">Time spent practising in video calls.</p>
        </div>

        <div className="stats stats-vertical sm:stats-horizontal w-full gap-4 bg-transparent">
          <Stat icon={ClockIcon} label="Total practice" value={formatMinutes(data.totalMinutes)} />
          <Stat icon={VideoIcon} label="Sessions" value={data.totalSessions} />
          <Stat icon={FlameIcon} label="Day streak" value={data.streakDays} />
        </div>

        <section className="card bg-base-200 p-6" aria-labelledby="week-title">
          <h2 id="week-title" className="font-semibold mb-4">
            Last 7 days (minutes)
          </h2>
          <ul className="flex items-end gap-2 h-40">
            {data.last7Days.map((day) => (
              <li key={day.date} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <span className="text-xs">{day.minutes}</span>
                <div
                  className="w-full rounded-t bg-primary"
                  style={{ height: `${(day.minutes / maxMinutes) * 100}%`, minHeight: day.minutes ? 4 : 2 }}
                  role="img"
                  aria-label={`${day.minutes} minutes on ${day.date}`}
                />
                <span className="text-xs opacity-60">{day.date.slice(5)}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="card bg-base-200 p-6" aria-labelledby="partners-title">
            <h2 id="partners-title" className="font-semibold mb-3">
              Top partners
            </h2>
            {data.topPartners.length === 0 ? (
              <p className="opacity-70 text-sm">Start a video call with a friend to see stats here.</p>
            ) : (
              <ul className="space-y-3">
                {data.topPartners.map(({ partner, sessions, totalSec }) => (
                  <li key={partner._id} className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="size-9 rounded-full">
                        <Avatar src={partner.profilePic} name={partner.fullName} />
                      </div>
                    </div>
                    <span className="flex-1">{partner.fullName}</span>
                    <span className="text-sm opacity-70">
                      {sessions} calls · {formatMinutes(Math.round(totalSec / 60))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card bg-base-200 p-6" aria-labelledby="recent-title">
            <h2 id="recent-title" className="font-semibold mb-3">
              Recent sessions
            </h2>
            {data.recent.length === 0 ? (
              <p className="opacity-70 text-sm">No sessions yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.recent.map((s) => (
                  <li key={s._id} className="flex justify-between">
                    <span>{s.partner?.fullName ?? "Former friend"}</span>
                    <span className="opacity-70">
                      {new Date(s.endedAt).toLocaleDateString()} · {formatMinutes(Math.round(s.durationSec / 60))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
