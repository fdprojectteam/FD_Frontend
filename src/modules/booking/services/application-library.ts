import { APPLICATION_TEMPLATES } from '../fixtures/application-templates';
import type { ApplicationTemplate } from '../types/application';

/**
 * institution + product → application template.
 *
 * ## One institution identity, not a second
 *
 * The key is `Bank.id`, which the selected deposit already carries. There is no
 * bank registry here and no mapping table from product to institution — the
 * deposit knows who it is with, and this reads that.
 *
 * ## Resolution is explicit about absence
 *
 * `null` for an institution with no template, rather than a default or the
 * first entry in the list. A generic form standing in for a bank's actual
 * application is exactly the invention this module must not make: the screen
 * says the application is not ready and the customer is not blocked from
 * understanding why.
 *
 * ## Versions
 *
 * The highest `version` for an institution wins, so a new revision is added
 * rather than edited in place — the old one stays readable for any booking that
 * referenced it.
 */
export interface ApplicationLibrary {
  /** The current template for an institution's fixed deposits, or `null`. */
  findTemplate(institutionId: string, productType?: 'fixed-deposit'): ApplicationTemplate | null;
  /** A template by its own id — for a booking that recorded which one it used. */
  findTemplateById(templateId: string): ApplicationTemplate | null;
  /** Every institution the library can serve. */
  supportedInstitutionIds(): readonly string[];
}

export function createApplicationLibrary(
  templates: readonly ApplicationTemplate[] = APPLICATION_TEMPLATES,
): ApplicationLibrary {
  return {
    findTemplate(institutionId, productType = 'fixed-deposit') {
      const matches = templates.filter(
        (template) =>
          template.institutionId === institutionId && template.productType === productType,
      );

      if (matches.length === 0) return null;

      /*
        Highest version wins. Reduce rather than sort: the list is shared and
        sorting it in place would reorder it for every other caller.
      */
      return matches.reduce((best, candidate) =>
        candidate.version > best.version ? candidate : best,
      );
    },

    findTemplateById(templateId) {
      return templates.find((template) => template.id === templateId) ?? null;
    },

    supportedInstitutionIds() {
      return [...new Set(templates.map((template) => template.institutionId))];
    },
  };
}
