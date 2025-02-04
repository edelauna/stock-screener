import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the Chart component with a named export
jest.mock('./components/chart.tsx', () => ({
  Chart: () => <div>Mock Chart</div>
}));

test('renders about project link', async () => {
  render(<App />);
  const linkElement = screen.getByText(/or ask questions on /i);
  expect(linkElement).toBeInTheDocument();
});
