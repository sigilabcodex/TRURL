import { createMockProvider } from './mock-provider.js';
import { createOllamaProvider } from './ollama-provider.js';

const providerFactories = {
  mock: createMockProvider,
  ollama: createOllamaProvider,
};

export function createAiProvider(env = process.env) {
  const providerName = env.TRURL_AI_PROVIDER || 'mock';
  const factory = providerFactories[providerName];

  if (!factory) {
    throw new Error(`Unsupported AI provider "${providerName}". Use "mock" or "ollama".`);
  }

  return factory({
    model: env.TRURL_AI_MODEL,
    baseUrl: env.TRURL_AI_BASE_URL,
  });
}
