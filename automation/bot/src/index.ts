import { runOrchestrator } from './orchestrator.js';

async function main() {
  try {
    const result = await runOrchestrator();
    if (result) {
      console.log('✅ Orchestrator execution completed successfully.');
      console.log(`Token ID: ${result.tokenId}`);
      console.log(`OpenSea URL: ${result.openSeaUrl}`);
    } else {
      console.log('ℹ️ Orchestrator execution skipped due to idempotency guard.');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Orchestrator execution failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
