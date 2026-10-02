/**
 * Tests for services/createPDF.ts's pageRender — pure HTML-building
 * function, no Puppeteer involved, so it's safe/fast to test directly.
 *
 * Also covers issue #154 (see bottom describe block) — createCV's
 * executable-path resolution for Puppeteer's Chrome/Chromium launch.
 */

import { pageRender, createCV } from '@/services/createPDF';
import puppeteer from 'puppeteer';

describe('pageRender', () => {
  it('renders career and careerGoal into the PDF content (issue #87)', () => {
    const { html } = pageRender({
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      generalInformation: {
        career: 'Backend Developer',
        careerGoal: 'Trở thành Tech Lead trong 3 năm tới',
        personalSkills: [],
        professionalSkills: [],
      },
    });

    expect(html).toContain('Backend Developer');
    expect(html).toContain('Trở thành Tech Lead trong 3 năm tới');
    // _boxContent() uppercases its title heading — match the real output.
    expect(html).toContain('ĐỊNH HƯỚNG NGHỀ NGHIỆP');
  });

  it('omits the career box entirely when both fields are empty', () => {
    const { html } = pageRender({
      email: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      generalInformation: {
        career: '',
        careerGoal: '',
        personalSkills: [],
        professionalSkills: [],
      },
    });

    expect(html).not.toContain('ĐỊNH HƯỚNG NGHỀ NGHIỆP');
  });

  it('renders only whichever of career/careerGoal is present', () => {
    const { html } = pageRender({
      email: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      generalInformation: {
        career: 'QA Engineer',
        careerGoal: '',
        personalSkills: [],
        professionalSkills: [],
      },
    });

    expect(html).toContain('QA Engineer');
    expect(html).toContain('ĐỊNH HƯỚNG NGHỀ NGHIỆP');
    expect(html).not.toContain('Mục tiêu nghề nghiệp');
  });
});

// Puppeteer's own `launch()` is mocked out entirely — no real browser is
// spawned, keeping this fast/safe to run anywhere (no Chrome install
// required in the test environment). Only the executablePath resolution
// logic (the part issue #154 is about) is under test.
jest.mock('puppeteer', () => ({ launch: jest.fn() }));

function createFakeBrowser() {
  return {
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(Buffer.from('fake-pdf-bytes')),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

function createFakeRes() {
  return { contentType: jest.fn(), send: jest.fn() };
}

describe('createCV executablePath resolution (issue #154)', () => {
  const ORIGINAL_ENV = process.env['PUPPETEER_EXECUTABLE_PATH'];

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) delete process.env['PUPPETEER_EXECUTABLE_PATH'];
    else process.env['PUPPETEER_EXECUTABLE_PATH'] = ORIGINAL_ENV;
    jest.clearAllMocks();
  });

  it('launches with no hardcoded executablePath when PUPPETEER_EXECUTABLE_PATH is unset (Puppeteer resolves its own bundled Chromium)', async () => {
    delete process.env['PUPPETEER_EXECUTABLE_PATH'];
    (puppeteer.launch as jest.Mock).mockResolvedValue(createFakeBrowser());

    await createCV({ email: 'a@b.com' }, createFakeRes() as any);

    expect(puppeteer.launch).toHaveBeenCalledWith(expect.not.objectContaining({ executablePath: expect.anything() }));
  });

  it('launches with the given executablePath when PUPPETEER_EXECUTABLE_PATH is set (CI/Docker override)', async () => {
    process.env['PUPPETEER_EXECUTABLE_PATH'] = '/usr/bin/chromium';
    (puppeteer.launch as jest.Mock).mockResolvedValue(createFakeBrowser());

    await createCV({ email: 'a@b.com' }, createFakeRes() as any);

    expect(puppeteer.launch).toHaveBeenCalledWith(expect.objectContaining({ executablePath: '/usr/bin/chromium' }));
  });
});
