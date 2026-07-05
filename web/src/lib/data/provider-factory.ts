export interface ProviderConfig<T> {
  createPostgres: () => T | Promise<T>;
  createMock: () => T | Promise<T>;
}

export async function resolveProvider<T>(config: ProviderConfig<T>): Promise<T> {
  return process.env.DATABASE_URL ? config.createPostgres() : config.createMock();
}
