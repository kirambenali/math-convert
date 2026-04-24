# 📐 Math Text to Word Converter

Convert raw math text (Markdown + LaTeX) from ChatGPT, Claude, DeepSeek, etc. into clean, professional Word documents with properly formatted equations.

## ✨ Features

- **📝 Markdown Cleanup**: Converts `**Title**` → `# Title` for proper heading formatting
- **π Unicode Symbols**: Converts Unicode math symbols (π, ∞, ∫, ∑, etc.) to LaTeX equivalents
- **🔧 LaTeX Auto-fixing**: Fixes broken syntax like `e^-x` → `e^{-x}`
- **📊 Equation Detection**: Automatically wraps LaTeX commands in proper math delimiters
- **🎯 MathML Rendering**: Equations are rendered as proper MathML in Word (not LaTeX code)
- **⚡ Fast Processing**: All processing is local, deterministic, and completes in <1 second
- **💯 Zero Manual Editing**: Generated Word documents are clean and professional out of the box

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+**: [Download here](https://nodejs.org/)
- **Pandoc**: [Installation guide](https://pandoc.org/installing.html)
  - On macOS: `brew install pandoc`
  - On Ubuntu/Debian: `sudo apt-get install pandoc`
  - On Windows: Download from [pandoc.org](https://pandoc.org/installing.html)

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open in browser**:
   - Navigate to [http://localhost:3000](http://localhost:3000)

4. **Use the app**:
   - Paste raw text in the input area
   - Preview formatted text and equations in real-time
   - Click "Generate Word Document" to create and download the .docx file

### Building for Production

```bash
npm run build
npm start
```

## 🐳 Docker Deployment

### Prerequisites

- **Docker**: [Installation guide](https://docs.docker.com/get-docker/)
- **Docker Compose**: [Installation guide](https://docs.docker.com/compose/install/)

### Build and Run

```bash
# Build Docker image
docker build -t math-convert .

# Run container
docker run -p 3000:3000 math-convert
```

### Using Docker Compose

```bash
# Start production container
docker-compose up --build

# Start development container
docker-compose --profile dev up --build app-dev
```

Access the app at [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

Run the test suite:

```bash
npm test              # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Generate coverage report
```

Tests cover:
- ✓ Markdown title conversion
- ✓ Unicode math symbol replacement
- ✓ LaTeX syntax fixing
- ✓ Equation delimiter standardization
- ✓ Whitespace normalization
- ✓ Edge cases and malformed input

## 📋 Supported Conversions

### Markdown

| Input | Output |
|-------|--------|
| `**Title**` | `# Title` |
| `*text*` | cleaned to plain text |

### Unicode Math Symbols

| Symbol | LaTeX | Symbol | LaTeX |
|--------|-------|--------|-------|
| π | `\pi` | ∫ | `\int` |
| ∞ | `\infty` | ∑ | `\sum` |
| ∏ | `\prod` | √ | `\sqrt` |
| ±| `\pm` | ≤ | `\leq` |
| ≥ | `\geq` | ≠ | `\neq` |
| ∂ | `\partial` | ∇ | `\nabla` |

### LaTeX Auto-Fixing

| Before | After |
|--------|-------|
| `e^-x` | `e^{-x}` |
| `a_bc` | `a_{bc}` |
| `d_-e` | `d_{-e}` |

### Equation Delimiters

| Input | Output |
|-------|--------|
| `\(x^2\)` | `$x^2$` (inline) |
| `\[x^2\]` | `$$x^2$$` (display) |
| `\int dx` | `$$\int dx$$` (auto-wrapped) |

## 💻 Technology Stack

- **Frontend**: React 19, Next.js 16 (App Router), TypeScript, Tailwind CSS, KaTeX
- **Backend**: Node.js, Next.js API Routes, Pandoc
- **Text Processing**: Remark for Markdown parsing
- **Markdown Conversion**: Pandoc (local server execution)
- **Containerization**: Docker + Docker Compose

## 🏗️ Architecture

```
┌─────────────────┐
│   Web Browser   │
│   (React UI)    │
└────────┬────────┘
         │
         ├─ Input textarea
         ├─ Real-time KaTeX preview
         └─ Download button
         │
         ▼
┌─────────────────┐
│   Next.js       │
│  /api/convert   │ (POST endpoint)
└────────┬────────┘
         │
         ├─ Validate input
         ├─ Clean text (deterministic rules)
         ├─ Save to temp .md file
         ├─ Execute Pandoc
         └─ Return .docx file
         │
         ▼
┌─────────────────┐
│   Pandoc        │
│   (markdown →   │
│    .docx)       │
└─────────────────┘
```

## 📦 Project Structure

```
.
├── app/
│   ├── api/
│   │   └── convert/
│   │       └── route.ts          # Conversion API endpoint
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main UI component
│   └── globals.css               # Global styles
├── lib/
│   ├── textCleaner.ts            # Text cleaning functions
│   └── api.ts                    # Frontend API utilities
├── __tests__/
│   └── textCleaner.test.ts       # Unit tests
├── public/                       # Static assets
├── Dockerfile                    # Docker image definition
├── docker-compose.yml            # Docker Compose config
├── jest.config.ts                # Jest testing config
├── jest.setup.ts                 # Jest setup
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
└── README.md                     # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file if needed (optional for basic functionality):

```bash
# Development environment (default)
NODE_ENV=development
```

### Pandoc Options

The conversion API uses these Pandoc options:

```bash
pandoc input.md \
  -o output.docx \
  --from=markdown \
  --to=docx \
  --mathml \           # Use MathML for equations
  --wrap=none \        # Preserve line breaks
  --toc-depth=2       # Generate table of contents
```

## ⚠️ Troubleshooting

### "Pandoc is not installed"

**Solution**: Install Pandoc for your OS
- macOS: `brew install pandoc`
- Ubuntu/Debian: `sudo apt-get install pandoc`
- Windows: Download from [pandoc.org](https://pandoc.org/installing.html)

Verify installation:
```bash
pandoc --version
```

### "Failed to convert text to Word document"

**Causes**:
- Pandoc not installed or not in PATH
- Input text is too large (>5MB)
- Corrupted temporary files

**Solutions**:
- Check Pandoc installation
- Try with smaller input
- Restart the application

### Docker build fails

**Solution**: Ensure Docker and Docker Compose are installed and running:
```bash
docker --version
docker-compose --version
```

## 📊 Performance

- **Text cleaning**: ~10-50ms for typical inputs (< 1000 words)
- **Pandoc conversion**: ~200-500ms
- **Total response time**: <1 second (typical)
- **Memory usage**: ~50-100MB (idle) / ~200-300MB (processing)

## 🛡️ Security & Limitations

- **Input size limit**: 5MB per request
- **Timeout**: 30 seconds per request
- **No external APIs**: All processing is local
- **No AI services**: Deterministic rule-based processing only
- **Temporary files**: Automatically cleaned up after conversion
- **CORS**: Same-origin requests only (development)

## 📝 Example Inputs & Outputs

### Example 1: Calculus Problem

**Input**:
```
**Calculus Problem**

Find ∫ (e^-x) dx from 0 to ∞

Solution:
∫ e^-x dx = -e^-x + C
```

**Output**:
- Heading: "Calculus Problem" (H1)
- Text: "Find [integral symbol] (e^{-x}) dx from 0 to ∞"
- All symbols and equations properly formatted in Word

### Example 2: Series Formula

**Input**:
```
**Infinite Series**

The sum ∑(n=1 to ∞) 1/n^2 = π^2/6
```

**Output**:
- Heading: "Infinite Series" (H1)
- Text with properly formatted: Σ, ∞, π symbols
- All in a clean Word document

## 🤝 Contributing

To extend the app:

1. **Add more Unicode symbols**: Edit `UNICODE_MATH_SYMBOLS` in `lib/textCleaner.ts`
2. **Add more LaTeX patterns**: Edit `LATEX_COMMAND_PATTERNS` in `lib/textCleaner.ts`
3. **Add tests**: Create test cases in `__tests__/textCleaner.test.ts`
4. **Improve UI**: Modify components in `app/page.tsx`

## 📄 License

Open source. Use freely.

## 🆘 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review test cases in `__tests__/textCleaner.test.ts`
3. Check Pandoc documentation: https://pandoc.org/

---

**Made with ❤️ for mathematics and clean documents**
