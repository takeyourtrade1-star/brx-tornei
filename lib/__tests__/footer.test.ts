import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { COMPANY_INFO } from '@/lib/legal/company-info';

describe('footer and conditional footer contract', () => {
  it('defines company and legal information correctly', () => {
    expect(COMPANY_INFO.legalName).toBe('PHONEX SRL');
    expect(COMPANY_INFO.tradeName).toBe('Ebartex');
    expect(COMPANY_INFO.legalAddress).toContain('Ivrea');
    expect(COMPANY_INFO.vatNumber).toBe('13355310015');
    expect(COMPANY_INFO.pec).toBe('phonex@pecamministratore.it');
  });

  it('hides the footer on live match and webcam companion pages', () => {
    const conditionalFooterSource = readFileSync(
      new URL('../../components/layout/ConditionalFooter.tsx', import.meta.url),
      'utf8',
    );

    expect(conditionalFooterSource).toContain("pathname.includes('/live')");
    expect(conditionalFooterSource).toContain("pathname.startsWith('/tornei/webcam')");
  });

  it('contains locked language selector with Italian active and others disabled', () => {
    const footerSource = readFileSync(
      new URL('../../components/layout/Footer.tsx', import.meta.url),
      'utf8',
    );

    expect(footerSource).toContain("title: 'Lingua del sito'");
    expect(footerSource).toContain("label: 'Italiano', href: '#', active: true");
    expect(footerSource).toContain("label: 'English', href: '#', disabled: true");
    expect(footerSource).toContain("label: 'Deutsch', href: '#', disabled: true");
    expect(footerSource).toContain("label: 'Español', href: '#', disabled: true");
    expect(footerSource).toContain("label: 'Français', href: '#', disabled: true");
    expect(footerSource).toContain("label: 'Português', href: '#', disabled: true");
    expect(footerSource).toContain('cursor-not-allowed');
    expect(footerSource).toContain('In arrivo');
  });

  it('includes features, legal, guides, and games columns aligned with main site', () => {
    const footerSource = readFileSync(
      new URL('../../components/layout/Footer.tsx', import.meta.url),
      'utf8',
    );

    expect(footerSource).toContain("title: 'Funzionalità'");
    expect(footerSource).toContain("title: 'Aiuto & Regolamento'");
    expect(footerSource).toContain("title: 'Guide'");
    expect(footerSource).toContain("title: 'Giochi'");
    expect(footerSource).toContain('Fatto con cura ad Ivrea');
    expect(footerSource).toContain('Tutti i marchi, i nomi dei giochi e le immagini delle carte');
  });

  it('is integrated into root layout', () => {
    const layoutSource = readFileSync(
      new URL('../../app/layout.tsx', import.meta.url),
      'utf8',
    );

    expect(layoutSource).toContain("import { ConditionalFooter } from '@/components/layout/ConditionalFooter'");
    expect(layoutSource).toContain('<ConditionalFooter />');
  });
});
