import { groupSalesByPeriod } from './SalesChart';

describe('groupSalesByPeriod', () => {
  const now = new Date('2024-05-15T12:00:00Z');
  const salesHistory = [
    { date: '2024-05-15T10:00:00Z', total: 100 },
    { date: '2024-05-15T11:00:00Z', total: 50 },
    { date: '2024-05-14T09:00:00Z', total: 75 },
    { date: '2024-05-01T12:00:00Z', total: 120 },
    { date: '2024-05-08T12:00:00Z', total: 80 },
    { date: '2024-03-05T12:00:00Z', total: 200 }
  ];

  test('groups by hour for today', () => {
    const { labels, data } = groupSalesByPeriod(salesHistory, 'today', now);
    expect(labels.length).toBe(24);
    const idx10 = labels.indexOf('10h');
    const idx11 = labels.indexOf('11h');
    expect(data[idx10]).toBe(100);
    expect(data[idx11]).toBe(50);
  });

  test('groups by day for week', () => {
    const { labels, data } = groupSalesByPeriod(salesHistory, 'week', now);
    expect(labels.length).toBe(7);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const yesterday = new Date('2024-05-14T00:00:00Z');
    const label = `${dayNames[yesterday.getUTCDay()]} ${yesterday.getUTCDate()}`;
    const idx = labels.indexOf(label);
    expect(data[idx]).toBe(75);
  });

  test('groups by week for month', () => {
    const { labels, data } = groupSalesByPeriod(salesHistory, 'month', now);
    expect(labels.includes('W1')).toBe(true);
    expect(labels.includes('W3')).toBe(true);
    const idxW1 = labels.indexOf('W1');
    const idxW3 = labels.indexOf('W3');
    expect(data[idxW1]).toBe(120);
    expect(data[idxW3]).toBe(225);
  });

  test('groups by month for year', () => {
    const { labels, data } = groupSalesByPeriod(salesHistory, 'year', now);
    expect(labels.length).toBe(12);
    const idxMar = labels.indexOf('Mar');
    const idxMay = labels.indexOf('May');
    expect(data[idxMar]).toBe(200);
    expect(data[idxMay]).toBe(425);
  });
});

