export interface Question {
  prompt: string;
  choices: string[];
  answerIndex: number;
  hint: string;
  explain: string;
}

function rand(max: number): number {
  return Math.floor(Math.random() * max);
}

function pick<T>(items: T[]): T {
  return items[rand(items.length)];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = rand(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function withChoices(correct: number, distractors: number[], rest: Omit<Question, "choices" | "answerIndex">): Question {
  const unique = [...new Set([correct, ...distractors])].slice(0, 3);
  while (unique.length < 3) {
    const extra = correct + unique.length + 1;
    if (!unique.includes(extra)) unique.push(extra);
  }
  const choices = shuffle(unique.map(String));
  return {
    ...rest,
    choices,
    answerIndex: choices.indexOf(String(correct)),
  };
}

function addSub(): Question {
  const add = Math.random() < 0.65;
  if (add) {
    const a = 1 + rand(12);
    const b = 1 + rand(12);
    return withChoices(a + b, [a + b + 1, Math.abs(a - b), a + b - 1], {
      prompt: `What is ${a} + ${b}?`,
      hint: `Start at ${a} and count up ${b}.`,
      explain: `${a} + ${b} = ${a + b}.`,
    });
  }
  const a = 6 + rand(15);
  const b = 1 + rand(a);
  return withChoices(a - b, [a - b + 1, a + b, Math.max(0, a - b - 1)], {
    prompt: `What is ${a} − ${b}?`,
    hint: `Start at ${a} and count back ${b}.`,
    explain: `${a} − ${b} = ${a - b}.`,
  });
}

function multiplyOrBiggerAdd(): Question {
  if (Math.random() < 0.6) {
    const a = 2 + rand(9);
    const b = 2 + rand(9);
    return withChoices(a * b, [a * b + a, a * b - b, a + b], {
      prompt: `What is ${a} × ${b}?`,
      hint: `${a} × ${b} means ${b} groups of ${a}.`,
      explain: `${a} × ${b} = ${a * b}.`,
    });
  }
  const a = 15 + rand(40);
  const b = 10 + rand(40);
  return withChoices(a + b, [a + b + 10, a + b - 10, a + b + 1], {
    prompt: `What is ${a} + ${b}?`,
    hint: `Add the tens, then add the ones.`,
    explain: `${a} + ${b} = ${a + b}.`,
  });
}

function divisionOrFraction(): Question {
  if (Math.random() < 0.5) {
    const b = 2 + rand(8);
    const q = 2 + rand(9);
    const a = b * q;
    return withChoices(q, [q + 1, q - 1, b], {
      prompt: `What is ${a} ÷ ${b}?`,
      hint: `How many ${b}s fit into ${a}?`,
      explain: `${a} ÷ ${b} = ${q}, because ${b} × ${q} = ${a}.`,
    });
  }
  const denom = pick([2, 3, 4, 5]);
  const whole = denom * (1 + rand(6));
  const numer = 1 + rand(denom - 1);
  const value = (whole / denom) * numer;
  return withChoices(value, [value + denom, whole / denom, value + 1], {
    prompt: `What is ${numer}/${denom} of ${whole}?`,
    hint: `Divide ${whole} by ${denom}, then multiply by ${numer}.`,
    explain: `${whole} ÷ ${denom} = ${whole / denom}, and × ${numer} = ${value}.`,
  });
}

function wordProblem(): Question {
  const kind = rand(3);
  if (kind === 0) {
    const bags = 2 + rand(4);
    const each = 3 + rand(6);
    const eaten = 1 + rand(each);
    const total = bags * each - eaten;
    return withChoices(total, [bags * each, total + 2, bags * each + eaten], {
      prompt: `A trader packs ${bags} bags with ${each} apples in each bag, then eats ${eaten}. How many apples are left?`,
      hint: `Multiply the bags by the apples, then subtract what was eaten.`,
      explain: `${bags} × ${each} = ${bags * each}, then − ${eaten} = ${total}.`,
    });
  }
  if (kind === 1) {
    const ratioA = 1 + rand(4);
    const ratioB = 1 + rand(4);
    const parts = ratioA + ratioB;
    const each = 2 + rand(5);
    const total = parts * each;
    const share = ratioA * each;
    return withChoices(share, [ratioB * each, total, share + each], {
      prompt: `Coins are shared in the ratio ${ratioA}:${ratioB}. There are ${total} coins. How many are in the first share?`,
      hint: `The shares have ${parts} parts in all. Each part is ${total} ÷ ${parts}.`,
      explain: `${total} ÷ ${parts} = ${each}, and the first share is ${ratioA} × ${each} = ${share}.`,
    });
  }
  const left = 2 + rand(8);
  const right = 2 + rand(8);
  const sum = left + right;
  return withChoices(left, [right, sum, left + 1], {
    prompt: `A number plus ${right} equals ${sum}. What is the number?`,
    hint: `Subtract ${right} from ${sum}.`,
    explain: `${sum} − ${right} = ${left}.`,
  });
}

export function makeQuestion(level: number): Question {
  if (level <= 2) return addSub();
  if (level <= 4) return multiplyOrBiggerAdd();
  if (level <= 6) return divisionOrFraction();
  return wordProblem();
}

export function bandLabel(level: number): string {
  if (level <= 2) return "Adding and subtracting";
  if (level <= 4) return "Multiplying and larger sums";
  if (level <= 6) return "Dividing and fractions";
  return "Word problems and ratios";
}
