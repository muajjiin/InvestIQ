import { sendWelcomeEmail, sendNewsSummaryEmail, transporter } from '../index';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
  })),
}));

describe('Nodemailer Module', () => {
  let mockSendMail: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendMail = transporter.sendMail as jest.Mock;
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct parameters', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-message-id' });

      await sendWelcomeEmail({
        email: 'user@example.com',
        name: 'John Doe',
        intro: '<p>Welcome to InvestIQ\\!</p>',
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMail.mock.calls[0][0];

      expect(callArgs.from).toBe('"InvestIQ"<korosenseimark40@gmail.com>');
      expect(callArgs.to).toBe('user@example.com');
      expect(callArgs.subject).toBe('Welcome to InvestIQ - Let\'s Get Started\\! 🚀');
      expect(callArgs.text).toBe('Welcome to InvestIQ');
      expect(callArgs.html).toContain('{{name}}');
      expect(callArgs.html).toContain('{{intro}}');
    });

    it('should replace name placeholder in template', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-message-id' });

      await sendWelcomeEmail({
        email: 'user@example.com',
        name: 'Jane Smith',
        intro: '<p>Intro text</p>',
      });

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).not.toContain('{{name}}');
      expect(callArgs.html).toContain('Jane Smith');
    });

    it('should replace intro placeholder in template', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-message-id' });

      const customIntro = '<p class="test">Custom welcome message</p>';
      await sendWelcomeEmail({
        email: 'user@example.com',
        name: 'Test User',
        intro: customIntro,
      });

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).not.toContain('{{intro}}');
      expect(callArgs.html).toContain(customIntro);
    });

    it('should handle sendMail errors', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      await expect(
        sendWelcomeEmail({
          email: 'user@example.com',
          name: 'Test User',
          intro: '<p>Test</p>',
        })
      ).rejects.toThrow('SMTP Error');
    });

    it('should handle special characters in email', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-message-id' });

      await sendWelcomeEmail({
        email: 'user+test@example.com',
        name: "O'Connor",
        intro: '<p>Test & Special <chars></p>',
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe('user+test@example.com');
      expect(callArgs.html).toContain("O'Connor");
    });
  });

  describe('sendNewsSummaryEmail', () => {
    it('should send news summary email with correct parameters', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-message-id' });

      await sendNewsSummaryEmail({
        email: 'user@example.com',
        date: 'Monday, January 15, 2024',
        newsContent: '<div>News content here</div>',
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMail.mock.calls[0][0];

      expect(callArgs.from).toBe('"InvestIQ News"<korosenseimark40@gmail.com>');
      expect(callArgs.to).toBe('user@example.com');
      expect(callArgs.subject).toBe('📈 Market News Summary Today - Monday, January 15, 2024');
      expect(callArgs.text).toBe("Today's market news summary from InvestIQ");
      expect(callArgs.html).toContain('{{date}}');
      expect(callArgs.html).toContain('{{newsContent}}');
    });

    it('should replace date placeholder in template', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-message-id' });

      const date = 'Friday, December 25, 2024';
      await sendNewsSummaryEmail({
        email: 'user@example.com',
        date,
        newsContent: '<div>News</div>',
      });

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).not.toContain('{{date}}');
      expect(callArgs.html).toContain(date);
      expect(callArgs.subject).toContain(date);
    });

    it('should replace newsContent placeholder in template', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-message-id' });

      const newsContent = '<div class="news"><h3>Breaking News</h3><p>Market update...</p></div>';
      await sendNewsSummaryEmail({
        email: 'user@example.com',
        date: 'Today',
        newsContent,
      });

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).not.toContain('{{newsContent}}');
      expect(callArgs.html).toContain(newsContent);
    });

    it('should handle sendMail errors', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP Connection Failed'));

      await expect(
        sendNewsSummaryEmail({
          email: 'user@example.com',
          date: 'Today',
          newsContent: '<div>News</div>',
        })
      ).rejects.toThrow('SMTP Connection Failed');
    });

    it('should handle empty news content', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-message-id' });

      await sendNewsSummaryEmail({
        email: 'user@example.com',
        date: 'Today',
        newsContent: '',
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toBeDefined();
    });

    it('should handle multiple replacements correctly', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-message-id' });

      const date = 'Test Date';
      const newsContent = '<div>Test Content</div>';
      
      await sendNewsSummaryEmail({
        email: 'user@example.com',
        date,
        newsContent,
      });

      const callArgs = mockSendMail.mock.calls[0][0];
      // Count occurrences of date in the HTML
      const dateCount = callArgs.html.split(date).length - 1;
      expect(dateCount).toBeGreaterThan(0);
      
      // Verify newsContent is present
      expect(callArgs.html).toContain(newsContent);
      
      // Verify no placeholders remain
      expect(callArgs.html).not.toContain('{{date}}');
      expect(callArgs.html).not.toContain('{{newsContent}}');
    });
  });

  describe('transporter', () => {
    it('should be properly configured', () => {
      expect(transporter).toBeDefined();
      expect(transporter.sendMail).toBeDefined();
    });
  });
});