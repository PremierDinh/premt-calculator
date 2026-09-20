/* @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LCDScreen } from '../display/LCDScreen';
import { useCalculatorStore } from '../../store/calculatorStore';

describe('LCDScreen', () => {
  it('renders QR image when overlay is active', () => {
    useCalculatorStore.setState({
      power: 'on',
      display: {
        lines: [{ text: 'QR', size: 'small' }],
        overlay: 'qr',
        qrImageDataUrl: 'data:image/png;base64,abc',
      },
    });
    render(<LCDScreen />);
    expect(screen.getByAltText('QR code')).toBeInTheDocument();
  });
});
