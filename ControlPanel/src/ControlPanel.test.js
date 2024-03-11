import { render, screen } from '@testing-library/react';
import ControlPanel from './ControlPanel';

test('renders learn react link', () => {
  render(<ControlPanel />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
