// O/X 퀴즈 한 판 뽑기 (화면과 분리해서 테스트할 수 있게 따로 둠)
export const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// 문제 은행에서 n개를 뽑는다. 장소(place)마다 최소 3문제씩 먼저 넣고 나머지는 무작위.
export function pickRound(bank, n = 10, perPlace = 3) {
  const groups = {};
  for (const q of bank) (groups[q.place || "_"] = groups[q.place || "_"] || []).push(q);
  const picked = [];
  for (const g of Object.values(groups)) picked.push(...shuffle(g).slice(0, Math.min(perPlace, g.length)));
  const rest = shuffle(bank.filter(q => !picked.includes(q)));
  return shuffle([...shuffle(picked), ...rest].slice(0, n));
}
