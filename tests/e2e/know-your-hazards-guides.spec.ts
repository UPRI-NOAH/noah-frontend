import { test, expect, Page } from '../support/test';
import {
  DEFAULT_HAZARDS,
  ExposureLevel,
  expectedExposure,
} from '../support/mock-data';

/**
 * Hazard guides rendered in the Know Your Hazards sidebar:
 * /know-your-hazards/flood, /landslide and /storm-surge, each ending with the
 * shared survival kit checklist.
 */

const SURVIVAL_KIT = [
  'Water: one gallon per person',
  'Food: non-perishable, easy-to-prepare items',
  'Flashlight',
  'First-Aid Kit',
  'Medications and medical items',
  'Sanitation and personal hygiene',
  'Copies of personal documents (IDs, proof of address, passports, insurance policies, birth certificates)',
  'Cellphone with chargers',
  'Family and emergency contact information',
  'Extra cash',
  'Emergency blanket(s)',
];

const TEXT_CLASS: Record<ExposureLevel, string> = {
  high: 'text-noah-red-high',
  medium: 'text-noah-red-medium',
  low: 'text-noah-red-low',
  unavailable: 'text-noah-red-unavailable',
  'little to none': 'text-noah-black-high',
};

const exposure = expectedExposure(DEFAULT_HAZARDS);

const GUIDES = [
  {
    type: 'flood',
    component: 'noah-flood',
    title: 'Know Your Hazard: Flooding',
    keyword: 'Flooding',
    sections: ['What To Do During Flood'],
    tips: [
      'Be prepared to evacuate immediately when there’s an alert for heavy rainfall.',
      'Refrain from walking through floodwater most especially without wearing protective gear like boots.',
      'Don’t walk or drive through moving water. It can sweep you and your car away.',
      'Turn off all electrical appliances and LPG tank; turn off the main power switch as needed.',
    ],
    illustrations: [
      'flood-evacuate',
      'flood-boots',
      'flood-dont-walk',
      'flood-switch',
    ],
  },
  {
    type: 'landslide',
    component: 'noah-landslides',
    title: 'Know Your Hazard: Landslides',
    keyword: 'landslide',
    sections: [
      'How To Prepare For Landslides',
      'Surviving A Landslide',
      'After A Landslide',
    ],
    tips: [
      'Evacuate immediately when there’s an alert for heavy rainfall or as advised by your local authorities.',
      'If caught in landslide debris, continue to move and make noise to alert rescuers.',
      'Stay away from damaged power lines and report them immediately.',
    ],
    illustrations: [
      'landslide-evacuate',
      'landslide-exit',
      'landslide-listen',
      'landslide-noise',
      'landslide-safe',
      'landslide-power',
    ],
  },
  {
    type: 'storm-surge',
    component: 'noah-storm-surge',
    title: 'Know Your Hazard: Storm Surge',
    keyword: 'storm surge',
    sections: ['How To Prepare For Storm Surges'],
    tips: [
      'Evacuate immediately and move to a more elevated area',
      'Always have a survival kit ready and accessible.',
    ],
    illustrations: [
      'storm-surge-evacuate',
      'storm-surge-exit',
      'storm-surge-listen',
    ],
  },
] as const;

const guide = (page: Page, component: string) =>
  page.locator(component).filter({ visible: true });

for (const g of GUIDES) {
  test.describe(`${g.title} guide`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/know-your-hazards/${g.type}`);
    });

    test('shows the title, guidance and illustrations', async ({ page }) => {
      const root = guide(page, g.component);
      await expect(root.getByRole('heading', { name: g.title })).toBeVisible();
      for (const section of g.sections) {
        await expect(
          root.getByRole('heading', { name: section })
        ).toBeVisible();
      }
      for (const tip of g.tips) {
        await expect(root.getByText(tip, { exact: false })).toBeVisible();
      }
      for (const name of g.illustrations) {
        const img = root.locator(
          `img[src="assets/images/${g.type}/${name}.svg"]`
        );
        await expect(img).toBeVisible();
        expect(
          await img.evaluate((el: HTMLImageElement) => el.naturalWidth)
        ).toBeGreaterThan(0);
      }
    });

    test('highlights the hazard in the colour of the local exposure level', async ({
      page,
    }) => {
      const level = exposure[g.type];
      const keyword = guide(page, g.component).locator('b', {
        hasText: new RegExp(`^\\s*${g.keyword}\\s*$`),
      });
      await expect(keyword).toHaveClass(new RegExp(TEXT_CLASS[level]));
    });

    test('ends with the survival kit checklist', async ({ page }) => {
      const kit = guide(page, g.component).locator('noah-survival-kit');
      await expect(
        kit.getByRole('heading', { name: 'Survival Kit' })
      ).toBeVisible();
      for (const item of SURVIVAL_KIT) {
        await expect(kit.getByText(item, { exact: true })).toBeVisible();
      }
      await expect(
        kit.locator('img[src^="assets/images/survival-kit/"]')
      ).toHaveCount(SURVIVAL_KIT.length);
    });

    test('the back button returns to the assessment', async ({ page }) => {
      await guide(page, g.component).getByRole('button').first().click();
      await expect(page).toHaveURL(/\/know-your-hazards$/);
      await expect(
        page.getByText('Hazard Levels In Your Area').filter({ visible: true })
      ).toBeVisible();
    });
  });
}

test('the bibliography can be opened inside the Know Your Hazards sidebar', async ({
  page,
}) => {
  await page.goto('/know-your-hazards/bibliography');
  await expect(
    page.getByRole('heading', { name: 'International Publication References' })
  ).toBeVisible();
  await expect(page.locator('#map-kyh')).toBeAttached();
});
