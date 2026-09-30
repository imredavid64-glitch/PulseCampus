import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

// Test component that uses useTheme
function TestThemeComponent() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('provides default theme as system', () => {
    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('theme')).toHaveTextContent('system');
  });

  it('allows changing theme', () => {
    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );
    
    fireEvent.click(screen.getByText('Dark'));
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    
    fireEvent.click(screen.getByText('Light'));
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    
    fireEvent.click(screen.getByText('System'));
    expect(screen.getByTestId('theme')).toHaveTextContent('system');
  });

  it('persists theme to localStorage', () => {
    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );
    
    fireEvent.click(screen.getByText('Dark'));
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('reads theme from localStorage on mount', () => {
    localStorage.setItem('theme', 'dark');
    
    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });
});