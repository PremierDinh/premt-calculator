import { create } from 'zustand';
import type { CalcValue } from '../math/ast';
import { toReal } from '../math/ast';
import type { Matrix } from '../math/matrix';
import type { Vector } from '../math/vector';
import type { DisplayState, HistoryEntry, KeyContext, KeyId, ModeId, Overlay, PowerState, VariableName } from '../core/types';
import { createInitialModeState, getModeDisplay, handleModeKey } from '../core/modes';
import { applySetting, DEFAULT_SETTINGS, SETTINGS_ITEMS, type CalculatorSettings, type Language } from '../core/settings';
import { cycleFormat, formatValue } from '../core/format';
import { applyCatalogItem, getCatalog, getTools } from '../core/catalog';
import { settingLabel, t } from '../i18n/strings';
import { insertAtCursor } from '../math/expression';
import { buildQrPayload, encodeQrDataUrl } from '../qr';

const DEFAULT_VARS: Record<VariableName, number> = {
  A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, x: 0, y: 0, z: 0,
};

interface CalculatorStore {
  power: PowerState;
  currentMode: ModeId;
  shiftActive: boolean;
  alphaActive: boolean;
  ans: number;
  preAns: number;
  lastValue: CalcValue | null;
  variables: Record<VariableName, number>;
  matrices: Record<string, Matrix>;
  vectors: Record<string, Vector>;
  settings: CalculatorSettings;
  modeState: ReturnType<typeof createInitialModeState>;
  display: DisplayState;
  overlay: Overlay;
  overlayIndex: number;
  overlayGroup: number;
  history: HistoryEntry[];
  pressedKey: KeyId | null;
  lastInputAt: number;
  qrPayload: string | null;
  qrImageDataUrl: string | null;

  getContext: () => KeyContext;
  refreshDisplay: () => void;
  pressKey: (key: KeyId) => void;
  releaseKey: () => void;
  navigateToMode: (mode: ModeId) => void;
  openSettingsOverlay: () => void;
  setLanguage: (language: Language) => void;
}

const LANGUAGE_STORAGE_KEY = 'premt-lang';

function loadStoredLanguage(): Language | null {
  try {
    const value = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (value === 'vi' || value === 'en') return value;
  } catch {
    /* ignore storage errors */
  }
  return null;
}

function persistLanguage(language: Language) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    /* ignore storage errors */
  }
}

function valueToAns(value: CalcValue | number): number {
  if (typeof value === 'number') return value;
  try { return toReal(value); } catch { return 0; }
}

function buildDisplay(state: CalculatorStore): DisplayState {
  const ctx = makeContext(state);
  if (state.power === 'off') return { lines: [{ text: '' }] };

  if (state.overlay === 'settings') {
    const item = SETTINGS_ITEMS[state.overlayIndex];
    const value = String(state.settings[item.key]);
    return {
      lines: [
        { text: t(state.settings.language, 'settings'), size: 'small' },
        { text: settingLabel(state.settings.language, String(item.key)) },
        { text: value, align: 'right', size: 'large' },
        { text: `${state.overlayIndex + 1}/${SETTINGS_ITEMS.length}`, size: 'small' },
      ],
      overlay: 'settings',
      showShift: state.shiftActive,
      showAlpha: state.alphaActive,
    };
  }

  if (state.overlay === 'qr') {
    const calc = state.modeState.calculate;
    return {
      lines: [
        { text: 'QR', size: 'small' },
        { text: state.qrPayload ?? buildQrPayload(calc.expression, calc.result, state.ans), align: 'right', size: 'small' },
      ],
      overlay: 'qr',
      qrImageDataUrl: state.qrImageDataUrl ?? undefined,
    };
  }

  if (state.overlay === 'catalog' || state.overlay === 'tools') {
    const groups = state.overlay === 'catalog'
      ? getCatalog(state.currentMode, state.settings.language)
      : getTools(state.currentMode, state.settings.language);
    const group = groups[state.overlayGroup] ?? groups[0];
    const item = group?.items[state.overlayIndex];
    return {
      lines: [
        { text: group?.title ?? '', size: 'small' },
        { text: `▶ ${item?.label ?? ''}` },
        { text: `${(state.overlayIndex + 1)}/${group?.items.length ?? 0}`, size: 'small' },
      ],
      overlay: state.overlay,
    };
  }

  if (state.overlay === 'menu') {
    const items = [
      t(state.settings.language, 'home'),
      t(state.settings.language, 'settings'),
      t(state.settings.language, 'catalog'),
    ];
    return {
      lines: [
        { text: t(state.settings.language, 'menu'), size: 'small' },
        ...items.map((label, i) => ({
          text: i === state.overlayIndex ? `▶ ${label}` : label,
        })),
      ],
      overlay: 'menu',
    };
  }

  const display = getModeDisplay(state.currentMode, state.modeState, ctx);
  return {
    ...display,
    showShift: state.shiftActive,
    showAlpha: state.alphaActive,
  };
}

