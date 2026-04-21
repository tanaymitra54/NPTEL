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
  const questions = parseMarkdown(md)

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
