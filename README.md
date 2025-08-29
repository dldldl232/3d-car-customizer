# 🚗 3D Car Customization Platform

A full-stack web application that allows users to customize cars in real-time 3D with interactive part placement, manual adjustments, and persistent configuration saving.

![3D Car Customization](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)

## ✨ Features

- **Real-time 3D Visualization**: Interactive 3D car models with React Three Fiber
- **Part Customization**: Add, remove, and position automotive parts in real-time
- **Manual Adjustments**: Precise part positioning with transform controls
- **Configuration Saving**: Save and load custom car configurations
- **Authentication**: Secure user authentication with JWT tokens
- **Responsive Design**: Modern UI with Tailwind CSS
- **External API Integration**: Real automotive parts from Sketchfab

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **Next.js 14** - Full-stack React framework
- **TypeScript** - Type safety
- **React Three Fiber** - 3D rendering
- **Three.js** - 3D graphics library
- **Tailwind CSS** - Styling
- **@react-three/drei** - 3D utilities

### Backend
- **FastAPI** - Python web framework
- **SQLModel** - SQL database ORM
- **SQLite** - Database
- **Pydantic** - Data validation
- **JWT** - Authentication
- **Sketchfab API** - 3D model integration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/3d-car-customizer.git
   cd 3d-car-customizer
   ```

2. **Set up the Backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration:
   # DATABASE_URL=sqlite:///./test.db
   # SECRET_KEY=your-secret-key
   # SKETCHFAB_API_TOKEN=your-sketchfab-token
   ```

4. **Set up the Frontend**
   ```bash
   cd ../car-customization-app
   npm install
   ```

5. **Run the Application**
   ```bash
   # Terminal 1 - Backend
   cd backend
   uvicorn app.main:app --reload --port 8000
   
   # Terminal 2 - Frontend
   cd car-customization-app
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📖 Usage

### Basic Workflow
1. **Choose a Car Model**: Select from available 3D car models
2. **Add Parts**: Browse and select automotive parts (wheels, hoods, etc.)
3. **Customize**: Use manual mode to precisely position parts
4. **Save Configuration**: Save your custom car design
5. **View Saved Cars**: Access your saved configurations

### Manual Mode
- Toggle "Manual Mode" to enable precise part positioning
- Use transform controls to move, rotate, and scale parts
- Click "Save Manual Adjustments" to persist changes

## 🔧 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Cars
- `GET /cars/` - List available car models
- `GET /cars/{id}` - Get specific car model

### Parts
- `GET /parts/` - List available parts
- `GET /parts/{id}` - Get specific part

### Saved Cars
- `POST /saved-cars/` - Save car configuration
- `GET /saved-cars/` - List user's saved cars
- `GET /saved-cars/{id}` - Get specific saved car
- `DELETE /saved-cars/{id}` - Delete saved car

### Manual Adjustments
- `POST /fitments/manual-adjustment` - Save manual part adjustments
- `GET /fitments/manual-adjustments/{car_model_id}` - Get manual adjustments

## 🏗️ Project Structure

```
3d-car-customizer/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Configuration settings
│   │   ├── models/              # Database models
│   │   ├── routers/             # API routes
│   │   └── services/            # Business logic
│   ├── requirements.txt         # Python dependencies
│   └── .env                     # Environment variables
├── car-customization-app/
│   ├── app/                     # Next.js app directory
│   │   ├── customize/           # Customization page
│   │   ├── saved-cars/          # Saved cars pages
│   │   └── globals.css          # Global styles
│   ├── components/              # React components
│   │   ├── CarViewer.tsx        # 3D car viewer
│   │   ├── PartsSelector.tsx    # Part selection UI
│   │   └── ManualCorrectionControls.tsx
│   └── lib/                     # Utilities
│       └── api.ts               # API client
└── README.md
```

## 🎯 Key Features Explained

### 3D Rendering with React Three Fiber
- Real-time 3D scene management
- Interactive camera controls
- Dynamic part loading and positioning
- Transform controls for manual adjustments

### Part Placement System
- Automatic anchor-based placement
- Manual override capabilities
- Real-time position updates
- Persistent adjustment storage

### State Management
- React hooks for local state
- API integration for persistence
- Real-time synchronization
- Optimistic updates

## 🔒 Security Features

- JWT token authentication
- Secure API key management
- Environment variable protection
- Input validation with Pydantic
- CORS configuration

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd car-customization-app
npm run build
# Deploy to Vercel or similar platform
```

### Backend (Railway/Render)
```bash
cd backend
# Configure environment variables
# Deploy using Railway, Render, or similar platform
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Sketchfab](https://sketchfab.com/) for 3D models
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber) for 3D rendering
- [Three.js](https://threejs.org/) for 3D graphics
- [FastAPI](https://fastapi.tiangolo.com/) for backend framework

## 📞 Contact

Your Name - [your.email@example.com](mailto:your.email@example.com)

Project Link: [https://github.com/yourusername/3d-car-customizer](https://github.com/yourusername/3d-car-customizer)

---

⭐ Star this repository if you found it helpful!
