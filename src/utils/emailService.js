/**
 * Email Service for NosytLabs
 * Handles contact form submissions and email notifications
 */

// Email service configuration
const EMAIL_CONFIG = {
  // For production, use environment variables
  apiKey: process.env.EMAIL_API_KEY || 'demo-key',
  fromEmail: 'noreply@nosytlabs.com',
  toEmail: 'info@nosytlabs.com',
  adminEmail: 'admin@nosytlabs.com',
  
  // Email templates
  templates: {
    contact: 'contact-form',
    booking: 'service-booking',
    newsletter: 'newsletter-signup',
    admin: 'admin-notification'
  }
};

// Simple email validation
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sanitize input to prevent XSS
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Email service class
class EmailService {
  constructor() {
    this.isDemo = true; // Set to false in production
  }

  // Send contact form email
  async sendContactForm(formData) {
    try {
      // Validate required fields
      const { name, email, subject, message } = formData;
      
      if (!name || !email || !subject || !message) {
        throw new Error('All fields are required');
      }

      if (!validateEmail(email)) {
        throw new Error('Invalid email address');
      }

      // Sanitize inputs
      const sanitizedData = {
        name: sanitizeInput(name),
        email: sanitizeInput(email),
        subject: sanitizeInput(subject),
        message: sanitizeInput(message),
        timestamp: new Date().toISOString(),
        ip: formData.ip || 'unknown',
        userAgent: formData.userAgent || 'unknown'
      };

      // In demo mode, just log and return success
      if (this.isDemo) {
        console.log('📧 Contact Form Submission (Demo Mode):', sanitizedData);
        
        // Simulate email sending delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Store in localStorage for demo purposes
        this.storeContactSubmission(sanitizedData);
        
        return {
          success: true,
          message: 'Thank you for your message! We\'ll get back to you soon.',
          id: this.generateId()
        };
      }

      // In production, integrate with actual email service
      return await this.sendProductionEmail('contact', sanitizedData);
      
    } catch (error) {
      console.error('Email service error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send message. Please try again.'
      };
    }
  }

  // Send service booking email
  async sendBookingForm(formData) {
    try {
      const { name, email, service, budget, timeline, description } = formData;
      
      if (!name || !email || !service) {
        throw new Error('Name, email, and service are required');
      }

      if (!validateEmail(email)) {
        throw new Error('Invalid email address');
      }

      const sanitizedData = {
        name: sanitizeInput(name),
        email: sanitizeInput(email),
        service: sanitizeInput(service),
        budget: sanitizeInput(budget),
        timeline: sanitizeInput(timeline),
        description: sanitizeInput(description),
        timestamp: new Date().toISOString(),
        ip: formData.ip || 'unknown'
      };

      if (this.isDemo) {
        console.log('📅 Service Booking Submission (Demo Mode):', sanitizedData);
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.storeBookingSubmission(sanitizedData);
        
        return {
          success: true,
          message: 'Booking request received! We\'ll contact you within 24 hours.',
          id: this.generateId()
        };
      }

      return await this.sendProductionEmail('booking', sanitizedData);
      
    } catch (error) {
      console.error('Booking service error:', error);
      return {
        success: false,
        message: error.message || 'Failed to submit booking. Please try again.'
      };
    }
  }

  // Newsletter signup
  async subscribeNewsletter(email, name = '') {
    try {
      if (!validateEmail(email)) {
        throw new Error('Invalid email address');
      }

      const sanitizedData = {
        email: sanitizeInput(email),
        name: sanitizeInput(name),
        timestamp: new Date().toISOString(),
        source: 'website'
      };

      if (this.isDemo) {
        console.log('📰 Newsletter Subscription (Demo Mode):', sanitizedData);
        await new Promise(resolve => setTimeout(resolve, 500));
        this.storeNewsletterSubscription(sanitizedData);
        
        return {
          success: true,
          message: 'Successfully subscribed to our newsletter!'
        };
      }

      return await this.sendProductionEmail('newsletter', sanitizedData);
      
    } catch (error) {
      console.error('Newsletter service error:', error);
      return {
        success: false,
        message: error.message || 'Failed to subscribe. Please try again.'
      };
    }
  }

