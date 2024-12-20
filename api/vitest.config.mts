import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
	test: {
		poolOptions: {
			workers: {
				wrangler: { configPath: './wrangler.toml' },
			},
		},
		coverage: {
			provider: 'istanbul',
			thresholds: {
				lines: 80,
				functions: 80,
				branches: 80,
				statements: 80
			}
		}
	},
});
