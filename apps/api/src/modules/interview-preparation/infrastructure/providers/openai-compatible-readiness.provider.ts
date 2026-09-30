import { Injectable } from '@nestjs/common';
import {
  IReadinessNarrativeProvider,
  ReadinessNarrativeInput,
  ReadinessNarrativeResult,
} from '../../domain/interfaces/readiness-narrative-provider.interface';

interface ProviderResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

function parseResult(content: string): ReadinessNarrativeResult {
  const parsed: unknown = JSON.parse(content);
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid narrative response');
  const value = parsed as { explanation?: unknown; recommendations?: unknown };
  if (typeof value.explanation !== 'string' || !Array.isArray(value.recommendations)) {
    throw new Error('Invalid narrative response');
  }
  const recommendations = value.recommendations.filter(
    (item): item is string => typeof item === 'string',
  );
  if (recommendations.length === 0) throw new Error('Invalid narrative response');
  return { explanation: value.explanation, recommendations: recommendations.slice(0, 3) };
}

@Injectable()
export class OpenAiCompatibleReadinessProvider implements IReadinessNarrativeProvider {
  async generate(input: ReadinessNarrativeInput): Promise<ReadinessNarrativeResult> {
    const endpoint = process.env.READINESS_AI_ENDPOINT;
    const apiKey = process.env.READINESS_AI_API_KEY;
    const model = process.env.READINESS_AI_MODEL;
    if (!endpoint || !apiKey || !model) throw new Error('Readiness AI provider is not configured');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Explain the supplied interview-readiness evidence without changing scores or implying hiring probability. Return JSON with explanation and up to three recommendations.',
          },
          { role: 'user', content: JSON.stringify(input) },
        ],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Readiness AI request failed with ${response.status}`);
    const payload = (await response.json()) as ProviderResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error('Readiness AI response was empty');
    return parseResult(content);
  }
}
