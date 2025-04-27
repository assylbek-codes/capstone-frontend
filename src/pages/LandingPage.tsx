import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export const LandingPage = () => {
  const { isAuthenticated } = useAuthStore();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Header/Nav */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
              <path d="M7 12h2v5H7zm4-7h2v12h-2zm4 4h2v8h-2z"/>
            </svg>
            <span className="ml-2 text-xl font-bold">Husslify</span>
          </div>
          
          <nav className="hidden md:flex space-x-8 text-gray-300">
            <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-400 transition-colors">How It Works</a>
            <a href="#demo" className="hover:text-blue-400 transition-colors">Demo</a>
          </nav>
          
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <Link to="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-gray-300 hover:text-white transition-colors">Sign In</Link>
                <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Tech background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-blue-500 blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-60 h-60 rounded-full bg-purple-500 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-cyan-500 blur-3xl"></div>
        </div>
        
        {/* Grid lines for tech effect */}
        <div className="absolute inset-0 grid grid-cols-8 z-0 opacity-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`v-${i}`} className="border-r border-white h-full"></div>
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`h-${i}`} className="border-b border-white w-full absolute" style={{ top: `${(i + 1) * 12.5}%` }}></div>
          ))}
        </div>
        
        <div className="container mx-auto px-4 relative z-1">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2 space-y-6">
              <div className="inline-block px-3 py-1 bg-blue-900/40 rounded-full text-blue-400 text-sm font-medium mb-2">
                AI-Powered Warehouse Optimization
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                Optimize Robot Operations with Advanced AI
              </h1>
              <p className="text-xl text-gray-300">
                Design warehouse layouts, simulate robot movement, and maximize efficiency with our powerful visualization platform.
              </p>
              
              <div className="pt-6 flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-md font-medium text-white transition-colors flex items-center justify-center">
                  Start Optimizing Now
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                {/* <a href="#demo" className="border border-blue-500 hover:bg-blue-900/30 px-6 py-3 rounded-md font-medium text-blue-400 transition-colors flex items-center justify-center">
                  See Live Demo
                </a> */}
              </div>
              
              <div className="pt-8 flex flex-wrap gap-6 items-center text-gray-400 text-sm">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Real-time simulation
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Physics-based movement
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Advanced metrics
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2">
              <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
                <div className="relative p-1">
                  {/* Warehouse visualization preview */}
                  <div className="bg-gray-900 rounded-lg aspect-video p-2">
                    <div className="grid grid-cols-12 grid-rows-12 gap-1 h-full">
                      {/* Layout grid */}
                      <div className="col-span-9 row-span-12 bg-gray-800 rounded-lg relative overflow-hidden">
                        {/* Simulate warehouse grid */}
                        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-px">
                          {Array.from({ length: 64 }).map((_, i) => (
                            <div key={i} className="bg-gray-900/30"></div>
                          ))}
                        </div>
                        
                        {/* Robots */}
                        <div className="absolute h-3 w-3 bg-blue-500 rounded-full" style={{ top: '20%', left: '30%' }}></div>
                        <div className="absolute h-3 w-3 bg-purple-500 rounded-full" style={{ top: '40%', left: '60%' }}></div>
                        <div className="absolute h-3 w-3 bg-cyan-500 rounded-full" style={{ top: '70%', left: '40%' }}></div>
                        
                        {/* Destinations */}
                        <div className="absolute h-4 w-4 border-2 border-yellow-500 rounded-full" style={{ top: '30%', left: '50%' }}></div>
                        <div className="absolute h-4 w-4 border-2 border-green-500 rounded-full" style={{ top: '60%', left: '20%' }}></div>
                      </div>
                      
                      {/* Controls/metrics */}
                      <div className="col-span-3 row-span-6 bg-gray-800 rounded-lg p-2">
                        <div className="text-xs text-gray-400 mb-1">Metrics</div>
                        <div className="space-y-2">
                          <div className="bg-gray-900 h-2 rounded-full">
                            <div className="bg-blue-500 h-2 rounded-full w-3/4"></div>
                          </div>
                          <div className="bg-gray-900 h-2 rounded-full">
                            <div className="bg-green-500 h-2 rounded-full w-1/2"></div>
                          </div>
                          <div className="bg-gray-900 h-2 rounded-full">
                            <div className="bg-purple-500 h-2 rounded-full w-2/3"></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-3 row-span-6 bg-gray-800 rounded-lg p-2">
                        <div className="text-xs text-gray-400 mb-1">Controls</div>
                        <div className="flex justify-between gap-1 mb-1">
                          <div className="bg-gray-900 rounded h-4 w-full"></div>
                          <div className="bg-blue-600 rounded h-4 w-8"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <div className="bg-gray-900 rounded h-3"></div>
                          <div className="bg-gray-900 rounded h-3"></div>
                          <div className="bg-gray-900 rounded h-3"></div>
                          <div className="bg-gray-900 rounded h-3"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Tech overlay elements */}
                <div className="absolute top-1 left-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <div className="absolute bottom-1 left-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute bottom-1 right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 bg-blue-900/40 rounded-full text-blue-400 text-sm font-medium mb-2">
              Advanced Capabilities
            </div>
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Our platform offers cutting-edge tools to design, simulate, and optimize your robot operations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-10 h-10 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                ),
                title: "Interactive Environment Builder",
                description: "Create and customize warehouse layouts with our intuitive drag-and-drop interface with real-time updates"
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 11.08V8l-6-6H6a2 2 0 00-2 2v16c0 1.1.9 2 2 2h6" />
                    <path d="M14 3v5h5M18 21a3 3 0 100-6 3 3 0 000 6z" />
                    <path d="M18 16v-5M16 16h5" />
                  </svg>
                ),
                title: "Robot Physics Simulation",
                description: "Simulate robot movement with realistic physics, including acceleration, velocity, and path planning"
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12h-8v8h8v-8z" />
                    <path d="M3 21h18M3 10V3h18v7" />
                    <path d="M12 3v18" />
                  </svg>
                ),
                title: "AI-Powered Optimization",
                description: "Leverage advanced algorithms to generate optimal task schedules and routes for maximum efficiency"
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 2v7.31M14 9.3V2M11 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                    <path d="M21 17.59A9 9 0 0 1 11 22a9 9 0 0 1 0-18" />
                  </svg>
                ),
                title: "Real-time Metrics",
                description: "Track performance metrics in real-time, including distance traveled, task completion, and efficiency scores"
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                ),
                title: "Advanced Task Management",
                description: "Create, schedule, and manage complex task sequences with our intuitive task management system"
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 12h10M7 5h10M7 19h10" />
                    <path d="M3 5h1v1H3zM3 12h1v1H3zM3 19h1v1H3z" />
                    <path d="M17 5h4v1h-4zM17 12h4v1h-4zM17 19h4v1h-4z" />
                  </svg>
                ),
                title: "Custom Visualization",
                description: "Visualize your warehouse operations with customizable views, colors, and display options"
              },
            ].map((feature, index) => (
              <div key={index} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 transition-colors group">
                <div className="mb-4 p-3 bg-gray-900 rounded-lg inline-block group-hover:bg-blue-900/20 transition-colors">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-800 relative overflow-hidden">
        {/* Background tech elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 w-full h-full">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="absolute bg-white rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  width: `${Math.random() * 3 + 1}px`,
                  height: `${Math.random() * 3 + 1}px`,
                  opacity: Math.random() * 0.5 + 0.1
                }}
              ></div>
            ))}
          </div>
        </div>
        
        <div className="container mx-auto px-4 relative z-1">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 bg-blue-900/40 rounded-full text-blue-400 text-sm font-medium mb-2">
              Simple Process
            </div>
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Our platform streamlines warehouse optimization through an intuitive workflow
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8">
            {[
              {
                number: "01",
                title: "Design Your Layout",
                description: "Create your warehouse environment with our visual editor. Place shelves, stations, and define navigation paths."
              },
              {
                number: "02",
                title: "Set Up Robots & Tasks",
                description: "Configure robots with physics properties and create tasks with pickup and dropoff points."
              },
              {
                number: "03",
                title: "Run Simulation",
                description: "Visualize robot movements with realistic physics and analyze performance in real-time."
              },
              {
                number: "04",
                title: "Optimize Operations",
                description: "Use the generated metrics to identify bottlenecks and improve your warehouse efficiency."
              },
            ].map((step, index) => (
              <div key={index} className="flex-1 relative">
                <div className="absolute h-full w-px bg-gradient-to-b from-blue-500 to-transparent left-6 top-8 hidden md:block"
                     style={{ display: index === 3 ? 'none' : 'block' }}></div>
                <div className="flex items-start">
                  <div className="p-3 bg-blue-900/40 rounded-xl flex items-center justify-center min-w-[48px] mr-4">
                    <span className="text-blue-400 font-bold">{step.number}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-gray-400">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Demo Section */}
      <section id="demo" className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block px-3 py-1 bg-blue-900/40 rounded-full text-blue-400 text-sm font-medium mb-2">
              Interactive Demo
            </div>
            <h2 className="text-4xl font-bold mb-4">See It In Action</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Watch our warehouse simulation technology in real-time with actual physics-based movement
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 shadow-lg">
            {/* This would be replaced by your actual simulation component in production */}
            <div className="aspect-video bg-gray-900 rounded-lg relative overflow-hidden flex items-center justify-center">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600/20 rounded-full mb-4">
                  <svg className="w-10 h-10 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Live Robot Simulation</h3>
                <p className="text-gray-400 max-w-md mx-auto mt-2">
                  Click to interact with our real-time warehouse simulation featuring physics-based robot movement
                </p>
              </div>
              
              {/* Tech grid overlay */}
              <div className="absolute inset-0 grid grid-cols-32 grid-rows-18 gap-px opacity-10 pointer-events-none">
                {Array.from({ length: 32 * 18 }).map((_, i) => (
                  <div key={i} className="bg-blue-500"></div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <Link to="/dashboard" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-md font-medium text-white transition-colors inline-flex items-center">
              Try Full Version
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-purple-900 relative overflow-hidden">
        {/* Tech pattern background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20px 20px, rgba(255,255,255,0.1) 2px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-1">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Warehouse Operations?</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8">
            Start optimizing your robot movements and warehouse efficiency today with our cutting-edge platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-white text-blue-900 hover:bg-gray-100 px-6 py-3 rounded-md font-medium transition-colors">
              Get Started
            </Link>
            {/* <Link to="/login" className="border border-white text-white hover:bg-white/10 px-6 py-3 rounded-md font-medium transition-colors">
              Schedule a Demo
            </Link> */}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white/60 py-12 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center mb-4">
                <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                  <path d="M7 12h2v5H7zm4-7h2v12h-2zm4 4h2v8h-2z"/>
                </svg>
                <span className="ml-2 text-xl font-bold text-white">Husslify</span>
              </div>
              {/* <p className="max-w-xs text-white/60">
                Advanced warehouse optimization with AI-powered insights and physics-based robot simulation.
              </p> */}
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                {/* <h3 className="font-semibold mb-4 text-white">Platform</h3> */}
                <ul className="space-y-2">
                  {/* <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li> */}
                  {/* <li><a href="#how-it-works" className="hover:text-blue-400 transition-colors">How It Works</a></li> */}
                  {/* <li><a href="#demo" className="hover:text-blue-400 transition-colors">Demo</a></li> */}
                  {/* <li><a href="#" className="hover:text-blue-400 transition-colors">Documentation</a></li> */}
                </ul>
              </div>
              
              {/* <div>
                <h3 className="font-semibold mb-4 text-white">Legal</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
                </ul>
              </div> */}
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/60">© 2025 Husslify. All rights reserved.</p>
            {/* <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-white/60 hover:text-blue-400 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z" />
                </svg>
              </a>
              <a href="#" className="text-white/60 hover:text-blue-400 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a href="#" className="text-white/60 hover:text-blue-400 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm6.804 8.4c.037 6.037-4.232 9.6-10.8 9.6-2.343 0-4.537-.635-6.4-1.736 2.242.27 4.472-.404 6.24-1.84-1.837-.036-3.38-1.25-3.92-2.928.645.12 1.284.077 1.86-.136-2.022-.41-3.436-2.223-3.432-4.16.566.317 1.21.505 1.905.528C2.813 8.772 2.093 5.865 3.592 3.9c2.087 2.556 5.204 4.244 8.72 4.423-.622-2.648 1.382-5.23 4.084-5.23 1.222 0 2.358.51 3.14 1.33.978-.2 1.98-.56 2.82-.84-.32 1-.995 1.83-1.857 2.36.87-.12 1.737-.344 2.517-.606-.58.857-1.302 1.603-2.13 2.202z" />
                </svg>
              </a>
            </div> */}
          </div>
        </div>
      </footer>
    </div>
  );
}; 