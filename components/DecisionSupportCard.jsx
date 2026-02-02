import { useMemo, useEffect, useRef } from "react";
import { analyzeEnvironmentalConditions } from "@/lib/dssEngine";
import { animate, stagger } from "animejs";

export default function DecisionSupportCard({ sensorData }) {
    const cardRef = useRef(null);
    const result = useMemo(() => {
        return analyzeEnvironmentalConditions(sensorData);
    }, [sensorData]);

    const hasAnimatedIn = useRef(false);

    useEffect(() => {
        if (result) {
            // Pulse animation on risk change - only re-trigger if riskColor changes
            animate(cardRef.current, {
                boxShadow: [
                    '0 0 0px rgba(0,0,0,0)',
                    `0 0 20px ${result.riskColor === 'red' ? 'rgba(239, 68, 68, 0.2)' : result.riskColor === 'orange' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
                    '0 0 0px rgba(0,0,0,0)'
                ],
                duration: 2000,
                easing: 'easeInOutQuad',
                loop: true
            });

            // Staggered entrance for recommendations - only run once per visit
            if (!hasAnimatedIn.current) {
                animate('.rec-item', {
                    opacity: [0, 1],
                    translateX: [-15, 0],
                    delay: stagger(120, { start: 200 }),
                    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                    duration: 900
                });
                hasAnimatedIn.current = true;
            }
        }
    }, [result.riskColor, result !== null]);

    if (!result) return null;

    const { riskLevel, riskColor, recommendations } = result;

    const colorStyles = {
        green: "from-green-500/10 to-green-600/5 border-green-500/20 text-green-400 bg-green-500/10",
        yellow: "from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 text-yellow-400 bg-yellow-500/10",
        orange: "from-orange-500/10 to-orange-600/5 border-orange-500/20 text-orange-400 bg-orange-500/10",
        red: "from-red-500/10 to-red-600/5 border-red-500/20 text-red-500 bg-red-500/10",
    };

    const badgeColor = {
        green: "bg-green-500/20 text-green-400 border-green-500/30",
        yellow: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
        orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
        red: "bg-red-500/20 text-red-400 border-red-500/30",
    };

    return (
        <div ref={cardRef} className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 transition-all duration-300 hover:shadow-xl ${colorStyles[riskColor]?.split(' ').slice(0, 3).join(' ') || colorStyles.green}`}>
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-white">Rekomendasi Tindakan</h3>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeColor[riskColor] || badgeColor.green}`}>
                            Risiko {riskLevel}
                        </span>
                    </div>

                    <p className="text-sm text-zinc-400">
                        Berdasarkan analisis kondisi lingkungan terkini (Suhu, Kelembapan, Tanah), sistem merekomendasikan:
                    </p>

                    <ul className="space-y-3">
                        {recommendations.map((rec, index) => (
                            <li key={index} className="rec-item opacity-0 flex flex-col gap-1">
                                <div className="flex items-start gap-3 text-sm text-zinc-200">
                                    <span className={`mt-1.5 flex h-2 w-2 shrink-0 rounded-full ${rec.priority === 'critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                        rec.priority === 'warning' ? 'bg-orange-500' : 'bg-green-500'
                                        }`} />
                                    <span>{typeof rec === 'string' ? rec : rec.message}</span>
                                </div>
                                {rec.action && (
                                    <div className="ml-5 text-xs font-medium text-blue-400">
                                        💡 Saran: {rec.action}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex shrink-0 items-center justify-center rounded-2xl bg-zinc-950/50 p-8 md:w-48">
                    <div className="text-center">
                        <div className={`text-4xl transition-transform duration-500 group-hover:scale-110 ${riskColor === 'green' ? 'text-green-500' :
                            riskColor === 'yellow' ? 'text-yellow-500' :
                                riskColor === 'orange' ? 'text-orange-500' : 'text-red-500'
                            }`}>
                            {riskColor === 'green' ? '✅' : riskColor === 'yellow' ? '🌤️' : riskColor === 'orange' ? '⚠️' : '🚨'}
                        </div>
                        <p className="mt-2 text-xs font-medium text-zinc-500 uppercase tracking-widest">System Status</p>
                    </div>
                </div>
            </div>

            {/* Background Accent Animation */}
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full blur-3xl opacity-20 transition-opacity duration-500 group-hover:opacity-40 
        ${riskColor === 'red' ? 'bg-red-500' : riskColor === 'orange' ? 'bg-orange-500' : riskColor === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'}`} />
        </div>
    );
}
