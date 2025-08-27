import React from 'react';
import { render, screen } from '@testing-library/react';
import MetricCard from './MetricCard';

test('renders MetricCard with title and value', () => {
  const Dummy = () => <svg />;
  render(
    <MetricCard
      title="Test"
      value={100}
      change={0}
      icon={Dummy}
      color="#000"
      isDark={false}
      currency="FCFA"
    />
  );
  expect(screen.getByText('Test')).toBeInTheDocument();
  expect(screen.getByText(/100/)).toBeInTheDocument();
});

test('displays margin percentage when provided', () => {
  const Dummy = () => <svg />;
  render(
    <MetricCard
      title="Marge brute"
      value={50}
      change={0}
      marginPct={25}
      icon={Dummy}
      color="#000"
      isDark={false}
      currency="FCFA"
    />
  );
  expect(
    screen.getByText((content) => content.includes('du CA') && content.includes('25'))
  ).toBeInTheDocument();
});
