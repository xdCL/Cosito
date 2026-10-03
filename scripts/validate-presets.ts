import { BUILTIN_SIZE_PRESETS } from '../src/config/builtin-presets';
import { validatePresetRegistry } from '../src/presets/validation';
validatePresetRegistry(BUILTIN_SIZE_PRESETS);
console.log('Registro de presets válido.');
