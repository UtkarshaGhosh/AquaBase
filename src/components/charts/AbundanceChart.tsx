import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
interface DataPoint {
    label: string;
    value: number;
}
const AbundanceChart: React.FC<{
    data: DataPoint[];
}> = ({ data }) => {
    return (<ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.05}/>
        <XAxis dataKey="label" angle={-30} textAnchor="end" interval={0} height={60} tick={{ fontSize: 12 }}/>
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#0ea5e9"/>
      </BarChart>
    </ResponsiveContainer>);
};
export default AbundanceChart;
