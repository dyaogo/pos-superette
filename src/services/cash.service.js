const SESSION_KEY = 'pos_cash_session';
const OPERATIONS_KEY = 'pos_cash_operations';
const REPORTS_KEY = 'pos_cash_reports';

export const getCashSession = () => {
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveCashSession = (session) => {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

export const getCashOperations = () => {
  return JSON.parse(localStorage.getItem(OPERATIONS_KEY) || '[]');
};

export const saveCashOperations = (operations) => {
  localStorage.setItem(OPERATIONS_KEY, JSON.stringify(operations));
};

export const addCashReport = (report) => {
  const reports = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
  reports.push(report);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
};

export const clearCashData = () => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(OPERATIONS_KEY);
};

