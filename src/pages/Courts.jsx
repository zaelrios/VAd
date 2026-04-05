import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Sun, Lightbulb, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const SURFACE_LABELS = {
  arcilla: "Arcilla",
  cesped: "Césped",
  dura: "Dura",
  sintetica: "Sintética",
};

const SURFACE_COLORS = {
  arcilla: "bg-orange-100 text-orange-700",
  cesped: "bg-green-100 text-green-700",
  dura: "bg-blue-100 text-blue-700",
  sintetica: "bg-purple-100 text-purple-700",
};

const COURT_IMAGES = [
  "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80",
  "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=600&q=80",
  "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&q=80",
  "https://images.unsplash.com/photo-1530915534664-4ac6423816b7?w=600&q=80",
];

export default function Courts() {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourts = async () => {
      const data = await base44.entities.Court.list();
      setCourts(data);
      setLoading(false);
    };
    loadCourts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-28 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Canchas Disponibles</h1>
          <p className="text-muted-foreground">Explora las canchas donde puedes jugar</p>
        </div>

        {courts.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No hay canchas registradas</h3>
            <p className="text-muted-foreground">Las canchas serán agregadas próximamente</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courts.map((court, i) => (
              <motion.div
                key={court.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="aspect-video relative overflow-hidden bg-muted">
                    <img
                      src={court.image_url || COURT_IMAGES[i % COURT_IMAGES.length]}
                      alt={court.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className={court.is_available ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
                        {court.is_available ? "Disponible" : "No disponible"}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg text-foreground mb-2">{court.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4" />
                      {court.location}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={SURFACE_COLORS[court.surface]}>
                        {SURFACE_LABELS[court.surface]}
                      </Badge>
                      {court.is_indoor && (
                        <Badge variant="outline" className="gap-1">
                          <Sun className="w-3 h-3" /> Techada
                        </Badge>
                      )}
                      {court.has_lights && (
                        <Badge variant="outline" className="gap-1">
                          <Lightbulb className="w-3 h-3" /> Iluminada
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}