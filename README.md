# Ultimate Texas Hold'em Poker Advisor

A comprehensive, production-ready poker strategy web application built with React, TypeScript, and Tailwind CSS. Features Monte Carlo simulation, professional betting advice, and AI-powered strategic recommendations via OpenAI API integration.

## 🎯 Features

### Core Functionality
- **Interactive Card Selection**: Professional 52-card grid with suit organization
- **Hand Evaluation**: Real-time poker hand analysis using `pokersolver`
- **Monte Carlo Simulation**: 300-1000 iteration probability calculations
- **Betting Advice**: Stage-specific recommendations (pre-flop, flop, turn, river)
- **AI Strategic Advisor**: Advanced recommendations via OpenAI API

### Technical Features
- **Responsive Design**: Mobile-first, dark poker table theme
- **Real-time Updates**: Asynchronous simulation without UI blocking
- **Race Condition Prevention**: Proper state management and request handling
- **Error Handling**: Comprehensive error states and fallbacks
- **Performance Optimized**: Batch processing and efficient algorithms

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- OpenAI API key (for AI advisor feature)

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

3. **Start development server:**
```bash
npm run dev
```

4. **Open in browser:**
Navigate to `http://localhost:5173`

## 🎮 How to Use

### Basic Workflow
1. **Select Hole Cards**: Choose your 2 starting cards
2. **Add Community Cards**: Select flop (3), turn (1), and river (1) cards
3. **Get Advice**: Receive betting recommendations based on:
   - Pre-flop: Hand strength analysis
   - Post-flop: Monte Carlo simulation results
   - AI Advisor: Advanced strategic recommendations

### Betting Advice System
- **4x Bet**: Premium hands (pairs, suited aces, broadway cards)
- **3x Bet**: Strong hands (65%+ win rate)
- **2x Bet**: Good hands (45-65% win rate)
- **Check**: Marginal hands (35-45% win rate)
- **Fold**: Weak hands (<35% win rate)

## 🏗️ Architecture

### Component Structure
```
src/
├── components/
│   ├── CardPicker.tsx          # Interactive card selection
│   ├── HandEvaluator.ts        # Poker hand analysis
│   ├── BetAdvisor.ts          # Local betting logic
│   └── OpenAIAdvisor.tsx      # AI-powered advice
├── utils/
│   └── monteCarlo.ts          # Simulation algorithms
└── App.tsx                    # Main application
```

### Key Technologies
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for responsive styling
- **pokersolver** for accurate hand evaluation
- **OpenAI API** for advanced strategic advice
- **Vite** for fast development and building

## 🤖 AI Integration

### OpenAI API Setup
The AI advisor requires an OpenAI API key to provide advanced strategic recommendations.

1. **Get API Key**: Sign up at [OpenAI Platform](https://platform.openai.com/)
2. **Set Environment Variable**: Add `OPENAI_API_KEY` to your `.env` file
3. **API Endpoint**: The app uses `/api/openai-advice` to securely call OpenAI

### AI Features
- **Context-Aware Analysis**: Considers hand strength, odds, and game stage
- **Strategic Recommendations**: Specific betting actions with reasoning
- **Risk Assessment**: Conservative, moderate, or aggressive play styles
- **Confidence Levels**: High, medium, or low confidence ratings

## 📊 Monte Carlo Simulation

### Algorithm Details
- **Iterations**: 300 (fast mode) or 1000 (full mode)
- **Methodology**: Simulates remaining possible hands
- **Accuracy**: Statistical probability calculations
- **Performance**: Batch processing with UI yield points

### Simulation Features
- **Input Validation**: Prevents invalid card combinations
- **Error Handling**: Graceful failure with fallback advice
- **Race Condition Prevention**: Request tracking and cancellation
- **Progress Indicators**: Real-time simulation status

## 🎨 UI/UX Design

### Design Principles
- **Professional Poker Aesthetic**: Dark theme with gold accents
- **Mobile-First Responsive**: Works on all screen sizes
- **Clear Visual Hierarchy**: Important information prominently displayed
- **Smooth Interactions**: Hover states and transitions
- **Accessibility**: ARIA labels and keyboard navigation

### Layout Structure
- **Top**: Betting advice with AI recommendations
- **Left**: Hand analysis and game stage
- **Center**: Interactive card picker
- **Right**: Monte Carlo simulation results

## 🔧 Configuration

### Environment Variables
```env
# Required for AI advisor
OPENAI_API_KEY=sk-your-openai-api-key

# Optional: API endpoint override
OPENAI_API_URL=https://api.openai.com/v1/chat/completions
```

### Build Configuration
- **Vite Config**: Optimized for React and TypeScript
- **Tailwind Config**: Custom poker theme colors
- **ESLint Config**: Strict TypeScript rules

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Bolt Platform
The application is optimized for deployment on the Bolt platform with:
- Static asset optimization
- Environment variable support
- Serverless API endpoints
- CDN-ready builds

### Other Deployment Options
- **Vercel**: Zero-config deployment with serverless functions
- **Netlify**: Static site with edge functions
- **AWS S3 + CloudFront**: Static hosting with Lambda functions

## 🧪 Testing

### Manual Testing Checklist
- [ ] Card selection works across all suits
- [ ] Hand evaluation updates correctly
- [ ] Monte Carlo simulation completes
- [ ] Betting advice updates appropriately
- [ ] AI advisor provides recommendations
- [ ] Error states display properly
- [ ] Mobile responsiveness works

### Performance Testing
- [ ] Simulation completes within 2 seconds
- [ ] UI remains responsive during calculations
- [ ] Memory usage stays reasonable
- [ ] No race conditions or flickering

## 🔒 Security

### API Key Protection
- OpenAI API key stored securely in environment variables
- No client-side exposure of sensitive credentials
- Server-side API calls only

### Input Validation
- Card format validation
- Duplicate card prevention
- Iteration limit enforcement
- Error boundary implementation

## 📈 Performance Optimizations

### Simulation Performance
- **Batch Processing**: Prevents UI blocking
- **Efficient Shuffling**: Optimized Fisher-Yates algorithm
- **Memory Management**: Proper cleanup and garbage collection
- **Caching**: Avoids duplicate calculations

### UI Performance
- **React Optimizations**: Proper key props and memo usage
- **CSS Optimizations**: Efficient Tailwind classes
- **Asset Optimization**: Minimized bundle size
- **Lazy Loading**: Components loaded as needed

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Standards
- TypeScript strict mode
- ESLint compliance
- Consistent formatting
- Comprehensive error handling
- Clear documentation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **pokersolver**: Accurate poker hand evaluation
- **OpenAI**: Advanced AI strategic advice
- **Tailwind CSS**: Beautiful, responsive styling
- **React Team**: Excellent development framework
- **Vite**: Fast build tooling

## 📞 Support

For questions, issues, or feature requests:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information
4. Include steps to reproduce any bugs

---

**Built with ❤️ for poker enthusiasts and developers**

*For entertainment and educational purposes only. Please gamble responsibly.*