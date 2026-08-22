import type { KycMethod } from '@/types/investor';

/**
 * The verification routes the platform models, and which of them actually run.
 *
 * ## The registry is the extension seam
 *
 * Doc 10 asks the platform to reuse verified investor information; the routes
 * below are how that information would arrive. Declaring them as data — rather
 * than as branches inside a screen — is what lets a real integration be added by
 * flipping `availability` and supplying a client, with **no change to the
 * customer experience**. `deriveKycReadiness` already reads this list.
 *
 * ## ⚠ Only one route is connected, and the rest say so
 *
 * This build has no CKYC client, no DigiLocker consent flow, no Aadhaar e-KYC
 * licence and no Video-CIP provider. Marking them `available` would put a
 * control on screen that cannot work, and — far worse on an identity screen —
 * would imply the platform has a regulatory permission it does not hold.
 *
 * So exactly one route is `available`: reusing what the platform already holds,
 * confirmed by the investor. That is a real capability of this build, and it is
 * the one the north-star experience actually depends on.
 */
export const KYC_METHODS: readonly KycMethod[] = [
  {
    id: 'existing-kyc',
    label: 'Use my verified details',
    description: 'Confirm the details already on file. Nothing new to type.',
    availability: 'available',
  },
  {
    id: 'ckyc',
    label: 'Central KYC records',
    description: 'Fetch your existing KYC record from the central registry.',
    availability: 'not-connected',
  },
  {
    id: 'digilocker',
    label: 'DigiLocker',
    description: 'Share your documents securely from DigiLocker, with your consent.',
    availability: 'not-connected',
  },
  {
    id: 'aadhaar-ekyc',
    label: 'Aadhaar verification',
    description: 'Verify using Aadhaar, where the partner bank permits it.',
    availability: 'not-connected',
  },
  {
    id: 'video-cip',
    label: 'Video verification',
    description: 'A short guided video call with a verification officer.',
    availability: 'not-connected',
  },
  {
    id: 'assisted',
    label: 'Help me verify',
    description: 'Our team completes the verification with you.',
    availability: 'not-connected',
  },
] as const;

/** The method for an id, or `undefined` when it is not modelled. */
export function findKycMethod(id: string): KycMethod | undefined {
  return KYC_METHODS.find((method) => method.id === id);
}