  // Store submissions in localStorage for demo
  storeContactSubmission(data) {
    const submissions = JSON.parse(localStorage.getItem('nosytlabs_contact_submissions') || '[]');
    submissions.unshift({ ...data, id: this.generateId() });
    localStorage.setItem('nosytlabs_contact_submissions', JSON.stringify(submissions.slice(0, 50)));
  }

  storeBookingSubmission(data) {
    const bookings = JSON.parse(localStorage.getItem('nosytlabs_booking_submissions') || '[]');
    bookings.unshift({ ...data, id: this.generateId() });
    localStorage.setItem('nosytlabs_booking_submissions', JSON.stringify(bookings.slice(0, 50)));
  }

  storeNewsletterSubscription(data) {
    const subscriptions = JSON.parse(localStorage.getItem('nosytlabs_newsletter_subscriptions') || '[]');
    subscriptions.unshift({ ...data, id: this.generateId() });
    localStorage.setItem('nosytlabs_newsletter_subscriptions', JSON.stringify(subscriptions.slice(0, 100)));
  }

  // Get stored submissions (for admin panel)
  getContactSubmissions() {
    return JSON.parse(localStorage.getItem('nosytlabs_contact_submissions') || '[]');
  }

  getBookingSubmissions() {
    return JSON.parse(localStorage.getItem('nosytlabs_booking_submissions') || '[]');
  }

  getNewsletterSubscriptions() {
    return JSON.parse(localStorage.getItem('nosytlabs_newsletter_subscriptions') || '[]');
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Production email sending (placeholder for actual service integration)
  async sendProductionEmail(type, data) {
    // This would integrate with services like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Nodemailer with SMTP
    
    const emailData = {
      to: EMAIL_CONFIG.toEmail,
      from: EMAIL_CONFIG.fromEmail,
      subject: this.getEmailSubject(type, data),
      html: this.generateEmailHTML(type, data),
      text: this.generateEmailText(type, data)
    };

    // Example SendGrid integration:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(EMAIL_CONFIG.apiKey);
    
    try {
      await sgMail.send(emailData);
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      throw new Error('Failed to send email');
    }
    */

    // For now, return success (implement actual service in production)
    return {
      success: true,
      message: 'Email sent successfully',
      id: this.generateId()
    };
  }

  // Generate email subject based on type
  getEmailSubject(type, data) {
    switch (type) {
      case 'contact':
        return `[NosytLabs] Contact Form: ${data.subject}`;
      case 'booking':
        return `[NosytLabs] Service Booking: ${data.service}`;
      case 'newsletter':
        return `[NosytLabs] Newsletter Subscription`;
      default:
        return `[NosytLabs] Website Notification`;
    }
  }

  // Generate HTML email content
  generateEmailHTML(type, data) {
    const baseStyle = `
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4C1D95, #FF6B00); color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #4C1D95; }
      </style>
    `;

    switch (type) {
      case 'contact':
        return `
          ${baseStyle}
          <div class="container">
            <div class="header">
              <h1>New Contact Form Submission</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Name:</div>
                <div>${data.name}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div>${data.email}</div>
              </div>
              <div class="field">
                <div class="label">Subject:</div>
                <div>${data.subject}</div>
              </div>
              <div class="field">
                <div class="label">Message:</div>
                <div>${data.message.replace(/\n/g, '<br>')}</div>
              </div>
              <div class="field">
                <div class="label">Submitted:</div>
                <div>${new Date(data.timestamp).toLocaleString()}</div>
              </div>
            </div>
            <div class="footer">
              <p>NosytLabs - Notable Opportunities Shape Your Tomorrow</p>
            </div>
          </div>
        `;

      case 'booking':
        return `
          ${baseStyle}
          <div class="container">
            <div class="header">
              <h1>New Service Booking Request</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Name:</div>
                <div>${data.name}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div>${data.email}</div>
              </div>
              <div class="field">
                <div class="label">Service:</div>
                <div>${data.service}</div>
              </div>
              <div class="field">
                <div class="label">Budget:</div>
                <div>${data.budget || 'Not specified'}</div>
              </div>
              <div class="field">
                <div class="label">Timeline:</div>
                <div>${data.timeline || 'Not specified'}</div>
              </div>
              <div class="field">
                <div class="label">Description:</div>
                <div>${(data.description || 'No description provided').replace(/\n/g, '<br>')}</div>
              </div>
              <div class="field">
                <div class="label">Submitted:</div>
                <div>${new Date(data.timestamp).toLocaleString()}</div>
              </div>
            </div>
            <div class="footer">
              <p>NosytLabs - Notable Opportunities Shape Your Tomorrow</p>
            </div>
          </div>
        `;

      default:
        return `
          ${baseStyle}
          <div class="container">
            <div class="header">
              <h1>NosytLabs Notification</h1>
            </div>
            <div class="content">
              <p>New notification from NosytLabs website.</p>
              <pre>${JSON.stringify(data, null, 2)}</pre>
            </div>
            <div class="footer">
              <p>NosytLabs - Notable Opportunities Shape Your Tomorrow</p>
            </div>
          </div>
        `;
    }
  }

  // Generate plain text email content
  generateEmailText(type, data) {
    switch (type) {
      case 'contact':
        return `
New Contact Form Submission

Name: ${data.name}
Email: ${data.email}
Subject: ${data.subject}
Message: ${data.message}
Submitted: ${new Date(data.timestamp).toLocaleString()}

--
NosytLabs - Notable Opportunities Shape Your Tomorrow
        `.trim();

      case 'booking':
        return `
New Service Booking Request

Name: ${data.name}
Email: ${data.email}
Service: ${data.service}
Budget: ${data.budget || 'Not specified'}
Timeline: ${data.timeline || 'Not specified'}
Description: ${data.description || 'No description provided'}
Submitted: ${new Date(data.timestamp).toLocaleString()}

--
NosytLabs - Notable Opportunities Shape Your Tomorrow
        `.trim();

      default:
        return `
NosytLabs Notification

${JSON.stringify(data, null, 2)}

--
NosytLabs - Notable Opportunities Shape Your Tomorrow
        `.trim();
    }
  }
}

// Create global email service instance
const emailService = new EmailService();

export default emailService;

// Client-side form handlers
export const formHandlers = {
  // Contact form handler
  async handleContactForm(formElement) {
    const formData = new FormData(formElement);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
      ip: await this.getClientIP(),
      userAgent: navigator.userAgent
    };

    return await emailService.sendContactForm(data);
  },

