import { motion } from "framer-motion";

interface WorldMapSectionProps {
  language: "es" | "en";
}

export default function WorldMapSection({ language }: WorldMapSectionProps) {
  const content = {
    en: {
      label: "GERMAN",
    },
    es: {
      label: "ALEMÁN",
    },
  };

  const t = content[language];

  const germanyPosition = { x: 520, y: 145 };
  const labelPosition = { x: 620, y: 80 };

  return (
    <section
      id="german-desk"
      className="py-20 lg:py-28 bg-white dark:bg-gray-900"
      data-testid="section-world-map"
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <svg
            viewBox="0 0 900 450"
            className="w-full h-auto"
            data-testid="svg-world-map"
          >
            <g fill="#9CA3AF" fillOpacity="0.6">
              <path d="M165,85 L175,75 L190,78 L205,72 L215,75 L225,68 L235,72 L240,82 L235,95 L225,98 L220,108 L230,115 L235,130 L225,145 L210,152 L195,155 L180,165 L165,175 L150,185 L135,178 L125,168 L115,155 L105,145 L100,132 L105,118 L115,105 L130,95 L145,88 L155,85 Z" />
              <path d="M175,185 L185,178 L200,175 L215,180 L230,195 L245,215 L255,235 L250,255 L240,275 L225,295 L205,310 L185,318 L165,315 L150,305 L140,290 L135,272 L140,255 L150,238 L160,222 L165,205 L170,192 Z" />
              <path d="M240,320 L255,310 L275,305 L290,315 L305,330 L315,350 L310,370 L295,385 L275,392 L255,388 L240,375 L235,355 L238,338 Z" />
              
              <path d="M425,65 L445,58 L468,55 L490,60 L510,55 L528,62 L545,58 L562,65 L575,72 L590,68 L605,75 L618,72 L630,78 L640,85 L650,92 L660,88 L672,95 L680,105 L685,118 L678,132 L665,140 L648,145 L632,148 L615,145 L598,150 L580,155 L562,152 L545,148 L528,155 L510,162 L492,158 L475,152 L458,158 L440,165 L422,162 L405,155 L390,148 L378,138 L370,125 L375,110 L385,98 L400,88 L415,78 Z" />
              <path d="M450,172 L470,165 L490,168 L510,175 L525,185 L535,198 L540,215 L535,232 L525,248 L510,262 L490,272 L468,278 L445,275 L425,268 L410,255 L400,238 L398,218 L405,198 L420,182 Z" />
              <path d="M548,172 L568,165 L590,168 L612,175 L632,185 L648,198 L660,215 L665,235 L658,255 L645,272 L625,285 L602,295 L578,298 L555,292 L535,282 L520,268 L512,248 L515,228 L525,208 L538,188 Z" />
              <path d="M660,145 L680,138 L702,142 L722,155 L738,172 L750,192 L758,215 L752,238 L740,258 L722,275 L700,288 L675,295 L650,290 L628,278 L612,262 L605,242 L610,220 L622,198 L640,178 L655,158 Z" />
              
              <path d="M720,150 L745,142 L772,138 L798,145 L820,155 L838,172 L852,192 L860,215 L855,240 L842,265 L822,285 L798,302 L770,312 L742,308 L718,295 L700,275 L692,252 L695,228 L708,205 L725,182 L738,162 Z" />
              <path d="M765,315 L790,308 L818,312 L842,325 L860,345 L870,368 L865,392 L850,412 L825,425 L798,432 L770,428 L745,415 L728,395 L722,372 L730,348 L748,328 Z" />
              <path d="M820,175 L848,168 L875,172 L898,185 L895,195 L880,195 L865,188 L848,192 L835,185 Z" />
              
              <path d="M745,338 L758,355 L752,375 L735,388 L715,392 L698,382 L692,362 L702,345 L720,335 L738,332 Z" />
              <path d="M762,368 L780,358 L800,362 L815,378 L818,398 L808,415 L788,422 L768,418 L755,402 L752,382 Z" />
            </g>

            <motion.line
              x1={germanyPosition.x}
              y1={germanyPosition.y}
              x2={labelPosition.x}
              y2={labelPosition.y}
              stroke="#AC162C"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              data-testid="line-germany-connector"
            />

            <motion.circle
              cx={germanyPosition.x}
              cy={germanyPosition.y}
              r="6"
              fill="#AC162C"
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              data-testid="marker-germany"
            />

            <motion.g
              initial={{ opacity: 0, x: 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <text
                x={labelPosition.x + 8}
                y={labelPosition.y + 5}
                fill="#AC162C"
                fontSize="16"
                fontWeight="600"
                fontFamily="'Optima', 'Segoe UI', sans-serif"
                letterSpacing="0.1em"
                data-testid="text-germany-label"
              >
                {t.label}
              </text>
            </motion.g>
          </svg>
        </motion.div>
      </div>
    </section>
  );
}
