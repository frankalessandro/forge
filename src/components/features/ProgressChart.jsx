import { ResponsiveContainer, LineChart, XAxis, YAxis, Tooltip, Line } from 'recharts'

// Gráfica de línea del design system. Vive en su propio módulo para poder
// cargarse con lazy(): recharts (~100KB) solo se descarga cuando hay datos
// que graficar, no en el chunk inicial de Profile/ExerciseDetail.
export default function ProgressChart({
  data,
  dataKey,
  height = 200,
  yWidth = 36,
  dot = false,
  tooltipFormatter,
  margin,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={margin}>
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} stroke="#2a2a31" />
        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#71717a' }} width={yWidth} stroke="#2a2a31" />
        <Tooltip
          contentStyle={{ background: '#17171b', border: '1px solid #2a2a31', borderRadius: 12, color: '#fafafa' }}
          labelStyle={{ color: '#a1a1aa' }}
          formatter={tooltipFormatter}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke="#a3e635"
          dot={dot ? { r: 2, fill: '#a3e635' } : false}
          strokeWidth={2.5}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
