/**
 * Coloration syntaxique minimale pour TypeScript et C# : assez pour que le code
 * ressemble à un vrai éditeur, sans embarquer une bibliothèque complète.
 */

export type CodeLanguage = 'typescript' | 'csharp'

/** Langage d'un fichier, d'après son extension (TypeScript par défaut). */
export const languageOf = (fileName: string): CodeLanguage =>
  fileName.endsWith('.cs') ? 'csharp' : 'typescript'

export type TokenKind = 'plain' | 'keyword' | 'string' | 'comment' | 'number' | 'function' | 'type'

export interface Token {
  kind: TokenKind
  text: string
}

const KEYWORDS = new Set([
  'as',
  'async',
  'await',
  'class',
  'const',
  'else',
  'export',
  'extends',
  'false',
  'for',
  'from',
  'function',
  'if',
  'import',
  'interface',
  'let',
  'new',
  'null',
  'of',
  'return',
  'throw',
  'true',
  'try',
  'catch',
  'type',
  'typeof',
  'undefined',
  'var',
  'while',
])

const CSHARP_KEYWORDS = new Set([
  'base',
  'bool',
  'break',
  'class',
  'const',
  'else',
  'enum',
  'false',
  'float',
  'for',
  'foreach',
  'if',
  'in',
  'int',
  'internal',
  'namespace',
  'new',
  'null',
  'out',
  'override',
  'private',
  'protected',
  'public',
  'readonly',
  'return',
  'sealed',
  'static',
  'string',
  'this',
  'true',
  'using',
  'var',
  'void',
  'while',
])

// Ordre important : commentaires, chaînes, nombres, identifiants, reste.
const TOKEN =
  /(\/\/.*$)|('(?:[^'\\]|\\.)*'?|"(?:[^"\\]|\\.)*"?)|(`)|(\b\d[\d_]*(?:\.\d+)?[fFdDmM]?\b)|([A-Za-z_$][\w$]*)|(\s+|.)/gy

export function highlightLines(
  lines: readonly string[],
  language: CodeLanguage = 'typescript',
): Token[][] {
  const keywords = language === 'csharp' ? CSHARP_KEYWORDS : KEYWORDS
  let inTemplate = false
  return lines.map((line) => {
    const tokens: Token[] = []
    const push = (kind: TokenKind, text: string) => {
      const last = tokens[tokens.length - 1]
      if (last && last.kind === kind) last.text += text
      else tokens.push({ kind, text })
    }

    let i = 0
    while (i < line.length) {
      if (inTemplate) {
        const end = line.indexOf('`', i)
        if (end === -1) {
          push('string', line.slice(i))
          i = line.length
        } else {
          push('string', line.slice(i, end + 1))
          i = end + 1
          inTemplate = false
        }
        continue
      }
      TOKEN.lastIndex = i
      const m = TOKEN.exec(line)
      if (!m) break
      const [text, comment, str, backtick, num, ident] = m
      if (comment) push('comment', text)
      else if (str) push('string', text)
      else if (backtick && language === 'csharp') push('plain', text)
      else if (backtick) {
        push('string', text)
        inTemplate = true
      } else if (num) push('number', text)
      else if (ident) {
        const rest = line.slice(i + text.length)
        if (keywords.has(ident)) push('keyword', text)
        else if (/^\s*\(/.test(rest)) push('function', text)
        else if (/^[A-Z]/.test(ident)) push('type', text)
        else push('plain', text)
      } else push('plain', text)
      i += text.length
    }
    return tokens
  })
}
