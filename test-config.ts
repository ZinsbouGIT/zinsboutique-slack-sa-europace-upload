import { config } from './src/utils/config';

console.log('Current configuration:');
console.log('EUROPACE_TEST_MODE env var:', process.env.EUROPACE_TEST_MODE);
console.log('config.europace.testMode:', config.europace.testMode);
console.log('Will send datenkontext:', config.europace.testMode ? 'TEST_MODUS' : 'ECHT_GESCHAEFT');
