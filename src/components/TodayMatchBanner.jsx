import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

export default function TodayMatchBanner() {
  const [matchInfo, setMatchInfo] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (auth) => {
      if (!auth) return;
      const u = await base44.auth.me();
      const today = new Date().toISOString().split("T")[0];
      const allMatches = await base44.entities.Match.list("-created_date", 50);
      const mine = allMatches.find(
        (m) => (m.player1_email === u.email || m.player2_email === u.email)
          && m.status === "programado"
          && m.date === today
      );
      if (mine) {
        const players = await base44.entities.Player.filter({ user_email: u.email });
        const firstName = players[0]?.full_name?.split(" ")[0] || u.full_name?.split(" ")[0] || "";
        setMatchInfo({ firstName, time: mine.time?.split(" ")[0] || mine.time, id: mine.id });
      }
    }).catch(() => {});
  }, []);

  if (!matchInfo) return null;

  return (
    <div className="bg-indigo-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">
            ¡Hoy es día de gloria, {matchInfo.firstName}! Te esperamos en la cancha a las {matchInfo.time}.
          </span>
        </div>
        <Link to="/my-matches">
          <button className="bg-white text-indigo-600 text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-indigo-50 transition-colors whitespace-nowrap">
            Detalles del Partido
          </button>
        </Link>
      </div>
    </div>
  );
}