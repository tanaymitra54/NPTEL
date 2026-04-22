import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(new URL('.', import.meta.url).pathname, '..')
const inputPath = path.resolve(repoRoot, '..', 'NPTEL ANSWERS.md')
const outputDir = path.resolve(repoRoot, 'src', 'data')
const outputPath = path.resolve(outputDir, 'questions.json')

function stripMd(s) {
  return s
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim()
}

function slugify(s) {
  return stripMd(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
}

function parseAnswerLine(line) {
  // Examples:
  // ✅ **Answer:** B. Natural
  // ✅ **Answer:** D. all of the given
  // ✅ **Answer:** B
  const m = line.match(/Answer:\*\*\s*:?\s*([A-D])(?:\.|\b)/i)
  if (!m) return null
  return m[1].toUpperCase()
}

function normalizeChoiceText(s) {
  // keep visible text, remove surrounding bold markers
  return stripMd(s)
}

function titleCase(s) {
  return s.replace(/\b\w+/g, (part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
}

function compactText(s) {
  return s.replace(/\s+/g, ' ').trim()
}

function normalizeLettersAndDigits(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function getKeyWords(s, limit = 3) {
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'do', 'for', 'from', 'has', 'have', 'in', 'into', 'is',
    'it', 'its', 'of', 'on', 'or', 'that', 'the', 'their', 'there', 'these', 'this', 'those', 'to', 'under',
    'which', 'with', 'who', 'will', 'would', 'all', 'not', 'one', 'than', 'then', 'any', 'before', 'after',
  ])

  return compactText(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .slice(0, limit)
}

function makeInitialism(words) {
  return words.map((word) => word[0]?.toUpperCase()).filter(Boolean).join('')
}

function buildTricks(question) {
  const correct = question.choices.find((choice) => choice.key === question.answerKey)
  const correctText = compactText(correct?.text || '')
  const normalizedAnswer = normalizeLettersAndDigits(correctText)
  const cue = correctText
    .split(/[.,;():-]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)[0]
  const lowered = correctText.toLowerCase()
  const answerWords = getKeyWords(correctText, 4)
  const promptWords = getKeyWords(question.prompt, 4)
  const initials = makeInitialism(answerWords)
  const acronym = (correctText.match(/[A-Z0-9]+/g) || []).join('')
  const numericToken = (correctText.match(/\$?\d+(?:\.\d+)?/) || [null])[0]

  if (/^all (?:of )?the given$/.test(normalizedAnswer)) {
    return 'Mnemonic: if A, B, and C all look reasonable, take the umbrella choice: all of the given.'
  }

  if (/^none of the given$/.test(normalizedAnswer)) {
    return 'Mnemonic: when every listed choice feels off, remember NONE survives the check.'
  }

  if (/^both a and b$/.test(normalizedAnswer)) {
    return 'Mnemonic: when two statements team up as correct, remember the pair answer: both A and B.'
  }

  if (lowered === 'true') {
    return 'Mnemonic: mark True only when the statement sounds like a direct textbook fact with no obvious exaggeration.'
  }

  if (lowered === 'false') {
    return 'Mnemonic: rigid or absolute statements are often traps, so False is the usual red-flag answer.'
  }

  if (/^\d+$/.test(correctText) && /\bsdq?g\b/i.test(question.prompt)) {
    return `Mnemonic: pin this topic to SDG ${correctText}; remember the number first, then recall the goal.`
  }

  if (numericToken && correctText.replace(numericToken, '').trim() === '') {
    return `Mnemonic: treat ${numericToken} as the exam number hook for this fact and recall the figure before the options.`
  }

  if (/^(?:\d{1,4}\s+){1,3}\d{1,4}$/.test(normalizedAnswer)) {
    return `Mnemonic: remember the number chain ${normalizedAnswer.replace(/\s+/g, ' -> ')} in order and then map it back to the option.`
  }

  if (acronym.length >= 2 && /[A-Z]/.test(correctText) && correctText.replace(/[A-Z0-9*.-]/g, '').trim() === '') {
    return `Mnemonic: ${acronym} is the letter-hook here, so recall the initials first and the full term will follow.`
  }

  if (answerWords.length >= 2 && initials.length >= 2) {
    return `Mnemonic: ${initials} = ${titleCase(answerWords.join(' '))}; use the initials as a shortcut to recall the full answer.`
  }

  if (answerWords.length === 1) {
    const word = answerWords[0]
    const promptCue = promptWords.find((promptWord) => promptWord[0] === word[0])
    if (promptCue) {
      return `Mnemonic: ${word[0].toUpperCase()} links ${titleCase(word)} with ${titleCase(promptCue)}; hold that letter-pair in memory.`
    }
    return `Mnemonic: ${word[0].toUpperCase()} for ${titleCase(word)}; lock the first letter and recall the concept from it.`
  }

  return cue
    ? `Mnemonic: remember the clue phrase "${cue}" and use it to pull back the right option.`
    : 'Mnemonic: focus on the central concept in the question and match the option that names it most directly.'
}

function isGenericTrick(tricks) {
  return (
    /^Remember: The correct answer is [A-D]\. Think about the key concept in this question\.$/.test(tricks) ||
    /^Anchor: Lock on option [A-D]/.test(tricks) ||
    /^Remember [A-D]: /.test(tricks) ||
    /^Mnemonic: /.test(tricks)
  )
}

function readExistingTricks() {
  if (!fs.existsSync(outputPath)) return new Map()

  try {
    const raw = JSON.parse(fs.readFileSync(outputPath, 'utf8'))
    const entries = Array.isArray(raw?.questions) ? raw.questions : []
    return new Map(
      entries
        .filter(
          (question) =>
            question?.questionId &&
            typeof question?.tricks === 'string' &&
            question.tricks.trim() &&
            !isGenericTrick(question.tricks.trim()),
        )
        .map((question) => [question.questionId, question.tricks.trim()]),
    )
  } catch {
    return new Map()
  }
}

function parseMarkdown(md) {
  const lines = md.split(/\r?\n/)

  /** @type {Array<{assignmentId:number, assignmentLabel:string, questionId:string, prompt:string, choices:Array<{key:string,text:string}>, answerKey:string}>} */
  const questions = []

  let assignmentId = null
  let assignmentLabel = null

  let current = null

  const flush = () => {
    if (!current) return
    if (!current.answerKey || current.choices.length < 2) {
      current = null
      return
    }
    const qSlug = slugify(current.prompt || `q${current.questionNumber}`)
    const questionId = `w${assignmentId}-q${current.questionNumber}-${qSlug || 'question'}`
    questions.push({
      assignmentId,
      assignmentLabel,
      questionId,
      prompt: current.prompt,
      choices: current.choices,
      answerKey: current.answerKey,
    })
    current = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd()

    const assignmentMatch = line.match(/^##\s+.*Assignment\s+(\d+)/i)
    if (assignmentMatch) {
      flush()
      assignmentId = Number(assignmentMatch[1])
      assignmentLabel = stripMd(line.replace(/^##\s+/, ''))
      continue
    }

    const qHeader = line.match(/^###\s+Q(\d+)\b/i)
    const qInline = line.match(/^\*\*Q(\d+)\.\*\*\s*(.*)$/i)
    if (qHeader || qInline) {
      flush()
      current = {
        questionNumber: Number((qHeader ? qHeader[1] : qInline[1])),
        prompt: '',
        choices: [],
        answerKey: null,
      }

      if (qInline) {
        const rest = stripMd(qInline[2] || '')
        if (rest) current.prompt = rest
      }
      continue
    }

    if (!current) continue

    // choices
    // - A. ...
    const choiceMatch = line.match(/^\s*-\s*([A-D])\.\s*(.*)$/)
    if (choiceMatch) {
      const key = choiceMatch[1].toUpperCase()
      const text = normalizeChoiceText(choiceMatch[2])
      current.choices.push({ key, text })
      continue
    }

    // answer line
    if (line.includes('Answer')) {
      const ak = parseAnswerLine(line)
      if (ak) current.answerKey = ak
      continue
    }

    // prompt line: first non-empty, non-separator content after header
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed === '---') continue
    if (trimmed.startsWith('*Total:')) continue

    // If prompt not set and this is not a choice/answer, set prompt
    if (!current.prompt) {
      current.prompt = stripMd(trimmed)
      continue
    }
  }

  flush()

  // Dedupe identical questions across assignments (Week 0 repeats Week 1).
  // We keep the first occurrence in file order.
  const seen = new Set()
  const deduped = []
  for (const q of questions) {
    const key = JSON.stringify({
      prompt: q.prompt,
      choices: q.choices,
      answerKey: q.answerKey,
    })
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(q)
  }

  return deduped
}

function main() {
  if (!fs.existsSync(inputPath)) {
    console.error(`Input not found: ${inputPath}`)
    process.exit(1)
  }
  const md = fs.readFileSync(inputPath, 'utf8')
  const existingTricks = readExistingTricks()
  const questions = parseMarkdown(md).map((question) => ({
    ...question,
    tricks: existingTricks.get(question.questionId) || buildTricks(question),
  }))

  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        source: path.basename(inputPath),
        generatedAt: new Date().toISOString(),
        count: questions.length,
        questions,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  )

  console.log(`Wrote ${questions.length} questions to ${outputPath}`)
}

main()
