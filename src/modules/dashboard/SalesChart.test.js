import SalesChart, { groupSalesByPeriod, formatCFA } from './SalesChart';

describe('groupSalesByPeriod', () => {
  const now = new Date('2024-05-15T12:00:00Z');
  const salesHistory = [
    {
      date: '2024-05-15T10:00:00Z',
      total: 100,
      items: [
        { quantity: 2, price: 30, costPrice: 20 }, // margin 20
        { quantity: 1, price: 40, costPrice: 25 }  // margin 15
      ],
    },
    {
      date: '2024-05-15T11:00:00Z',
      total: 50,
      items: [
        { quantity: 1, price: 50, costPrice: 30 }, // margin 20
      ],
    },
    {
      date: '2024-05-14T09:00:00Z',
      total: 75,
      items: [
        { quantity: 3, price: 25, costPrice: 15 }, // margin 30
      ],
    },
    {
      date: '2024-05-01T12:00:00Z',
      total: 120,
      items: [
        { quantity: 4, price: 30, costPrice: 18 }, // margin 48
      ],
    },
    {
      date: '2024-05-08T12:00:00Z',
      total: 80,
      items: [
        { quantity: 2, price: 50, costPrice: 35 }, // margin 30
      ],
    },
    {
      date: '2024-03-05T12:00:00Z',
      total: 200,
      items: [
        { quantity: 5, price: 60, costPrice: 40 }, // margin 100
      ],
    },
  ];

  test('groups by hour for today', () => {
    const chartData = groupSalesByPeriod(salesHistory, 'today', now);
    expect(chartData.length).toBe(24);
    const ten = chartData.find(d => d.label === '10h');
    const eleven = chartData.find(d => d.label === '11h');
    expect(ten).toEqual({ label: '10h', revenue: 100, margin: 35 });
    expect(eleven).toEqual({ label: '11h', revenue: 50, margin: 20 });
  });

  test('groups by day for week', () => {
    const chartData = groupSalesByPeriod(salesHistory, 'week', now);
    expect(chartData.length).toBe(7);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const yesterday = new Date('2024-05-14T00:00:00Z');
    const label = `${dayNames[yesterday.getUTCDay()]} ${yesterday.getUTCDate()}`;
    const entry = chartData.find(d => d.label === label);
    expect(entry).toEqual({ label, revenue: 75, margin: 30 });
  });

  test('groups by week for month', () => {
    const chartData = groupSalesByPeriod(salesHistory, 'month', now);
    const labels = chartData.map(d => d.label);
    expect(labels.includes('W1')).toBe(true);
    expect(labels.includes('W3')).toBe(true);
    const w1 = chartData.find(d => d.label === 'W1');
    const w3 = chartData.find(d => d.label === 'W3');
    expect(w1).toEqual({ label: 'W1', revenue: 120, margin: 48 });
    expect(w3).toEqual({ label: 'W3', revenue: 150, margin: 55 });
  });

  test('groups by month for year', () => {
    const chartData = groupSalesByPeriod(salesHistory, 'year', now);
    expect(chartData.length).toBe(12);
    const mar = chartData.find(d => d.label === 'Mar');
    const may = chartData.find(d => d.label === 'May');
    expect(mar).toEqual({ label: 'Mar', revenue: 200, margin: 100 });
    expect(may).toEqual({ label: 'May', revenue: 425, margin: 163 });
  });

  test('renders two Bars for SalesChart component', () => {
    const element = SalesChart({ salesHistory, selectedPeriod: 'today' });
    const collectBars = (node, acc = []) => {
      if (!node) return acc;
      if (Array.isArray(node)) {
        node.forEach(child => collectBars(child, acc));
      } else if (node.type && node.type.name === 'Bar') {
        acc.push(node);
      } else if (node.props && node.props.children) {
        collectBars(node.props.children, acc);
      }
      return acc;
    };
    const bars = collectBars(element);
    expect(bars).toHaveLength(2);
    bars.forEach(bar => {
      expect(bar.props.stackId).toBe('a');
    });
  });
});

describe('formatting', () => {
  test('formatCFA returns full value without abbreviation', () => {
    expect(formatCFA(123456)).toBe('123 456 CFA');
    expect(formatCFA(123456).toLowerCase()).not.toContain('k');
  });

  test('SalesChart components use formatCFA', () => {
    const element = SalesChart({ salesHistory: [], selectedPeriod: 'today' });
    const findComponent = (node, typeName) => {
      if (!node) return null;
      if (Array.isArray(node)) {
        for (const child of node) {
          const found = findComponent(child, typeName);
          if (found) return found;
        }
        return null;
      }
      if (node.type && node.type.name === typeName) return node;
      if (node.props && node.props.children) return findComponent(node.props.children, typeName);
      return null;
    };

    const yAxis = findComponent(element, 'YAxis');
    const tooltip = findComponent(element, 'Tooltip');
    const labelList = findComponent(element, 'LabelList');

    const yTick = yAxis.props.tickFormatter(123456);
    const tip = tooltip.props.formatter(123456);
    const labelElement = labelList.props.content({ value: 123456 });

    expect(yTick).toBe('123 456 CFA');
    expect(tip).toBe('123 456 CFA');
    expect(labelElement.props.children).toBe('123 456 CFA');

    expect(yTick.toLowerCase()).not.toContain('k');
    expect(tip.toLowerCase()).not.toContain('k');
    expect(labelElement.props.children.toLowerCase()).not.toContain('k');
  });
});

