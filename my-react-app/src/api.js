async function request(phone, url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-user-phone': phone,
      ...options.headers,
    },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'Request failed.')
  return body
}

export async function fetchTasks(phone, gameCode) {
  const { tasks } = await request(
    phone,
    `/api/hunts/${encodeURIComponent(gameCode)}/tasks`,
  )
  return tasks
}

export async function completeTask(phone, gameCode, taskId, text) {
  const { task } = await request(
    phone,
    `/api/hunts/${encodeURIComponent(gameCode)}/tasks/${taskId}/complete`,
    { method: 'POST', body: JSON.stringify({ text }) },
  )
  return task
}
