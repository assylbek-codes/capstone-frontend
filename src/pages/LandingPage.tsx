import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useRef, useEffect } from 'react';

export const LandingPage = () => {
  const { isAuthenticated } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Auto play the video when component mounts
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.error("Video autoplay failed:", err);
        // Most browsers require user interaction before autoplay
      });
    }
  }, []);
  
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
          <div className="flex flex-col items-center text-center">
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="inline-block px-3 py-1 bg-blue-900/40 rounded-full text-blue-400 text-sm font-medium mb-2">
                Robot Simulation & Optimization Platform
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                Test Warehouse Robotics Before Deployment
              </h1>
              <p className="text-xl text-gray-300">
                Simulate robot quantities, test algorithms, and optimize parameters without the costs of real-world deployment. Powered by advanced AI.
              </p>
              
              <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-md font-medium text-white transition-colors flex items-center justify-center">
                  Start Simulating Now
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
              
              <div className="pt-8 flex flex-wrap gap-6 items-center justify-center text-gray-400 text-sm">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Robot quantity simulation
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  LLM-powered task generation
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Algorithm performance testing
                </div>
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
              Simulate, test, and optimize your warehouse robotics operations before real-world implementation
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: (
                  <svg className="w-10 h-10 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                ),
                title: "Interactive Environment Builder",
                description: "Create digital twins of your warehouse layouts to simulate real-world conditions with accuracy"
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 11.08V8l-6-6H6a2 2 0 00-2 2v16c0 1.1.9 2 2 2h6" />
                    <path d="M14 3v5h5M18 21a3 3 0 100-6 3 3 0 000 6z" />
                    <path d="M18 16v-5M16 16h5" />
                  </svg>
                ),
                title: "Scenario Simulation",
                description: "Test different robot speeds, battery capacities, and configurations to find your optimal setup"
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12h-8v8h8v-8z" />
                    <path d="M3 21h18M3 10V3h18v7" />
                    <path d="M12 3v18" />
                  </svg>
                ),
                title: "LLM-Powered Task Generation",
                description: "Our AI understands your environment to generate realistic tasks that match your real-world needs"
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 2v7.31M14 9.3V2M11 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                    <path d="M21 17.59A9 9 0 0 1 11 22a9 9 0 0 1 0-18" />
                  </svg>
                ),
                title: "Algorithm Choosing",
                description: "Choose from multiple robot routing and task allocation algorithms to identify the best for your specific needs"
              },
              // {
              //   icon: (
              //     <svg className="w-10 h-10 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              //       <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              //       <path d="M12 8v4M12 16h.01" />
              //     </svg>
              //   ),
              //   title: "Parameter Optimization",
              //   description: "Fine-tune system parameters in simulation to achieve maximum efficiency before real deployment"
              // },
              // {
              //   icon: (
              //     <svg className="w-10 h-10 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              //       <path d="M7 12h10M7 5h10M7 19h10" />
              //       <path d="M3 5h1v1H3zM3 12h1v1H3zM3 19h1v1H3z" />
              //       <path d="M17 5h4v1h-4zM17 12h4v1h-4zM17 19h4v1h-4z" />
              //     </svg>
              //   ),
              //   title: "Cost Analysis Tools",
              //   description: "Estimate operational costs and ROI of different robot configurations before investing in hardware"
              // },
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
              Test and optimize your robot fleet in simulation before real-world deployment
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8">
            {[
              {
                number: "01",
                title: "Build Your Environment",
                description: "Create a digital twin of your warehouse layout with accurate dimensions and constraints."
              },
              {
                number: "02",
                title: "Set Up Scenarios & Robots",
                description: "Define robot types, quantities, and scenarios. Our LLM helps generate realistic tasks based on your setup."
              },
              {
                number: "03",
                title: "Test Algorithms",
                description: "Compare different algorithms and parameter settings to find the optimal solution for your needs."
              },
              {
                number: "04",
                title: "Analyze & Optimize",
                description: "Review comprehensive metrics and visually compare results to make data-driven deployment decisions."
              },
            ].map((step, index) => (
              <div key={index} className="flex-1 relative">
                <div className="absolute h-full w-px bg-gradient-to-b from-blue-500 to-transparent left-6 top-8 hidden md:block"
                     style={{ display: index === 4 ? 'none' : 'block' }}></div>
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
              Watch how our simulation platform helps optimize robot fleets without costly real-world testing
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 shadow-lg">
            <div className="aspect-video bg-gray-900 rounded-lg relative overflow-hidden">
              {/* Demo Video */}
              <video 
                ref={videoRef}
                className="h-full w-full object-cover"
                controls
                loop
                muted
                poster="/videos/demo-poster.jpg"
              >
                <source src="/videos/warehouse-demo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Fallback for video not loading */}
              {/* <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 opacity-0 hover:opacity-100 transition-opacity">
                <div className="text-center p-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/50 rounded-full mb-4">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">Play Demo</h3>
                </div>
              </div> */}
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <Link to="/register" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-md font-medium text-white transition-colors inline-flex items-center">
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
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Optimize Your Robot Fleet?</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8">
            Save time and money by testing in simulation before investing in physical robots
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-white text-blue-900 hover:bg-gray-100 px-6 py-3 rounded-md font-medium transition-colors">
              Get Started
            </Link>
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
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <ul className="space-y-2">
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/60">© 2025 Husslify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 