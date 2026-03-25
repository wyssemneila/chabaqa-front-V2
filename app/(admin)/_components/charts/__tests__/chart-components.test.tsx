import React from 'react'
import { render, screen } from '@testing-library/react'
import { LineChart } from '../line-chart'
import { BarChart } from '../bar-chart'
import { PieChart } from '../pie-chart'
import { ChartCard } from '../../chart-card'

// Mock Recharts components to avoid rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />
}))

describe('Chart Components', () => {
  describe('ChartCard', () => {
    it('should render title and description', () => {
      render(
        <ChartCard title="Test Chart" description="Test description">
          <div>Chart content</div>
        </ChartCard>
      )
      
      expect(screen.getByText('Test Chart')).toBeInTheDocument()
      expect(screen.getByText('Test description')).toBeInTheDocument()
      expect(screen.getByText('Chart content')).toBeInTheDocument()
    })

    it('should show loading skeleton when loading', () => {
      render(
        <ChartCard title="Test Chart" loading={true}>
          <div>Chart content</div>
        </ChartCard>
      )
      
      expect(screen.queryByText('Chart content')).not.toBeInTheDocument()
    })

    it('should render actions when provided', () => {
      render(
        <ChartCard
          title="Test Chart"
          actions={<button>Export</button>}
        >
          <div>Chart content</div>
        </ChartCard>
      )
      
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
  })

  describe('LineChart', () => {
    const mockData = [
      { month: 'Jan', revenue: 1000 },
      { month: 'Feb', revenue: 1500 },
      { month: 'Mar', revenue: 1200 }
    ]

    it('should render with data', () => {
      render(
        <LineChart
          data={mockData}
          xKey="month"
          yKeys={[{ key: 'revenue', color: '#8884d8' }]}
        />
      )
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('should show empty state when no data', () => {
      render(
        <LineChart
          data={[]}
          xKey="month"
          yKeys={[{ key: 'revenue', color: '#8884d8' }]}
        />
      )
      
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('BarChart', () => {
    const mockData = [
      { category: 'A', value: 100 },
      { category: 'B', value: 200 },
      { category: 'C', value: 150 }
    ]

    it('should render with data', () => {
      render(
        <BarChart
          data={mockData}
          xKey="category"
          yKeys={[{ key: 'value', color: '#82ca9d' }]}
        />
      )
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })

    it('should show empty state when no data', () => {
      render(
        <BarChart
          data={[]}
          xKey="category"
          yKeys={[{ key: 'value', color: '#82ca9d' }]}
        />
      )
      
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('PieChart', () => {
    const mockData = [
      { name: 'Category A', value: 400 },
      { name: 'Category B', value: 300 },
      { name: 'Category C', value: 200 }
    ]

    it('should render with data', () => {
      render(
        <PieChart
          data={mockData}
          nameKey="name"
          valueKey="value"
        />
      )
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    })

    it('should show empty state when no data', () => {
      render(
        <PieChart
          data={[]}
          nameKey="name"
          valueKey="value"
        />
      )
      
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })
})