  // Booking form handler
  async handleBookingForm(formElement) {
    const formData = new FormData(formElement);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      service: formData.get('service'),
      budget: formData.get('budget'),
      timeline: formData.get('timeline'),
      description: formData.get('description'),
      ip: await this.getClientIP()
    };

    return await emailService.sendBookingForm(data);
  },

  // Newsletter subscription handler
  async handleNewsletterForm(formElement) {
    const formData = new FormData(formElement);
    const email = formData.get('email');
    const name = formData.get('name') || '';

    return await emailService.subscribeNewsletter(email, name);
  },

  // Get client IP (for demo purposes)
  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  },

  // Show form feedback
  showFormFeedback(formElement, result) {
    // Remove existing feedback
    const existingFeedback = formElement.querySelector('.form-feedback');
    if (existingFeedback) {
      existingFeedback.remove();
    }

    // Create feedback element
    const feedback = document.createElement('div');
    feedback.className = `form-feedback ${result.success ? 'success' : 'error'}`;
    feedback.innerHTML = `
      <div class="feedback-content">
        <div class="feedback-icon">
          ${result.success ? '✅' : '❌'}
        </div>
        <div class="feedback-message">
          ${result.message}
        </div>
      </div>
    `;

    // Add styles
    feedback.style.cssText = `
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 0.5rem;
      background-color: ${result.success ? '#d1fae5' : '#fee2e2'};
      border: 1px solid ${result.success ? '#10b981' : '#ef4444'};
      color: ${result.success ? '#065f46' : '#991b1b'};
    `;

    const feedbackContent = feedback.querySelector('.feedback-content');
    feedbackContent.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `;

    // Insert feedback
    formElement.appendChild(feedback);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.remove();
      }
    }, 5000);
  }
};
