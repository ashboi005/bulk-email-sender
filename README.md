# Bulk Email Sender

A modern, frontend-heavy bulk email system built with Next.js, React, TypeScript, and the Resend API. Send personalized emails to up to 1000 recipients with an intuitive drag-and-drop interface.

## 🚀 Features

- **Drag & Drop File Upload**: Support for CSV, XLS, and XLSX files
- **Smart Email Validation**: Automatic email format validation and duplicate detection
- **Template System**: Rich email composer with variable replacement ({{name}}, {{email}}, etc.)
- **Real-time Progress**: Live tracking of email sending progress with detailed results
- **Batch Processing**: Efficient sending in batches of 50 emails using Resend API
- **Secure Authentication**: JWT-based admin authentication
- **Mobile Responsive**: Works perfectly on all devices
- **Export Results**: Download detailed sending reports as CSV

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom components
- **Email Service**: Resend API for reliable email delivery
- **File Processing**: Support for Excel (xlsx) and CSV files
- **Authentication**: JWT tokens with secure API routes
- **Deployment**: Optimized for Vercel (serverless functions)

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- A Resend account and API key
- Vercel account (for deployment)

## 🔧 Installation & Setup

### 1. Clone and Install Dependencies

```bash
cd bulk-email-sender
npm install
```

### 2. Environment Configuration

Copy the environment template and configure your variables:

```bash
cp env.example .env.local
```

Edit `.env.local` with your actual values:

```env
# Admin Authentication
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password

# Resend API Configuration  
RESEND_API_KEY=re_your_resend_api_key_here

# From Email
NEXT_PUBLIC_FROM_EMAIL=your_from_email_here

# JWT Secret (generate a long random string)
NEXTAUTH_SECRET=your_very_long_random_jwt_secret_here

# Environment
NODE_ENV=development
```

### 3. Get Your Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain or use their testing domain
3. Generate an API key from your dashboard
4. Add the API key to your `.env.local` file

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your application.

## 🚀 Deployment to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/bulk-email-sender)

### Option 2: Manual Deployment

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Configure Environment Variables** in Vercel Dashboard:
   - Go to your project settings
   - Add environment variables:
     - `ADMIN_USERNAME`: Your admin username
     - `ADMIN_PASSWORD`: Your admin password  
     - `RESEND_API_KEY`: Your Resend API key
     - `NEXTAUTH_SECRET`: A long random string for JWT signing

### Option 3: GitHub Integration

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on every push

## 📁 Project Structure

```
bulk-email-sender/
├── pages/
│   ├── api/
│   │   ├── auth/login.ts          # Authentication endpoint
│   │   ├── upload/process.ts      # File upload and processing
│   │   └── email/
│   │       ├── send.ts           # Bulk email sending
│   │       └── status.ts         # Email status tracking
│   ├── login.tsx                 # Login page
│   ├── dashboard.tsx             # Main dashboard
│   └── index.tsx                 # Home page (redirects to login)
├── components/
│   ├── FileUpload/
│   │   ├── DropZone.tsx         # Drag & drop file upload
│   │   └── DataPreview.tsx      # Data preview and validation
│   ├── EmailComposer/
│   │   ├── MessageEditor.tsx    # Email template editor
│   │   └── VariableHelper.tsx   # Variable insertion helper
│   └── Progress/
│       └── StatusTracker.tsx    # Real-time progress tracking
├── utils/
│   ├── auth.ts                  # JWT authentication utilities
│   ├── emailHelpers.ts          # Email template processing
│   └── fileParser.ts            # File parsing utilities
└── styles/
    └── globals.css              # Global styles and Tailwind
```

## 🎯 Usage Guide

### 1. Login
- Navigate to your deployed application
- Login with your configured admin credentials

### 2. Upload Email List
- Drag and drop a CSV, XLS, or XLSX file
- Ensure your file has an "email" column
- Preview your data and verify email addresses

### 3. Compose Email
- Write your subject line with variables like `{{name}}`
- Create your email content (HTML supported)
- Use the variable helper to insert data fields
- Preview your email with sample data

### 4. Send Emails
- Review your settings and recipient count
- Click "Send All Emails" to start the batch
- Monitor real-time progress and results

### 5. Track Results
- View detailed sending statistics
- Export results as CSV for record keeping
- Retry failed emails if needed

## 📝 File Format Requirements

### CSV Example:
```csv
email,name,company,custom_field
john@example.com,John Doe,Acme Corp,Premium
jane@example.com,Jane Smith,Beta Inc,Standard
```

### Required:
- Must have an "email" column (case-insensitive)
- Maximum file size: 10MB
- Maximum recipients: 1000 per batch

### Supported Formats:
- `.csv` (Comma-separated values)
- `.xlsx` (Excel 2007+)
- `.xls` (Excel 97-2003)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Environment Variables**: API keys never exposed to frontend
- **Input Validation**: Server-side validation of all inputs
- **File Size Limits**: Protection against large file uploads
- **Rate Limiting**: Built-in protection against abuse

## 🎨 Customization

### Styling
- Built with Tailwind CSS for easy customization
- Modify `tailwind.config.js` for brand colors
- Custom components in `styles/globals.css`

### Email Templates
- Add pre-built templates in `MessageEditor.tsx`
- Customize variable replacement logic in `emailHelpers.ts`
- Support for HTML and plain text emails

### File Processing
- Extend file parsing in `fileParser.ts`
- Add support for additional column types
- Customize validation rules

## 🔧 Configuration Options

### Resend API Settings
```typescript
// Adjust batch size (max 100 per Resend batch)
const BATCH_SIZE = 50;

// Customize email delivery options
const emailOptions = {
  from: template.fromEmail,
  to: recipients,
  subject: processedSubject,
  html: processedContent,
  text: plainTextVersion
};
```

### File Upload Limits
```typescript
// In next.config.js
api: {
  bodyParser: {
    sizeLimit: '10mb', // Adjust as needed
  },
}
```

## 🚨 Troubleshooting

### Common Issues

1. **"Module not found" errors**:
   ```bash
   npm install
   npm run build
   ```

2. **Authentication fails**:
   - Check environment variables are set correctly
   - Verify JWT secret is long enough (recommended 32+ characters)

3. **File upload fails**:
   - Ensure file has proper email column
   - Check file size is under 10MB
   - Verify file format is CSV, XLS, or XLSX

4. **Emails not sending**:
   - Verify Resend API key is correct
   - Check domain verification in Resend dashboard
   - Ensure "from" email is verified

5. **Vercel deployment issues**:
   - Verify all environment variables are set
   - Check function timeout limits
   - Review Vercel function logs

### Debug Mode
Enable detailed logging by setting:
```env
NODE_ENV=development
```

## 📊 Performance Notes

- **Batch Processing**: Emails sent in batches of 50 for optimal performance
- **Memory Efficient**: Large files processed in chunks
- **Rate Limiting**: Built-in delays prevent API rate limiting
- **Progress Tracking**: Real-time updates without blocking UI

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README for common solutions
- **Issues**: Open a GitHub issue for bugs or feature requests
- **Resend API**: Visit [resend.com/docs](https://resend.com/docs) for API documentation

## 🎉 What's Next?

- **Template Library**: Pre-built email templates
- **Scheduling**: Schedule emails for later sending
- **A/B Testing**: Test different email versions
- **Analytics**: Advanced open/click tracking
- **Team Management**: Multi-user support

---

**Made with ❤️ using Next.js and Resend API**