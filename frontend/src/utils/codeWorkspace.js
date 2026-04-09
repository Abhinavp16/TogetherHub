import * as Y from 'yjs'

export const languageOptions = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'sql', label: 'SQL' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'markdown', label: 'Markdown' }
]

export const languageExtensions = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  csharp: 'cs',
  html: 'html',
  css: 'css',
  json: 'json',
  xml: 'xml',
  sql: 'sql',
  php: 'php',
  ruby: 'rb',
  go: 'go',
  rust: 'rs',
  swift: 'swift',
  kotlin: 'kt',
  markdown: 'md'
}

const extensionToLanguage = Object.entries(languageExtensions).reduce((accumulator, [language, extension]) => {
  accumulator[extension] = language
  return accumulator
}, {})

const compareNodes = (left, right) => {
  if (left.kind !== right.kind) {
    return left.kind === 'folder' ? -1 : 1
  }

  if ((left.order || 0) !== (right.order || 0)) {
    return (left.order || 0) - (right.order || 0)
  }

  return left.name.localeCompare(right.name)
}

export const createWorkspaceNodeId = (kind) => {
  return `${kind}-${Math.random().toString(36).slice(2, 10)}`
}

export const getWorkspaceMaps = (ydoc) => {
  return {
    nodes: ydoc.getMap('nodes'),
    contents: ydoc.getMap('contents')
  }
}

export const getDefaultCodeTemplate = (language = 'javascript') => {
  const templates = {
    javascript: `// Welcome to Together Hub Code Workspace

function greet(name) {
  console.log(\`Hello, \${name}!\`)
}

greet('Developer')
`,
    typescript: `type User = {
  name: string
}

function greet(user: User) {
  console.log(\`Hello, \${user.name}!\`)
}

greet({ name: 'Developer' })
`,
    python: `def greet(name: str) -> None:
    print(f"Hello, {name}!")


greet("Developer")
`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Together Hub</title>
  </head>
  <body>
    <h1>Hello, Together Hub</h1>
  </body>
</html>
`,
    css: `:root {
  color-scheme: light dark;
}

body {
  margin: 0;
  font-family: system-ui, sans-serif;
}
`,
    json: `{
  "name": "together-hub",
  "version": "1.0.0"
}
`,
    markdown: `# Together Hub

Start writing documentation here.
`
  }

  return templates[language] || `// Start coding in ${language}\n`
}

export const getDefaultFileName = (language = 'javascript') => {
  if (language === 'markdown') {
    return 'README.md'
  }

  return `main.${languageExtensions[language] || 'txt'}`
}

export const inferLanguageFromFileName = (name, fallback = 'javascript') => {
  const segments = name.toLowerCase().split('.')

  if (segments.length < 2) {
    return fallback
  }

  return extensionToLanguage[segments.at(-1)] || fallback
}

export const bootstrapCodeWorkspace = (ydoc, { content = '', language = 'javascript' } = {}) => {
  const { nodes, contents } = getWorkspaceMaps(ydoc)

  if (nodes.size > 0) {
    return null
  }

  const fileId = createWorkspaceNodeId('file')
  const ytext = new Y.Text()
  const initialContent = content || getDefaultCodeTemplate(language)

  ydoc.transact(() => {
    nodes.set(fileId, {
      id: fileId,
      kind: 'file',
      name: getDefaultFileName(language),
      parentId: null,
      language,
      order: 0
    })
    ytext.insert(0, initialContent)
    contents.set(fileId, ytext)
  })

  return fileId
}

export const readWorkspaceSnapshot = (ydoc) => {
  const { nodes, contents } = getWorkspaceMaps(ydoc)
  const items = []

  nodes.forEach((value, id) => {
    items.push({
      ...value,
      id: value?.id || id,
      parentId: value?.parentId || null,
      language: value?.language || inferLanguageFromFileName(value?.name || '')
    })
  })

  items.sort(compareNodes)

  const byParent = new Map()
  const byId = new Map()

  items.forEach((item) => {
    byId.set(item.id, item)
    const parentKey = item.parentId || 'root'

    if (!byParent.has(parentKey)) {
      byParent.set(parentKey, [])
    }

    byParent.get(parentKey).push(item)
  })

  const buildTree = (parentId = null) => {
    const children = [...(byParent.get(parentId || 'root') || [])].sort(compareNodes)

    return children.map((child) => ({
      ...child,
      children: child.kind === 'folder' ? buildTree(child.id) : []
    }))
  }

  const files = items.filter((item) => item.kind === 'file')
  const fileContents = {}

  files.forEach((file) => {
    const ytext = contents.get(file.id)
    fileContents[file.id] = ytext ? ytext.toString() : ''
  })

  return {
    tree: buildTree(),
    files,
    fileIds: files.map((file) => file.id),
    fileContents,
    firstFileId: files[0]?.id || null,
    byId
  }
}

export const getDescendantNodeIds = (ydoc, nodeId) => {
  const { nodes } = getWorkspaceMaps(ydoc)
  const descendants = []
  const queue = [nodeId]

  while (queue.length > 0) {
    const currentId = queue.shift()
    descendants.push(currentId)

    nodes.forEach((value, id) => {
      const candidateId = value?.id || id

      if (value?.parentId === currentId) {
        queue.push(candidateId)
      }
    })
  }

  return descendants
}

export const getNextSiblingOrder = (ydoc, parentId = null) => {
  const { nodes } = getWorkspaceMaps(ydoc)
  let maxOrder = -1

  nodes.forEach((value) => {
    if ((value?.parentId || null) === parentId) {
      maxOrder = Math.max(maxOrder, value?.order || 0)
    }
  })

  return maxOrder + 1
}

export const hexToRgba = (hex, alpha = 0.18) => {
  const normalized = hex.replace('#', '')
  const safeHex = normalized.length === 3
    ? normalized.split('').map((segment) => segment + segment).join('')
    : normalized

  const red = Number.parseInt(safeHex.slice(0, 2), 16)
  const green = Number.parseInt(safeHex.slice(2, 4), 16)
  const blue = Number.parseInt(safeHex.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}
