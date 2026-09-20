import type { DisplayState, KeyContext, KeyId, MathBoxState, ModeResult } from '../../types';
import { gcd, lcm } from '../../../math/fraction';

export function createMathBoxState(): MathBoxState {
  return { screen: 'menu', tool: 'dice', inputBuffer: '', resultText: '' };
}

export function getMathBoxDisplay(state: MathBoxState): DisplayState {
  if (state.screen === 'menu') {
    return {
      lines: [
        { text: 'Math Box', size: 'small' },
        { text: `▶ ${state.tool}` },
        { text: '1:Dice 2:Coin 3:Rand 4:GCD 5:LCM', size: 'small' },
      ],
    };
  }
  if (state.screen === 'run') {
    return { lines: [{ text: state.tool, size: 'small' }, { text: state.inputBuffer || 'EXE', align: 'right' }] };
  }
  return { lines: [{ text: state.tool, size: 'small' }, { text: state.resultText, align: 'right', size: 'large' }] };
}

const TOOLS: MathBoxState['tool'][] = ['dice', 'coin', 'rand', 'gcd', 'lcm'];

export function handleMathBoxKey(
  state: MathBoxState,
  key: KeyId,
  _ctx: KeyContext,
): { state: MathBoxState; result: ModeResult } {
  const nums: Partial<Record<KeyId, string>> = {
    ZERO: '0', ONE: '1', TWO: '2', THREE: '3', FOUR: '4',
    FIVE: '5', SIX: '6', SEVEN: '7', EIGHT: '8', NINE: '9', DOT: '.',
  };
  if (key === 'AC') return { state: createMathBoxState(), result: { handled: true } };

  if (state.screen === 'menu') {
    if (key === 'ONE') return { state: { ...state, tool: 'dice' }, result: { handled: true } };
    if (key === 'TWO') return { state: { ...state, tool: 'coin' }, result: { handled: true } };
    if (key === 'THREE') return { state: { ...state, tool: 'rand' }, result: { handled: true } };
    if (key === 'FOUR') return { state: { ...state, tool: 'gcd' }, result: { handled: true } };
    if (key === 'FIVE') return { state: { ...state, tool: 'lcm' }, result: { handled: true } };
    if (key === 'UP' || key === 'DOWN') {
      const i = TOOLS.indexOf(state.tool);
      const next = TOOLS[(i + (key === 'DOWN' ? 1 : -1) + TOOLS.length) % TOOLS.length];
      return { state: { ...state, tool: next }, result: { handled: true } };
    }
    if (key === 'EXE') return { state: { ...state, screen: 'run', inputBuffer: '' }, result: { handled: true } };
  }

  if (state.screen === 'run') {
    if (nums[key]) return { state: { ...state, inputBuffer: state.inputBuffer + nums[key] }, result: { handled: true } };
    if (key === 'RPAREN') {
      return { state: { ...state, inputBuffer: state.inputBuffer.endsWith(',') ? state.inputBuffer : `${state.inputBuffer},` }, result: { handled: true } };
    }
    if (key === 'EXE') {
      let resultText = '';
      let ans = 0;
      if (state.tool === 'dice') {
        ans = 1 + Math.floor(Math.random() * 6);
        resultText = String(ans);
      } else if (state.tool === 'coin') {
        ans = Math.random() < 0.5 ? 0 : 1;
        resultText = ans ? 'H' : 'T';
      } else if (state.tool === 'rand') {
        const [a, b] = (state.inputBuffer || '1,100').split(',').map((x) => parseInt(x, 10));
        const lo = Number.isFinite(a) ? a : 1;
        const hi = Number.isFinite(b) ? b : 100;
        ans = lo + Math.floor(Math.random() * (hi - lo + 1));
        resultText = String(ans);
      } else {
        const [a, b] = (state.inputBuffer || '12,18').split(',').map((x) => parseInt(x, 10));
        ans = state.tool === 'gcd' ? gcd(a, b) : lcm(a, b);
        resultText = String(ans);
      }
      return { state: { ...state, screen: 'result', resultText }, result: { handled: true, setAns: ans } };
    }
  }

  if (state.screen === 'result' && (key === 'EXIT' || key === 'EXE')) {
    return { state: { ...state, screen: 'menu', inputBuffer: '', resultText: '' }, result: { handled: true } };
  }

  return { state, result: { handled: false } };
}
