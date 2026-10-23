export function formatJson(input) {
  const s = String(input)
  if (!s.trim()) return { error: '请输入 JSON 内容' }
  try {
    return { text: JSON.stringify(JSON.parse(s), null, 2) }
  } catch (e) {
    return { error: `JSON 格式错误：${e.message}` }
  }
}

export function minifyJson(input) {
  const s = String(input)
  if (!s.trim()) return { error: '请输入 JSON 内容' }
  try {
    return { text: JSON.stringify(JSON.parse(s)) }
  } catch (e) {
    return { error: `JSON 格式错误：${e.message}` }
  }
}

export function validateJson(input) {
  const s = String(input)
  if (!s.trim()) return { error: '请输入 JSON 内容' }
  try {
    JSON.parse(s)
    return { ok: true }
  } catch (e) {
    return { error: `JSON 格式错误：${e.message}` }
  }
}
