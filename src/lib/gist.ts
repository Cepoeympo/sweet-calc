/**
 * Облачная синхронизация через GitHub Gist.
 * Токен вводит сам пользователь, он хранится только в IndexedDB
 * и никогда не попадает в код, логи или файл бэкапа.
 */
const API_ROOT = 'https://api.github.com/gists'
export const GIST_FILE_NAME = 'sweet-calc-backup.json'

export interface GistCredentials {
  token: string
  gistId: string
}

export interface GistSaveResult {
  gistId: string
  updatedAt: string
}

function describeStatus(status: number): string {
  if (status === 401) return 'GitHub отклонил токен (401). Проверьте Personal Access Token и право gist.'
  if (status === 403) return 'GitHub ограничил доступ (403). У токена должно быть право gist.'
  if (status === 404) return 'Gist не найден (404). Проверьте Gist ID или создайте новый.'
  if (status === 422) return 'GitHub не принял данные (422). Проверьте формат резервной копии.'
  if (status >= 500) return 'GitHub временно недоступен. Попробуйте позже.'
  return `Запрос к GitHub завершился ошибкой ${status}.`
}

async function callApi(url: string, token: string, init?: RequestInit): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init?.headers ?? {}),
      },
    })
  } catch {
    throw new Error('Нет соединения с GitHub. Проверьте интернет и повторите попытку.')
  }

  if (!response.ok) {
    throw new Error(describeStatus(response.status))
  }

  return response.json()
}

/** Сохраняет резервную копию в Gist: создаёт новый или обновляет существующий. */
export async function saveBackupToGist(
  credentials: GistCredentials,
  payload: unknown,
): Promise<GistSaveResult> {
  const token = credentials.token.trim()
  if (!token) throw new Error('Укажите Personal Access Token с правом gist.')

  const content = JSON.stringify(payload, null, 2)
  const body = JSON.stringify({
    description: 'Sweet Calc — резервная копия базы',
    public: false,
    files: { [GIST_FILE_NAME]: { content } },
  })

  const gistId = credentials.gistId.trim()
  const url = gistId ? `${API_ROOT}/${gistId}` : API_ROOT
  const data = (await callApi(url, token, { method: gistId ? 'PATCH' : 'POST', body })) as {
    id?: string
    updated_at?: string
  }

  if (!data?.id) throw new Error('GitHub не вернул идентификатор Gist.')

  return {
    gistId: data.id,
    updatedAt: data.updated_at ?? new Date().toISOString(),
  }
}

interface GistFileResponse {
  content?: string
  truncated?: boolean
  raw_url?: string
}

/** Загружает содержимое резервной копии из Gist. */
export async function loadBackupFromGist(credentials: GistCredentials): Promise<string> {
  const token = credentials.token.trim()
  const gistId = credentials.gistId.trim()

  if (!token) throw new Error('Укажите Personal Access Token с правом gist.')
  if (!gistId) throw new Error('Укажите Gist ID, из которого нужно восстановить базу.')

  const data = (await callApi(`${API_ROOT}/${gistId}`, token)) as {
    files?: Record<string, GistFileResponse>
  }

  const file = data?.files?.[GIST_FILE_NAME]
  if (!file) throw new Error(`В Gist нет файла ${GIST_FILE_NAME}.`)

  if (file.truncated && file.raw_url) {
    const raw = await fetch(file.raw_url, { headers: { Authorization: `Bearer ${token}` } })
    if (!raw.ok) throw new Error('Не удалось скачать полный файл резервной копии.')
    return raw.text()
  }

  if (!file.content) throw new Error('Файл резервной копии пуст.')
  return file.content
}
