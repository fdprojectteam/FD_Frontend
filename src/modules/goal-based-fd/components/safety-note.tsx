/**
 * Re-export of the platform coverage note.
 *
 * The component moved to `components/business` when Booking needed the same
 * sentence: the client document requires the note at recommendation *and* at
 * booking, those are two modules, and module → module is forbidden. A second
 * copy of a compliance sentence would drift, silently.
 *
 * This file stays as the module's local name for it so nothing above changes,
 * and because this environment cannot delete files.
 */
export { SafetyNote } from '@/components/business';
