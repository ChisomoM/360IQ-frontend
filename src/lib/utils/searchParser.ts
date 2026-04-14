/**
 * Advanced Search Parser
 * Parses search queries with modifiers: type:pdf status:pending since:2024-01 etc.
 * 
 * Supported modifiers:
 * - type:pdf, type:docx, etc. (file type)
 * - status:pending, status:approved, status:archived (document status)
 * - since:2024-01-01, until:2024-03-31 (date range)
 * - tag:finance, tag:urgent (tags)
 * - Free text (searches title + description)
 */

interface ParsedSearch {
  text?: string
  types?: string[]
  statuses?: string[]
  tags?: string[]
  dateFrom?: string
  dateUntil?: string
}

export function parseAdvancedSearch(query: string): ParsedSearch {
  if (!query.trim()) return {}

  const result: ParsedSearch = {}
  const dateRegex = /(\d{4})-(\d{2})?(-(\d{2})?)?/

  // Extract modifiers
  const typeMatches = query.matchAll(/type:(\S+)/gi)
  const statusMatches = query.matchAll(/status:(\S+)/gi)
  const tagMatches = query.matchAll(/tag:(\S+)/gi)
  const sinceMatches = query.matchAll(/since:(\S+)/gi)
  const untilMatches = query.matchAll(/until:(\S+)/gi)

  // Collect type modifiers
  const types = Array.from(typeMatches).map(m => m[1].toLowerCase())
  if (types.length > 0) result.types = types

  // Collect status modifiers
  const statuses = Array.from(statusMatches).map(m => m[1].toLowerCase())
  if (statuses.length > 0) result.statuses = statuses

  // Collect tag modifiers
  const tags = Array.from(tagMatches).map(m => m[1].toLowerCase())
  if (tags.length > 0) result.tags = tags

  // Parse date modifiers (fuzzy parsing: 2024-01-01, 2024-01, 2024)
  const sinceMatches2 = Array.from(sinceMatches).map(m => m[1])
  if (sinceMatches2.length > 0) {
    const dateStr = sinceMatches2[0]
    const match = dateStr.match(dateRegex)
    if (match) {
      const [, year, month = '01', , day = '01'] = match
      result.dateFrom = `${year}-${month}-${day}`
    }
  }

  const untilMatches2 = Array.from(untilMatches).map(m => m[1])
  if (untilMatches2.length > 0) {
    const dateStr = untilMatches2[0]
    const match = dateStr.match(dateRegex)
    if (match) {
      const [, year, month = '12', , day = '31'] = match
      result.dateUntil = `${year}-${month}-${day}`
    }
  }

  // Remove modifiers from query to get free text
  const cleanedQuery = query
    .replace(/type:\S+/gi, '')
    .replace(/status:\S+/gi, '')
    .replace(/tag:\S+/gi, '')
    .replace(/since:\S+/gi, '')
    .replace(/until:\S+/gi, '')
    .trim()

  if (cleanedQuery) {
    result.text = cleanedQuery
  }

  return result
}

/**
 * Test advanced search parser
 * Examples:
 * - "type:pdf status:pending" → { types: ['pdf'], statuses: ['pending'] }
 * - "finance type:docx type:doc" → { text: 'finance', types: ['docx', 'doc'] }
 * - "since:2024-01 until:2024-03 urgent" → { text: 'urgent', dateFrom: '2024-01-01', dateUntil: '2024-03-31' }
 * - "tag:urgent tag:finance" → { tags: ['urgent', 'finance'] }
 */
export function testSearchParser() {
  const tests = [
    'type:pdf status:pending',
    'finance type:docx type:doc',
    'since:2024-01 until:2024-03 urgent',
    'tag:urgent tag:finance',
    'malformed: query',
    'simple search text',
  ]

  console.log('=== Advanced Search Parser Tests ===')
  tests.forEach(test => {
    console.log(`Query: "${test}" →`, parseAdvancedSearch(test))
  })
}
