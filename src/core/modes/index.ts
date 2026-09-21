import type { DisplayState, KeyContext, KeyId, ModeId, ModeResult, ModeState } from '../types';
import { createHomeState, getHomeDisplay, handleHomeKey } from './home';
import { createCalculateState, getCalculateDisplay, handleCalculateKey } from './calculate';
import { createStatisticsState, getStatisticsDisplay, handleStatisticsKey } from './statistics';
import { createDistributionState, getDistributionDisplay, handleDistributionKey } from './distribution';
import { createTableState, getTableDisplay, handleTableKey } from './table';
import { createEquationState, getEquationDisplay, handleEquationKey } from './equation';
import { createSpreadsheetState, getSpreadsheetDisplay, handleSpreadsheetKey } from './spreadsheet';
import { createInequalityState, getInequalityDisplay, handleInequalityKey } from './inequality';
import { createComplexState, getComplexDisplay, handleComplexKey } from './complex';
import { createBaseNState, getBaseNDisplay, handleBaseNKey } from './basen';
import { createMatrixState, getMatrixDisplay, handleMatrixKey } from './matrix';
import { createVectorState, getVectorDisplay, handleVectorKey } from './vector';
import { createRatioState, getRatioDisplay, handleRatioKey } from './ratio';
import { createMathBoxState, getMathBoxDisplay, handleMathBoxKey } from './mathbox';

export function createInitialModeState(): ModeState {
  return {
    home: createHomeState(),
    calculate: createCalculateState(),
    statistics: createStatisticsState(),
    distribution: createDistributionState(),
    table: createTableState(),
    equation: createEquationState(),
    spreadsheet: createSpreadsheetState(),
    inequality: createInequalityState(),
    complex: createComplexState(),
    basen: createBaseNState(),
    matrix: createMatrixState(),
    vector: createVectorState(),
    ratio: createRatioState(),
    mathbox: createMathBoxState(),
  };
}

export function getModeDisplay(mode: ModeId, modeState: ModeState, ctx: KeyContext): DisplayState {
  switch (mode) {
    case 'home': return getHomeDisplay(modeState.home, ctx);
    case 'calculate': return getCalculateDisplay(modeState.calculate, ctx);
    case 'statistics': return getStatisticsDisplay(modeState.statistics);
    case 'distribution': return getDistributionDisplay(modeState.distribution);
    case 'table': return getTableDisplay(modeState.table, ctx.settings);
    case 'equation': return getEquationDisplay(modeState.equation);
    case 'spreadsheet': return getSpreadsheetDisplay(modeState.spreadsheet);
    case 'inequality': return getInequalityDisplay(modeState.inequality);
    case 'complex': return getComplexDisplay(modeState.complex, ctx);
    case 'basen': return getBaseNDisplay(modeState.basen);
    case 'matrix': return getMatrixDisplay(modeState.matrix, ctx);
    case 'vector': return getVectorDisplay(modeState.vector, ctx);
    case 'ratio': return getRatioDisplay(modeState.ratio);
    case 'mathbox': return getMathBoxDisplay(modeState.mathbox);
    default: return { lines: [{ text: 'premt calculator' }] };
  }
}

export function handleModeKey(
  mode: ModeId,
  modeState: ModeState,
  key: KeyId,
  ctx: KeyContext,
): { modeState: ModeState; result: ModeResult } {
  switch (mode) {
    case 'home': {
      const r = handleHomeKey(modeState.home, key, ctx);
      return { modeState: { ...modeState, home: r.state }, result: r.result };
    }
    case 'calculate': {
      const r = handleCalculateKey(modeState.calculate, key, ctx);
      return { modeState: { ...modeState, calculate: r.state }, result: r.result };
    }
    case 'statistics': {
      const r = handleStatisticsKey(modeState.statistics, key, ctx);
      return { modeState: { ...modeState, statistics: r.state }, result: r.result };
    }
    case 'distribution': {
      const r = handleDistributionKey(modeState.distribution, key, ctx);
      return { modeState: { ...modeState, distribution: r.state }, result: r.result };
    }
    case 'table': {
      const r = handleTableKey(modeState.table, key, ctx);
      return { modeState: { ...modeState, table: r.state }, result: r.result };
    }
    case 'equation': {
      const r = handleEquationKey(modeState.equation, key, ctx);
      return { modeState: { ...modeState, equation: r.state }, result: r.result };
    }
    case 'spreadsheet': {
      const r = handleSpreadsheetKey(modeState.spreadsheet, key, ctx);
      return { modeState: { ...modeState, spreadsheet: r.state }, result: r.result };
    }
    case 'inequality': {
      const r = handleInequalityKey(modeState.inequality, key, ctx);
      return { modeState: { ...modeState, inequality: r.state }, result: r.result };
    }
    case 'complex': {
      const r = handleComplexKey(modeState.complex, key, ctx);
      return { modeState: { ...modeState, complex: r.state }, result: r.result };
    }
    case 'basen': {
      const r = handleBaseNKey(modeState.basen, key, ctx);
      return { modeState: { ...modeState, basen: r.state }, result: r.result };
    }
    case 'matrix': {
      const r = handleMatrixKey(modeState.matrix, key, ctx);
      return { modeState: { ...modeState, matrix: r.state }, result: r.result };
    }
    case 'vector': {
      const r = handleVectorKey(modeState.vector, key, ctx);
      return { modeState: { ...modeState, vector: r.state }, result: r.result };
    }
    case 'ratio': {
      const r = handleRatioKey(modeState.ratio, key, ctx);
      return { modeState: { ...modeState, ratio: r.state }, result: r.result };
    }
    case 'mathbox': {
      const r = handleMathBoxKey(modeState.mathbox, key, ctx);
      return { modeState: { ...modeState, mathbox: r.state }, result: r.result };
    }
    default:
      return { modeState, result: { handled: false } };
  }
}

export function resetModeState(mode: ModeId, modeState: ModeState): ModeState {
  switch (mode) {
    case 'home': return { ...modeState, home: createHomeState() };
    case 'calculate': return { ...modeState, calculate: createCalculateState() };
    case 'statistics': return { ...modeState, statistics: createStatisticsState() };
    case 'distribution': return { ...modeState, distribution: createDistributionState() };
    case 'table': return { ...modeState, table: createTableState() };
    case 'equation': return { ...modeState, equation: createEquationState() };
    case 'spreadsheet': return { ...modeState, spreadsheet: createSpreadsheetState() };
    case 'inequality': return { ...modeState, inequality: createInequalityState() };
    case 'complex': return { ...modeState, complex: createComplexState() };
    case 'basen': return { ...modeState, basen: createBaseNState() };
    case 'matrix': return { ...modeState, matrix: createMatrixState() };
    case 'vector': return { ...modeState, vector: createVectorState() };
    case 'ratio': return { ...modeState, ratio: createRatioState() };
    case 'mathbox': return { ...modeState, mathbox: createMathBoxState() };
    default: return modeState;
  }
}