function makeContext(state: CalculatorStore): KeyContext {
  return {
    shiftActive: state.shiftActive,
    alphaActive: state.alphaActive,
    angleUnit: state.settings.angleUnit,
    ans: state.ans,
    preAns: state.preAns,
    variables: state.variables,
    matrices: state.matrices,
    vectors: state.vectors,
    numberFormat: state.settings.numberFormat,
    settings: state.settings,
    history: state.history,
    language: state.settings.language,
  };
}

export const useCalculatorStore = create<CalculatorStore>((set, get) => ({
  power: 'on',
  currentMode: 'home',
  shiftActive: false,
  alphaActive: false,
  ans: 0,
  preAns: 0,
  lastValue: null,
  variables: { ...DEFAULT_VARS },
  matrices: {},
  vectors: {},
  settings: (() => {
    const storedLanguage = loadStoredLanguage();
    return storedLanguage
      ? { ...DEFAULT_SETTINGS, language: storedLanguage }
      : { ...DEFAULT_SETTINGS };
  })(),
  modeState: createInitialModeState(),
  display: { lines: [], showHome: true, menuItems: [], selectedMenuIndex: 0 },
  overlay: 'none',
  overlayIndex: 0,
  overlayGroup: 0,
  history: [],
  pressedKey: null,
  lastInputAt: Date.now(),
  qrPayload: null,
  qrImageDataUrl: null,

  getContext: () => makeContext(get()),

  refreshDisplay: () => set((s) => ({ display: buildDisplay(s) })),

  pressKey: (key: KeyId) => {
    const state = get();
    set({ pressedKey: key, lastInputAt: Date.now() });
    if (key === 'PAGEUP') key = 'UP';
    if (key === 'PAGEDOWN' || key === 'SCROLL') key = 'DOWN';

    if (state.power === 'off') {
      if (key === 'ON') {
        set({ power: 'on', currentMode: 'home', overlay: 'none' });
        get().refreshDisplay();
      }
      return;
    }

    if (key === 'ON' || (key === 'AC' && state.shiftActive)) {
      set({ power: 'off', shiftActive: false, alphaActive: false, overlay: 'none' });
      get().refreshDisplay();
      return;
    }

    if (key === 'SHIFT') {
      set({ shiftActive: !state.shiftActive, alphaActive: false });
      get().refreshDisplay();
      return;
    }

    if (key === 'ALPHA') {
      set({ alphaActive: !state.alphaActive, shiftActive: false });
      get().refreshDisplay();
      return;
    }

    if (key === 'HOME') {
      set({ currentMode: 'home', overlay: 'none', shiftActive: false, alphaActive: false });
      get().refreshDisplay();
      return;
    }

    if (key === 'MENU') {
      set({ overlay: state.overlay === 'menu' ? 'none' : 'menu', overlayIndex: 0, shiftActive: false });
      get().refreshDisplay();
      return;
    }

    if (key === 'SETTINGS') {
      set({ overlay: state.overlay === 'settings' ? 'none' : 'settings', overlayIndex: 0, shiftActive: false });
      get().refreshDisplay();
      return;
    }

    if (key === 'CATALOG') {
      set({ overlay: state.overlay === 'catalog' ? 'none' : 'catalog', overlayIndex: 0, overlayGroup: 0, shiftActive: false });
      get().refreshDisplay();
      return;
    }

    if (key === 'TOOLS') {
      set({ overlay: state.overlay === 'tools' ? 'none' : 'tools', overlayIndex: 0, overlayGroup: 0, shiftActive: false });
      get().refreshDisplay();
      return;
    }

    if (key === 'EXIT') {
      if (state.overlay !== 'none') {
        set({ overlay: 'none' });
      } else if (state.currentMode !== 'home') {
        const { modeState, result } = handleModeKey(state.currentMode, state.modeState, 'EXIT', makeContext(state));
        if (result.handled) {
          set({ modeState, shiftActive: false });
        } else {
          set({ currentMode: 'home', shiftActive: false });
        }
      }
      get().refreshDisplay();
      return;
    }

    if (state.overlay === 'settings') {
      handleSettingsKeys(key, get, set);
      get().refreshDisplay();
      return;
    }

    if (state.overlay === 'qr') {
      set({ overlay: 'none', qrPayload: null, qrImageDataUrl: null });
      get().refreshDisplay();
      return;
    }

    if (state.overlay === 'catalog' || state.overlay === 'tools') {
      handleCatalogKeys(key, get, set);
      get().refreshDisplay();
      return;
    }

    if (state.overlay === 'menu') {
      if (key === 'DOWN') {
        set({ overlayIndex: Math.min(2, state.overlayIndex + 1) });
      } else if (key === 'UP') {
        set({ overlayIndex: Math.max(0, state.overlayIndex - 1) });
      } else if (key === 'EXE' || key === 'OK') {
        if (state.overlayIndex === 0) set({ overlay: 'none', currentMode: 'home' });
        else if (state.overlayIndex === 1) set({ overlay: 'settings', overlayIndex: 0 });
        else set({ overlay: 'catalog', overlayIndex: 0, overlayGroup: 0 });
      } else if (key === 'ONE') set({ overlay: 'none', currentMode: 'home' });
      else if (key === 'TWO') set({ overlay: 'settings', overlayIndex: 0 });
      else if (key === 'THREE') set({ overlay: 'catalog', overlayIndex: 0, overlayGroup: 0 });
      get().refreshDisplay();
      return;
    }

    if (key === 'FORMAT' && (state.currentMode === 'calculate' || state.currentMode === 'complex')) {
      set({ settings: { ...state.settings, numberFormat: cycleFormat(state.settings.numberFormat) } });
      get().refreshDisplay();
      return;
    }

    if (key === 'FRAC' && !state.shiftActive && !state.alphaActive) {
      const calc = state.modeState.calculate;
      const editingCalc = state.currentMode === 'calculate' && calc.expression.trim() && !calc.showResult;
      if (!editingCalc) {
        const settings = { ...state.settings, fractionOutput: !state.settings.fractionOutput };
        const updates: Partial<CalculatorStore> = { settings, pressedKey: key, lastInputAt: Date.now() };
        if (state.currentMode === 'calculate' && calc.showResult && state.lastValue) {
          updates.modeState = {
            ...state.modeState,
            calculate: { ...calc, result: formatValue(state.lastValue, settings) },
          };
        }
        if (state.currentMode === 'complex' && state.modeState.complex.showResult && state.lastValue) {
          updates.modeState = {
            ...(updates.modeState ?? state.modeState),
            complex: {
              ...state.modeState.complex,
              result: formatValue(state.lastValue, settings),
            },
          };
        }
        set(updates);
        get().refreshDisplay();
        get().releaseKey();
        return;
      }
    }

    const ctx = makeContext(state);
    const { modeState, result } = handleModeKey(state.currentMode, state.modeState, key, ctx);
    const updates: Partial<CalculatorStore> = { modeState };
    if (result.consumeShift) updates.shiftActive = false;
    if (result.consumeAlpha) updates.alphaActive = false;
    if (result.setAns !== undefined) {
      updates.preAns = state.ans;
      updates.ans = valueToAns(result.setAns);
      updates.lastValue = typeof result.setAns === 'number' ? { kind: 'real', value: result.setAns } : result.setAns;
    }
    if (result.setVariable) {
      updates.variables = { ...state.variables, [result.setVariable.name]: result.setVariable.value };
    }
    if (result.setMatrix) {
      updates.matrices = { ...state.matrices, [result.setMatrix.name]: result.setMatrix.value };
    }
    if (result.setVector) {
      updates.vectors = { ...state.vectors, [result.setVector.name]: result.setVector.value };
    }
    if (result.addHistory) {
      updates.history = [...state.history, result.addHistory].slice(-50);
    }
    if (result.openQr) {
      const calc = modeState.calculate;
      const payload = result.qrPayload ?? buildQrPayload(calc.expression, calc.result, state.ans);
      updates.overlay = 'qr';
      updates.qrPayload = payload;
      updates.qrImageDataUrl = null;
      set(updates);
      encodeQrDataUrl(payload).then((url) => {
        set({ qrImageDataUrl: url });
        get().refreshDisplay();
      }).catch(() => {
        get().refreshDisplay();
      });
      get().releaseKey();
      return;
    }
    if (result.toggleApprox) {
      const io = state.settings.inputOutput;
      const next = io.endsWith('DecimalO')
        ? io.replace('DecimalO', 'MathO')
        : io.replace('MathO', 'DecimalO');
      updates.settings = { ...state.settings, inputOutput: next as typeof io };
    }
    if (result.switchMode) {
      updates.currentMode = result.switchMode;
      updates.shiftActive = false;
      updates.alphaActive = false;
    }
    set(updates);
    get().refreshDisplay();
  },

  releaseKey: () => set({ pressedKey: null }),

  navigateToMode: (mode: ModeId) => {
    set({
      power: 'on',
      currentMode: mode,
      overlay: 'none',
      shiftActive: false,
      alphaActive: false,
      qrPayload: null,
      qrImageDataUrl: null,
    });
    get().refreshDisplay();
  },

  openSettingsOverlay: () => {
    set({
      power: 'on',
      overlay: 'settings',
      overlayIndex: 0,
      shiftActive: false,
      alphaActive: false,
    });
    get().refreshDisplay();
  },

  setLanguage: (language: Language) => {
    const state = get();
    if (state.settings.language === language) return;
    persistLanguage(language);
    set({ settings: { ...state.settings, language } });
    get().refreshDisplay();
  },
}));

