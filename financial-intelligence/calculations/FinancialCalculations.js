export function debtGrowthRate(currentDebt, previousDebt) {
  const c = Number(currentDebt) || 0;
  const p = Number(previousDebt) || 0;
  if (p <= 0) return c > 0 ? 1 : 0;
  return (c - p) / p;
}

export function commitmentRatio(totalDebt, totalIncome) {
  const debt = Number(totalDebt) || 0;
  const income = Number(totalIncome) || 0;
  return income > 0 ? debt / income : 0;
}

export function paymentCapacity(totalIncome, essentialExpenses, minimumExistential) {
  return Math.max((Number(totalIncome) || 0) - (Number(essentialExpenses) || 0) - (Number(minimumExistential) || 0), 0);
}
