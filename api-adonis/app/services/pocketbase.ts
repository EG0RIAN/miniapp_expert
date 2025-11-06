import PocketBase from 'pocketbase'
import env from '#start/env'

export class PocketBaseService {
  #client: PocketBase

  constructor() {
    const url = env.get('PB_URL', 'http://127.0.0.1:8090')
    this.#client = new PocketBase(url)
  }

  public get client() {
    return this.#client
  }

  public async ensureAdminAuth(): Promise<boolean> {
    try {
      if (!this.#client.authStore.isValid) {
        const email = env.get('PB_ADMIN_EMAIL', '')
        const password = env.get('PB_ADMIN_PASSWORD', '')
        if (email && password) {
          await this.#client.admins.authWithPassword(email, password)
        }
      }
      return this.#client.authStore.isValid
    } catch (error) {
      console.error('PocketBase auth error:', (error as Error).message)
      return false
    }
  }
}

const pocketbase = new PocketBaseService()
export default pocketbase