function handleSettingsKeys(
  key: KeyId,
  get: () => CalculatorStore,
  set: (p: Partial<CalculatorStore>) => void,
) {
  const state = get();
  if (key === 'UP') {
    set({ overlayIndex: (state.overlayIndex - 1 + SETTINGS_ITEMS.length) % SETTINGS_ITEMS.length });
    return;
  }
  if (key === 'DOWN' || key === 'SCROLL') {
    set({ overlayIndex: (state.overlayIndex + 1) % SETTINGS_ITEMS.length });
    return;
  }
  if (key === 'EXE' || key === 'OK' || key === 'RIGHT') {
    const item = SETTINGS_ITEMS[state.overlayIndex];
    set({ settings: applySetting(state.settings, item.key) });
  }
  if (key === 'FORMAT') {
    set({ settings: { ...state.settings, numberFormat: cycleFormat(state.settings.numberFormat) } });
  }
}

function handleCatalogKeys(
  key: KeyId,
  get: () => CalculatorStore,
  set: (p: Partial<CalculatorStore>) => void,
) {
  const state = get();
  const groups = state.overlay === 'catalog'
    ? getCatalog(state.currentMode, state.settings.language)
    : getTools(state.currentMode, state.settings.language);
  const group = groups[state.overlayGroup] ?? groups[0];
  if (!group) return;

  if (key === 'LEFT') {
    const g = (state.overlayGroup - 1 + groups.length) % groups.length;
    set({ overlayGroup: g, overlayIndex: 0 });
    return;
  }
  if (key === 'RIGHT') {
    const g = (state.overlayGroup + 1) % groups.length;
    set({ overlayGroup: g, overlayIndex: 0 });
    return;
  }
  if (key === 'UP') {
    set({ overlayIndex: (state.overlayIndex - 1 + group.items.length) % group.items.length });
    return;
  }
  if (key === 'DOWN' || key === 'SCROLL') {
    set({ overlayIndex: (state.overlayIndex + 1) % group.items.length });
    return;
  }
  if (key === 'EXE' || key === 'OK') {
    const item = group.items[state.overlayIndex];
    if (!item) return;
    if (item.insert === '__FORMAT__') {
      set({ settings: { ...state.settings, numberFormat: cycleFormat(state.settings.numberFormat) }, overlay: 'none' });
      return;
    }
    if (item.insert === '__STO__') {
      set({ overlay: 'none' });
      get().pressKey('VARIABLE');
      return;
    }
    if (item.insert === '__HIST__') {
      set({ overlay: 'none', currentMode: 'calculate' });
      return;
    }
    if (item.insert === '__STATCALC__') {
      set({ overlay: 'none' });
      get().pressKey('FUNCTION');
      return;
    }
    const applied = applyCatalogItem(state.currentMode, state.modeState, item.insert);
    if (applied.kind === 'modeState') {
      set({ overlay: 'none', modeState: applied.modeState });
      return;
    }
    if (applied.kind === 'insert') {
      if (applied.field === 'expression' && state.currentMode === 'calculate') {
        const calc = state.modeState.calculate;
        const { text, cursor } = insertAtCursor(calc.expression, item.insert, calc.cursorPos);
        set({
          overlay: 'none',
          modeState: { ...state.modeState, calculate: { ...calc, expression: text, cursorPos: cursor, showResult: false } },
        });
        return;
      }
      if (applied.field === 'expression' && state.currentMode === 'complex') {
        const cplx = state.modeState.complex;
        const { text, cursor } = insertAtCursor(cplx.expression, item.insert, cplx.cursorPos);
        set({
          overlay: 'none',
          modeState: { ...state.modeState, complex: { ...cplx, expression: text, cursorPos: cursor, showResult: false } },
        });
        return;
      }
      if (applied.field === 'inputBuffer' && state.currentMode === 'table') {
        const tbl = state.modeState.table;
        set({
          overlay: 'none',
          modeState: {
            ...state.modeState,
            table: { ...tbl, inputBuffer: tbl.inputBuffer + item.insert, screen: 'func' },
          },
        });
        return;
      }
      if (applied.field === 'basenExpr' && state.currentMode === 'basen') {
        const basen = state.modeState.basen;
        set({
          overlay: 'none',
          modeState: { ...state.modeState, basen: { ...basen, expression: basen.expression + item.insert, result: '' } },
        });
        return;
      }
    }
    set({ overlay: 'none' });
  }
}

