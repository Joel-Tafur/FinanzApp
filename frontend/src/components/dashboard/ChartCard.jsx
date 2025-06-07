import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { cn } from '../../lib/utils';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  Filler
);

export function ChartCard({ 
  title, 
  data, 
  type = 'line', 
  className, 
  allowPeriodChange = true,
  height = 300
}) {
  const [period, setPeriod] = useState('month');
  
  // Opciones comunes para los gráficos
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 10,
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        cornerRadius: 4
      }
    }
  };
  
  // Opciones específicas para gráficos de línea
  const lineOptions = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: 'rgba(200, 200, 200, 0.15)'
        },
        ticks: {
          font: {
            size: 12
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 3,
        hoverRadius: 5
      }
    }
  };
  
  // Opciones específicas para gráficos de barras
  const barOptions = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: 'rgba(200, 200, 200, 0.15)'
        },
        ticks: {
          font: {
            size: 12
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      }
    }
  };
  
  // Opciones específicas para gráficos de dona
  const doughnutOptions = {
    ...commonOptions,
    cutout: '70%',
    plugins: {
      ...commonOptions.plugins,
      legend: {
        ...commonOptions.plugins.legend,
        position: 'bottom'
      }
    }
  };
  
  // Filtrar datos según el período seleccionado
  const filteredData = data && data[period] ? data[period] : data;
  
  // Renderizar el tipo de gráfico correcto
  const renderChart = () => {
    if (!filteredData) return <div className="flex items-center justify-center h-full">No hay datos disponibles</div>;
    
    switch (type) {
      case 'line':
        return <Line data={filteredData} options={lineOptions} height={height} />;
      case 'bar':
        return <Bar data={filteredData} options={barOptions} height={height} />;
      case 'doughnut':
        return <Doughnut data={filteredData} options={doughnutOptions} height={height} />;
      default:
        return <Line data={filteredData} options={lineOptions} height={height} />;
    }
  };
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        {allowPeriodChange && (
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semanal</SelectItem>
              <SelectItem value="month">Mensual</SelectItem>
              <SelectItem value="year">Anual</SelectItem>
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent className="pt-2">
        <div style={{ height }}>
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
}
