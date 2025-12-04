/**
 * Bun test setup and configuration.
 * Runs before all test specs.
 */

import { beforeEach, afterEach } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'

// Register happy-dom for DOM APIs in tests
GlobalRegistrator.register()

// Add custom setup if needed
beforeEach(() => {
	// Setup that runs before each test
})

afterEach(() => {
	// Cleanup after each test
})
