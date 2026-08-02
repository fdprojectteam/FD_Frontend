import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';

import { banks } from '../data';
import { applyLatency, readScenario, scenarioResponses } from './scenarios';

/** Bank handlers (M2.1) — featured strip and bank filter source. */
export const bankHandlers = [
  http.get(`${env.apiUrl}/banks`, async ({ request }) => {
    const scenario = readScenario(new URL(request.url));
    await applyLatency(scenario);

    if (scenario === 'error') return scenarioResponses.serverError();

    return HttpResponse.json({
      success: true,
      message: 'Banks retrieved successfully.',
      data: scenario === 'empty' ? [] : banks,
    });
  }),
];
