// src/components/dashboard/charts/Charts.jsx
import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area,
  RadialBarChart, RadialBar,
} from 'recharts';

// ============================================================
// PALETTE COULEURS
// ============================================================
export const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#06B6D4',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
  teal: '#14B8A6',
  orange: '#F97316',
  gray: '#6B7280',
};

export const COLORS_ARRAY = [
  COLORS.primary, COLORS.success, COLORS.warning, COLORS.error,
  COLORS.info, COLORS.purple, COLORS.pink, COLORS.indigo,
  COLORS.teal, COLORS.orange,
];

const formaterMontant = (m) => {
  if (!m) return '0';
  return new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(m));
};

// ============================================================
// TOOLTIP PERSONNALISÉ
// ============================================================
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-base-100 border border-base-300 rounded-lg shadow-lg p-3 text-xs">
      {label && <p className="font-bold mb-1">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: p.color || p.payload?.fill }}
          />
          <span className="text-base-content/70">{p.name} :</span>
          <span className="font-mono font-bold">
            {formatter ? formatter(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// 1. PIE CHART (camembert)
// ============================================================
export const PieChartCard = ({
  title,
  subtitle,
  data = [],
  dataKey = 'value',
  nameKey = 'name',
  formatter = null,
  height = 300,
  innerRadius = 0,
  outerRadius = 100,
}) => (
  <div className="card bg-base-100 shadow-sm border border-base-300">
    <div className="card-body p-4">
      <div className="mb-3">
        <h3 className="font-bold text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-base-content/50">{subtitle}</p>}
      </div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey={dataKey}
              nameKey={nameKey}
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS_ARRAY[index % COLORS_ARRAY.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip formatter={formatter} />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '11px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

// ============================================================
// 2. DONUT CHART (semi-circulaire - demi-cercle)
// ============================================================
export const SemiCircleCard = ({
  title,
  subtitle,
  data = [],
  dataKey = 'value',
  nameKey = 'name',
  formatter = null,
  height = 300,
}) => (
  <div className="card bg-base-100 shadow-sm border border-base-300">
    <div className="card-body p-4">
      <div className="mb-3">
        <h3 className="font-bold text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-base-content/50">{subtitle}</p>}
      </div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="90%"
              startAngle={180}
              endAngle={0}
              innerRadius={70}
              outerRadius={110}
              paddingAngle={1}
              dataKey={dataKey}
              nameKey={nameKey}
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS_ARRAY[index % COLORS_ARRAY.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip formatter={formatter} />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '11px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

// ============================================================
// 3. RADIAL BAR CHART (semi-circulaire en éventail)
// ============================================================
export const RadialBarCard = ({
  title,
  subtitle,
  data = [],
  dataKey = 'value',
  nameKey = 'name',
  height = 300,
}) => (
  <div className="card bg-base-100 shadow-sm border border-base-300">
    <div className="card-body p-4">
      <div className="mb-3">
        <h3 className="font-bold text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-base-content/50">{subtitle}</p>}
      </div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="30%"
            outerRadius="100%"
            barSize={10}
            data={data.map((d, i) => ({
              ...d,
              fill: COLORS_ARRAY[i % COLORS_ARRAY.length],
            }))}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar
              minAngle={15}
              label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }}
              background
              clockWise
              dataKey={dataKey}
            />
            <Legend
              iconSize={10}
              wrapperStyle={{ fontSize: '11px' }}
              layout="vertical"
              verticalAlign="middle"
              align="right"
            />
            <Tooltip content={<CustomTooltip />} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

// ============================================================
// 4. BAR CHART (vertical)
// ============================================================
export const BarChartCard = ({
  title,
  subtitle,
  data = [],
  dataKey = 'value',
  nameKey = 'name',
  formatter = null,
  color = COLORS.primary,
  height = 300,
}) => (
  <div className="card bg-base-100 shadow-sm border border-base-300">
    <div className="card-body p-4">
      <div className="mb-3">
        <h3 className="font-bold text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-base-content/50">{subtitle}</p>}
      </div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey={nameKey}
              tick={{ fontSize: 11 }}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={formatter} />
            <Tooltip content={<CustomTooltip formatter={formatter} />} />
            <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

// ============================================================
// 5. AREA CHART (évolution avec remplissage)
// ============================================================
export const AreaChartCard = ({
  title,
  subtitle,
  data = [],
  dataKey = 'value',
  nameKey = 'name',
  formatter = null,
  color = COLORS.success,
  height = 300,
}) => (
  <div className="card bg-base-100 shadow-sm border border-base-300">
    <div className="card-body p-4">
      <div className="mb-3">
        <h3 className="font-bold text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-base-content/50">{subtitle}</p>}
      </div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey={nameKey} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={formatter} />
            <Tooltip content={<CustomTooltip formatter={formatter} />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#gradient-${dataKey})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

// ============================================================
// 6. LINE CHART (multiple)
// ============================================================
export const LineChartCard = ({
  title,
  subtitle,
  data = [],
  lines = [], // [{ dataKey, color, name }]
  nameKey = 'name',
  formatter = null,
  height = 300,
}) => (
  <div className="card bg-base-100 shadow-sm border border-base-300">
    <div className="card-body p-4">
      <div className="mb-3">
        <h3 className="font-bold text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-base-content/50">{subtitle}</p>}
      </div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey={nameKey} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={formatter} />
            <Tooltip content={<CustomTooltip formatter={formatter} />} />
            <Legend wrapperStyle={{ fontSize: '11px' }} iconType="circle" />
            {lines.map((line, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color || COLORS_ARRAY[i]}
                strokeWidth={2}
                name={line.name}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

export { formaterMontant };