import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the Chart component with a named export
jest.mock('./components/chart.tsx', () => ({
  Chart: () => <div>Mock Chart</div>
}));

test('renders learn react link', async () => {
  render(<App />);
  const linkElement = screen.getByText(/Check out the project on /i);
  expect(linkElement).toBeInTheDocument();
});
