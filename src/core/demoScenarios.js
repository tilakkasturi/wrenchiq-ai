// Click-through demo scripts for the repair order agent, from resources/demo. Refilled in place when
// the file changes (see liveResource.js), so the Demo menu picks up edits without a reload.
import DEMO_FILE from '../../resources/demo/core_demo_scenarios.json';
import { liveStore, refillObject, resourceLoaded } from './liveResource';

export const DEMOS = refillObject(liveStore('demoScenarios', () => ({})), DEMO_FILE);

resourceLoaded('demo scenarios');
if (import.meta.hot) import.meta.hot.accept();
