import { HtmlSanitizerService } from '@/shared/services/html-sanitizer.service';

describe('HtmlSanitizerService', () => {
  let service: HtmlSanitizerService;

  beforeEach(() => {
    service = new HtmlSanitizerService();
  });

  it('removes scripts, event handlers, and unsafe style attributes', () => {
    const sanitized = service.sanitizeHtml('<p onclick="alert(1)" style="color:red">Hi</p><script>alert(1)</script>');

    expect(sanitized).toBe('<p>Hi</p>');
  });

  it('rejects dangerous URL protocols in links and images', () => {
    const sanitized = service.sanitizeHtml(
      '<a href="javascript:alert(1)">bad</a><img src="data:text/html;base64,PHNjcmlwdA==" alt="x">',
    );

    expect(sanitized).toBe('<a>bad</a><img alt="x">');
  });

  it('keeps safe links while normalizing target blank', () => {
    const sanitized = service.sanitizeHtml('<a href="https://chabaqa.io/path?a=1&b=2" target="_blank">ok</a>');

    expect(sanitized).toBe('<a href="https://chabaqa.io/path?a=1&amp;b=2" target="_blank" rel="noopener noreferrer">ok</a>');
  });

  it('validates URLs with an explicit protocol allowlist', () => {
    expect(service.sanitizeUrl('https://chabaqa.io')).toBe('https://chabaqa.io/');
    expect(service.sanitizeUrl('javascript:alert(1)')).toBeNull();
    expect(service.sanitizeUrl('/uploads/image/a.png', { allowRelative: true })).toBe('/uploads/image/a.png');
  });
});
