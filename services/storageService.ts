import { ChatSession, AccountingRecord, AppSettings, ResponseMode, Theme } from '../types';

const KEYS = {
  SESSIONS: 'sva_sessions',
  CURRENT_SESSION: 'sva_current_session',
  ACCOUNTING: 'sva_accounting',
  SETTINGS: 'sva_settings'
};

export const getSettings = (): AppSettings => {
  const stored = localStorage.getItem(KEYS.SETTINGS);
  if (stored) return JSON.parse(stored);
  return {
    responseMode: ResponseMode.MIXED,
    theme: Theme.LIGHT,
    fontSize: 'medium',
    autoPlayAudio: true,
    deviceId: `web_user_${Math.floor(Math.random() * 10000)}`
  };
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
};

export const getAccountingRecords = (): AccountingRecord[] => {
  const stored = localStorage.getItem(KEYS.ACCOUNTING);
  return stored ? JSON.parse(stored) : [];
};

export const saveAccountingRecord = (record: AccountingRecord) => {
  const records = getAccountingRecords();
  records.unshift(record);
  localStorage.setItem(KEYS.ACCOUNTING, JSON.stringify(records));
};

export const getSessions = (): ChatSession[] => {
  const stored = localStorage.getItem(KEYS.SESSIONS);
  return stored ? JSON.parse(stored) : [];
};

export const saveSession = (session: ChatSession) => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session);
  }
  localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
};

export const clearHistory = () => {
  localStorage.removeItem(KEYS.SESSIONS);
};